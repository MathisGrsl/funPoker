'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { useAuth } from '@/hooks/useAuth';
import { usePokerGame } from '../usePokerGame';
import Scene from './Scene';
import Overlay from './Overlay';
import { CAMERA_FOV } from './positions';

const Spinner = () => (
    <div className="flex h-screen items-center justify-center bg-[#06060F]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
    </div>
);

type Props = { tableId: string };

export default function PokerGame3D({ tableId }: Props) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { state, notFound, gameOver, act } = usePokerGame(tableId, user?.id);
    const resetViewRef = useRef<() => void>(() => {});

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    useEffect(() => {
        if (!notFound) return;
        const t = setTimeout(() => router.push('/lobby'), 2000);
        return () => clearTimeout(t);
    }, [notFound, router]);

    if (loading || !user) return <Spinner />;

    if (notFound) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#06060F]">
                <p className="font-semibold text-[#E2E2F0]">Game not found</p>
                <p className="text-xs text-[#4A4A6A]">Redirecting to lobby…</p>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
            </div>
        );
    }

    if (gameOver) {
        const isWinner = gameOver.winnerId === user.id;
        const winnerName = state?.players.find((p) => p.userId === gameOver.winnerId)?.username ?? 'Opponent';
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-5 bg-[#06060F] text-center">
                <div className="text-6xl">{isWinner ? '🏆' : '💀'}</div>
                <p className={`text-3xl font-black ${isWinner ? 'text-[#D4AF37]' : 'text-[#E2E2F0]'}`}>
                    {isWinner ? 'You Win!' : 'Game Over'}
                </p>
                {!isWinner && gameOver.winnerId && (
                    <p className="text-sm text-[#C4C4E0]">{winnerName} takes the pot</p>
                )}
                <button
                    onClick={() => router.push('/lobby')}
                    className="mt-2 cursor-pointer rounded-xl border border-[#7C3AED]/50 bg-[#7C3AED]/20 px-8 py-3 font-semibold text-[#A78BFA] transition-all hover:bg-[#7C3AED]/40"
                >
                    Back to Lobby
                </button>
            </div>
        );
    }

    if (!state) return <Spinner />;

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#06060F]">
            <Canvas shadows="percentage" dpr={[1, 2]} camera={{ fov: CAMERA_FOV }} gl={{ antialias: true }}>
                <Scene state={state} myId={user.id} resetViewRef={resetViewRef} />
            </Canvas>
            <Overlay
                state={state}
                currentUserId={user.id}
                onAction={act}
                onBack2D={() => router.push(`/poker/game/${tableId}`)}
                onResetView={() => resetViewRef.current()}
            />
        </div>
    );
}
