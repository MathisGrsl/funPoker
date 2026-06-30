'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { connectSocket, getSocket } from '@/lib/socket';
import GameTable from './GameTable';
import ActionPanel from './ActionPanel';
import AnimatedCard from './AnimatedCard';
import type { GameState } from './types';

type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

type Props = { tableId: string };

export default function PokerGame({ tableId }: Props) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [state, setGameState] = useState<GameState | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [gameOver, setGameOver] = useState<{ winnerId: string | null } | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
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
    }, [user, tableId]);

    const handleAction = (action: ActionType, amount?: number) => {
        getSocket().emit('poker:action', { tableId, action, amount });
    };

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading || (!state && !notFound && !gameOver)) {
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
                    <p className="text-[#3A3A5A] text-sm">Joining table…</p>
                </div>
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────────

    if (notFound) {
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="text-center flex flex-col gap-3">
                    <p className="text-[#E2E2F0] font-semibold">Game not found</p>
                    <button onClick={() => router.push('/lobby')} className="text-[#A78BFA] text-sm hover:underline cursor-pointer">
                        Back to lobby
                    </button>
                </div>
            </div>
        );
    }

    // ── Game over ────────────────────────────────────────────────────────────

    if (gameOver) {
        const isWinner = gameOver.winnerId === user?.id;
        const winnerName = state?.players.find(p => p.userId === gameOver.winnerId)?.username ?? 'Opponent';
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="text-center flex flex-col items-center gap-5">
                    <div className="text-6xl">{isWinner ? '🏆' : '💀'}</div>
                    <p className={`text-3xl font-black ${isWinner ? 'text-[#D4AF37]' : 'text-[#E2E2F0]'}`}>
                        {isWinner ? 'You Win!' : 'Game Over'}
                    </p>
                    {!isWinner && gameOver.winnerId && (
                        <p className="text-[#C4C4E0] text-sm">{winnerName} takes the pot</p>
                    )}
                    <button
                        onClick={() => router.push('/lobby')}
                        className="px-8 py-3 bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#A78BFA] rounded-xl font-semibold hover:bg-[#7C3AED]/40 transition-all cursor-pointer mt-2"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>
        );
    }

    // ── Active game ──────────────────────────────────────────────────────────

    const me = state!.players.find(p => p.userId === user?.id);
    const isMyTurn = state!.actingUserId === user?.id && state!.phase !== 'between-rounds';
    const myCards = me?.holeCards?.filter(c => c !== 'back') ? me.holeCards : null;
    const showMyCards = myCards && myCards[0] !== 'back';

    return (
        <div className="min-h-screen bg-[#06060F] text-[#E2E2F0] flex flex-col">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-[#0d0d20]">
                <div className="flex items-center gap-2 text-xs text-[#6B6B8A]">
                    <span className="font-bold text-[#A78BFA]">Texas Hold&apos;em</span>
                    <span>·</span>
                    <span>€{state!.sb}/{state!.bb}</span>
                </div>
                <span className="text-xs text-[#3A3A5A]">Hand #{state!.roundNumber}</span>
            </div>

            {/* ── Table area — fills all available vertical space ── */}
            <div className="flex-1 flex items-center justify-center px-1 py-2 min-h-0 overflow-hidden">
                {/* Width capped so table never gets taller than the available area */}
                <div
                    className="w-full"
                    style={{ maxWidth: 'min(calc(100vw - 8px), 1100px)' }}
                >
                    <GameTable state={state!} currentUserId={user!.id} />
                </div>
            </div>

            {/* ── Bottom zone: your cards + actions ── */}
            <div className="px-3 pb-4 pt-1 flex flex-col gap-2 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-end gap-3 max-w-2xl mx-auto w-full">
                    {/* Your hole cards (large) */}
                    <div className="flex gap-1.5 shrink-0">
                        {showMyCards ? (
                            me!.holeCards!.map((c, i) => (
                                <AnimatedCard key={`${state!.roundNumber}-${i}`} card={c} size="lg" dealDelay={i * 130} />
                            ))
                        ) : (
                            // Placeholder when cards not yet dealt
                            <>
                                <div className="w-16 h-[94px] rounded-lg border border-dashed border-[#1E1E3A] bg-[#0D0D1F]/50" />
                                <div className="w-16 h-[94px] rounded-lg border border-dashed border-[#1E1E3A] bg-[#0D0D1F]/50" />
                            </>
                        )}
                    </div>

                    {/* Action panel */}
                    <div className="flex-1 flex flex-col justify-end gap-2">
                        {isMyTurn && (
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                                <p className="text-[#D4AF37] text-xs font-semibold">Your turn</p>
                            </div>
                        )}
                        {!isMyTurn && state!.phase !== 'between-rounds' && state!.actingUserId && (
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-pulse" />
                                <p className="text-[#6B6B8A] text-xs">
                                    Waiting for {state!.players.find(p => p.userId === state!.actingUserId)?.username ?? 'opponent'}…
                                </p>
                            </div>
                        )}
                        <ActionPanel state={state!} currentUserId={user!.id} onAction={handleAction} />
                    </div>
                </div>
            </div>
        </div>
    );
}
