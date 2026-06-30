const RANK_VALUE: Record<string, number> = {
    A: 14, K: 13, Q: 12, J: 11, T: 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

const HAND_NAMES = [
    'High Card',        // 0
    'One Pair',         // 1
    'Two Pair',         // 2
    'Three of a Kind',  // 3
    'Straight',         // 4
    'Flush',            // 5
    'Full House',       // 6
    'Four of a Kind',   // 7
    'Straight Flush',   // 8
    'Royal Flush',      // 9
];

function rankOf(card: string): number { return RANK_VALUE[card[0]]; }
function suitOf(card: string): string { return card[1]; }

function eval5(cards: string[]): number[] {
    const ranks = cards.map(rankOf).sort((a, b) => b - a);
    const suits = cards.map(suitOf);

    const isFlush = suits.every(s => s === suits[0]);

    const unique = [...new Set(ranks)].sort((a, b) => b - a);
    let isStraight = false;
    let straightHigh = 0;
    if (unique.length === 5 && unique[0] - unique[4] === 4) {
        isStraight = true;
        straightHigh = unique[0];
    }
    // Wheel: A-2-3-4-5
    if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
        isStraight = true;
        straightHigh = 5;
    }

    const freq = new Map<number, number>();
    for (const r of ranks) freq.set(r, (freq.get(r) ?? 0) + 1);
    const groups = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

    if (isFlush && isStraight) return straightHigh === 14 ? [9, 14] : [8, straightHigh];
    if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]];
    if (groups[0][1] === 3 && groups[1][1] === 2) return [6, groups[0][0], groups[1][0]];
    if (isFlush) return [5, ...ranks];
    if (isStraight) return [4, straightHigh];
    if (groups[0][1] === 3) return [3, groups[0][0], groups[1][0], groups[2][0]];
    if (groups[0][1] === 2 && (groups[1]?.[1] ?? 0) === 2) return [2, groups[0][0], groups[1][0], groups[2][0]];
    if (groups[0][1] === 2) return [1, groups[0][0], groups[1][0], groups[2][0], groups[3][0]];
    return [0, ...ranks];
}

function compareScores(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const d = (a[i] ?? 0) - (b[i] ?? 0);
        if (d !== 0) return d;
    }
    return 0;
}

// Generate all C(n,5) combinations
function combos5(cards: string[]): string[][] {
    const result: string[][] = [];
    const n = cards.length;
    for (let a = 0; a < n - 4; a++)
        for (let b = a + 1; b < n - 3; b++)
            for (let c = b + 1; c < n - 2; c++)
                for (let d = c + 1; d < n - 1; d++)
                    for (let e = d + 1; e < n; e++)
                        result.push([cards[a], cards[b], cards[c], cards[d], cards[e]]);
    return result;
}

export interface HandResult {
    score: number[];
    handName: string;
    bestCards: string[];
}

export function evaluateBestHand(cards: string[]): HandResult {
    let bestScore: number[] = [];
    let bestCards: string[] = [];

    for (const combo of combos5(cards)) {
        const score = eval5(combo);
        if (!bestCards.length || compareScores(score, bestScore) > 0) {
            bestScore = score;
            bestCards = combo;
        }
    }

    return { score: bestScore, handName: HAND_NAMES[bestScore[0]], bestCards };
}

export function compareHandResults(a: HandResult, b: HandResult): number {
    return compareScores(a.score, b.score);
}
