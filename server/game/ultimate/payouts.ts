import { CAT, HandScore, compareHands, isRoyal } from './handeval';

export type BetOutcome = 'win' | 'lose' | 'push';
export interface BetResult {
    outcome: BetOutcome;
    /** Montant rendu au joueur (mise incluse). 0 si perdu. */
    payout: number;
}

export interface Settlement {
    ante: BetResult;
    blind: BetResult;
    play: BetResult;
    trips: BetResult;
    total: number;
}

/** Barème Blind (gain net en multiple de la mise) — payé seulement si le joueur gagne. */
export function blindMultiplier(score: HandScore): number {
    if (isRoyal(score)) return 500;
    switch (score.cat) {
        case CAT.STRAIGHT_FLUSH: return 50;
        case CAT.QUADS: return 10;
        case CAT.FULL_HOUSE: return 3;
        case CAT.FLUSH: return 1.5;
        case CAT.STRAIGHT: return 1;
        default: return 0; // moins qu'une quinte → push
    }
}

/** Barème Trips (gain net en multiple de la mise) — indépendant du croupier. */
export function tripsMultiplier(score: HandScore): number {
    if (isRoyal(score)) return 50;
    switch (score.cat) {
        case CAT.STRAIGHT_FLUSH: return 40;
        case CAT.QUADS: return 30;
        case CAT.FULL_HOUSE: return 8;
        case CAT.FLUSH: return 6;
        case CAT.STRAIGHT: return 4;
        case CAT.TRIPS: return 3;
        default: return -1; // moins qu'un brelan → perdu
    }
}

const win = (stake: number, mult = 1): BetResult => ({ outcome: 'win', payout: stake + Math.round(stake * mult) });
const push = (stake: number): BetResult => ({ outcome: 'push', payout: stake });
const lose = (): BetResult => ({ outcome: 'lose', payout: 0 });

function resolveTrips(stake: number, player: HandScore): BetResult {
    if (stake <= 0) return { outcome: 'push', payout: 0 };
    const m = tripsMultiplier(player);
    return m >= 0 ? win(stake, m) : lose();
}

/**
 * Règlement d'une main contre le croupier.
 * `bets` = mises engagées ; `folded` = le joueur s'est couché à la river.
 */
export function settle(
    bets: { ante: number; blind: number; trips: number; play: number },
    folded: boolean,
    player: HandScore,
    dealer: HandScore,
): Settlement {
    const trips = resolveTrips(bets.trips, player);

    if (folded) {
        return { ante: lose(), blind: lose(), play: push(0), trips, total: trips.payout };
    }

    const cmp = compareHands(player, dealer);
    const qualifies = dealer.cat >= CAT.PAIR;

    // Play : toujours en jeu (1:1).
    const play = cmp > 0 ? win(bets.play) : cmp === 0 ? push(bets.play) : lose();

    // Ante : push si le croupier ne se qualifie pas, sinon 1:1.
    const ante = !qualifies ? push(bets.ante) : cmp > 0 ? win(bets.ante) : cmp === 0 ? push(bets.ante) : lose();

    // Blind : barème si le joueur gagne (push sous la quinte), sinon perdu/push.
    let blind: BetResult;
    if (cmp > 0) {
        const m = blindMultiplier(player);
        blind = m > 0 ? win(bets.blind, m) : push(bets.blind);
    } else if (cmp === 0) blind = push(bets.blind);
    else blind = lose();

    const total = ante.payout + blind.payout + play.payout + trips.payout;
    return { ante, blind, play, trips, total };
}
