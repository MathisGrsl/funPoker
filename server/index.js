const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
// const authRoutes = require('./routes/auth');
// const gameRoutes = require('./routes/game');
// const friendRoutes = require('./routes/friends');
// const groupRoutes = require('./routes/groups');

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

connectDB();

// app.use('/api/auth', authRoutes);
// app.use('/api/games', gameRoutes);
// app.use('/api/friends', friendRoutes);
// app.use('/api/groups', groupRoutes);

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
    console.log(`[SOCKET] Nouvelle connexion: ${socketId}`);

    socket.on('disconnect', () => {
        console.log(`[SOCKET] Déconnexion: ${socketId}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

module.exports = app;
