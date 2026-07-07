'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { friendlyFaceTexture } from './avatarFaceTexture';

type Props = {
    color: string;
    status: 'active' | 'folded' | 'all-in';
    avatarUrl?: string | null;
};

/** A friendly, cartoonish seated character — generalized from blackjack's primitive `StylizedDealer` bust. */
export default function PlayerAvatar3D({ color, status, avatarUrl }: Props) {
    const group = useRef<THREE.Group>(null);
    const faceTex = friendlyFaceTexture();
    const [photoTex, setPhotoTex] = useState<THREE.Texture | null>(null);
    const clock = useRef(Math.random() * 10);

    useEffect(() => {
        if (!avatarUrl) { setPhotoTex(null); return; }
        let alive = true;
        const loader = new THREE.TextureLoader();
        loader.crossOrigin = 'anonymous';
        loader.load(
            avatarUrl,
            (tex) => { if (alive) { tex.colorSpace = THREE.SRGBColorSpace; setPhotoTex(tex); } },
            undefined,
            () => { if (alive) setPhotoTex(null); },
        );
        return () => { alive = false; };
    }, [avatarUrl]);

    const folded = status === 'folded';
    const allIn = status === 'all-in';

    useFrame((_, delta) => {
        clock.current += delta;
        const g = group.current;
        if (!g) return;
        const bob = folded ? 0 : Math.sin(clock.current * 1.6) * 0.02;
        g.position.y = bob;
        g.rotation.z = folded ? -0.28 : Math.sin(clock.current * 0.8) * 0.015;
        g.rotation.x = folded ? -0.18 : 0;
    });

    const opacity = folded ? 0.4 : 1;
    const emissive = allIn ? color : '#000000';
    const emissiveIntensity = allIn ? 0.55 : 0;

    return (
        <group ref={group}>
            {/* Torso */}
            <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.34, 0.46, 0.75, 24]} />
                <meshStandardMaterial color={color} roughness={0.75} transparent opacity={opacity} emissive={emissive} emissiveIntensity={emissiveIntensity} />
            </mesh>

            {/* Arms — simple resting cylinders */}
            <mesh position={[-0.42, 0.5, 0.18]} rotation={[0.3, 0, 0.5]} castShadow>
                <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
                <meshStandardMaterial color={color} roughness={0.75} transparent opacity={opacity} />
            </mesh>
            <mesh position={[0.42, 0.5, 0.18]} rotation={[0.3, 0, -0.5]} castShadow>
                <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
                <meshStandardMaterial color={color} roughness={0.75} transparent opacity={opacity} />
            </mesh>

            {/* Neck + head */}
            <mesh position={[0, 0.98, 0]} castShadow>
                <cylinderGeometry args={[0.11, 0.12, 0.14, 16]} />
                <meshStandardMaterial color="#f0c9a0" transparent opacity={opacity} />
            </mesh>
            <mesh position={[0, 1.26, 0]} castShadow>
                <sphereGeometry args={[0.27, 28, 28]} />
                <meshStandardMaterial color="#f0c9a0" roughness={0.8} transparent opacity={opacity} />
            </mesh>

            {/* Face plate — photo if available, else a friendly cartoon face */}
            <mesh position={[0, 1.28, 0.255]}>
                <planeGeometry args={[0.34, 0.34]} />
                <meshBasicMaterial map={photoTex ?? faceTex} transparent depthWrite={false} opacity={opacity} />
            </mesh>
        </group>
    );
}
