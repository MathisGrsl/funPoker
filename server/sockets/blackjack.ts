import { Server, Socket } from 'socket.io';
import { BlackjackManager, roomOf } from '../game/blackjack/manager';
import { PlayerAction } from '../game/blackjack/types';

type Result = { ok: boolean; error?: string };

const ACTIONS: PlayerAction[] = ['hit', 'stand', 'double', 'split'];

/**
 * Branche les events `blackjack:*` sur un socket déjà authentifié.
 * Appelé une fois par connexion depuis le handler `io.on('connection')`.
 */
export function registerBlackjackHandlers(
    io: Server,
    socket: Socket,
    manager: BlackjackManager,
    userId: string,
    username: string,
): void {
    const joined = new Set<string>();

    const respond = (result: Result) => {
        if (!result.ok) socket.emit('blackjack:error', { message: result.error ?? 'Action refusée' });
    };

    socket.on('blackjack:tables', () => {
        socket.emit('blackjack:tables', manager.listTables());
    });

    socket.on('blackjack:join', async ({ tableId }: { tableId: string }) => {
        const table = manager.getTable(tableId);
        if (!table) return socket.emit('blackjack:error', { message: 'Table introuvable' });

        const balance = await manager.ensureBalance(userId);
        socket.join(roomOf(tableId));
        joined.add(tableId);
        socket.emit('blackjack:balance', { balance });
        socket.emit('blackjack:state', table.snapshot());
    });

    socket.on('blackjack:sit', ({ tableId, seatIndex }: { tableId: string; seatIndex: number }) => {
        respond(manager.sit(userId, username, tableId, seatIndex));
    });

    socket.on('blackjack:leaveSeat', ({ tableId, seatIndex }: { tableId: string; seatIndex: number }) => {
        respond(manager.leaveSeat(userId, tableId, seatIndex));
    });

    socket.on('blackjack:bet', ({ tableId, seatIndex, amount }: { tableId: string; seatIndex: number; amount: number }) => {
        if (typeof amount !== 'number' || !Number.isFinite(amount)) return;
        respond(manager.bet(userId, tableId, seatIndex, amount));
    });

    socket.on(
        'blackjack:action',
        ({ tableId, seatIndex, handIndex, action }: { tableId: string; seatIndex: number; handIndex: number; action: PlayerAction }) => {
            if (!ACTIONS.includes(action)) return;
            respond(manager.act(userId, tableId, seatIndex, handIndex, action));
        },
    );

    socket.on('blackjack:deal', ({ tableId }: { tableId: string }) => {
        respond(manager.dealNow(userId, tableId));
    });

    socket.on('blackjack:rebet', ({ tableId }: { tableId: string }) => {
        respond(manager.rebet(userId, tableId));
    });

    socket.on('blackjack:insurance', ({ tableId, seatIndex, take }: { tableId: string; seatIndex: number; take: boolean }) => {
        respond(manager.insure(userId, tableId, seatIndex, !!take));
    });

    socket.on('blackjack:topup', async ({ tableId }: { tableId: string }) => {
        const balance = await manager.topup(userId);
        socket.emit('blackjack:balance', { balance });
        if (tableId) manager.broadcastTable(tableId);
    });

    socket.on('blackjack:leaveTable', ({ tableId }: { tableId: string }) => {
        manager.leaveTable(userId, tableId);
        socket.leave(roomOf(tableId));
        joined.delete(tableId);
    });

    socket.on('disconnect', () => {
        for (const tableId of joined) manager.leaveTable(userId, tableId);
    });
}
