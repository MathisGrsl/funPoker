'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Hand3D from '@/app/blackjack/3d/Hand3D';
import ChipStack3D from '@/app/blackjack/3d/Chip3D';
import PlayerAvatar3D from '@/app/poker/game/[tableId]/3d/PlayerAvatar3D';
import { avatarColorFor } from '@/app/poker/game/[tableId]/3d/avatarFaceTexture';
import { BET_SPOTS, PLAYER_OUT, PLAYER_SCALE, PLAYER_Y, SEATS, SURFACE_Y } from './positions';
import { Phase, SnapshotSeat } from '../types';

type Props = {
    seat: SnapshotSeat;
    isMine: boolean;
    isActiveSeat: boolean;
    phase: Phase;
    balance: number;
    selectedChip: number;
    maxAnte: number;
    onSit: (i: number) => void;
    onAnte: (i: number, amount: number) => void;
    onTrips: (i: number, amount: number) => void;
};

export default function UltSeat3D({ seat, isMine, isActiveSeat, phase, balance, selectedChip, maxAnte, onSit, onAnte, onTrips }: Props) {
    const s = SEATS[seat.index];
    if (!s) return null;

    const occupied = !!seat.playerId;
    const canSit = phase === 'waiting' || phase === 'betting';
    const canBet = phase === 'betting' && isMine && occupied;
    const isTurn = isActiveSeat && (phase === 'preflop' || phase === 'flop' || phase === 'river');
    const amounts: Record<string, number> = { ante: seat.ante, blind: seat.blind, trips: seat.trips, play: seat.play };

    const addAnte = () => onAnte(seat.index, Math.min(maxAnte, seat.ante + selectedChip));
    const addTrips = () => onTrips(seat.index, Math.min(maxAnte, seat.trips + selectedChip));

    // Avatar reculé vers l'extérieur + abaissé pour ne pas masquer la table.
    const len = Math.hypot(s.spot[0], s.spot[2]) || 1;
    const avatarPos: [number, number, number] = [
        s.spot[0] + (s.spot[0] / len) * PLAYER_OUT,
        SURFACE_Y + PLAYER_Y,
        s.spot[2] + (s.spot[2] / len) * PLAYER_OUT,
    ];

    return (
        <group>
            {/* Avatar du joueur (reculé + abaissé) */}
            {occupied && (
                <group position={avatarPos} rotation={[0, s.rotationY, 0]} scale={PLAYER_SCALE}>
                    <PlayerAvatar3D color={avatarColorFor(seat.index)} status={seat.decision === 'folded' ? 'folded' : 'active'} />
                </group>
            )}

            {/* Cartes fermées du joueur */}
            {occupied && seat.hole.length > 0 && <Hand3D cards={seat.hole} basePos={s.hand} />}

            {/* Cases de mise ANTE / BLIND / TRIPS / PLAY */}
            {BET_SPOTS.map((b) => {
                const amt = amounts[b.key];
                const clickable = canBet && (b.key === 'ante' || b.key === 'trips');
                const pos: [number, number, number] = [s.bet[0] + b.dx, SURFACE_Y, s.bet[2] + b.dz];
                return (
                    <group key={b.key}>
                        <mesh
                            position={[pos[0], SURFACE_Y + 0.002, pos[2]]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            onClick={clickable ? (e) => { e.stopPropagation(); (b.key === 'ante' ? addAnte : addTrips)(); } : undefined}
                            onPointerOver={() => { if (clickable) document.body.style.cursor = 'pointer'; }}
                            onPointerOut={() => { document.body.style.cursor = 'default'; }}
                        >
                            <circleGeometry args={[0.27, 32]} />
                            <meshStandardMaterial color={b.color} transparent opacity={amt > 0 ? 0.28 : clickable ? 0.22 : 0.1} side={THREE.DoubleSide} />
                        </mesh>
                        {amt > 0 && <ChipStack3D amount={amt} position={[pos[0], SURFACE_Y, pos[2]]} />}
                    </group>
                );
            })}

            {/* Anneau du tour actif */}
            {isTurn && <TurnRing pos={s.hand} />}

            {/* Badge infos (nom, solde, mises, décision/résultat) — suit l'avatar reculé */}
            {occupied && (
                <Html position={[avatarPos[0], SURFACE_Y + 1.2, avatarPos[2]]} center distanceFactor={9} zIndexRange={[20, 0]}>
                    <InfoBadge seat={seat} balance={balance} isMine={isMine} phase={phase} />
                </Html>
            )}

            {/* S'asseoir */}
            {!occupied && canSit && (
                <Html position={[s.spot[0], SURFACE_Y + 0.3, s.spot[2]]} center distanceFactor={10} zIndexRange={[20, 0]}>
                    <button
                        onClick={() => onSit(seat.index)}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#D4AF37]/40 bg-black/50 text-3xl font-bold leading-none text-[#D4AF37]/80 transition-colors hover:text-[#D4AF37]"
                    >
                        ＋
                    </button>
                </Html>
            )}
        </group>
    );
}

function InfoBadge({ seat, balance, isMine, phase }: { seat: SnapshotSeat; balance: number; isMine: boolean; phase: Phase }) {
    const committed = seat.ante + seat.blind + seat.trips + seat.play;
    const net = (seat.payout ?? 0) - committed;
    const decision = phase !== 'showdown' && seat.decision !== 'none' && seat.decision !== 'pending' ? seat.decision : null;
    const decMap: Record<string, { t: string; c: string }> = {
        checked: { t: 'CHECK', c: 'bg-[#3A3A5C]' },
        played: { t: 'MISE', c: 'bg-[#15803D]' },
        folded: { t: 'COUCHÉ', c: 'bg-[#7f1d1d]' },
    };

    return (
        <div className="pointer-events-none flex flex-col items-center gap-1">
            <div className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${isMine ? 'border-[#D4AF37]/60 bg-black/70 text-white' : 'border-white/15 bg-black/60 text-white/90'}`}>
                {seat.playerName} · <span className="text-[#D4AF37]">{balance.toLocaleString()} 🪙</span>
            </div>

            {/* Mises ante/blind/trips/play */}
            {(seat.ante > 0 || seat.trips > 0) && (
                <div className="flex gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold">
                    <span className="text-[#D4AF37]">A{seat.ante}</span>
                    <span className="text-[#9CC2FF]">B{seat.blind}</span>
                    {seat.trips > 0 && <span className="text-[#F472B6]">T{seat.trips}</span>}
                    {seat.play > 0 && <span className="text-[#34D399]">P{seat.play}</span>}
                </div>
            )}

            {decision && <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${decMap[decision].c}`}>{decMap[decision].t}</span>}

            {phase === 'showdown' && seat.results && (
                <div className="flex flex-col items-center gap-0.5">
                    {seat.handName && <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-white/80">{seat.handName}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${net > 0 ? 'bg-[#15803D] text-white' : net < 0 ? 'bg-[#7f1d1d] text-white/90' : 'bg-[#3A3A5C] text-white'}`}>
                        {net > 0 ? `+${net}` : net < 0 ? `${net}` : '±0'}
                    </span>
                </div>
            )}
        </div>
    );
}

/** Anneau doré pulsé sur le feutre autour de la main dont c'est le tour. */
function TurnRing({ pos }: { pos: [number, number, number] }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        const m = ref.current?.material as THREE.MeshStandardMaterial | undefined;
        if (m) m.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.7;
    });
    return (
        <mesh ref={ref} position={[pos[0], SURFACE_Y - 0.02, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 0.9, 56]} />
            <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={1.2} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
    );
}
