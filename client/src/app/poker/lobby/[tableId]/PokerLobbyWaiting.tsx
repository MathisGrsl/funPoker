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
        const doRejoin = () => socket.emit('poker:rejoin', { tableId });

        socket.on('poker:state', handleState);
        socket.on('poker:not_found', handleNotFound);
        // Re-emit rejoin every time the socket (re)connects so the race between
        // Lobby's disconnectSocket cleanup and our connectSocket never causes a
        // permanently-lost event.
        socket.on('connect', doRejoin);

        if (socket.connected) {
            doRejoin();
        }

        return () => {
            socket.off('poker:state', handleState);
            socket.off('poker:not_found', handleNotFound);
            socket.off('connect', doRejoin);
            // Do NOT disconnectSocket here — socket lives for the whole session.
        };
    }, [user, tableId]);

    const handleLeave = () => {
        getSocket().emit('poker:leave', { tableId });
        router.push('/lobby');
    };

    if (loading || (!state && !notFound)) {
        return (
            <div className="min-h-screen bg-[#090910] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="text-center gap-3 flex flex-col">
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

    return (
        <div className="min-h-screen bg-[#06060F] text-[#E2E2F0] flex flex-col items-center justify-center gap-8 p-8 relative">
            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/3 w-[700px] h-[350px] rounded-full bg-[#7C3AED] opacity-[0.04] blur-[160px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full bg-[#D4AF37] opacity-[0.025] blur-[150px]" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center gap-8">
                <LobbyHeader
                    gameMode={state!.gameMode}
                    sb={state!.sb}
                    bb={state!.bb}
                    playerCount={state!.players.length}
                    maxPlayers={state!.maxPlayers}
                />

                <LobbyTable
                    players={state!.players}
                    maxPlayers={state!.maxPlayers}
                    currentUserId={user!.id}
                />

                <LobbyFooter
                    playerCount={state!.players.length}
                    maxPlayers={state!.maxPlayers}
                    onLeave={handleLeave}
                />
            </div>
        </div>
    );
}
