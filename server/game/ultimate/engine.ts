import { Card, buildDeck } from './cards';
import { CAT_NAME, bestOf7, isRoyal } from './handeval';
import { settle } from './payouts';
import { Decision, Phase, Seat, SnapshotCard, TableSnapshot, UltAction } from './types';

export interface TableHooks {
    broadcast(table: UltimateTable): void;
    getBalance(playerId: string): number;
    adjustBalance(playerId: string, delta: number): void;
    onRoundSettled(table: UltimateTable): void;
}

export interface TableConfig {
    seats: number;
    minAnte: number;
    maxAnte: number;
    bettingMs: number;
    turnMs: number;
    revealMs: number;
    showdownMs: number;
}

export const DEFAULT_CONFIG: TableConfig = {
    seats: 6,
    minAnte: 5,
    maxAnte: 500,
    bettingMs: 20000,
    turnMs: 20000,
    revealMs: 850,
    showdownMs: 7000,
};

type Result = { ok: boolean; error?: string };
const ok = (): Result => ({ ok: true });
const fail = (error: string): Result => ({ ok: false, error });

export class UltimateTable {
    readonly id: string;
    readonly name: string;
    readonly config: TableConfig;

    private hooks: TableHooks;
    private seats: Seat[];
    private deck: Card[] = [];
    private community: Card[] = [];
    private revealed = 0; // cartes communes face visible (0,3,5)
    private dealer: Card[] = [];
    private dealerHidden = true;
    private dealerHandName?: string;

    private phase: Phase = 'waiting';
    private activeSeat: number | null = null;
    private timer: NodeJS.Timeout | null = null;
    private deadline: number | null = null;

    constructor(id: string, name: string, hooks: TableHooks, config: Partial<TableConfig> = {}) {
        this.id = id;
        this.name = name;
        this.hooks = hooks;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.seats = Array.from({ length: this.config.seats }, (_, i) => this.emptySeat(i));
    }

    /* ------------------------------------------------------------------ */
    /*  API publique                                                       */
    /* ------------------------------------------------------------------ */

    sit(playerId: string, playerName: string, seatIndex: number): Result {
        const seat = this.seats[seatIndex];
        if (!seat) return fail('Siège invalide');
        if (seat.playerId && seat.playerId !== playerId) return fail('Siège déjà occupé');
        if (this.phase !== 'waiting' && this.phase !== 'betting') return fail('Donne en cours, asseyez-vous au prochain tour');

        seat.playerId = playerId;
        seat.playerName = playerName;
        seat.disconnected = false;
        if (this.phase === 'waiting') this.startBetting();
        else this.broadcast();
        return ok();
    }

    leaveSeat(playerId: string, seatIndex: number): Result {
        const seat = this.seats[seatIndex];
        if (!seat || seat.playerId !== playerId) return fail('Ce siège n\'est pas le vôtre');
        if (this.phase === 'waiting' || this.phase === 'betting') {
            this.refundSeat(seat);
            this.resetSeat(seat);
            this.broadcast();
        } else {
            seat.disconnected = true;
        }
        return ok();
    }

    leaveAll(playerId: string): void {
        let changed = false;
        for (const seat of this.seats) {
            if (seat.playerId !== playerId) continue;
            if (this.phase === 'waiting' || this.phase === 'betting') {
                this.refundSeat(seat);
                this.resetSeat(seat);
            } else {
                seat.disconnected = true;
            }
            changed = true;
        }
        if (changed) this.broadcast();
    }

    /** Pose Ante (+ Blind égal). amount=0 efface. */
    setAnte(playerId: string, seatIndex: number, amount: number): Result {
        const seat = this.seats[seatIndex];
        if (!seat || seat.playerId !== playerId) return fail('Ce siège n\'est pas le vôtre');
        if (this.phase === 'waiting') this.startBetting();
        if (this.phase !== 'betting') return fail('Les mises sont fermées');

        amount = Math.floor(amount);
        if (amount === 0) { this.refundAnte(seat); this.broadcast(); return ok(); }
        if (amount < this.config.minAnte || amount > this.config.maxAnte) return fail(`Ante entre ${this.config.minAnte} et ${this.config.maxAnte}`);

        const prev = seat.ante * 2;
        if (this.hooks.getBalance(playerId) + prev < amount * 2) return fail('Solde insuffisant');
        if (prev > 0) this.hooks.adjustBalance(playerId, prev);
        this.hooks.adjustBalance(playerId, -amount * 2); // Ante + Blind
        seat.ante = amount;
        seat.blind = amount;
        this.broadcast();
        return ok();
    }

    /** Pose la mise Trips (bonus). amount=0 efface. */
    setTrips(playerId: string, seatIndex: number, amount: number): Result {
        const seat = this.seats[seatIndex];
        if (!seat || seat.playerId !== playerId) return fail('Ce siège n\'est pas le vôtre');
        if (this.phase !== 'betting') return fail('Les mises sont fermées');

        amount = Math.max(0, Math.floor(amount));
        if (amount > this.config.maxAnte) return fail(`Trips max ${this.config.maxAnte}`);
        const prev = seat.trips;
        if (this.hooks.getBalance(playerId) + prev < amount) return fail('Solde insuffisant');
        if (prev > 0) this.hooks.adjustBalance(playerId, prev);
        if (amount > 0) this.hooks.adjustBalance(playerId, -amount);
        seat.trips = amount;
        this.broadcast();
        return ok();
    }

    rebet(playerId: string): Result {
        if (this.phase === 'waiting') this.startBetting();
        if (this.phase !== 'betting') return fail('Les mises sont fermées');
        let any = false;
        for (const seat of this.seats) {
            if (seat.playerId !== playerId || seat.lastAnte <= 0 || seat.ante > 0) continue;
            const cost = seat.lastAnte * 2 + seat.lastTrips;
            if (this.hooks.getBalance(playerId) < cost) continue;
            this.hooks.adjustBalance(playerId, -cost);
            seat.ante = seat.lastAnte;
            seat.blind = seat.lastAnte;
            seat.trips = seat.lastTrips;
            any = true;
        }
        if (!any) return fail('Aucune mise précédente à rejouer');
        this.broadcast();
        return ok();
    }

    forceDeal(playerId: string): Result {
        if (this.phase !== 'betting') return fail('Pas en phase de mise');
        if (!this.seats.some((s) => s.playerId === playerId)) return fail('Asseyez-vous d\'abord');
        if (!this.seats.some((s) => s.playerId && s.ante > 0)) return fail('Aucune mise placée');
        this.deal();
        return ok();
    }

    act(playerId: string, seatIndex: number, action: UltAction): Result {
        if (seatIndex !== this.activeSeat) return fail('Ce n\'est pas votre tour');
        const seat = this.seats[seatIndex];
        if (!seat || seat.playerId !== playerId) return fail('Ce siège n\'est pas le vôtre');
        if (!this.legalActions(this.phase).includes(action)) return fail('Action interdite à cette étape');

        if (action === 'check') seat.decision = 'checked';
        else if (action === 'fold') seat.decision = 'folded';
        else {
            const mult = action === 'play4x' ? 4 : action === 'play3x' ? 3 : action === 'play2x' ? 2 : 1;
            const amount = seat.ante * mult;
            if (this.hooks.getBalance(playerId) < amount) return fail('Solde insuffisant pour cette relance');
            this.hooks.adjustBalance(playerId, -amount);
            seat.play = amount;
            seat.decision = 'played';
        }
        this.advanceActor();
        return ok();
    }

    private legalActions(phase: Phase): UltAction[] {
        if (phase === 'preflop') return ['check', 'play4x', 'play3x'];
        if (phase === 'flop') return ['check', 'play2x'];
        if (phase === 'river') return ['fold', 'play1x'];
        return [];
    }

    /* ------------------------------------------------------------------ */
    /*  Machine à états                                                    */
    /* ------------------------------------------------------------------ */

    private startBetting(): void {
        this.clearTimer();
        this.phase = 'betting';
        this.activeSeat = null;
        this.community = [];
        this.revealed = 0;
        this.dealer = [];
        this.dealerHidden = true;
        this.dealerHandName = undefined;
        for (const seat of this.seats) this.clearHand(seat);
        this.setTimer(this.config.bettingMs, () => this.deal());
        this.broadcast();
    }

    private deal(): void {
        this.clearTimer();
        // Sièges sans Ante : retirés pour libérer la place.
        for (const seat of this.seats) if (seat.playerId && seat.ante === 0) this.resetSeat(seat);

        const inPlay = this.seats.filter((s) => s.playerId && s.ante > 0);
        if (inPlay.length === 0) { this.phase = 'waiting'; this.broadcast(); return; }

        this.deck = buildDeck();
        this.community = [this.deck.pop()!, this.deck.pop()!, this.deck.pop()!, this.deck.pop()!, this.deck.pop()!];
        this.revealed = 0;
        this.dealer = [this.deck.pop()!, this.deck.pop()!];
        this.dealerHidden = true;

        for (const seat of inPlay) {
            seat.hole = [this.deck.pop()!, this.deck.pop()!];
            seat.play = 0;
            seat.decision = 'pending';
            seat.results = undefined;
            seat.payout = undefined;
            seat.handName = undefined;
            seat.lastAnte = seat.ante;
            seat.lastTrips = seat.trips;
        }

        this.startStreet('preflop');
    }

    private startStreet(phase: Phase): void {
        this.phase = phase;
        const next = this.findNextActor(0, phase);
        if (next === null) {
            // Personne à jouer : on enchaîne après une courte pause (laisse voir le board).
            this.setTimer(this.config.revealMs, () => this.endStreet(phase));
            this.broadcast();
            return;
        }
        this.activeSeat = next;
        this.setTimer(this.config.turnMs, () => this.onTurnTimeout());
        this.broadcast();
    }

    private advanceActor(): void {
        this.clearTimer();
        const next = this.findNextActor((this.activeSeat ?? -1) + 1, this.phase);
        if (next === null) { this.endStreet(this.phase); return; }
        this.activeSeat = next;
        this.setTimer(this.config.turnMs, () => this.onTurnTimeout());
        this.broadcast();
    }

    private onTurnTimeout(): void {
        if (this.activeSeat === null) return;
        const seat = this.seats[this.activeSeat];
        // Défaut : check au preflop/flop, fold à la river.
        seat.decision = this.phase === 'river' ? 'folded' : 'checked';
        this.advanceActor();
    }

    private endStreet(phase: Phase): void {
        this.clearTimer();
        this.activeSeat = null;
        if (phase === 'preflop') { this.revealed = 3; this.startStreet('flop'); }
        else if (phase === 'flop') { this.revealed = 5; this.startStreet('river'); }
        else this.showdown();
    }

    private showdown(): void {
        this.clearTimer();
        this.phase = 'showdown';
        this.activeSeat = null;
        this.dealerHidden = false;
        this.revealed = 5;

        const dealerScore = bestOf7([...this.dealer, ...this.community]);
        const qualifies = dealerScore.cat >= 1;
        this.dealerHandName = `${CAT_NAME[dealerScore.cat]}${qualifies ? '' : ' (non qualifié)'}`;

        for (const seat of this.seats) {
            if (!seat.playerId || seat.ante === 0 || seat.hole.length === 0) continue;
            const playerScore = bestOf7([...seat.hole, ...this.community]);
            const folded = seat.decision === 'folded';
            const s = settle({ ante: seat.ante, blind: seat.blind, trips: seat.trips, play: seat.play }, folded, playerScore, dealerScore);
            if (s.total > 0) this.hooks.adjustBalance(seat.playerId, s.total);
            seat.results = { ante: s.ante.outcome, blind: s.blind.outcome, play: s.play.outcome, trips: s.trips.outcome };
            seat.payout = s.total;
            seat.handName = isRoyal(playerScore) ? 'Quinte flush royale' : CAT_NAME[playerScore.cat];
        }

        this.broadcast();
        this.hooks.onRoundSettled(this);
        this.setTimer(this.config.showdownMs, () => this.nextRound());
    }

    private nextRound(): void {
        this.clearTimer();
        for (const seat of this.seats) {
            if (seat.disconnected) this.resetSeat(seat);
            else this.clearHand(seat);
        }
        this.community = [];
        this.dealer = [];
        this.revealed = 0;
        this.dealerHidden = true;
        this.dealerHandName = undefined;
        if (this.seats.some((s) => s.playerId)) this.startBetting();
        else { this.phase = 'waiting'; this.broadcast(); }
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    private findNextActor(from: number, phase: Phase): number | null {
        const eligible = (s: Seat) =>
            s.playerId && s.ante > 0 && (phase === 'preflop' ? s.decision === 'pending' : s.decision === 'checked');

        for (let i = Math.max(0, from); i < this.seats.length; i++) {
            const seat = this.seats[i];
            if (!eligible(seat)) continue;
            if (seat.disconnected) {
                // Joueur parti : résolution automatique, on passe.
                seat.decision = phase === 'river' ? 'folded' : 'checked';
                continue;
            }
            return i;
        }
        return null;
    }

    private clearHand(seat: Seat): void {
        seat.ante = 0;
        seat.blind = 0;
        seat.trips = 0;
        seat.play = 0;
        seat.hole = [];
        seat.decision = 'none';
        seat.results = undefined;
        seat.payout = undefined;
        seat.handName = undefined;
    }

    private refundAnte(seat: Seat): void {
        if (seat.playerId && seat.ante > 0) this.hooks.adjustBalance(seat.playerId, seat.ante * 2);
        seat.ante = 0;
        seat.blind = 0;
    }

    private refundSeat(seat: Seat): void {
        if (!seat.playerId) return;
        const refund = seat.ante * 2 + seat.trips;
        if (refund > 0) this.hooks.adjustBalance(seat.playerId, refund);
    }

    private resetSeat(seat: Seat): void {
        Object.assign(seat, this.emptySeat(seat.index));
    }

    private emptySeat(index: number): Seat {
        return {
            index, playerId: null, playerName: null,
            ante: 0, blind: 0, trips: 0, play: 0,
            hole: [], decision: 'none', lastAnte: 0, lastTrips: 0, disconnected: false,
        };
    }

    private setTimer(ms: number, cb: () => void): void {
        this.clearTimer();
        this.deadline = Date.now() + ms;
        this.timer = setTimeout(cb, ms);
    }

    private clearTimer(): void {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.deadline = null;
    }

    private broadcast(): void { this.hooks.broadcast(this); }
    dispose(): void { this.clearTimer(); }
    hasPlayers(): boolean { return this.seats.some((s) => s.playerId); }
    occupantIds(): string[] { return [...new Set(this.seats.map((s) => s.playerId).filter(Boolean) as string[])]; }

    /* ------------------------------------------------------------------ */
    /*  Snapshot                                                           */
    /* ------------------------------------------------------------------ */

    snapshot(): TableSnapshot {
        const balances: Record<string, number> = {};
        for (const id of this.occupantIds()) balances[id] = this.hooks.getBalance(id);

        const community: SnapshotCard[] = this.community.map((c, i) =>
            i < this.revealed ? ({ ...c } as SnapshotCard) : ({ hidden: true } as SnapshotCard),
        );

        return {
            tableId: this.id,
            name: this.name,
            phase: this.phase,
            activeSeat: this.activeSeat,
            deadline: this.deadline,
            minAnte: this.config.minAnte,
            maxAnte: this.config.maxAnte,
            balances,
            community,
            dealer: {
                cards: this.dealer.map((c) => (this.dealerHidden ? ({ hidden: true } as SnapshotCard) : ({ ...c } as SnapshotCard))),
                handName: this.dealerHidden ? undefined : this.dealerHandName,
            },
            seats: this.seats.map((seat) => ({
                index: seat.index,
                playerId: seat.playerId,
                playerName: seat.playerName,
                ante: seat.ante,
                blind: seat.blind,
                trips: seat.trips,
                play: seat.play,
                hole: seat.hole.map((c) => ({ ...c }) as SnapshotCard),
                decision: seat.decision,
                handName: seat.handName,
                results: seat.results,
                payout: seat.payout,
                lastAnte: seat.lastAnte,
                lastTrips: seat.lastTrips,
            })),
        };
    }
}
