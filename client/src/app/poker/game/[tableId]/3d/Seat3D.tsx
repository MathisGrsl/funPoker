'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Hand3D from '../../../../blackjack/3d/Hand3D';
import PlayerAvatar3D from './PlayerAvatar3D';
import PokerChipStack3D from './PokerChipStack3D';
import { avatarColorFor } from './avatarFaceTexture';
import { toSnapshotCard } from './pokerCardAdapter';
import { SeatLayout, SURFACE_Y } from './positions';
import type { GamePlayerState } from '../types';

type Props = {
    player: GamePlayerState;
    layout: SeatLayout;
    isMine: boolean;
    isActing: boolean;
    bb: number;
};

export default function Seat3D({ player, layout, isMine, isActing, bb }: Props) {
    const cards = (player.holeCards ?? []).map(toSnapshotCard);
    const color = avatarColorFor(player.seatIndex);

    // Bet chips sit between the avatar spot and the hand position.
    const chipPos: [number, number, number] = [
        (layout.spot[0] + layout.hand[0]) / 2,
        SURFACE_Y,
        (layout.spot[2] + layout.hand[2]) / 2,
    ];

    return (
        <group>
            {/* First-person embodiment: skip rendering my own body so it never blocks my view of the table. */}
            {!isMine && (
                <group position={layout.spot} rotation={[0, layout.rotationY, 0]}>
                    <PlayerAvatar3D color={color} status={player.status} avatarUrl={player.avatar} />
                </group>
            )}

            {player.bet > 0 && <PokerChipStack3D amount={player.bet} bb={bb} position={chipPos} tier={isMine ? 2 : 1} />}

            {cards.length > 0 && (
                <Hand3D cards={cards} basePos={layout.hand} dealDelayBase={0} />
            )}

            {isActing && <TurnRing pos={layout.hand} />}

            {/* My own name/chips are shown in the side HUD instead — a floating badge right in front of the camera would block the view. */}
            {!isMine && (
                <Html position={[layout.spot[0], SURFACE_Y + 1.75, layout.spot[2]]} center distanceFactor={9} zIndexRange={[20, 0]}>
                    <div className="pointer-events-none flex flex-col items-center gap-0.5">
                        <div className="whitespace-nowrap rounded-full border border-white/15 bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                            {player.username}
                            {player.isDealer && <span className="ml-1 text-white/60">D</span>}
                            {player.isSB && <span className="ml-1 text-blue-300">SB</span>}
                            {player.isBB && <span className="ml-1 text-orange-300">BB</span>}
                        </div>
                        <div className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                            €{player.chips.toFixed(2)}
                        </div>
                        {player.status === 'all-in' && (
                            <div className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white">ALL-IN</div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
}

/** Pulsing ring marking whose turn it is — same idea as blackjack's `TurnRing`. */
function TurnRing({ pos }: { pos: [number, number, number] }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        const m = ref.current?.material as THREE.MeshStandardMaterial | undefined;
        if (m) m.emissiveIntensity = 1.1 + Math.sin(state.clock.elapsedTime * 4) * 0.6;
    });
    return (
        <mesh ref={ref} position={[pos[0], SURFACE_Y - 0.04, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.85, 1.05, 56]} />
            <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={1.1} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
    );
}
