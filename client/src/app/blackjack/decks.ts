import { Rank } from './types';

/**
 * Un thème de deck décrit l'apparence des cartes.
 * `court` mappe les figures (V/D/R) vers une image personnalisée.
 * Si l'image est absente, la carte retombe sur un rendu CSS par défaut.
 * Le rang et l'enseigne restent toujours visibles dans les coins.
 */
export interface DeckTheme {
    id: string;
    name: string;
    /** Images des figures (chemins dans /public). */
    court?: Partial<Record<'J' | 'Q' | 'K', string>>;
    /** Couleur dominante du dos de carte. */
    backColor: string;
}

export const DEFAULT_DECK: DeckTheme = {
    id: 'classic',
    name: 'Classique',
    backColor: '#7C3AED',
};

/**
 * Deck « Prof » : les figures affichent la tête du professeur.
 * Déposez les fichiers dans client/public/cards/professor/.
 */
export const PROFESSOR_DECK: DeckTheme = {
    id: 'professor',
    name: 'Prof',
    backColor: '#0E7C5A',
    court: {
        J: '/cards/professor/jack.png',
        Q: '/cards/professor/queen.png',
        K: '/cards/professor/king.png',
    },
};

export const DECKS: DeckTheme[] = [DEFAULT_DECK, PROFESSOR_DECK];

export function getDeck(id: string): DeckTheme {
    return DECKS.find((d) => d.id === id) ?? DEFAULT_DECK;
}

export function courtImage(deck: DeckTheme, rank: Rank): string | undefined {
    if (rank === 'J' || rank === 'Q' || rank === 'K') return deck.court?.[rank];
    return undefined;
}
