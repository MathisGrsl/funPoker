'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { chipCountFor, pokerChipSideTexture, pokerChipTopTexture } from './pokerChipTexture';
import type { Vec3 } from './positions';

const CHIP_R = 0.24;
const CHIP_H = 0.05;

function Chip({ tier, targetY, delay }: { tier: number; targetY: number; delay: number }) {
    const ref = useRef<THREE.Group>(null);
    const started = useRef(false);
    const elapsed = useRef(0);
    const top = pokerChipTopTexture(tier);
    const side = pokerChipSideTexture(tier);

    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        if (!started.current) {
            g.position.y = targetY + 1.0;
            started.current = true;
        }
        elapsed.current += delta;
        if (elapsed.current < delay) return;
        g.position.y += (targetY - g.position.y) * 0.25;
    });

    return (
        <group ref={ref}>
            <mesh castShadow>
                <cylinderGeometry args={[CHIP_R, CHIP_R, CHIP_H, 40]} />
                <meshStandardMaterial attach="material-0" map={side} roughness={0.5} />
                <meshStandardMaterial attach="material-1" map={top} roughness={0.5} />
                <meshStandardMaterial attach="material-2" map={top} roughness={0.5} />
            </mesh>
        </group>
    );
}

/** A chip stack sized visually (not an exact denomination breakdown — poker amounts are fractional). */
export default function PokerChipStack3D({ amount, bb, position, tier = 2 }: { amount: number; bb: number; position: Vec3; tier?: number }) {
    const count = chipCountFor(amount, bb);
    if (count <= 0) return null;

    return (
        <group position={position}>
            {Array.from({ length: count }, (_, i) => (
                <Chip key={i} tier={tier} targetY={i * CHIP_H + CHIP_H / 2} delay={i * 0.04} />
            ))}
        </group>
    );
}
