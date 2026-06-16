const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./config/passport');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

// express-session is only needed for the Google OAuth flow (temporary state)
app.use(
    session({
        secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 5 * 60 * 1000 }, // 5 min, just enough for the Google redirect
    }),
);
app.use(passport.initialize());
app.use(passport.session());

connectDB();

app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'Server is running ✅' });
});

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
});

io.on('connection', (socket) => {
    const socketId = socket.id;
    console.log(`[SOCKET] New connection: ${socketId}`);

    socket.on('disconnect', () => {
        console.log(`[SOCKET] Disconnected: ${socketId}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
