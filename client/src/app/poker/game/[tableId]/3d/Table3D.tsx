'use client';

import { ContactShadows } from '@react-three/drei';
import { FELT_RADIUS, RAIL_RADIUS, getSeatLayout } from './positions';
import { pokerFeltTextTexture } from './pokerFeltText';

/** Full oval table (rail + felt + gold trim) sized for up to 9 seats around the whole perimeter. */
export default function Table3D({ playerCount }: { playerCount: number }) {
    const seats = getSeatLayout(playerCount);
    const railScaleX = RAIL_RADIUS.x / RAIL_RADIUS.z;
    const feltScaleX = FELT_RADIUS.x / FELT_RADIUS.z;

    return (
        <group>
            {/* Rail (dark wood) */}
            <mesh position={[0, -0.16, 0]} scale={[railScaleX, 1, 1]} receiveShadow>
                <cylinderGeometry args={[RAIL_RADIUS.z, RAIL_RADIUS.z, 0.42, 96]} />
                <meshStandardMaterial color="#2a1c0d" roughness={0.8} />
            </mesh>

            {/* Felt */}
            <mesh position={[0, 0, 0]} scale={[feltScaleX, 1, 1]} receiveShadow>
                <cylinderGeometry args={[FELT_RADIUS.z, FELT_RADIUS.z, 0.16, 96]} />
                <meshStandardMaterial color="#0c4a5a" roughness={0.95} />
            </mesh>

            {/* Gold decorative ring, full perimeter */}
            <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[feltScaleX, 1, 1]}>
                <ringGeometry args={[FELT_RADIUS.z * 0.86, FELT_RADIUS.z * 0.9, 96]} />
                <meshStandardMaterial color="#D4AF37" roughness={0.5} />
            </mesh>

            {/* Felt branding, flat at the center */}
            <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[feltScaleX, 1, 1]}>
                <planeGeometry args={[3.2, 3.2]} />
                <meshBasicMaterial map={pokerFeltTextTexture()} transparent depthWrite={false} />
            </mesh>

            {/* Seat / betting markers */}
            {seats.map((s, i) => (
                <mesh key={i} position={[s.spot[0], 0.085, s.spot[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.34, 0.4, 48]} />
                    <meshStandardMaterial color="#D4AF37" roughness={0.5} transparent opacity={0.6} />
                </mesh>
            ))}

            <ContactShadows position={[0, 0.09, 0]} scale={16} blur={2.4} opacity={0.5} far={4} />
        </group>
    );
}
