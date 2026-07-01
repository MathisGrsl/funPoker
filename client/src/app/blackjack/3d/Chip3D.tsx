'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { decomposeChips } from '../Chips';
import { chipSideTexture, chipTopTexture } from './chipTexture';

const CHIP_R = 0.26;
const CHIP_H = 0.055;

/** Un jeton qui tombe sur la pile à l'apparition. */
function Chip3D({ value, targetY, delay }: { value: number; targetY: number; delay: number }) {
    const ref = useRef<THREE.Group>(null);
    const started = useRef(false);
    const elapsed = useRef(0);
    const top = chipTopTexture(value);
    const side = chipSideTexture(value);

    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        if (!started.current) {
            g.position.y = targetY + 1.2;
            started.current = true;
        }
        elapsed.current += delta;
        if (elapsed.current < delay) return;
        g.position.y += (targetY - g.position.y) * 0.25;
    });

    return (
        <group ref={ref}>
            <mesh castShadow>
                <cylinderGeometry args={[CHIP_R, CHIP_R, CHIP_H, 48]} />
                <meshStandardMaterial attach="material-0" map={side} roughness={0.5} />
                <meshStandardMaterial attach="material-1" map={top} roughness={0.5} />
                <meshStandardMaterial attach="material-2" map={top} roughness={0.5} />
            </mesh>
        </group>
    );
}

/** Pile de jetons représentant un montant, posée à `position`. */
export default function ChipStack3D({ amount, position }: { amount: number; position: [number, number, number] }) {
    if (amount <= 0) return null;
    const chips = decomposeChips(amount, 8);

    return (
        <group position={position}>
            {chips.map((v, i) => (
                <Chip3D key={`${i}-${v}`} value={v} targetY={i * CHIP_H + CHIP_H / 2} delay={i * 0.04} />
            ))}
        </group>
    );
}
