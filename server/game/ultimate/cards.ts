import { randomInt } from 'crypto';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    suit: Suit;
    rank: Rank;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/** Valeur numérique du rang (As haut = 14). */
export const RANK_VALUE: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14,
};

/** Paquet de 52 cartes mélangé (un par main, comme à l'Ultimate Texas Hold'em). */
export function buildDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) deck.push({ suit, rank });
    }
    return shuffle(deck);
}

export function shuffle(cards: Card[]): Card[] {
    for (let i = cards.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}
