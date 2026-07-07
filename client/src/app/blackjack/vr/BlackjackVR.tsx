'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { useAuth } from '@/hooks/useAuth';
import { useBlackjack } from '../useBlackjack';
import VRScene from './VRScene';
import { useHeadLook } from './useHeadLook';

const Spinner = () => (
    <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
    </div>
);

export default function BlackjackVR() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const game = useBlackjack('main-3d', user?.id);
    const { quat, enableGyro, gyro } = useHeadLook();

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    const enterVR = async () => {
        await enableGyro();
        try { await document.documentElement.requestFullscreen?.(); } catch { /* ignore */ }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        try { await (screen.orientation as any)?.lock?.('landscape'); } catch { /* ignore */ }
    };

    if (loading || !user) return <Spinner />;

    return (
        <div className="relative h-screen w-screen touch-none overflow-hidden bg-black">
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [0, 1.5, 3.6], fov: 72, near: 0.1 }}>
                {game.state && <VRScene state={game.state} quat={quat} game={game} myId={user.id} />}
            </Canvas>

            {/* Séparateur central (repère Cardboard) */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/50" />

            {/* HUD (une seule couche, à régler avant de mettre le tel dans le Cardboard) */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
                <div className="flex items-start justify-between">
                    <button
                        onClick={() => router.push('/blackjack/3d')}
                        className="pointer-events-auto rounded-lg border border-white/20 bg-black/55 px-3 py-1.5 text-sm text-white/85 hover:border-white/40 hover:text-white"
                    >
                        ← Quitter la VR
                    </button>
                    {!gyro && (
                        <button
                            onClick={enterVR}
                            className="pointer-events-auto rounded-lg bg-[#7C3AED] px-4 py-1.5 text-sm font-bold text-white shadow-lg hover:bg-[#6D28D9]"
                        >
                            🥽 Entrer en VR
                        </button>
                    )}
                </div>
                <p className="pointer-events-none text-center text-[11px] text-white/55">
                    {gyro
                        ? '📱 Bouge la tête pour regarder · fixe un bouton ~1,5 s pour jouer (viseur central)'
                        : '💻 Glisse à la souris pour regarder · vise un bouton et fixe-le ~1,5 s pour jouer'}
                </p>
            </div>

            {!game.state && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
                </div>
            )}
        </div>
    );
}
