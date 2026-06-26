import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import passport from './config/passport';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import User from './models/User';
import { BlackjackManager } from './game/blackjack/manager';
import { registerBlackjackHandlers } from './sockets/blackjack';

interface AuthSocket extends Socket {
    userId: string;
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// express-session is only needed for the Google OAuth flow (temporary state)
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 },
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

// Orchestrateur des tables de blackjack (state machine + soldes + broadcast)
const blackjack = new BlackjackManager(io);

// userId -> { count, username, avatar }
const onlineUsers = new Map<string, { count: number; username: string; avatar: string | null }>();

const broadcastOnlineUsers = () => {
    const list = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        id,
        username: data.username,
        avatar: data.avatar,
    }));
    io.emit('users:online', list);
};

// Authenticate socket connections via JWT cookie
io.use((socket: Socket, next) => {
    const authSocket = socket as AuthSocket;
    const cookieHeader = socket.handshake.headers.cookie || '';
    const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c) => {
            const [k, ...v] = c.trim().split('=');
            return [k.trim(), decodeURIComponent(v.join('='))];
        }),
    );

    const token = cookies.token;
    if (!token) return next(new Error('Not authenticated'));

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        authSocket.userId = payload.id;
        next();
    } catch {
        next(new Error('Invalid token'));
    }
});

io.on('connection', async (socket: Socket) => {
    const authSocket = socket as AuthSocket;
    const userId = authSocket.userId;

    const user = await User.findById(userId).select('username avatar').lean();
    if (!user) return socket.disconnect();

    if (onlineUsers.has(userId)) {
        onlineUsers.get(userId)!.count++;
    } else {
        onlineUsers.set(userId, { count: 1, username: (user as any).username, avatar: (user as any).avatar });
        broadcastOnlineUsers();
    }

    console.log(`[SOCKET] ${(user as any).username} connected (${socket.id}) — ${onlineUsers.get(userId)!.count} tab(s)`);

    // Events blackjack (blackjack:join / sit / bet / action / …)
    registerBlackjackHandlers(io, socket, blackjack, userId, (user as any).username);

    socket.on('disconnect', () => {
        const entry = onlineUsers.get(userId);
        if (!entry) return;

        entry.count--;
        console.log(`[SOCKET] ${(user as any).username} disconnected — ${entry.count} tab(s) remaining`);

        if (entry.count === 0) {
            onlineUsers.delete(userId);
            broadcastOnlineUsers();
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
