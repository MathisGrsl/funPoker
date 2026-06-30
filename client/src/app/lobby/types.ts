export type OnlineUser = {
    id: string;
    username: string;
    avatar: string | null;
};

export type PrivateTableState = {
    tableId: string;
    roomCode: string;
    creatorId: string;
    players: { id: string; username: string; avatar: string | null }[];
    invited: { id: string; username: string; status: 'pending' | 'accepted' | 'declined' }[];
};

export type InviteData = {
    tableId: string;
    roomCode: string;
    creatorId: string;
    creatorUsername: string;
};
