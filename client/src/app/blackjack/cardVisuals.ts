import { Rank, Suit } from './types';

export const SUIT_GLYPH: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
};

/** Rouge pour cœur/carreau, presque noir pour pique/trèfle. */
export function suitColor(suit: Suit): string {
    return suit === 'hearts' || suit === 'diamonds' ? '#D4183A' : '#1A1A22';
}

export function isCourt(rank: Rank): rank is 'J' | 'Q' | 'K' {
    return rank === 'J' || rank === 'Q' || rank === 'K';
}

/* ------------------------------------------------------------------ */
/*  Disposition des pips (cartes 2 à 10) — positions en % de la carte */
/*  Les pips de la moitié basse (y > 50) sont pivotés de 180°.        */
/* ------------------------------------------------------------------ */

type Pip = { x: number; y: number };

const L = 30;
const C = 50;
const R = 70;

export const PIP_LAYOUT: Record<string, Pip[]> = {
    '2': [{ x: C, y: 18 }, { x: C, y: 82 }],
    '3': [{ x: C, y: 18 }, { x: C, y: 50 }, { x: C, y: 82 }],
    '4': [{ x: L, y: 18 }, { x: R, y: 18 }, { x: L, y: 82 }, { x: R, y: 82 }],
    '5': [{ x: L, y: 18 }, { x: R, y: 18 }, { x: C, y: 50 }, { x: L, y: 82 }, { x: R, y: 82 }],
    '6': [{ x: L, y: 18 }, { x: R, y: 18 }, { x: L, y: 50 }, { x: R, y: 50 }, { x: L, y: 82 }, { x: R, y: 82 }],
    '7': [{ x: L, y: 18 }, { x: R, y: 18 }, { x: C, y: 34 }, { x: L, y: 50 }, { x: R, y: 50 }, { x: L, y: 82 }, { x: R, y: 82 }],
    '8': [{ x: L, y: 18 }, { x: R, y: 18 }, { x: C, y: 34 }, { x: L, y: 50 }, { x: R, y: 50 }, { x: C, y: 66 }, { x: L, y: 82 }, { x: R, y: 82 }],
    '9': [{ x: L, y: 18 }, { x: R, y: 18 }, { x: L, y: 39 }, { x: R, y: 39 }, { x: C, y: 50 }, { x: L, y: 61 }, { x: R, y: 61 }, { x: L, y: 82 }, { x: R, y: 82 }],
    '10': [{ x: L, y: 16 }, { x: R, y: 16 }, { x: C, y: 30 }, { x: L, y: 39 }, { x: R, y: 39 }, { x: L, y: 61 }, { x: R, y: 61 }, { x: C, y: 70 }, { x: L, y: 84 }, { x: R, y: 84 }],
};
