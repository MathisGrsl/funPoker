import type { PokerGameMode, PokerLobby, PokerPlayer } from './types';

function generateId(): string {
    return Math.random().toString(36).substring(2, 14).toUpperCase();
}

export class PokerLobbyManager {
    private lobbies = new Map<string, PokerLobby>();

    findOrCreate(gameMode: PokerGameMode, sb: string, bb: string): PokerLobby {
        const maxPlayers = gameMode === 'poker-5' ? 5 : 9;

        for (const lobby of this.lobbies.values()) {
            if (
                lobby.gameMode === gameMode &&
                lobby.sb === sb &&
                lobby.bb === bb &&
                lobby.status === 'waiting' &&
                lobby.players.size < maxPlayers
            ) {
                return lobby;
            }
        }

        const newLobby: PokerLobby = {
            tableId: generateId(),
            gameMode,
            sb,
            bb,
            maxPlayers,
            players: new Map(),
            status: 'waiting',
            createdAt: Date.now(),
        };
        this.lobbies.set(newLobby.tableId, newLobby);
        return newLobby;
    }

    addPlayer(tableId: string, userId: string, username: string, avatar: string | null): boolean {
        const lobby = this.lobbies.get(tableId);
        if (!lobby || lobby.players.size >= lobby.maxPlayers) return false;
        lobby.players.set(userId, { userId, username, avatar });
        return true;
    }

    removePlayer(tableId: string, userId: string): void {
        const lobby = this.lobbies.get(tableId);
        if (!lobby) return;
        lobby.players.delete(userId);
        if (lobby.players.size === 0) {
            this.lobbies.delete(tableId);
        }
    }

    hasPlayer(tableId: string, userId: string): boolean {
        return this.lobbies.get(tableId)?.players.has(userId) ?? false;
    }

    getPublicState(tableId: string) {
        const lobby = this.lobbies.get(tableId);
        if (!lobby) return null;
        return {
            tableId: lobby.tableId,
            gameMode: lobby.gameMode,
            sb: lobby.sb,
            bb: lobby.bb,
            maxPlayers: lobby.maxPlayers,
            players: Array.from(lobby.players.values()).map((p: PokerPlayer) => ({
                id: p.userId,
                username: p.username,
                avatar: p.avatar,
            })),
            status: lobby.status,
        };
    }
}
