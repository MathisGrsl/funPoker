import { Server } from 'socket.io';
import User from '../../models/User';
import { TableHooks, UltimateTable } from './engine';
import { UltAction } from './types';

const STARTER_CHIPS = 1000;
const MIN_TO_PLAY = 100;

export const roomOf = (tableId: string) => `ult:${tableId}`;

/** Orchestre les tables d'Ultimate Texas Hold'em (état + soldes + diffusion). */
export class UltimateManager {
    private io: Server;
    private tables = new Map<string, UltimateTable>();
    private balances = new Map<string, number>();

    constructor(io: Server) {
        this.io = io;
        this.createTable('ult-1', 'Salon Diamant — 5/500');
        this.createTable('ult-2', 'Salon Royal — 5/500');
    }

    private createTable(id: string, name: string): void {
        const hooks: TableHooks = {
            broadcast: (t) => this.io.to(roomOf(t.id)).emit('ultimate:state', t.snapshot()),
            getBalance: (id) => this.balances.get(id) ?? 0,
            adjustBalance: (id, d) => this.balances.set(id, (this.balances.get(id) ?? 0) + d),
            onRoundSettled: (t) => this.persistBalances(t.occupantIds()),
        };
        this.tables.set(id, new UltimateTable(id, name, hooks));
    }

    getTable(tableId: string): UltimateTable | undefined {
        return this.tables.get(tableId);
    }

    async ensureBalance(playerId: string): Promise<number> {
        if (this.balances.has(playerId)) return this.balances.get(playerId)!;
        const user = await User.findById(playerId).select('VirtualCredit').lean();
        let balance = (user as any)?.VirtualCredit ?? 0;
        if (balance < MIN_TO_PLAY) {
            balance = STARTER_CHIPS;
            await User.updateOne({ _id: playerId }, { VirtualCredit: balance }).catch(() => {});
        }
        this.balances.set(playerId, balance);
        return balance;
    }

    private async persistBalances(playerIds: string[]): Promise<void> {
        await Promise.all(
            playerIds.map((id) =>
                User.updateOne({ _id: id }, { VirtualCredit: this.balances.get(id) ?? 0 }).catch((err) =>
                    console.error('[ULTIMATE] persist balance:', err),
                ),
            ),
        );
    }

    async topup(playerId: string): Promise<number> {
        const current = this.balances.get(playerId) ?? 0;
        if (current >= MIN_TO_PLAY) return current;
        this.balances.set(playerId, STARTER_CHIPS);
        await User.updateOne({ _id: playerId }, { VirtualCredit: STARTER_CHIPS }).catch(() => {});
        return STARTER_CHIPS;
    }

    broadcastTable(tableId: string): void {
        const table = this.tables.get(tableId);
        if (table) this.io.to(roomOf(tableId)).emit('ultimate:state', table.snapshot());
    }

    private with<T>(tableId: string, fn: (t: UltimateTable) => T): T | { ok: false; error: string } {
        const table = this.tables.get(tableId);
        return table ? fn(table) : { ok: false, error: 'Table introuvable' };
    }

    sit(playerId: string, name: string, tableId: string, seatIndex: number) {
        return this.with(tableId, (t) => t.sit(playerId, name, seatIndex));
    }
    setAnte(playerId: string, tableId: string, seatIndex: number, amount: number) {
        return this.with(tableId, (t) => t.setAnte(playerId, seatIndex, amount));
    }
    setTrips(playerId: string, tableId: string, seatIndex: number, amount: number) {
        return this.with(tableId, (t) => t.setTrips(playerId, seatIndex, amount));
    }
    rebet(playerId: string, tableId: string) {
        return this.with(tableId, (t) => t.rebet(playerId));
    }
    dealNow(playerId: string, tableId: string) {
        return this.with(tableId, (t) => t.forceDeal(playerId));
    }
    act(playerId: string, tableId: string, seatIndex: number, action: UltAction) {
        return this.with(tableId, (t) => t.act(playerId, seatIndex, action));
    }
    leaveSeat(playerId: string, tableId: string, seatIndex: number) {
        return this.with(tableId, (t) => t.leaveSeat(playerId, seatIndex));
    }
    leaveTable(playerId: string, tableId: string): void {
        const table = this.tables.get(tableId);
        if (!table) return;
        table.leaveAll(playerId);
        this.persistBalances([playerId]);
    }
}
