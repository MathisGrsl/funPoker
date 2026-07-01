'use client';

import { ContactShadows } from '@react-three/drei';
import { SEATS } from './positions';
import { feltTextTexture } from './feltText';

/** Table ovale : rail bois, feutre vert, cases de mise, ombres de contact. */
export default function Table3D() {
    return (
        <group>
            {/* Rail (bois foncé) */}
            <mesh position={[0, -0.16, 0]} scale={[1.28, 1, 1]} receiveShadow>
                <cylinderGeometry args={[4.6, 4.6, 0.42, 72]} />
                <meshStandardMaterial color="#2a1c0d" roughness={0.8} />
            </mesh>

            {/* Feutre */}
            <mesh position={[0, 0.0, 0]} scale={[1.24, 1, 1]} receiveShadow>
                <cylinderGeometry args={[4.3, 4.3, 0.16, 72]} />
                <meshStandardMaterial color="#0c5a34" roughness={0.95} />
            </mesh>

            {/* Arc doré décoratif (anneau) — élargi */}
            <mesh position={[0, 0.09, -0.4]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.24, 1, 1]}>
                <ringGeometry args={[3.5, 3.57, 96, 1, Math.PI * 0.06, Math.PI * 0.88]} />
                <meshStandardMaterial color="#D4AF37" roughness={0.5} />
            </mesh>

            {/* Texte du tapis sous l'arc, face aux joueurs */}
            <mesh position={[0, 0.095, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[6.6, 3.3]} />
                <meshBasicMaterial map={feltTextTexture()} transparent depthWrite={false} />
            </mesh>

            {/* Cases de mise */}
            {SEATS.map((s, i) => (
                <mesh key={i} position={[s.spot[0], 0.085, s.spot[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.34, 0.4, 48]} />
                    <meshStandardMaterial color="#D4AF37" roughness={0.5} transparent opacity={0.75} />
                </mesh>
            ))}

            <ContactShadows position={[0, 0.09, 0]} scale={14} blur={2.4} opacity={0.5} far={4} />
        </group>
    );
}
