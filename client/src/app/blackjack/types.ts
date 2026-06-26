// Types miroir du snapshot serveur (server/game/blackjack/types.ts).

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    suit: Suit;
    rank: Rank;
}

/** Une carte face cachée n'expose pas sa valeur. */
export type SnapshotCard = { hidden: true } | (Card & { hidden?: false });

export type Phase = 'waiting' | 'betting' | 'dealing' | 'insurance' | 'playerTurns' | 'dealerTurn' | 'settle';
export type HandStatus = 'playing' | 'stand' | 'bust' | 'blackjack' | 'doubled';
export type HandResult = 'win' | 'lose' | 'push' | 'blackjack';
export type PlayerAction = 'hit' | 'stand' | 'double' | 'split';

export interface SnapshotHand {
    cards: SnapshotCard[];
    bet: number;
    value: number;
    soft: boolean;
    status: HandStatus;
    insurance?: number;
    result?: HandResult;
    payout?: number;
}

export interface SnapshotSeat {
    index: number;
    playerId: string | null;
    playerName: string | null;
    pendingBet: number;
    lastBet: number;
    hands: SnapshotHand[];
}

export interface SnapshotDealer {
    cards: SnapshotCard[];
    value: number;
    soft: boolean;
}

export interface TableSnapshot {
    tableId: string;
    name: string;
    phase: Phase;
    seats: SnapshotSeat[];
    dealer: SnapshotDealer;
    activeSeat: number | null;
    activeHand: number | null;
    deadline: number | null;
    minBet: number;
    maxBet: number;
    balances: Record<string, number>;
}

export interface TableInfo {
    id: string;
    name: string;
    phase: Phase;
    seatsTaken: number;
    maxSeats: number;
}

export function isHidden(card: SnapshotCard): card is { hidden: true } {
    return 'hidden' in card && card.hidden === true;
}
