'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { useAuth } from '@/hooks/useAuth';
import { useUltimate } from '../useUltimate';
import UltScene from './UltScene';
import UltOverlay from './UltOverlay';
import { CAMERA_FOV, CAMERA_POS } from './positions';

const Spinner = () => (
    <div className="flex h-screen items-center justify-center bg-[#05100b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
    </div>
);

export default function Ultimate3D() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const game = useUltimate('ult-1', user?.id);
    const [selectedChip, setSelectedChip] = useState(25);
    const resetViewRef = useRef<() => void>(() => {});

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    if (loading || !user) return <Spinner />;

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#05100b]">
            <Canvas shadows="percentage" dpr={[1, 2]} camera={{ position: CAMERA_POS, fov: CAMERA_FOV }} gl={{ antialias: true }}>
                {game.state && (
                    <UltScene
                        state={game.state}
                        myId={user.id}
                        selectedChip={selectedChip}
                        onSit={game.sit}
                        onAnte={game.ante}
                        onTrips={game.trips}
                        resetViewRef={resetViewRef}
                    />
                )}
            </Canvas>

            {game.state ? (
                <UltOverlay
                    game={game}
                    myId={user.id}
                    selectedChip={selectedChip}
                    setSelectedChip={setSelectedChip}
                    onBack2D={() => router.push('/ultimate')}
                    onResetView={() => resetViewRef.current()}
                />
            ) : (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
                </div>
            )}
        </div>
    );
}
