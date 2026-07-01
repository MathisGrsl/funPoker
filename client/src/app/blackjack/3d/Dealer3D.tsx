'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Dépose ton modèle ici : client/public/models/dealer.glb
const DEALER_URL = '/models/dealer.glb';

type Props = { position?: [number, number, number]; scale?: number; rotationY?: number };

/** Croupier : charge un modèle GLTF si présent, sinon un buste stylisé (repli). */
export default function Dealer3D({ position = [0, 0, -3.9], scale = 2.5, rotationY = 0 }: Props) {
    const [model, setModel] = useState<THREE.Object3D | null>(null);

    useEffect(() => {
        let alive = true;
        new GLTFLoader().load(
            DEALER_URL,
            (gltf) => {
                if (!alive) return;
                gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
                setModel(gltf.scene);
            },
            undefined,
            () => { /* fichier absent → on garde le repli */ },
        );
        return () => { alive = false; };
    }, []);

    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {model ? <primitive object={model} scale={scale} /> : <StylizedDealer />}
        </group>
    );
}

/** Repli : buste de croupier en primitives (tant qu'aucun GLTF n'est fourni). */
function StylizedDealer() {
    return (
        <group>
            {/* Tête */}
            <mesh position={[0, 2.05, 0]} castShadow>
                <sphereGeometry args={[0.32, 24, 24]} />
                <meshStandardMaterial color="#d8a679" roughness={0.85} />
            </mesh>
            {/* Cou */}
            <mesh position={[0, 1.72, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.13, 0.2, 16]} />
                <meshStandardMaterial color="#d8a679" />
            </mesh>
            {/* Buste (veste) */}
            <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.48, 0.66, 1.25, 28]} />
                <meshStandardMaterial color="#14141a" roughness={0.7} />
            </mesh>
            {/* Épaules */}
            <mesh position={[0, 1.62, 0]} castShadow>
                <boxGeometry args={[1.2, 0.26, 0.48]} />
                <meshStandardMaterial color="#14141a" roughness={0.7} />
            </mesh>
            {/* Chemise */}
            <mesh position={[0, 1.3, 0.34]} castShadow>
                <boxGeometry args={[0.28, 0.95, 0.2]} />
                <meshStandardMaterial color="#f4f4ee" />
            </mesh>
            {/* Nœud papillon */}
            <mesh position={[0, 1.65, 0.42]} castShadow>
                <boxGeometry args={[0.22, 0.1, 0.07]} />
                <meshStandardMaterial color="#7a1414" />
            </mesh>
        </group>
    );
}
