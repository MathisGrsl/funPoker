import { Server } from 'socket.io';
import User from '../../models/User';
import { BlackjackTable, TableConfig, TableHooks } from './engine';
import { PlayerAction } from './types';

/** Capital de départ offert si le joueur n'a pas assez de VirtualCredit pour jouer. */
const STARTER_CHIPS = 1000;
const MIN_TO_PLAY = 100;

export const roomOf = (tableId: string) => `bj:${tableId}`;

interface TableInfo {
    id: string;
    name: string;
    phase: string;
    seatsTaken: number;
    maxSeats: number;
}

/**
 * Orchestre les tables de blackjack :
 *  - registre des tables en mémoire,
 *  - cache des soldes VirtualCredit (source de vérité = Mongo, écrit au règlement),
 *  - diffusion des snapshots vers les rooms socket.
 */
export class BlackjackManager {
    private io: Server;
    private tables = new Map<string, BlackjackTable>();
    private balances = new Map<string, number>();

    constructor(io: Server) {
        this.io = io;
        this.seedDefaultTables();
    }

    private seedDefaultTables(): void {
        this.createTable('main-1', 'Table Or — 5/1000');
        this.createTable('main-2', 'Table Émeraude — 5/1000');
        this.createTable('main-3d', 'Table 3D — 3 places', { seats: 3 });
    }

    private createTable(id: string, name: string, config: Partial<TableConfig> = {}): BlackjackTable {
        const hooks: TableHooks = {
            broadcast: (table) => this.io.to(roomOf(table.id)).emit('blackjack:state', table.snapshot()),
            getBalance: (playerId) => this.balances.get(playerId) ?? 0,
            adjustBalance: (playerId, delta) => {
                this.balances.set(playerId, (this.balances.get(playerId) ?? 0) + delta);
            },
            onRoundSettled: (table) => this.persistBalances(table.occupantIds()),
        };
        const table = new BlackjackTable(id, name, hooks, config);
        this.tables.set(id, table);
        return table;
    }

    getTable(tableId: string): BlackjackTable | undefined {
        return this.tables.get(tableId);
    }

    listTables(): TableInfo[] {
        return [...this.tables.values()].map((t) => {
            const snap = t.snapshot();
            return {
                id: t.id,
                name: t.name,
                phase: snap.phase,
                seatsTaken: snap.seats.filter((s) => s.playerId).length,
                maxSeats: snap.seats.length,
            };
        });
    }

    /** Charge le solde du joueur depuis Mongo (avec capital de départ si nécessaire). */
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

    getBalance(playerId: string): number {
        return this.balances.get(playerId) ?? 0;
    }

    private async persistBalances(playerIds: string[]): Promise<void> {
        await Promise.all(
            playerIds.map((id) =>
                User.updateOne({ _id: id }, { VirtualCredit: this.balances.get(id) ?? 0 }).catch((err) =>
                    console.error('[BLACKJACK] persist balance:', err),
                ),
            ),
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Actions joueur (déléguées à la table après chargement du solde)   */
    /* ------------------------------------------------------------------ */

    sit(playerId: string, name: string, tableId: string, seatIndex: number) {
        return this.tables.get(tableId)?.sit(playerId, name, seatIndex) ?? { ok: false, error: 'Table introuvable' };
    }

    bet(playerId: string, tableId: string, seatIndex: number, amount: number) {
        return this.tables.get(tableId)?.placeBet(playerId, seatIndex, amount) ?? { ok: false, error: 'Table introuvable' };
    }

    act(playerId: string, tableId: string, seatIndex: number, handIndex: number, action: PlayerAction) {
        return this.tables.get(tableId)?.act(playerId, seatIndex, handIndex, action) ?? { ok: false, error: 'Table introuvable' };
    }

    insure(playerId: string, tableId: string, seatIndex: number, take: boolean) {
        return this.tables.get(tableId)?.insure(playerId, seatIndex, take) ?? { ok: false, error: 'Table introuvable' };
    }

    rebet(playerId: string, tableId: string) {
        return this.tables.get(tableId)?.rebet(playerId) ?? { ok: false, error: 'Table introuvable' };
    }

    dealNow(playerId: string, tableId: string) {
        return this.tables.get(tableId)?.forceDeal(playerId) ?? { ok: false, error: 'Table introuvable' };
    }

    leaveSeat(playerId: string, tableId: string, seatIndex: number) {
        return this.tables.get(tableId)?.leaveSeat(playerId, seatIndex) ?? { ok: false, error: 'Table introuvable' };
    }

    /** Offre un nouveau capital si le joueur est (presque) à court. Renvoie le nouveau solde. */
    async topup(playerId: string): Promise<number> {
        const current = this.balances.get(playerId) ?? 0;
        if (current >= MIN_TO_PLAY) return current;
        this.balances.set(playerId, STARTER_CHIPS);
        await User.updateOne({ _id: playerId }, { VirtualCredit: STARTER_CHIPS }).catch(() => {});
        return STARTER_CHIPS;
    }

    broadcastTable(tableId: string): void {
        const table = this.tables.get(tableId);
        if (table) this.io.to(roomOf(tableId)).emit('blackjack:state', table.snapshot());
    }

    /** Le joueur quitte une table (déconnexion ou départ volontaire). */
    leaveTable(playerId: string, tableId: string): void {
        const table = this.tables.get(tableId);
        if (!table) return;
        table.leaveAll(playerId);
        this.persistBalances([playerId]);
    }
}
