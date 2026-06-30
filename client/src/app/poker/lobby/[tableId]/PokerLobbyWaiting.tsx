'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { connectSocket, getSocket } from '@/lib/socket';
import LobbyHeader from './LobbyHeader';
import LobbyTable from './LobbyTable';
import LobbyFooter from './LobbyFooter';
import type { PokerLobbyState } from './types';

type Props = { tableId: string };

export default function PokerLobbyWaiting({ tableId }: Props) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [state, setState] = useState<PokerLobbyState | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const socket = connectSocket();

        const handleState = (s: PokerLobbyState) => setState(s);
        const handleNotFound = () => setNotFound(true);
        const handleGameStarted = () => router.push(`/poker/game/${tableId}`);
        const doRejoin = () => socket.emit('poker:rejoin', { tableId });

        socket.on('poker:state', handleState);
        socket.on('poker:not_found', handleNotFound);
        socket.on('poker:game_started', handleGameStarted);
        socket.on('connect', doRejoin);

        if (socket.connected) doRejoin();

        return () => {
            socket.off('poker:state', handleState);
            socket.off('poker:not_found', handleNotFound);
            socket.off('poker:game_started', handleGameStarted);
            socket.off('connect', doRejoin);
        };
    }, [user, tableId]);

    const handleLeave = () => {
        getSocket().emit('poker:leave', { tableId });
        router.push('/lobby');
    };

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading || (!state && !notFound)) {
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
                    <p className="text-[#3A3A5A] text-sm">Finding table…</p>
                </div>
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────────

    if (notFound) {
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="text-center flex flex-col gap-3">
                    <p className="text-[#E2E2F0] font-semibold">Lobby not found</p>
                    <button
                        onClick={() => router.push('/lobby')}
                        className="text-[#A78BFA] text-sm hover:underline cursor-pointer"
                    >
                        Back to lobby
                    </button>
                </div>
            </div>
        );
    }

    // ── Lobby ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#06060F] text-[#E2E2F0] flex flex-col">

            {/* ── Header bar ── */}
            <LobbyHeader
                gameMode={state!.gameMode}
                sb={state!.sb}
                bb={state!.bb}
                playerCount={state!.players.length}
                maxPlayers={state!.maxPlayers}
            />

            {/* ── Table (fills all remaining space) ── */}
            <div className="flex-1 flex items-center justify-center px-2 py-4 min-h-0">
                <div
                    className="w-full"
                    style={{ maxWidth: 'min(calc(100vw - 8px), 1100px)' }}
                >
                    <LobbyTable
                        players={state!.players}
                        maxPlayers={state!.maxPlayers}
                        currentUserId={user!.id}
                    />
                </div>
            </div>

            {/* ── Footer ── */}
            <LobbyFooter
                playerCount={state!.players.length}
                maxPlayers={state!.maxPlayers}
                onLeave={handleLeave}
            />
        </div>
    );
}
