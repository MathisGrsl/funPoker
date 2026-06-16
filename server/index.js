const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const passport = require('./config/passport');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// express-session is only needed for the Google OAuth flow (temporary state)
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 }, // 5 min, just enough for the Google redirect
}));
app.use(passport.initialize());
app.use(passport.session());

connectDB();

app.use('/api/auth', authRoutes);
app.get('/health', (_req, res) => res.json({ status: 'Server is running ✅' }));

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
});

// userId -> { count, username, avatar }
const onlineUsers = new Map();

const broadcastOnlineUsers = () => {
    const list = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        id,
        username: data.username,
        avatar: data.avatar,
    }));
    io.emit('users:online', list);
};

// Authenticate socket connections via JWT cookie
io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [k, ...v] = c.trim().split('=');
            return [k.trim(), decodeURIComponent(v.join('='))];
        }),
    );

    const token = cookies.token;
    if (!token) return next(new Error('Not authenticated'));

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = payload.id;
        next();
    } catch {
        next(new Error('Invalid token'));
    }
});

io.on('connection', async (socket) => {
    const userId = socket.userId;

    const user = await User.findById(userId).select('username avatar').lean();
    if (!user) return socket.disconnect();

    // Handle multiple tabs: increment connection count
    if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).count++;
    } else {
        onlineUsers.set(userId, { count: 1, username: user.username, avatar: user.avatar });
        broadcastOnlineUsers();
    }

    console.log(`[SOCKET] ${user.username} connected (${socket.id}) — ${onlineUsers.get(userId).count} tab(s)`);

    socket.on('disconnect', () => {
        const entry = onlineUsers.get(userId);
        if (!entry) return;

        entry.count--;
        console.log(`[SOCKET] ${user.username} disconnected — ${entry.count} tab(s) remaining`);

        if (entry.count === 0) {
            onlineUsers.delete(userId);
            broadcastOnlineUsers();
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
