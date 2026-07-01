// Types miroir du snapshot serveur (server/game/ultimate/types.ts).
// Les types de carte sont repris du blackjack pour rester compatibles avec <Card>.
import type { SnapshotCard } from '@/app/blackjack/types';

export type { SnapshotCard };
export { isHidden } from '@/app/blackjack/types';

export type Phase = 'waiting' | 'betting' | 'preflop' | 'flop' | 'river' | 'showdown';
export type Decision = 'none' | 'pending' | 'checked' | 'played' | 'folded';
export type UltAction = 'check' | 'fold' | 'play4x' | 'play3x' | 'play2x' | 'play1x';
export type BetOutcome = 'win' | 'lose' | 'push';

export interface SeatResults {
    ante: BetOutcome;
    blind: BetOutcome;
    play: BetOutcome;
    trips: BetOutcome;
}

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
