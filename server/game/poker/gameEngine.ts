import { createShuffledDeck, deal } from './deck';
import { evaluateBestHand, compareHandResults } from './handEvaluator';
import type { ActiveGame, ActiveGamePlayer, GamePhase, PotWinner } from './gameState';

// ─── Monetary helper ──────────────────────────────────────────────────────────

/** Round to 2 decimal places to prevent IEEE-754 drift in chip maths. */
export function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function nonFolded(game: ActiveGame): ActiveGamePlayer[] {
    return game.seatOrder.map(uid => game.players.get(uid)!).filter(p => p.status !== 'folded');
}

function activePlayers(game: ActiveGame): ActiveGamePlayer[] {
    return game.seatOrder.map(uid => game.players.get(uid)!).filter(p => p.status === 'active');
}

function firstActiveFrom(game: ActiveGame, fromIdx: number): string | null {
    for (let i = 0; i < game.seatOrder.length; i++) {
        const uid = game.seatOrder[(fromIdx + i) % game.seatOrder.length];
        if (game.players.get(uid)!.status === 'active') return uid;
    }
    return null;
}

function nextPendingActor(game: ActiveGame): string | null {
    if (!game.actingUserId || game.pendingActors.size === 0) return null;
    const cur = game.seatOrder.indexOf(game.actingUserId);
    for (let i = 1; i <= game.seatOrder.length; i++) {
        const uid = game.seatOrder[(cur + i) % game.seatOrder.length];
        if (game.pendingActors.has(uid)) return uid;
    }
    return null;
}

// ─── Round start ──────────────────────────────────────────────────────────────

export function startRound(game: ActiveGame): void {
    game.roundNumber++;
    game.communityCards = [];
    game.lastWinners = null;
    game.betweenRounds = false;

    // Rotate dealer to the next player who still has chips
    const n = game.seatOrder.length;
    for (let i = 1; i <= n; i++) {
        const idx = (game.dealerIndex + i) % n;
        if (game.players.get(game.seatOrder[idx])!.chips > 0) {
            game.dealerIndex = idx;
            break;
        }
    }

    const isHeadsUp = n === 2;
    game.sbIndex = isHeadsUp ? game.dealerIndex : (game.dealerIndex + 1) % n;
    game.bbIndex = isHeadsUp ? (game.dealerIndex + 1) % n : (game.dealerIndex + 2) % n;

    // Reset per-hand state
    for (const p of game.players.values()) {
        p.bet = 0;
        p.totalBet = 0;
        p.holeCards = null;
        p.status = p.chips > 0 ? 'active' : 'folded';
    }

    // Deal 2 hole cards to each active player
    let deck = createShuffledDeck();
    for (const uid of game.seatOrder) {
        const p = game.players.get(uid)!;
        if (p.status === 'active') {
            const { dealt, remaining } = deal(deck, 2);
            p.holeCards = [dealt[0], dealt[1]];
            deck = remaining;
        }
    }
    game.deck = deck;

    // Post small blind
    const sbUid = game.seatOrder[game.sbIndex];
    const sbPlayer = game.players.get(sbUid)!;
    const sbPost = round2(Math.min(game.sb, sbPlayer.chips));
    sbPlayer.chips = round2(sbPlayer.chips - sbPost);
    sbPlayer.bet = sbPost;
    sbPlayer.totalBet = sbPost;
    if (sbPlayer.chips === 0) sbPlayer.status = 'all-in';

    // Post big blind
    const bbUid = game.seatOrder[game.bbIndex];
    const bbPlayer = game.players.get(bbUid)!;
    const bbPost = round2(Math.min(game.bb, bbPlayer.chips));
    bbPlayer.chips = round2(bbPlayer.chips - bbPost);
    bbPlayer.bet = bbPost;
    bbPlayer.totalBet = bbPost;
    if (bbPlayer.chips === 0) bbPlayer.status = 'all-in';

    game.pot = round2(sbPost + bbPost);
    game.currentBet = bbPost;
    game.phase = 'preflop';

    // First to act preflop: after BB (heads-up: SB/dealer acts first)
    const firstActorIdx = isHeadsUp ? game.sbIndex : (game.bbIndex + 1) % n;

    // pendingActors = all active players, including BB (they keep the option to raise)
    game.pendingActors = new Set(
        game.seatOrder.filter(uid => game.players.get(uid)!.status === 'active')
    );
    game.actingUserId = firstActiveFrom(game, firstActorIdx);
}

// ─── Apply a player action ────────────────────────────────────────────────────

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

/**
 * 'hand-over'   — all but one folded, award pot immediately
 * 'street-over' — betting done, deal next street
 * 'continue'    — advance to next pending actor
 */
export type ActionResult = 'hand-over' | 'street-over' | 'continue';

export function applyAction(
    game: ActiveGame,
    userId: string,
    action: ActionType,
    raiseTarget?: number,
): ActionResult {
    const player = game.players.get(userId)!;
    game.pendingActors.delete(userId);

    switch (action) {
        case 'fold': {
            player.status = 'folded';
            break;
        }

        case 'check': {
            // Nothing to do — bet already matches currentBet
            break;
        }

        case 'call': {
            const toCall = round2(Math.min(game.currentBet - player.bet, player.chips));
            player.chips = round2(player.chips - toCall);
            player.bet = round2(player.bet + toCall);
            player.totalBet = round2(player.totalBet + toCall);
            game.pot = round2(game.pot + toCall);
            if (player.chips === 0) player.status = 'all-in';
            break;
        }

        case 'raise':
        case 'all-in': {
            // raiseTarget = total amount player wants committed this street (absolute)
            const maxTarget = round2(player.bet + player.chips);
            const target = action === 'all-in'
                ? maxTarget
                : round2(Math.min(raiseTarget ?? round2(game.currentBet * 2), maxTarget));

            const extra = round2(target - player.bet);
            player.chips = round2(player.chips - extra);
            player.bet = round2(player.bet + extra);
            player.totalBet = round2(player.totalBet + extra);
            game.pot = round2(game.pot + extra);

            if (target > game.currentBet) {
                game.currentBet = target;
                // Re-open action for all other active (non-all-in) players
                game.pendingActors = new Set(
                    game.seatOrder.filter(uid => {
                        if (uid === userId) return false;
                        return game.players.get(uid)!.status === 'active';
                    })
                );
            }

            if (player.chips === 0) player.status = 'all-in';
            break;
        }
    }

    // Last player standing → pot is theirs
    if (nonFolded(game).length === 1) return 'hand-over';

    // Street is over when nobody is left to act
    if (game.pendingActors.size === 0) return 'street-over';

    game.actingUserId = nextPendingActor(game);
    return 'continue';
}

// ─── Advance to the next street ───────────────────────────────────────────────

/** Returns true when we've reached showdown. */
export function advanceStreet(game: ActiveGame): boolean {
    // Reset street bets (totalBet is preserved for side-pot calculations)
    for (const p of game.players.values()) p.bet = 0;
    game.currentBet = 0;

    if (game.phase === 'preflop') {
        const { dealt, remaining } = deal(game.deck, 3);
        game.communityCards = dealt;
        game.deck = remaining;
        game.phase = 'flop';
    } else if (game.phase === 'flop') {
        const { dealt, remaining } = deal(game.deck, 1);
        game.communityCards.push(...dealt);
        game.deck = remaining;
        game.phase = 'turn';
    } else if (game.phase === 'turn') {
        const { dealt, remaining } = deal(game.deck, 1);
        game.communityCards.push(...dealt);
        game.deck = remaining;
        game.phase = 'river';
    } else {
        // river → showdown
        game.phase = 'showdown';
        return true;
    }

    // If no active (non-all-in) players remain, there's no one left to act — the caller
    // is responsible for revealing the remaining streets (paced, one at a time) by calling
    // `advanceStreet` again for each one instead of dealing them all out instantly.
    const active = activePlayers(game);
    if (active.length === 0) {
        game.pendingActors = new Set();
        game.actingUserId = null;
        return false;
    }

    game.pendingActors = new Set(active.map(p => p.userId));
    const firstActorIdx = (game.dealerIndex + 1) % game.seatOrder.length;
    game.actingUserId = firstActiveFrom(game, firstActorIdx);
    return false;
}

// ─── Pot resolution ───────────────────────────────────────────────────────────

export function resolvePot(game: ActiveGame): PotWinner[] {
    const live = nonFolded(game);

    // Last player standing — no showdown needed
    if (live.length === 1) {
        const winner = live[0];
        winner.chips = round2(winner.chips + game.pot);
        const result: PotWinner[] = [{ userId: winner.userId, amount: game.pot, handName: '', bestCards: [] }];
        game.pot = 0;
        return result;
    }

    // Evaluate each live player's best hand from hole + community cards
    const evaluated = live.map(p => ({
        player: p,
        hand: evaluateBestHand([...p.holeCards!, ...game.communityCards]),
    }));

    // Side-pot algorithm: process layers by totalBet (ascending)
    const allEntries = game.seatOrder.map(uid => ({
        uid,
        player: game.players.get(uid)!,
        remaining: game.players.get(uid)!.totalBet,
    }));

    const awards = new Map<string, number>();

    while (allEntries.some(e => e.remaining > 0)) {
        const minBet = Math.min(...allEntries.filter(e => e.remaining > 0).map(e => e.remaining));
        const slice = round2(allEntries.reduce((s, e) => s + Math.min(e.remaining, minBet), 0));

        // Eligible to win this slice: contributed >= minBet AND not folded
        const eligible = evaluated.filter(ev => {
            const entry = allEntries.find(e => e.uid === ev.player.userId)!;
            return entry.remaining >= minBet;
        });

        if (eligible.length > 0) {
            eligible.sort((a, b) => compareHandResults(b.hand, a.hand));
            const best = eligible[0].hand;
            const winners = eligible.filter(e => compareHandResults(e.hand, best) === 0);
            const perWinner = round2(Math.floor((slice / winners.length) * 100) / 100);
            const remainder = round2(slice - perWinner * winners.length);
            winners.forEach((w, i) => {
                const uid = w.player.userId;
                awards.set(uid, round2((awards.get(uid) ?? 0) + perWinner + (i === 0 ? remainder : 0)));
            });
        }

        for (const e of allEntries) e.remaining = round2(Math.max(0, e.remaining - minBet));
    }

    // Apply chip awards
    const result: PotWinner[] = [];
    for (const [uid, amount] of awards.entries()) {
        const p = game.players.get(uid)!;
        p.chips = round2(p.chips + amount);
        const hand = evaluated.find(e => e.player.userId === uid)?.hand;
        result.push({ userId: uid, amount, handName: hand?.handName ?? '', bestCards: hand?.bestCards ?? [] });
    }

    game.pot = 0;
    return result;
}

// ─── Client state serializer ─────────────────────────────────────────────────

export function buildClientState(game: ActiveGame, forUserId: string) {
    const dealerUid = game.seatOrder[game.dealerIndex];
    const sbUid = game.seatOrder[game.sbIndex];
    const bbUid = game.seatOrder[game.bbIndex];
    const atShowdown = game.phase === 'showdown' || game.betweenRounds;

    return {
        tableId: game.tableId,
        gameMode: game.gameMode,
        sb: game.sb,
        bb: game.bb,
        maxPlayers: game.maxPlayers,
        phase: game.betweenRounds ? ('between-rounds' as const) : game.phase,
        pot: game.pot,
        currentBet: game.currentBet,
        communityCards: game.communityCards,
        actingUserId: game.betweenRounds ? null : game.actingUserId,
        roundNumber: game.roundNumber,
        winners: game.lastWinners ?? null,
        players: game.seatOrder.map((uid, i) => {
            const p = game.players.get(uid)!;
            const reveal = uid === forUserId || (atShowdown && p.status !== 'folded');
            return {
                userId: uid,
                username: p.username,
                avatar: p.avatar,
                chips: p.chips,
                bet: p.bet,
                status: p.status,
                seatIndex: i,
                isDealer: uid === dealerUid,
                isSB: uid === sbUid,
                isBB: uid === bbUid,
                holeCards: reveal ? p.holeCards : (p.holeCards ? ['back', 'back'] : null),
            };
        }),
    };
}
