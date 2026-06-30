import type { PokerGameMode } from './types';

export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface ActiveGamePlayer {
    userId: string;
    username: string;
    avatar: string | null;
    chips: number;
    bet: number;       // chips committed this street
    totalBet: number;  // chips committed this entire hand (for side-pot maths)
    holeCards: [string, string] | null;
    status: 'active' | 'folded' | 'all-in';
    seatIndex: number;
}

export interface PotWinner {
    userId: string;
    amount: number;
    handName: string;
    bestCards: string[];
}

export interface ActiveGame {
    tableId: string;
    gameId: string;              // MongoDB Game._id as string
    gameMode: PokerGameMode;
    sb: number;
    bb: number;
    maxPlayers: number;
    players: Map<string, ActiveGamePlayer>; // userId → player
    seatOrder: string[];          // fixed seat order for the whole game
    dealerIndex: number;          // index into seatOrder
    sbIndex: number;
    bbIndex: number;
    phase: GamePhase;
    deck: string[];
    communityCards: string[];
    pot: number;
    currentBet: number;
    pendingActors: Set<string>;   // players who still need to act this street
    actingUserId: string | null;
    roundNumber: number;
    roundId: string | null;       // MongoDB Round._id as string
    lastWinners: PotWinner[] | null;
    betweenRounds: boolean;
    actionTimer: ReturnType<typeof setTimeout> | null;
}
