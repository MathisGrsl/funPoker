'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Table3D from './Table3D';
import Shoe3D from './Shoe3D';
import Dealer3D from './Dealer3D';
import Hand3D from './Hand3D';
import Seat3D from './Seat3D';
import WinLossChips from './WinLossChips';
import { CAMERA_LOOK, DEALER_HAND, SURFACE_Y } from './positions';
import { TableSnapshot, isHidden } from '../types';

type Props = {
    state: TableSnapshot;
    myId: string;
    selectedChip: number;
    premium: boolean;
    rageSignal: number;
    onSit: (i: number) => void;
    onBet: (i: number, amount: number) => void;
};

function CameraRig() {
    const { camera } = useThree();
    useEffect(() => {
        camera.lookAt(CAMERA_LOOK[0], CAMERA_LOOK[1], CAMERA_LOOK[2]);
    }, [camera]);
    return null;
}

/** Ragequit : bascule le « monde » (table + cartes + jetons) et secoue la caméra. */
function RageController({ worldRef, signal }: { worldRef: React.RefObject<THREE.Group | null>; signal: number }) {
    const { camera } = useThree();
    const active = useRef(false);
    const t = useRef(0);
    const last = useRef(signal);
    const baseCam = useRef<THREE.Vector3 | null>(null);

    useFrame((_, delta) => {
        if (signal !== last.current) {
            last.current = signal;
            active.current = true;
            t.current = 0;
            baseCam.current = camera.position.clone();
        }
        const w = worldRef.current;
        if (!w || !active.current) return;

        t.current += delta;
        const dur = 1.8;
        const p = Math.min(1, t.current / dur);

        // Quantité de bascule : montée -> plein -> maintien -> retour.
        let f: number;
        if (p < 0.68) f = 1 - Math.pow(1 - p / 0.68, 3);
        else if (p < 0.84) f = 1;
        else f = 1 - Math.pow((p - 0.84) / 0.16, 2);

        w.rotation.x = -1.5 * f;
        w.rotation.z = 0.32 * f;
        w.position.y = -3.4 * f;

        // Secousse caméra, qui s'atténue.
        const shake = (1 - p) * 0.14;
        if (baseCam.current) {
            camera.position.x = baseCam.current.x + Math.sin(t.current * 62) * shake;
            camera.position.y = baseCam.current.y + Math.cos(t.current * 57) * shake;
        }

        if (p >= 1) {
            active.current = false;
            w.rotation.set(0, 0, 0);
            w.position.set(0, 0, 0);
            if (baseCam.current) camera.position.copy(baseCam.current);
        }
    });
    return null;
}

/** Cartes & jetons projetés en l'air lors du ragequit (montés brièvement sur signal). */
function RageDebris3D({ signal }: { signal: number }) {
    const [ids, setIds] = useState<number[]>([]);
    const last = useRef(signal);

    useEffect(() => {
        if (signal === last.current) return;
        last.current = signal;
        setIds(Array.from({ length: 16 }, (_, i) => signal * 100 + i));
        const to = setTimeout(() => setIds([]), 1900);
        return () => clearTimeout(to);
    }, [signal]);

    return <>{ids.map((id) => <DebrisPiece key={id} seed={id} />)}</>;
}

function DebrisPiece({ seed }: { seed: number }) {
    const ref = useRef<THREE.Group>(null);
    const vel = useRef(new THREE.Vector3());
    const spin = useRef(new THREE.Vector3());
    const init = useRef(false);
    const isChip = seed % 3 === 0;

    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        if (!init.current) {
            init.current = true;
            const a = ((seed % 16) / 16) * Math.PI * 2;
            const speed = 2.2 + (seed % 5) * 0.5;
            g.position.set(Math.cos(a) * 0.6, SURFACE_Y + 0.3, 0.4 + Math.sin(a) * 0.6);
            vel.current.set(Math.cos(a) * speed, 5.2 + (seed % 4) * 0.7, Math.sin(a) * speed);
            spin.current.set((seed % 7) - 3, (seed % 5) - 2, (seed % 3) - 1);
        }
        const dt = Math.min(delta, 0.05);
        vel.current.y -= 13 * dt;
        g.position.addScaledVector(vel.current, dt);
        g.rotation.x += spin.current.x * dt;
        g.rotation.y += spin.current.y * dt;
        g.rotation.z += spin.current.z * dt;
    });

    return (
        <group ref={ref}>
            {isChip ? (
                <mesh castShadow>
                    <cylinderGeometry args={[0.22, 0.22, 0.05, 20]} />
                    <meshStandardMaterial color={seed % 2 ? '#c0392b' : '#E7C24A'} />
                </mesh>
            ) : (
                <mesh castShadow>
                    <boxGeometry args={[0.5, 0.02, 0.7]} />
                    <meshStandardMaterial color="#f4f4ee" />
                </mesh>
            )}
        </group>
    );
}

export default function Scene({ state, myId, selectedChip, premium, rageSignal, onSit, onBet }: Props) {
    const worldRef = useRef<THREE.Group>(null);
    const dealerHasHidden = state.dealer.cards.some((c) => isHidden(c));
    // Total de cartes en jeu : quand ça augmente, le croupier fait un geste de distribution.
    const cardCount = state.dealer.cards.length + state.seats.reduce((n, s) => n + s.hands.reduce((m, h) => m + h.cards.length, 0), 0);

    return (
        <>
            <CameraRig />
            <RageController worldRef={worldRef} signal={rageSignal} />
            <ambientLight intensity={0.55} />
            <directionalLight
                position={[4, 9, 5]}
                intensity={1.0}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />
            <directionalLight position={[-6, 5, -4]} intensity={0.3} />

            {/* Fond sombre (le feutre masque déjà le bas du corps du croupier) */}
            <mesh position={[0, 2, -7]}>
                <planeGeometry args={[30, 16]} />
                <meshStandardMaterial color="#04120c" roughness={1} />
            </mesh>

            {/* Le croupier (personne) reste debout — seule la table bascule */}
            <Dealer3D dealSignal={cardCount} />

            {/* « Monde » qui se retourne au ragequit */}
            <group ref={worldRef}>
                <Table3D />
                <Shoe3D />

                {/* Croupier : cartes */}
                <Hand3D cards={state.dealer.cards} basePos={DEALER_HAND} premium={premium} />
                {state.dealer.cards.length > 0 && (
                    <Html position={[DEALER_HAND[0], 0.6, DEALER_HAND[2] - 0.25]} center distanceFactor={9} zIndexRange={[20, 0]}>
                        <div className="pointer-events-none rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-bold text-white">
                            {state.dealer.value}{dealerHasHidden ? ' +' : ''}
                        </div>
                    </Html>
                )}

                {/* Sièges */}
                {state.seats.map((seat) => (
                    <Seat3D
                        key={seat.index}
                        seat={seat}
                        isMine={seat.playerId === myId}
                        isActiveSeat={state.activeSeat === seat.index}
                        phase={state.phase}
                        premium={premium}
                        selectedChip={selectedChip}
                        balance={seat.playerId ? state.balances[seat.playerId] ?? 0 : 0}
                        maxBet={state.maxBet}
                        onSit={onSit}
                        onBet={onBet}
                    />
                ))}

                <WinLossChips state={state} />
                <RageDebris3D signal={rageSignal} />
            </group>
        </>
    );
}
