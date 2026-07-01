'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket } from '@/lib/socket';
import { TableSnapshot, UltAction } from './types';

/** Connexion temps réel à une table d'Ultimate Texas Hold'em. */
export function useUltimate(tableId: string, myId: string | undefined) {
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

        socket.on('ultimate:state', onState);
        socket.on('ultimate:error', onError);
        socket.on('ultimate:balance', onBalance);
        socket.emit('ultimate:join', { tableId });

        return () => {
            socket.emit('ultimate:leaveTable', { tableId });
            socket.off('ultimate:state', onState);
            socket.off('ultimate:error', onError);
            socket.off('ultimate:balance', onBalance);
        };
    }, [tableId]);

    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(null), 3500);
        return () => clearTimeout(t);
    }, [error]);

    const emit = useCallback((event: string, payload: object = {}) => {
        socketRef.current?.emit(event, { tableId, ...payload });
    }, [tableId]);

    const sit = useCallback((seatIndex: number) => emit('ultimate:sit', { seatIndex }), [emit]);
    const leaveSeat = useCallback((seatIndex: number) => emit('ultimate:leaveSeat', { seatIndex }), [emit]);
    const ante = useCallback((seatIndex: number, amount: number) => emit('ultimate:ante', { seatIndex, amount }), [emit]);
    const trips = useCallback((seatIndex: number, amount: number) => emit('ultimate:trips', { seatIndex, amount }), [emit]);
    const act = useCallback((seatIndex: number, action: UltAction) => emit('ultimate:action', { seatIndex, action }), [emit]);
    const rebet = useCallback(() => emit('ultimate:rebet'), [emit]);
    const dealNow = useCallback(() => emit('ultimate:deal'), [emit]);
    const topup = useCallback(() => emit('ultimate:topup'), [emit]);

    const fromState = myId ? state?.balances[myId] : undefined;
    const balance = fromState ?? joinBalance ?? 0;

    return { state, error, balance, sit, leaveSeat, ante, trips, act, rebet, dealNow, topup };
}
