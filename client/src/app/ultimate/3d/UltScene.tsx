'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import Card3D from '@/app/blackjack/3d/Card3D';
import Hand3D from '@/app/blackjack/3d/Hand3D';
import PlayerAvatar3D from '@/app/poker/game/[tableId]/3d/PlayerAvatar3D';
import UltTable3D from './UltTable3D';
import UltSeat3D from './UltSeat3D';
import {
    CAMERA_POS, CAMERA_TARGET, COMMUNITY_BASE, COMMUNITY_SPACING, DEALER_HAND, DEALER_POS,
    ORBIT_MAX_DISTANCE, ORBIT_MAX_POLAR, ORBIT_MIN_DISTANCE, ORBIT_MIN_POLAR,
} from './positions';
import { TableSnapshot } from '../types';

type Props = {
    state: TableSnapshot;
    myId: string;
    selectedChip: number;
    onSit: (i: number) => void;
    onAnte: (i: number, amount: number) => void;
    onTrips: (i: number, amount: number) => void;
    resetViewRef: React.RefObject<() => void>;
};

function CameraRig({ resetViewRef }: { resetViewRef: React.RefObject<() => void> }) {
    const { camera } = useThree();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controls = useRef<any>(null);

    const applyPose = useCallback(() => {
        camera.position.set(...CAMERA_POS);
        controls.current?.target.set(...CAMERA_TARGET);
        controls.current?.update();
    }, [camera]);

    useEffect(() => {
        applyPose();
        resetViewRef.current = applyPose;
    }, [applyPose, resetViewRef]);

    return (
        <OrbitControls
            ref={controls}
            target={CAMERA_TARGET}
            enablePan={false}
            minDistance={ORBIT_MIN_DISTANCE}
            maxDistance={ORBIT_MAX_DISTANCE}
            minPolarAngle={ORBIT_MIN_POLAR}
            maxPolarAngle={ORBIT_MAX_POLAR}
        />
    );
}

export default function UltScene({ state, myId, selectedChip, onSit, onAnte, onTrips, resetViewRef }: Props) {
    const community = state.community;
    const totalW = (Math.max(1, community.length) - 1) * COMMUNITY_SPACING;

    return (
        <>
            <CameraRig resetViewRef={resetViewRef} />
            <ambientLight intensity={0.55} />
            <directionalLight
                position={[4, 9, 5]}
                intensity={1.0}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-12}
                shadow-camera-right={12}
                shadow-camera-top={12}
                shadow-camera-bottom={-12}
            />
            <directionalLight position={[-6, 5, -4]} intensity={0.3} />

            {/* Fond sombre */}
            <mesh position={[0, 2, -8]}>
                <planeGeometry args={[34, 18]} />
                <meshStandardMaterial color="#04120c" roughness={1} />
            </mesh>

            <UltTable3D />

            {/* Croupier (maison) */}
            <group position={DEALER_POS} rotation={[0, 0, 0]}>
                <PlayerAvatar3D color="#334155" status="active" />
            </group>
            {state.dealer.cards.length > 0 && <Hand3D cards={state.dealer.cards} basePos={DEALER_HAND} />}
            <Html position={[DEALER_HAND[0], DEALER_HAND[1] + 0.7, DEALER_HAND[2] - 0.35]} center distanceFactor={10} zIndexRange={[20, 0]}>
                <div className="pointer-events-none whitespace-nowrap rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-bold text-white/90">
                    Croupier{state.dealer.handName ? ` · ${state.dealer.handName}` : ''}
                </div>
            </Html>

            {/* Cartes communes */}
            {community.map((c, i) => (
                <Card3D
                    key={i}
                    card={c}
                    position={[COMMUNITY_BASE[0] - totalW / 2 + i * COMMUNITY_SPACING, COMMUNITY_BASE[1], COMMUNITY_BASE[2]]}
                    dealDelay={i * 0.08}
                />
            ))}

            {/* Sièges */}
            {state.seats.map((seat) => (
                <UltSeat3D
                    key={seat.index}
                    seat={seat}
                    isMine={seat.playerId === myId}
                    isActiveSeat={state.activeSeat === seat.index}
                    phase={state.phase}
                    balance={seat.playerId ? state.balances[seat.playerId] ?? 0 : 0}
                    selectedChip={selectedChip}
                    maxAnte={state.maxAnte}
                    onSit={onSit}
                    onAnte={onAnte}
                    onTrips={onTrips}
                />
            ))}
        </>
    );
}
