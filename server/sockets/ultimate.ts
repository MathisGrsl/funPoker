import { Server, Socket } from 'socket.io';
import { UltimateManager, roomOf } from '../game/ultimate/manager';
import { UltAction } from '../game/ultimate/types';

type Result = { ok: boolean; error?: string };
const ACTIONS: UltAction[] = ['check', 'fold', 'play4x', 'play3x', 'play2x', 'play1x'];

/** Branche les events `ultimate:*` sur un socket authentifié. */
export function registerUltimateHandlers(
    io: Server,
    socket: Socket,
    manager: UltimateManager,
    userId: string,
    username: string,
): void {
    const joined = new Set<string>();
    const respond = (r: Result) => { if (!r.ok) socket.emit('ultimate:error', { message: r.error ?? 'Action refusée' }); };

    socket.on('ultimate:join', async ({ tableId }: { tableId: string }) => {
        const table = manager.getTable(tableId);
        if (!table) return socket.emit('ultimate:error', { message: 'Table introuvable' });
        const balance = await manager.ensureBalance(userId);
        socket.join(roomOf(tableId));
        joined.add(tableId);
        socket.emit('ultimate:balance', { balance });
        socket.emit('ultimate:state', table.snapshot());
    });

    socket.on('ultimate:sit', ({ tableId, seatIndex }: { tableId: string; seatIndex: number }) => {
        respond(manager.sit(userId, username, tableId, seatIndex));
    });
    socket.on('ultimate:leaveSeat', ({ tableId, seatIndex }: { tableId: string; seatIndex: number }) => {
        respond(manager.leaveSeat(userId, tableId, seatIndex));
    });
    socket.on('ultimate:ante', ({ tableId, seatIndex, amount }: { tableId: string; seatIndex: number; amount: number }) => {
        if (typeof amount !== 'number' || !Number.isFinite(amount)) return;
        respond(manager.setAnte(userId, tableId, seatIndex, amount));
    });
    socket.on('ultimate:trips', ({ tableId, seatIndex, amount }: { tableId: string; seatIndex: number; amount: number }) => {
        if (typeof amount !== 'number' || !Number.isFinite(amount)) return;
        respond(manager.setTrips(userId, tableId, seatIndex, amount));
    });
    socket.on('ultimate:rebet', ({ tableId }: { tableId: string }) => respond(manager.rebet(userId, tableId)));
    socket.on('ultimate:deal', ({ tableId }: { tableId: string }) => respond(manager.dealNow(userId, tableId)));
    socket.on('ultimate:action', ({ tableId, seatIndex, action }: { tableId: string; seatIndex: number; action: UltAction }) => {
        if (!ACTIONS.includes(action)) return;
        respond(manager.act(userId, tableId, seatIndex, action));
    });
    socket.on('ultimate:topup', async ({ tableId }: { tableId: string }) => {
        const balance = await manager.topup(userId);
        socket.emit('ultimate:balance', { balance });
        if (tableId) manager.broadcastTable(tableId);
    });
    socket.on('ultimate:leaveTable', ({ tableId }: { tableId: string }) => {
        manager.leaveTable(userId, tableId);
        socket.leave(roomOf(tableId));
        joined.delete(tableId);
    });
    socket.on('disconnect', () => {
        for (const tableId of joined) manager.leaveTable(userId, tableId);
    });
}
