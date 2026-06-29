export type PokerGameMode = 'poker-5' | 'poker-9';

export interface PokerPlayer {
    userId: string;
    username: string;
    avatar: string | null;
}

export interface PokerLobby {
    tableId: string;
    gameMode: PokerGameMode;
    sb: string;
    bb: string;
    maxPlayers: number;
    players: Map<string, PokerPlayer>;
    status: 'waiting' | 'starting' | 'active';
    createdAt: number;
}
