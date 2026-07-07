'use client';

import { ContactShadows } from '@react-three/drei';
import { FELT_RADIUS, RAIL_RADIUS } from './positions';
import { ultFeltTextTexture } from './ultFeltText';

/** Table ovale : rail bois, feutre vert, arc doré, texte réglementaire, ombres de contact. */
export default function UltTable3D() {
    const railScaleX = RAIL_RADIUS.x / RAIL_RADIUS.z;
    const feltScaleX = FELT_RADIUS.x / FELT_RADIUS.z;

    return (
        <group>
            {/* Rail (bois foncé) */}
            <mesh position={[0, -0.16, 0]} scale={[railScaleX, 1, 1]} receiveShadow>
                <cylinderGeometry args={[RAIL_RADIUS.z, RAIL_RADIUS.z, 0.42, 96]} />
                <meshStandardMaterial color="#2a1c0d" roughness={0.8} />
            </mesh>

            {/* Feutre */}
            <mesh position={[0, 0, 0]} scale={[feltScaleX, 1, 1]} receiveShadow>
                <cylinderGeometry args={[FELT_RADIUS.z, FELT_RADIUS.z, 0.16, 96]} />
                <meshStandardMaterial color="#0c5a34" roughness={0.95} />
            </mesh>

            {/* Arc doré décoratif côté joueurs */}
            <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[feltScaleX, 1, 1]}>
                <ringGeometry args={[FELT_RADIUS.z * 0.82, FELT_RADIUS.z * 0.86, 96, 1, Math.PI * 0.08, Math.PI * 0.84]} />
                <meshStandardMaterial color="#D4AF37" roughness={0.5} />
            </mesh>

            {/* Texte du tapis, face aux joueurs */}
            <mesh position={[0, 0.095, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[7.4, 3.7]} />
                <meshBasicMaterial map={ultFeltTextTexture()} transparent depthWrite={false} />
            </mesh>

            <ContactShadows position={[0, 0.09, 0]} scale={16} blur={2.4} opacity={0.5} far={4} />
        </group>
    );
}
