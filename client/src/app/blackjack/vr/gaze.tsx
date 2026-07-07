'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { vrButtonTexture } from './vrButtonTexture';

const DWELL = 1.4; // secondes de visée avant validation
const HOVER_COS = Math.cos(0.14); // demi-angle ~8° de tolérance de visée

type GazeButton = {
    id: string;
    pos: THREE.Vector3;
    onSelect: () => void;
    setHover: (progress: number) => void;
};

type GazeCtx = { register: (b: GazeButton) => void; unregister: (id: string) => void };
const Ctx = createContext<GazeCtx | null>(null);

/** Contrôle au regard : un viseur central, une visée par angle, et un « dwell » qui valide. */
export function GazeProvider({ children }: { children: React.ReactNode }) {
    const { camera } = useThree();
    const buttons = useRef<Map<string, GazeButton>>(new Map());
    const hovered = useRef<string | null>(null);
    const fired = useRef<string | null>(null);
    const dwell = useRef(0);

    const reticle = useRef<THREE.Group>(null);
    const fill = useRef<THREE.Mesh>(null);
    const _dir = useMemo(() => new THREE.Vector3(), []);
    const _toB = useMemo(() => new THREE.Vector3(), []);

    const register = useCallback((b: GazeButton) => { buttons.current.set(b.id, b); }, []);
    const unregister = useCallback((id: string) => {
        buttons.current.delete(id);
        if (hovered.current === id) { hovered.current = null; dwell.current = 0; }
        if (fired.current === id) fired.current = null;
    }, []);

    useFrame((_, delta) => {
        // Viseur à 2.2 devant la caméra
        _dir.set(0, 0, -1).applyQuaternion(camera.quaternion);
        if (reticle.current) {
            reticle.current.position.copy(camera.position).addScaledVector(_dir, 2.2);
            reticle.current.quaternion.copy(camera.quaternion);
        }

        // Bouton le mieux visé (plus petit angle)
        let best: GazeButton | null = null;
        let bestDot = HOVER_COS;
        buttons.current.forEach((b) => {
            _toB.copy(b.pos).sub(camera.position).normalize();
            const d = _toB.dot(_dir);
            if (d > bestDot) { bestDot = d; best = b; }
        });
        const bestId: string | null = best ? (best as GazeButton).id : null;

        // Changement de cible → reset
        if (bestId !== hovered.current) {
            if (hovered.current) buttons.current.get(hovered.current)?.setHover(0);
            hovered.current = bestId;
            dwell.current = 0;
            if (bestId !== fired.current) fired.current = null; // ré-armement quand on regarde ailleurs
        }

        // Progression / validation
        let progress = 0;
        if (best && fired.current !== bestId) {
            dwell.current += delta;
            progress = Math.min(1, dwell.current / DWELL);
            (best as GazeButton).setHover(progress);
            if (progress >= 1) {
                fired.current = bestId;
                (best as GazeButton).setHover(0);
                (best as GazeButton).onSelect();
                progress = 0;
            }
        }
        if (fill.current) {
            fill.current.scale.setScalar(0.0001 + progress);
            (fill.current.material as THREE.MeshBasicMaterial).opacity = progress > 0 ? 0.95 : 0;
        }
    });

    return (
        <Ctx.Provider value={{ register, unregister }}>
            {children}
            <group ref={reticle}>
                <mesh renderOrder={999}>
                    <ringGeometry args={[0.012, 0.02, 24]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthTest={false} depthWrite={false} />
                </mesh>
                <mesh ref={fill} position={[0, 0, 0.001]} renderOrder={999}>
                    <ringGeometry args={[0.026, 0.038, 32]} />
                    <meshBasicMaterial color="#34D399" transparent opacity={0} depthTest={false} depthWrite={false} />
                </mesh>
            </group>
        </Ctx.Provider>
    );
}

/** Bouton d'action flottant, validé au regard. */
export function ActionButton3D({ id, position, label, color, onSelect }: {
    id: string; position: [number, number, number]; label: string; color: string; onSelect: () => void;
}) {
    const ctx = useContext(Ctx);
    const group = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const cb = useRef(onSelect);
    cb.current = onSelect;

    const posV = useMemo(() => new THREE.Vector3(position[0], position[1], position[2]), [position]);
    const tex = useMemo(() => vrButtonTexture(label, color), [label, color]);

    useEffect(() => {
        if (!ctx) return;
        ctx.register({
            id,
            pos: posV,
            onSelect: () => cb.current(),
            setHover: (h) => {
                if (mat.current) mat.current.emissiveIntensity = 0.3 + h * 1.4;
                if (group.current) group.current.scale.setScalar(1 + h * 0.12);
            },
        });
        return () => ctx.unregister(id);
    }, [ctx, id, posV]);

    return (
        <group ref={group} position={position}>
            <mesh>
                <planeGeometry args={[0.58, 0.22]} />
                <meshStandardMaterial ref={mat} map={tex} emissive={color} emissiveIntensity={0.3} transparent side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}
