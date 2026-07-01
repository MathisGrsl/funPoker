import { Card } from './cards';
import { BetOutcome } from './payouts';

export type Phase = 'waiting' | 'betting' | 'preflop' | 'flop' | 'river' | 'showdown';

/** Décision du joueur sur sa main durant la donne. */
export type Decision = 'none' | 'pending' | 'checked' | 'played' | 'folded';

/** Actions possibles (validées par phase côté moteur). */
export type UltAction = 'check' | 'fold' | 'play4x' | 'play3x' | 'play2x' | 'play1x';

export interface SeatResults {
    ante: BetOutcome;
    blind: BetOutcome;
    play: BetOutcome;
    trips: BetOutcome;
}

export interface Seat {
    index: number;
    playerId: string | null;
    playerName: string | null;
    ante: number;
    blind: number;
    trips: number;
    play: number;
    hole: Card[];
    decision: Decision;
    handName?: string;
    results?: SeatResults;
    payout?: number;
    /** Mémoire pour le « rebet ». */
    lastAnte: number;
    lastTrips: number;
    disconnected?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Snapshot public                                                    */
/* ------------------------------------------------------------------ */

export type SnapshotCard = { hidden: true } | (Card & { hidden?: false });

export interface SnapshotSeat {
    index: number;
    playerId: string | null;
    playerName: string | null;
    ante: number;
    blind: number;
    trips: number;
    play: number;
    hole: SnapshotCard[];
    decision: Decision;
    handName?: string;
    results?: SeatResults;
    payout?: number;
    lastAnte: number;
    lastTrips: number;
}

export interface TableSnapshot {
    tableId: string;
    name: string;
    phase: Phase;
    community: SnapshotCard[];
    dealer: { cards: SnapshotCard[]; handName?: string };
    seats: SnapshotSeat[];
    activeSeat: number | null;
    deadline: number | null;
    minAnte: number;
    maxAnte: number;
    balances: Record<string, number>;
}
