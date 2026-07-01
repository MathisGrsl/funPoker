'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Dépose ton modèle ici : client/public/models/dealer.glb
const DEALER_URL = '/models/dealer.glb';

// Pose de repos (rad) — bras baissés + avancés + avant-bras fléchis vers la table. Tout ajustable.
const ARM_DOWN = 1.0;    // descente des bras (axe monde Z)
const ARM_FWD = 0.5;     // avancée vers la table (axe monde X)
const FORE_BEND = 0.8;   // flexion des avant-bras vers la table (axe monde X)
const WORLD_Z = new THREE.Vector3(0, 0, 1);
const WORLD_X = new THREE.Vector3(1, 0, 0);

// Geste de distribution (2 temps) — ajustable.
const GESTURE_S = 1.05;
const SHOE_ARM = { x: -0.35, y: -0.4, z: 0.15 };
const SHOE_FORE = { x: 0.45, y: 0, z: 0 };
const PLACE_ARM = { x: 0.6, y: 0.1, z: 0 };
const PLACE_FORE = { x: 0.3, y: 0, z: 0 };

function pulse(p: number, a: number, b: number): number {
    if (p < a || p > b) return 0;
    return Math.sin(((p - a) / (b - a)) * Math.PI);
}

const _pq = new THREE.Quaternion();
/** Rotation d'un bone autour d'un axe MONDE, en tenant compte du parent pivoté (fiable en hiérarchie). */
function rotateBoneWorld(bone: THREE.Object3D | undefined, axis: THREE.Vector3, angle: number) {
    if (!bone?.parent) return;
    bone.parent.getWorldQuaternion(_pq);
    const localAxis = axis.clone().applyQuaternion(_pq.invert()).normalize();
    bone.rotateOnAxis(localAxis, angle);
}

type Props = {
    position?: [number, number, number];
    scale?: number;
    rotationY?: number;
    /** Nombre total de cartes en jeu : quand il augmente, le croupier fait un geste. */
    dealSignal?: number;
};

type Rig = {
    spine?: THREE.Object3D;
    head?: THREE.Object3D;
    rArm?: THREE.Object3D;
    rForeArm?: THREE.Object3D;
    base: Map<THREE.Object3D, THREE.Euler>;
};

export default function Dealer3D({ position = [0, -3.35, -4.0], scale = 3.6, rotationY = 0, dealSignal = 0 }: Props) {
    const [model, setModel] = useState<THREE.Object3D | null>(null);
    const rig = useRef<Rig>({ base: new Map() });
    const clock = useRef(0);
    const gestureAt = useRef(-10);
    const prevSignal = useRef(dealSignal);

    useEffect(() => {
        let alive = true;
        new GLTFLoader().load(
            DEALER_URL,
            (gltf) => {
                if (!alive) return;
                const bones: Record<string, THREE.Object3D> = {};
                gltf.scene.traverse((o) => {
                    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
                    bones[o.name] = o;
                });

                // Pose de repos.
                gltf.scene.updateMatrixWorld(true);
                rotateBoneWorld(bones.LeftArm, WORLD_Z, -ARM_DOWN);
                rotateBoneWorld(bones.RightArm, WORLD_Z, ARM_DOWN);
                rotateBoneWorld(bones.LeftArm, WORLD_X, -ARM_FWD);
                rotateBoneWorld(bones.RightArm, WORLD_X, -ARM_FWD);
                gltf.scene.updateMatrixWorld(true);
                rotateBoneWorld(bones.LeftForeArm, WORLD_X, -FORE_BEND);
                rotateBoneWorld(bones.RightForeArm, WORLD_X, -FORE_BEND);

                const r = rig.current;
                r.spine = bones.Spine;
                r.head = bones.Head;
                r.rArm = bones.RightArm;
                r.rForeArm = bones.RightForeArm;
                [r.spine, r.head, r.rArm, r.rForeArm].forEach((b) => { if (b) r.base.set(b, b.rotation.clone()); });
                setModel(gltf.scene);
            },
            undefined,
            () => { /* absent → repli */ },
        );
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (dealSignal > prevSignal.current) gestureAt.current = clock.current;
        prevSignal.current = dealSignal;
    }, [dealSignal]);

    useFrame((_, delta) => {
        clock.current += delta;
        const r = rig.current;
        if (!r.spine && !r.rArm) return;
        const t = clock.current;

        // Idle.
        if (r.spine) {
            const b = r.base.get(r.spine)!;
            r.spine.rotation.set(b.x + Math.sin(t * 1.4) * 0.015, b.y, b.z + Math.sin(t * 0.9) * 0.01);
        }
        if (r.head) {
            const b = r.base.get(r.head)!;
            r.head.rotation.set(b.x + Math.sin(t * 1.1) * 0.012, b.y + Math.sin(t * 0.55) * 0.03, b.z);
        }

        // Distribution : phase 1 vers le sabot, phase 2 dépose vers la table.
        const elapsed = t - gestureAt.current;
        const p = elapsed >= 0 && elapsed < GESTURE_S ? elapsed / GESTURE_S : 2;
        const shoe = pulse(p, 0, 0.5);
        const place = pulse(p, 0.35, 1);
        if (r.rArm) {
            const b = r.base.get(r.rArm)!;
            r.rArm.rotation.set(
                b.x + shoe * SHOE_ARM.x + place * PLACE_ARM.x,
                b.y + shoe * SHOE_ARM.y + place * PLACE_ARM.y,
                b.z + shoe * SHOE_ARM.z + place * PLACE_ARM.z,
            );
        }
        if (r.rForeArm) {
            const b = r.base.get(r.rForeArm)!;
            r.rForeArm.rotation.set(b.x + shoe * SHOE_FORE.x + place * PLACE_FORE.x, b.y, b.z);
        }
    });

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
            <mesh position={[0, 2.05, 0]} castShadow>
                <sphereGeometry args={[0.32, 24, 24]} />
                <meshStandardMaterial color="#d8a679" roughness={0.85} />
            </mesh>
            <mesh position={[0, 1.72, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.13, 0.2, 16]} />
                <meshStandardMaterial color="#d8a679" />
            </mesh>
            <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.48, 0.66, 1.25, 28]} />
                <meshStandardMaterial color="#14141a" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.62, 0]} castShadow>
                <boxGeometry args={[1.2, 0.26, 0.48]} />
                <meshStandardMaterial color="#14141a" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.3, 0.34]} castShadow>
                <boxGeometry args={[0.28, 0.95, 0.2]} />
                <meshStandardMaterial color="#f4f4ee" />
            </mesh>
            <mesh position={[0, 1.65, 0.42]} castShadow>
                <boxGeometry args={[0.22, 0.1, 0.07]} />
                <meshStandardMaterial color="#7a1414" />
            </mesh>
        </group>
    );
}
