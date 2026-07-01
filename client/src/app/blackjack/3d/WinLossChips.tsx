'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { chipSideTexture, chipTopTexture } from './chipTexture';
import { DEALER_HAND, SEATS, SURFACE_Y, Vec3 } from './positions';
import { TableSnapshot } from '../types';

type Flight = { id: number; from: Vec3; to: Vec3; value: number };
const DUR = 0.85;

/** Au règlement : un jeton vole du croupier vers le joueur (gain) ou l'inverse (perte). */
export default function WinLossChips({ state }: { state: TableSnapshot }) {
    const [flights, setFlights] = useState<Flight[]>([]);
    const prevPhase = useRef(state.phase);
    const nextId = useRef(1);

    useEffect(() => {
        if (state.phase === 'settle' && prevPhase.current !== 'settle') {
            const list: Flight[] = [];
            const dealer: Vec3 = [DEALER_HAND[0], SURFACE_Y + 0.08, DEALER_HAND[2]];
            state.seats.forEach((seat) => {
                const s = SEATS[seat.index];
                if (!s || !seat.playerId) return;
                const spot: Vec3 = [s.spot[0], SURFACE_Y + 0.08, s.spot[2]];
                seat.hands.forEach((h) => {
                    if (h.result === 'win' || h.result === 'blackjack') list.push({ id: nextId.current++, from: dealer, to: spot, value: repChip(h.payout || h.bet) });
                    else if (h.result === 'lose') list.push({ id: nextId.current++, from: spot, to: dealer, value: repChip(h.bet) });
                });
            });
            if (list.length) setFlights((f) => [...f, ...list]);
        }
        prevPhase.current = state.phase;
    }, [state.phase, state.seats]);

    const remove = (id: number) => setFlights((f) => f.filter((x) => x.id !== id));
    return <>{flights.map((f) => <FlyingChip key={f.id} flight={f} onDone={() => remove(f.id)} />)}</>;
}

function repChip(amount: number): number {
    for (const v of [500, 100, 50, 25, 10, 5]) if (amount >= v) return v;
    return 5;
}

function FlyingChip({ flight, onDone }: { flight: Flight; onDone: () => void }) {
    const ref = useRef<THREE.Group>(null);
    const t = useRef(0);
    const done = useRef(false);
    const top = chipTopTexture(flight.value);
    const side = chipSideTexture(flight.value);

    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        t.current += delta;
        const p = Math.min(1, t.current / DUR);
        const e = 1 - Math.pow(1 - p, 3);
        const [fx, fy, fz] = flight.from;
        const [tx, ty, tz] = flight.to;
        g.position.set(fx + (tx - fx) * e, fy + (ty - fy) * e + Math.sin(p * Math.PI) * 1.0, fz + (tz - fz) * e);
        g.rotation.y += delta * 6;
        if (p >= 1 && !done.current) { done.current = true; onDone(); }
    });

    return (
        <group ref={ref}>
            <mesh castShadow>
                <cylinderGeometry args={[0.26, 0.26, 0.055, 48]} />
                <meshStandardMaterial attach="material-0" map={side} />
                <meshStandardMaterial attach="material-1" map={top} />
                <meshStandardMaterial attach="material-2" map={top} />
            </mesh>
        </group>
    );
}
