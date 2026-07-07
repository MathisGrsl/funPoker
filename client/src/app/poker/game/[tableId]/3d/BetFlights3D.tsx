'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pokerChipSideTexture, pokerChipTopTexture } from './pokerChipTexture';
import { POT_POS, SURFACE_Y, Vec3 } from './positions';
import type { GamePlayerState, PotWinner } from '../types';

type Flight = { id: number; from: Vec3; to: Vec3; tier: number };
const DUR = 0.7;

type Props = {
    players: GamePlayerState[];
    phase: string;
    winners: PotWinner[] | null;
    seatPos: Record<string, Vec3>;
};

/** Chips flying seat→pot on a raise/call, and pot→winner(s) at showdown — mirrors blackjack's `WinLossChips`. */
export default function BetFlights3D({ players, phase, winners, seatPos }: Props) {
    const [flights, setFlights] = useState<Flight[]>([]);
    const prevBets = useRef<Map<string, number>>(new Map());
    const settledRound = useRef(false);
    const nextId = useRef(1);

    useEffect(() => {
        const list: Flight[] = [];
        const potSpot: Vec3 = [POT_POS[0], SURFACE_Y + 0.08, POT_POS[2]];

        players.forEach((p) => {
            const prev = prevBets.current.get(p.userId) ?? 0;
            const spot = seatPos[p.userId];
            if (spot && p.bet > prev) {
                list.push({ id: nextId.current++, from: [spot[0], SURFACE_Y + 0.3, spot[2]], to: potSpot, tier: 1 });
            }
            prevBets.current.set(p.userId, p.bet);
        });

        if (phase === 'between-rounds') prevBets.current.clear();

        if (list.length) setFlights((f) => [...f, ...list]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [players.map((p) => `${p.userId}:${p.bet}`).join(','), phase]);

    useEffect(() => {
        if (!winners || winners.length === 0 || settledRound.current) return;
        settledRound.current = true;
        const potSpot: Vec3 = [POT_POS[0], SURFACE_Y + 0.08, POT_POS[2]];
        const list: Flight[] = winners
            .map((w) => {
                const spot = seatPos[w.userId];
                if (!spot) return null;
                return { id: nextId.current++, from: potSpot, to: [spot[0], SURFACE_Y + 0.3, spot[2]] as Vec3, tier: 4 };
            })
            .filter((f): f is Flight => f !== null);
        if (list.length) setFlights((f) => [...f, ...list]);
    }, [winners, seatPos]);

    useEffect(() => {
        if (!winners) settledRound.current = false;
    }, [winners]);

    const remove = (id: number) => setFlights((f) => f.filter((x) => x.id !== id));
    return <>{flights.map((f) => <FlyingChip key={f.id} flight={f} onDone={() => remove(f.id)} />)}</>;
}

function FlyingChip({ flight, onDone }: { flight: Flight; onDone: () => void }) {
    const ref = useRef<THREE.Group>(null);
    const t = useRef(0);
    const done = useRef(false);
    const top = pokerChipTopTexture(flight.tier);
    const side = pokerChipSideTexture(flight.tier);

    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        t.current += delta;
        const p = Math.min(1, t.current / DUR);
        const e = 1 - Math.pow(1 - p, 3);
        const [fx, fy, fz] = flight.from;
        const [tx, ty, tz] = flight.to;
        g.position.set(fx + (tx - fx) * e, fy + (ty - fy) * e + Math.sin(p * Math.PI) * 0.8, fz + (tz - fz) * e);
        g.rotation.y += delta * 6;
        if (p >= 1 && !done.current) { done.current = true; onDone(); }
    });

    return (
        <group ref={ref}>
            <mesh castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.05, 40]} />
                <meshStandardMaterial attach="material-0" map={side} />
                <meshStandardMaterial attach="material-1" map={top} />
                <meshStandardMaterial attach="material-2" map={top} />
            </mesh>
        </group>
    );
}
