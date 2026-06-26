'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket } from '@/lib/socket';
import { PlayerAction, TableSnapshot } from './types';

/** Connexion temps réel à une table de blackjack. */
export function useBlackjack(tableId: string, myId: string | undefined) {
    const [state, setState] = useState<TableSnapshot | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [joinBalance, setJoinBalance] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = connectSocket();
        socketRef.current = socket;

        const onState = (snap: TableSnapshot) => setState(snap);
        const onError = ({ message }: { message: string }) => setError(message);
        const onBalance = ({ balance }: { balance: number }) => setJoinBalance(balance);

        socket.on('blackjack:state', onState);
        socket.on('blackjack:error', onError);
        socket.on('blackjack:balance', onBalance);
        socket.emit('blackjack:join', { tableId });

        return () => {
            socket.emit('blackjack:leaveTable', { tableId });
            socket.off('blackjack:state', onState);
            socket.off('blackjack:error', onError);
            socket.off('blackjack:balance', onBalance);
        };
    }, [tableId]);

    // L'erreur s'efface automatiquement après quelques secondes.
    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(null), 3500);
        return () => clearTimeout(t);
    }, [error]);

    const emit = useCallback((event: string, payload: object) => {
        socketRef.current?.emit(event, { tableId, ...payload });
    }, [tableId]);

    const sit = useCallback((seatIndex: number) => emit('blackjack:sit', { seatIndex }), [emit]);
    const leaveSeat = useCallback((seatIndex: number) => emit('blackjack:leaveSeat', { seatIndex }), [emit]);
    const bet = useCallback((seatIndex: number, amount: number) => emit('blackjack:bet', { seatIndex, amount }), [emit]);
    const act = useCallback(
        (seatIndex: number, handIndex: number, action: PlayerAction) => emit('blackjack:action', { seatIndex, handIndex, action }),
        [emit],
    );
    const dealNow = useCallback(() => emit('blackjack:deal', {}), [emit]);
    const rebet = useCallback(() => emit('blackjack:rebet', {}), [emit]);
    const insure = useCallback((seatIndex: number, take: boolean) => emit('blackjack:insurance', { seatIndex, take }), [emit]);
    const topup = useCallback(() => emit('blackjack:topup', {}), [emit]);

    // Le solde du snapshot (à jour) prime sur celui reçu au join.
    const fromState = myId ? state?.balances[myId] : undefined;
    const balance = fromState ?? joinBalance ?? 0;

    return { state, error, balance, sit, leaveSeat, bet, act, dealNow, rebet, insure, topup };
}
