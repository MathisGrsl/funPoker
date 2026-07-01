import { Card, RANK_VALUE } from './cards';

/** Catégories de mains (du plus faible au plus fort). */
export const CAT = {
    HIGH_CARD: 0,
    PAIR: 1,
    TWO_PAIR: 2,
    TRIPS: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    QUADS: 7,
    STRAIGHT_FLUSH: 8,
} as const;

export const CAT_NAME: Record<number, string> = {
    0: 'Hauteur',
    1: 'Paire',
    2: 'Double paire',
    3: 'Brelan',
    4: 'Quinte',
    5: 'Couleur',
    6: 'Full',
    7: 'Carré',
    8: 'Quinte flush',
};

export interface HandScore {
    cat: number;
    /** Départage : valeurs ordonnées (plus grand = plus fort), comparées lexicographiquement. */
    tiebreak: number[];
}

/** Évalue une main de 5 cartes exactement. */
function eval5(cards: Card[]): HandScore {
    const vals = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
    const isFlush = cards.every((c) => c.suit === cards[0].suit);

    // Détection de quinte (As bas inclus : A-2-3-4-5).
    const uniq = [...new Set(vals)];
    let straightHigh = 0;
    if (uniq.length === 5) {
        if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
        else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHigh = 5; // wheel
    }

    // Groupes (valeur -> nombre), triés par nombre puis valeur décroissants.
    const counts = new Map<number, number>();
    for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
    const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const pattern = groups.map((g) => g[1]);
    const byValue = groups.map((g) => g[0]);

    if (straightHigh && isFlush) return { cat: CAT.STRAIGHT_FLUSH, tiebreak: [straightHigh] };
    if (pattern[0] === 4) return { cat: CAT.QUADS, tiebreak: byValue };
    if (pattern[0] === 3 && pattern[1] === 2) return { cat: CAT.FULL_HOUSE, tiebreak: byValue };
    if (isFlush) return { cat: CAT.FLUSH, tiebreak: vals };
    if (straightHigh) return { cat: CAT.STRAIGHT, tiebreak: [straightHigh] };
    if (pattern[0] === 3) return { cat: CAT.TRIPS, tiebreak: byValue };
    if (pattern[0] === 2 && pattern[1] === 2) return { cat: CAT.TWO_PAIR, tiebreak: byValue };
    if (pattern[0] === 2) return { cat: CAT.PAIR, tiebreak: byValue };
    return { cat: CAT.HIGH_CARD, tiebreak: vals };
}

/** Meilleure main de 5 cartes parmi 7 (les 21 combinaisons). */
export function bestOf7(cards: Card[]): HandScore {
    let best: HandScore | null = null;
    for (let a = 0; a < cards.length; a++) {
        for (let b = a + 1; b < cards.length; b++) {
            const five = cards.filter((_, i) => i !== a && i !== b);
            const score = eval5(five);
            if (!best || compareHands(score, best) > 0) best = score;
        }
    }
    return best!;
}

/** > 0 si a gagne, < 0 si b gagne, 0 si égalité. */
export function compareHands(a: HandScore, b: HandScore): number {
    if (a.cat !== b.cat) return a.cat - b.cat;
    const len = Math.max(a.tiebreak.length, b.tiebreak.length);
    for (let i = 0; i < len; i++) {
        const av = a.tiebreak[i] ?? 0;
        const bv = b.tiebreak[i] ?? 0;
        if (av !== bv) return av - bv;
    }
    return 0;
}

export function isRoyal(score: HandScore): boolean {
    return score.cat === CAT.STRAIGHT_FLUSH && score.tiebreak[0] === 14;
}
