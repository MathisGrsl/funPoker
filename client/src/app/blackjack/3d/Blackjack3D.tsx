'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { useAuth } from '@/hooks/useAuth';
import { useBlackjack } from '../useBlackjack';
import Scene from './Scene';
import Overlay from './Overlay';
import { CAMERA_FOV, CAMERA_POS } from './positions';

const Spinner = () => (
    <div className="flex h-screen items-center justify-center bg-[#05100b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
    </div>
);

export default function Blackjack3D() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const game = useBlackjack('main-3d', user?.id);
    const [selectedChip, setSelectedChip] = useState(25);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    if (loading || !user) return <Spinner />;

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#05100b]">
            <Canvas shadows="percentage" dpr={[1, 2]} camera={{ position: CAMERA_POS, fov: CAMERA_FOV }} gl={{ antialias: true }}>
                {game.state && (
                    <Scene state={game.state} myId={user.id} selectedChip={selectedChip} onSit={game.sit} onBet={game.bet} />
                )}
            </Canvas>

            {game.state ? (
                <Overlay game={game} myId={user.id} selectedChip={selectedChip} setSelectedChip={setSelectedChip} onLeave={() => router.push('/blackjack')} />
            ) : (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
                </div>
            )}
        </div>
    );
}
