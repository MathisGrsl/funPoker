import { Server, Socket } from 'socket.io';
import { PokerLobbyManager } from '../game/poker/manager';
import type { PokerGameMode } from '../game/poker/types';

const VALID_MODES: PokerGameMode[] = ['poker-5', 'poker-9'];

export function registerPokerHandlers(
    io: Server,
    socket: Socket,
    manager: PokerLobbyManager,
    userId: string,
    username: string,
    avatar: string | null,
) {
    socket.on('poker:findOrCreate', ({ gameMode, sb, bb }: { gameMode: string; sb: string; bb: string }) => {
        if (!VALID_MODES.includes(gameMode as PokerGameMode)) return;

        const lobby = manager.findOrCreate(gameMode as PokerGameMode, sb, bb);
        const added = manager.addPlayer(lobby.tableId, userId, username, avatar);

        // Edge case: lobby just filled between findOrCreate and addPlayer — retry once
        if (!added) {
            const fresh = manager.findOrCreate(gameMode as PokerGameMode, sb, bb);
            manager.addPlayer(fresh.tableId, userId, username, avatar);
            socket.join(`poker:${fresh.tableId}`);
            socket.emit('poker:joined', { tableId: fresh.tableId });
            io.to(`poker:${fresh.tableId}`).emit('poker:state', manager.getPublicState(fresh.tableId));
            return;
        }

        socket.join(`poker:${lobby.tableId}`);
        socket.emit('poker:joined', { tableId: lobby.tableId });
        io.to(`poker:${lobby.tableId}`).emit('poker:state', manager.getPublicState(lobby.tableId));

        console.log(`[POKER] ${username} joined lobby ${lobby.tableId} (${gameMode} · ${sb}/${bb})`);
    });

    socket.on('poker:rejoin', ({ tableId }: { tableId: string }) => {
        if (!manager.hasPlayer(tableId, userId)) {
            socket.emit('poker:not_found');
            return;
        }
        socket.join(`poker:${tableId}`);
        socket.emit('poker:state', manager.getPublicState(tableId));
    });

    socket.on('poker:leave', ({ tableId }: { tableId: string }) => {
        manager.removePlayer(tableId, userId);
        socket.leave(`poker:${tableId}`);
        const state = manager.getPublicState(tableId);
        if (state) io.to(`poker:${tableId}`).emit('poker:state', state);
        console.log(`[POKER] ${username} left lobby ${tableId}`);
    });
}
