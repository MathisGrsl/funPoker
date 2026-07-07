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
    /** Rendu « luxe » : bordure dorée, foil, halo sur As/figures, gerbe au blackjack. */
    premium?: boolean;
    /** Couleur d'accent (or) du rendu premium. */
    accent?: string;
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

/**
 * Deck « Casino Royal » : faces ivoire liserées d'or, dos noir & or, reflet foil,
 * halo doré sur les As/figures et gerbe dorée au blackjack.
 */
export const ROYAL_DECK: DeckTheme = {
    id: 'royal',
    name: 'Royal Or',
    backColor: '#12101a',
    premium: true,
    accent: '#E7C24A',
};

export const DECKS: DeckTheme[] = [ROYAL_DECK, DEFAULT_DECK, PROFESSOR_DECK];

export function getDeck(id: string): DeckTheme {
    return DECKS.find((d) => d.id === id) ?? DEFAULT_DECK;
}

export function courtImage(deck: DeckTheme, rank: Rank): string | undefined {
    if (rank === 'J' || rank === 'Q' || rank === 'K') return deck.court?.[rank];
    return undefined;
}
