import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { Game } from '../models/Game';
import Round from '../models/Round';
import { PokerLobbyManager } from '../game/poker/manager';
import { PokerGameManager } from '../game/poker/gameManager';
import { startRound, applyAction, advanceStreet, resolvePot, buildClientState, round2 } from '../game/poker/gameEngine';
import type { ActionType } from '../game/poker/gameEngine';
import type { ActiveGame } from '../game/poker/gameState';
import type { PokerLobby } from '../game/poker/types';

export type RoundAction = { playerId: string; action: string; amount: number; pot: number };

const BETWEEN_ROUNDS_MS = 5000;
const ACTION_TIMEOUT_MS = 30_000;
const ALL_IN_REVEAL_DELAY_MS = 1500;

// ─── Broadcast ────────────────────────────────────────────────────────────────

function broadcastGameState(
    io: Server,
    game: ActiveGame,
    userSocketIds: Map<string, Set<string>>,
): void {
    for (const uid of game.seatOrder) {
        const sockets = userSocketIds.get(uid);
        if (!sockets) continue;
        const state = buildClientState(game, uid);
        for (const sid of sockets) io.to(sid).emit('poker:game_state', state);
    }
}

// ─── DB persistence ───────────────────────────────────────────────────────────

async function persistRoundStart(game: ActiveGame): Promise<string> {
    const doc = await Round.create({
        game: new mongoose.Types.ObjectId(game.gameId),
        roundNumber: game.roundNumber,
        players: game.seatOrder.map(uid => new mongoose.Types.ObjectId(uid)),
        maxPlayers: game.maxPlayers,
        PlayerTurn: new mongoose.Types.ObjectId(game.actingUserId ?? game.seatOrder[0]),
        pot: game.pot,
        betOfEachPlayer: game.seatOrder.map(uid => ({
            player: new mongoose.Types.ObjectId(uid),
            amount: game.players.get(uid)!.bet,
        })),
        moneyOfEachPlayer: game.seatOrder.map(uid => ({
            player: new mongoose.Types.ObjectId(uid),
            amount: game.players.get(uid)!.chips,
        })),
        currentBet: game.currentBet,
        blinds: { small: game.sb, big: game.bb },
        dealer: new mongoose.Types.ObjectId(game.seatOrder[game.dealerIndex]),
        smallBlind: new mongoose.Types.ObjectId(game.seatOrder[game.sbIndex]),
        bigBlind: new mongoose.Types.ObjectId(game.seatOrder[game.bbIndex]),
        boardCards: game.communityCards,
        hands: game.seatOrder.map(uid => ({
            player: new mongoose.Types.ObjectId(uid),
            cards: game.players.get(uid)!.holeCards ?? [],
        })),
        actions: [],
        status: 'active',
    });
    return (doc._id as mongoose.Types.ObjectId).toString();
}

async function persistRoundEnd(game: ActiveGame, actions: RoundAction[]): Promise<void> {
    if (!game.roundId) return;
    await Round.findByIdAndUpdate(game.roundId, {
        boardCards: game.communityCards,
        winners: (game.lastWinners ?? []).map(w => new mongoose.Types.ObjectId(w.userId)),
        actions: actions.map(a => ({
            playerId: new mongoose.Types.ObjectId(a.playerId),
            action: a.action,
            amount: a.amount,
            timestamp: Date.now(),
            pot: a.pot,
        })),
        status: 'completed',
    });

    const totalPot = (game.lastWinners ?? []).reduce((s, w) => s + w.amount, 0);
    await Game.findByIdAndUpdate(game.gameId, {
        $inc: { 'statistics.handsPlayed': 1, 'statistics.totalPot': totalPot },
        $set: { roundNumber: game.roundNumber, currentRound: new mongoose.Types.ObjectId(game.roundId) },
        $push: { allRounds: new mongoose.Types.ObjectId(game.roundId) },
    });
}

// ─── Round lifecycle ──────────────────────────────────────────────────────────

export async function beginRound(
    io: Server,
    game: ActiveGame,
    gameManager: PokerGameManager,
    userSocketIds: Map<string, Set<string>>,
    roundActions: Map<string, RoundAction[]>,
): Promise<void> {
    startRound(game);

    // Edge case: all players went all-in just from posting blinds → reveal the board
    // one street at a time (paced), instead of dumping the whole board instantly.
    if (game.pendingActors.size === 0) {
        const isShowdown = advanceStreet(game);
        broadcastGameState(io, game, userSocketIds);
        if (isShowdown) {
            game.lastWinners = resolvePot(game);
            game.betweenRounds = true;
            broadcastGameState(io, game, userSocketIds);
            persistRoundEnd(game, []).catch(err => console.error('[POKER GAME] persistRoundEnd error:', err));
            scheduleNextRound(io, game, gameManager, userSocketIds, roundActions);
            return;
        }
        scheduleAllInRunout(io, game, gameManager, userSocketIds, roundActions, []);
        return;
    }

    try {
        game.roundId = await persistRoundStart(game);
    } catch (err) {
        console.error('[POKER GAME] Failed to persist round start:', err);
        game.roundId = null;
    }
    roundActions.set(game.tableId, []);

    broadcastGameState(io, game, userSocketIds);
    console.log(`[POKER GAME] ${game.tableId} — round ${game.roundNumber} started`);
    scheduleActionTimeout(io, game, gameManager, userSocketIds, roundActions);
}

function scheduleActionTimeout(
    io: Server,
    game: ActiveGame,
    gameManager: PokerGameManager,
    userSocketIds: Map<string, Set<string>>,
    roundActions: Map<string, RoundAction[]>,
): void {
    if (game.actionTimer) clearTimeout(game.actionTimer);
    if (!game.actingUserId) return;

    game.actionTimer = setTimeout(() => {
        if (!game.actingUserId) return;
        console.log(`[POKER GAME] timeout — auto-folding ${game.actingUserId}`);
        handleAction(io, game, game.actingUserId, 'fold', undefined, gameManager, userSocketIds, roundActions)
            .catch(err => console.error('[POKER GAME] auto-fold error:', err));
    }, ACTION_TIMEOUT_MS);
}

/** Reveals the remaining community cards one street at a time (with a pause between each) when everyone left in the hand is all-in. */
function scheduleAllInRunout(
    io: Server,
    game: ActiveGame,
    gameManager: PokerGameManager,
    userSocketIds: Map<string, Set<string>>,
    roundActions: Map<string, RoundAction[]>,
    actList: RoundAction[],
): void {
    setTimeout(() => {
        const isShowdown = advanceStreet(game);
        broadcastGameState(io, game, userSocketIds);

        if (isShowdown) {
            game.lastWinners = resolvePot(game);
            game.betweenRounds = true;
            broadcastGameState(io, game, userSocketIds);
            persistRoundEnd(game, actList).catch(err => console.error('[POKER GAME] persistRoundEnd error:', err));
            scheduleNextRound(io, game, gameManager, userSocketIds, roundActions);
            return;
        }

        scheduleAllInRunout(io, game, gameManager, userSocketIds, roundActions, actList);
    }, ALL_IN_REVEAL_DELAY_MS);
}

function scheduleNextRound(
    io: Server,
    game: ActiveGame,
    gameManager: PokerGameManager,
    userSocketIds: Map<string, Set<string>>,
    roundActions: Map<string, RoundAction[]>,
): void {
    setTimeout(async () => {
        const remaining = game.seatOrder.filter(uid => game.players.get(uid)!.chips > 0);
        if (remaining.length < 2) {
            try {
                await Game.findByIdAndUpdate(game.gameId, { gameStatus: 'completed', endedAt: new Date() });
            } catch { /* ignore */ }
            io.to(`poker:${game.tableId}`).emit('poker:game_over', { winnerId: remaining[0] ?? null });
            gameManager.remove(game.tableId);
            return;
        }
        await beginRound(io, game, gameManager, userSocketIds, roundActions);
    }, BETWEEN_ROUNDS_MS);
}

async function handleAction(
    io: Server,
    game: ActiveGame,
    userId: string,
    action: ActionType,
    raiseTarget: number | undefined,
    gameManager: PokerGameManager,
    userSocketIds: Map<string, Set<string>>,
    roundActions: Map<string, RoundAction[]>,
): Promise<void> {
    if (game.actionTimer) { clearTimeout(game.actionTimer); game.actionTimer = null; }

    const actList = roundActions.get(game.tableId) ?? [];
    actList.push({ playerId: userId, action, amount: raiseTarget ?? 0, pot: game.pot });
    roundActions.set(game.tableId, actList);

    const result = applyAction(game, userId, action, raiseTarget);

    if (result === 'hand-over') {
        game.lastWinners = resolvePot(game);
        game.betweenRounds = true;
        broadcastGameState(io, game, userSocketIds);
        persistRoundEnd(game, actList).catch(err => console.error('[POKER GAME] persistRoundEnd error:', err));
        scheduleNextRound(io, game, gameManager, userSocketIds, roundActions);
        return;
    }

    if (result === 'street-over') {
        const isShowdown = advanceStreet(game);

        if (isShowdown) {
            game.lastWinners = resolvePot(game);
            game.betweenRounds = true;
            broadcastGameState(io, game, userSocketIds);
            persistRoundEnd(game, actList).catch(err => console.error('[POKER GAME] persistRoundEnd error:', err));
            scheduleNextRound(io, game, gameManager, userSocketIds, roundActions);
            return;
        }

        broadcastGameState(io, game, userSocketIds);

        if (game.pendingActors.size === 0) {
            // Everyone remaining is all-in — reveal the rest of the board with a pause between streets
            scheduleAllInRunout(io, game, gameManager, userSocketIds, roundActions, actList);
            return;
        }

        scheduleActionTimeout(io, game, gameManager, userSocketIds, roundActions);
        return;
    }

    // 'continue'
    broadcastGameState(io, game, userSocketIds);
    scheduleActionTimeout(io, game, gameManager, userSocketIds, roundActions);
}

// ─── Exported: create and launch a game from a lobby ─────────────────────────

export async function startGame(
    io: Server,
    lobby: PokerLobby,
    gameManager: PokerGameManager,
    userSocketIds: Map<string, Set<string>>,
    roundActions: Map<string, RoundAction[]>,
): Promise<void> {
    if (lobby.status !== 'waiting') return;
    lobby.status = 'starting';

    const seatOrder = Array.from(lobby.players.keys());
    const sb = parseFloat(lobby.sb);
    const bb = parseFloat(lobby.bb);
    const buyIn = round2(bb * 100);

    let gameDoc;
    try {
        gameDoc = await Game.create({
            gameCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            name: `Hold'em ${lobby.sb}/${lobby.bb}`,
            owner: new mongoose.Types.ObjectId(seatOrder[0]),
            players: seatOrder.map(uid => ({
                player: new mongoose.Types.ObjectId(uid),
                buyin: buyIn,
                chipStack: buyIn,
                status: 'active',
                profit: 0,
            })),
            maxPlayers: lobby.maxPlayers,
            gameStatus: 'active',
            gameType: 'cash',
            blinds: { small: sb, big: bb },
            buyinAmount: buyIn,
            minBuyIn: buyIn,
            maxBuyIn: buyIn,
            statistics: { totalPot: 0, totalRaises: 0, averageBet: 0, handsPlayed: 0 },
            roundNumber: 0,
            startedAt: new Date(),
        });
    } catch (err) {
        console.error('[POKER GAME] Failed to create Game document:', err);
        lobby.status = 'waiting';
        throw err;
    }

    const gameId = (gameDoc._id as mongoose.Types.ObjectId).toString();
    const game = gameManager.create(lobby, gameId);

    io.to(`poker:${lobby.tableId}`).emit('poker:game_started', { tableId: lobby.tableId });
    console.log(`[POKER GAME] Started — tableId ${lobby.tableId}, gameId ${gameId}`);

    setTimeout(async () => {
        await beginRound(io, game, gameManager, userSocketIds, roundActions);
    }, 1500);
}

// ─── Socket event registration ────────────────────────────────────────────────

export function registerPokerGameHandlers(
    io: Server,
    socket: Socket,
    lobbyManager: PokerLobbyManager,
    gameManager: PokerGameManager,
    userId: string,
    username: string,
    avatar: string | null,
    userSocketIds: Map<string, Set<string>>,
    roundActions: Map<string, RoundAction[]>,
): void {
    // Manual start (kept as fallback, but auto-start fires before this is usually needed)
    socket.on('poker:start', async ({ tableId }: { tableId: string }) => {
        const lobby = lobbyManager.getLobby(tableId);
        if (!lobby) return socket.emit('poker:error', 'Lobby not found');
        if (!lobby.players.has(userId)) return socket.emit('poker:error', 'Not in this lobby');
        if (lobby.players.size < 2) return socket.emit('poker:error', 'Need at least 2 players');

        try {
            await startGame(io, lobby, gameManager, userSocketIds, roundActions);
        } catch {
            socket.emit('poker:error', 'Server error — could not start game');
        }
    });

    socket.on('poker:game_rejoin', ({ tableId }: { tableId: string }) => {
        const game = gameManager.get(tableId);
        if (!game || !game.players.has(userId)) return socket.emit('poker:game_not_found');

        socket.join(`poker:${tableId}`);
        socket.emit('poker:game_state', buildClientState(game, userId));
    });

    socket.on(
        'poker:action',
        ({ tableId, action, amount }: { tableId: string; action: ActionType; amount?: number }) => {
            const game = gameManager.get(tableId);
            if (!game || game.betweenRounds) return;
            if (game.actingUserId !== userId) return;

            const player = game.players.get(userId);
            if (!player || player.status !== 'active') return;

            const playerBetR = round2(player.bet);
            const currentBetR = round2(game.currentBet);

            if (action === 'check' && playerBetR < currentBetR) return;
            if (action === 'raise' && (amount === undefined || round2(amount) <= currentBetR)) return;

            handleAction(io, game, userId, action, amount, gameManager, userSocketIds, roundActions)
                .catch(err => console.error('[POKER GAME] action error:', err));
        },
    );
}
