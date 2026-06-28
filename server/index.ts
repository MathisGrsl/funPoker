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

// Private Texas Hold'em tables
interface PrivateTableEntry {
    tableId: string;
    roomCode: string;
    creatorId: string;
    creatorUsername: string;
    players: Map<string, string>; // userId -> username
    invited: Map<string, { username: string; status: 'pending' | 'accepted' | 'declined' }>;
}

const privateTables = new Map<string, PrivateTableEntry>();
const userSocketIds = new Map<string, Set<string>>(); // userId -> set of socketIds

const broadcastPrivateState = (tableId: string) => {
    const table = privateTables.get(tableId);
    if (!table) return;
    io.to(`private:${tableId}`).emit('private:state', {
        tableId: table.tableId,
        roomCode: table.roomCode,
        creatorId: table.creatorId,
        players: Array.from(table.players.entries()).map(([id, username]) => ({ id, username })),
        invited: Array.from(table.invited.entries()).map(([id, { username, status }]) => ({ id, username, status })),
    });
};

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

    // Track socket IDs per user (for targeted private invites)
    if (!userSocketIds.has(userId)) userSocketIds.set(userId, new Set());
    userSocketIds.get(userId)!.add(socket.id);

    console.log(`[SOCKET] ${(user as any).username} connected (${socket.id}) — ${onlineUsers.get(userId)!.count} tab(s)`);

    // Events blackjack (blackjack:join / sit / bet / action / …)
    registerBlackjackHandlers(io, socket, blackjack, userId, (user as any).username);

    // ── Private Texas Hold'em table events ──────────────────────────────────

    socket.on('private:rejoin', ({ tableId }: { tableId: string }) => {
        const table = privateTables.get(tableId);
        if (!table) {
            socket.emit('private:not_found');
            return;
        }
        const isCreator = table.creatorId === userId;
        const invite = table.invited.get(userId);
        const isAccepted = invite?.status === 'accepted';
        if (!isCreator && !isAccepted) return;
        socket.join(`private:${tableId}`);
        broadcastPrivateState(tableId);
    });

    socket.on('private:create', () => {
        const tableId = Math.random().toString(36).substring(2, 14).toUpperCase();
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const table: PrivateTableEntry = {
            tableId,
            roomCode,
            creatorId: userId,
            creatorUsername: (user as any).username,
            players: new Map([[userId, (user as any).username]]),
            invited: new Map(),
        };
        privateTables.set(tableId, table);
        socket.join(`private:${tableId}`);
        socket.emit('private:created', { tableId, roomCode });
        broadcastPrivateState(tableId);
        console.log(`[PRIVATE] ${(user as any).username} created table ${tableId} (code: ${roomCode})`);
    });

    socket.on('private:invite', ({ tableId, targetUserId }: { tableId: string; targetUserId: string }) => {
        const table = privateTables.get(tableId);
        if (!table || table.creatorId !== userId) return;
        const targetOnline = onlineUsers.get(targetUserId);
        if (!targetOnline || table.invited.has(targetUserId)) return;
        table.invited.set(targetUserId, { username: targetOnline.username, status: 'pending' });
        // Send invite to all sockets of the target user
        const targetSockets = userSocketIds.get(targetUserId);
        if (targetSockets) {
            for (const sid of targetSockets) {
                io.to(sid).emit('private:invite:received', {
                    tableId,
                    roomCode: table.roomCode,
                    creatorId: table.creatorId,
                    creatorUsername: table.creatorUsername,
                });
            }
        }
        broadcastPrivateState(tableId);
        console.log(`[PRIVATE] ${(user as any).username} invited ${targetOnline.username} to table ${tableId}`);
    });

    socket.on('private:invite:respond', ({ tableId, accept }: { tableId: string; accept: boolean }) => {
        const table = privateTables.get(tableId);
        if (!table) return;
        const invite = table.invited.get(userId);
        if (!invite || invite.status !== 'pending') return;
        if (accept) {
            invite.status = 'accepted';
            table.players.set(userId, (user as any).username);
            socket.join(`private:${tableId}`);
        } else {
            invite.status = 'declined';
        }
        broadcastPrivateState(tableId);
        console.log(`[PRIVATE] ${(user as any).username} ${accept ? 'accepted' : 'declined'} invite to table ${tableId}`);
    });

    // ────────────────────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
        const entry = onlineUsers.get(userId);
        if (!entry) return;

        entry.count--;
        console.log(`[SOCKET] ${(user as any).username} disconnected — ${entry.count} tab(s) remaining`);

        if (entry.count === 0) {
            onlineUsers.delete(userId);
            broadcastOnlineUsers();
        }

        const socketSet = userSocketIds.get(userId);
        if (socketSet) {
            socketSet.delete(socket.id);
            if (socketSet.size === 0) userSocketIds.delete(userId);
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
