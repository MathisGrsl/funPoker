export type Card = string; // e.g. "Ah", "Kd", "Ts", "2c"

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const SUITS = ['h', 'd', 'c', 's'] as const;

export function createShuffledDeck(): Card[] {
    const deck: Card[] = [];
    for (const rank of RANKS) {
        for (const suit of SUITS) {
            deck.push(`${rank}${suit}`);
        }
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function deal(deck: Card[], n: number): { dealt: Card[]; remaining: Card[] } {
    return { dealt: deck.slice(0, n), remaining: deck.slice(n) };
}
