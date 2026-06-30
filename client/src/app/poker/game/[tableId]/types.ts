export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'between-rounds';

export interface GamePlayerState {
    userId: string;
    username: string;
    avatar: string | null;
    chips: number;
    bet: number;
    status: 'active' | 'folded' | 'all-in';
    seatIndex: number;
    isDealer: boolean;
    isSB: boolean;
    isBB: boolean;
    holeCards: string[] | null; // null = empty seat, ['back','back'] = hidden, actual cards = visible
}

export interface PotWinner {
    userId: string;
    amount: number;
    handName: string;
    bestCards: string[];
}

export interface GameState {
    tableId: string;
    gameMode: string;
    sb: number;
    bb: number;
    maxPlayers: number;
    phase: GamePhase;
    pot: number;
    currentBet: number;
    communityCards: string[];
    actingUserId: string | null;
    roundNumber: number;
    players: GamePlayerState[];
    winners: PotWinner[] | null;
}
