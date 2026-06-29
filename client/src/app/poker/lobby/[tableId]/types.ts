export type PokerGameMode = 'poker-5' | 'poker-9';

export type PokerLobbyPlayer = {
    id: string;
    username: string;
    avatar: string | null;
};

export type PokerLobbyState = {
    tableId: string;
    gameMode: PokerGameMode;
    sb: string;
    bb: string;
    maxPlayers: number;
    players: PokerLobbyPlayer[];
    status: 'waiting' | 'starting' | 'active';
};
