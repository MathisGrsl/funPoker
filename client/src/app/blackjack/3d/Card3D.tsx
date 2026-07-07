'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SnapshotCard, isHidden } from '../types';
import { cardBackTexture, cardFaceTexture } from './cardTexture';

const CARD_W = 0.64;
const CARD_D = 0.9;
const CARD_T = 0.02;
const DEAL_DURATION = 0.5;

type Props = {
    card?: SnapshotCard;
    position: [number, number, number];
    /** Angle d'éventail (autour de Y). */
    rotationY?: number;
    shoe?: [number, number, number];
    dealDelay?: number;
    /** Rendu deck « Royal Or » : faces dorées + tranche dorée. */
    premium?: boolean;
};

/** Une carte 3D qui glisse du sabot vers sa position sur le tapis. */
export default function Card3D({ card, position, rotationY = 0, shoe = [3.6, 0.7, -2.7], dealDelay = 0, premium = false }: Props) {
    const ref = useRef<THREE.Group>(null);
    const started = useRef(false);
    const elapsed = useRef(0);

    const posRef = useRef(position);
    posRef.current = position;
    const rotRef = useRef(rotationY);
    rotRef.current = rotationY;

    const known = card && !isHidden(card) ? card : null;
    const backTex = useMemo(() => cardBackTexture(premium), [premium]);
    const faceTex = useMemo(() => (known ? cardFaceTexture(known.rank, known.suit, premium) : null), [known?.rank, known?.suit, premium]);
    const topTex = known ? faceTex! : backTex;
    const edge = premium ? '#E7C24A' : '#f4f4ee';

    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        if (!started.current) {
            g.position.set(shoe[0], shoe[1], shoe[2]);
            g.rotation.set(0, 0, 0);
            started.current = true;
        }
        elapsed.current += delta;
        const t = elapsed.current - dealDelay;
        if (t < 0) return;
        // Ease-out cubique sur une durée fixe : glissé net et fluide.
        const p = Math.min(1, t / DEAL_DURATION);
        const e = 1 - Math.pow(1 - p, 3);
        const [tx, ty, tz] = posRef.current;
        g.position.set(
            shoe[0] + (tx - shoe[0]) * e,
            shoe[1] + (ty - shoe[1]) * e + Math.sin(p * Math.PI) * 0.22,
            shoe[2] + (tz - shoe[2]) * e,
        );
        g.rotation.y = rotRef.current * e;
    });

    return (
        <group ref={ref}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[CARD_W, CARD_T, CARD_D]} />
                <meshStandardMaterial attach="material-0" color={edge} metalness={premium ? 0.6 : 0} roughness={premium ? 0.35 : 0.8} />
                <meshStandardMaterial attach="material-1" color={edge} metalness={premium ? 0.6 : 0} roughness={premium ? 0.35 : 0.8} />
                <meshStandardMaterial attach="material-2" map={topTex} roughness={0.6} />
                <meshStandardMaterial attach="material-3" map={backTex} roughness={0.6} />
                <meshStandardMaterial attach="material-4" color={edge} metalness={premium ? 0.6 : 0} roughness={premium ? 0.35 : 0.8} />
                <meshStandardMaterial attach="material-5" color={edge} metalness={premium ? 0.6 : 0} roughness={premium ? 0.35 : 0.8} />
            </mesh>
        </group>
    );
}
