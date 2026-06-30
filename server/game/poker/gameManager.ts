import type { ActiveGame, ActiveGamePlayer } from './gameState';
import type { PokerLobby } from './types';
import { buildClientState } from './gameEngine';

export class PokerGameManager {
    private games = new Map<string, ActiveGame>();

    /** Create a fresh ActiveGame from a lobby that just started. */
    create(
        lobby: PokerLobby,
        mongoGameId: string,
    ): ActiveGame {
        const sb = parseFloat(lobby.sb);
        const bb = parseFloat(lobby.bb);
        const buyIn = Math.round(bb * 100 * 100) / 100; // 100 BBs, rounded to cents

        const seatOrder = Array.from(lobby.players.keys());

        const players = new Map<string, ActiveGamePlayer>();
        seatOrder.forEach((uid, i) => {
            const lp = lobby.players.get(uid)!;
            players.set(uid, {
                userId: uid,
                username: lp.username,
                avatar: lp.avatar,
                chips: buyIn,
                bet: 0,
                totalBet: 0,
                holeCards: null,
                status: 'active',
                seatIndex: i,
            });
        });

        const game: ActiveGame = {
            tableId: lobby.tableId,
            gameId: mongoGameId,
            gameMode: lobby.gameMode,
            sb,
            bb,
            maxPlayers: lobby.maxPlayers,
            players,
            seatOrder,
            dealerIndex: -1, // startRound will advance to 0
            sbIndex: 0,
            bbIndex: 1,
            phase: 'preflop',
            deck: [],
            communityCards: [],
            pot: 0,
            currentBet: 0,
            pendingActors: new Set(),
            actingUserId: null,
            roundNumber: 0,
            roundId: null,
            lastWinners: null,
            betweenRounds: false,
            actionTimer: null,
        };

        this.games.set(lobby.tableId, game);
        return game;
    }

    get(tableId: string): ActiveGame | undefined {
        return this.games.get(tableId);
    }

    remove(tableId: string): void {
        const game = this.games.get(tableId);
        if (game?.actionTimer) clearTimeout(game.actionTimer);
        this.games.delete(tableId);
    }

    /** Serialize the game state for a specific player (hides other players' cards). */
    getClientState(tableId: string, forUserId: string) {
        const game = this.games.get(tableId);
        if (!game) return null;
        return buildClientState(game, forUserId);
    }
}
