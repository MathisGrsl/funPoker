'use client';

import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';
import type { GameState } from './types';

type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

/** Real-time connection to a running Texas Hold'em game. */
export function usePokerGame(tableId: string, userId: string | undefined) {
    const [state, setGameState] = useState<GameState | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [gameOver, setGameOver] = useState<{ winnerId: string | null } | null>(null);

    useEffect(() => {
        if (!userId) return;
        const socket = connectSocket();

        const handleState = (s: GameState) => setGameState(s);
        const handleNotFound = () => setNotFound(true);
        const handleGameOver = (data: { winnerId: string | null }) => setGameOver(data);
        const doRejoin = () => socket.emit('poker:game_rejoin', { tableId });

        socket.on('poker:game_state', handleState);
        socket.on('poker:game_not_found', handleNotFound);
        socket.on('poker:game_over', handleGameOver);
        socket.on('connect', doRejoin);

        if (socket.connected) doRejoin();

        return () => {
            socket.off('poker:game_state', handleState);
            socket.off('poker:game_not_found', handleNotFound);
            socket.off('poker:game_over', handleGameOver);
            socket.off('connect', doRejoin);
        };
    }, [userId, tableId]);

    const act = (action: ActionType, amount?: number) => {
        getSocket().emit('poker:action', { tableId, action, amount });
    };

    return { state, notFound, gameOver, act };
}
