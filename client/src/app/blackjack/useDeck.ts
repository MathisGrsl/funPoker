'use client';

import { useCallback, useEffect, useState } from 'react';
import { DECKS, DeckTheme, getDeck } from './decks';

const KEY = 'bj-deck';

/** Deck choisi par le joueur, partagé entre la table 2D et la 3D (localStorage). */
export function useDeck(): { deck: DeckTheme; deckId: string; setDeckId: (id: string) => void; decks: DeckTheme[] } {
    const [deckId, setId] = useState('royal');

    useEffect(() => {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
        if (saved) setId(saved);
    }, []);

    const setDeckId = useCallback((id: string) => {
        setId(id);
        if (typeof window !== 'undefined') window.localStorage.setItem(KEY, id);
    }, []);

    return { deck: getDeck(deckId), deckId, setDeckId, decks: DECKS };
}
