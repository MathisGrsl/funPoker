import { randomInt } from 'crypto';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    suit: Suit;
    rank: Rank;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/** Valeur "brute" d'un rang : l'As vaut 11 (ajusté à 1 dans handValue si besoin). */
export function cardValue(rank: Rank): number {
    if (rank === 'A') return 11;
    if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
    return parseInt(rank, 10);
}

/** Construit un sabot mélangé de `decks` paquets de 52 cartes. */
export function buildShoe(decks: number): Card[] {
    const shoe: Card[] = [];
    for (let d = 0; d < decks; d++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                shoe.push({ suit, rank });
            }
        }
    }
    return shuffle(shoe);
}

/** Mélange Fisher-Yates avec une source aléatoire cryptographique (équitable). */
export function shuffle(cards: Card[]): Card[] {
    for (let i = cards.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}

/**
 * Meilleure valeur d'une main au blackjack.
 * `total` est la meilleure valeur <= 21 si possible.
 * `soft` indique qu'un As compte encore pour 11 (main "molle").
 */
export function handValue(cards: Card[]): { total: number; soft: boolean } {
    let total = 0;
    let aces = 0;

    for (const c of cards) {
        total += cardValue(c.rank);
        if (c.rank === 'A') aces++;
    }

    // Réduit les As de 11 -> 1 tant que la main dépasse 21.
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return { total, soft: aces > 0 };
}

/** Vrai blackjack : exactement 2 cartes totalisant 21. */
export function isBlackjack(cards: Card[]): boolean {
    return cards.length === 2 && handValue(cards).total === 21;
}

export function isBust(cards: Card[]): boolean {
    return handValue(cards).total > 21;
}
