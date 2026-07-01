'use client';

/** Un vrai sabot de cartes : corps sombre incliné, pile de cartes visible, lèvre avant. */
export default function Shoe3D() {
    return (
        <group position={[3.55, 0, -2.55]} rotation={[0, -0.42, 0]}>
            {/* Base */}
            <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.72, 0.1, 0.98]} />
                <meshStandardMaterial color="#141414" roughness={0.55} metalness={0.15} />
            </mesh>

            {/* Paroi arrière haute et inclinée */}
            <mesh position={[0, 0.32, -0.44]} rotation={[-0.22, 0, 0]} castShadow>
                <boxGeometry args={[0.72, 0.58, 0.08]} />
                <meshStandardMaterial color="#1b1b1b" roughness={0.55} metalness={0.15} />
            </mesh>

            {/* Parois latérales */}
            <mesh position={[-0.34, 0.22, -0.05]} castShadow>
                <boxGeometry args={[0.05, 0.42, 0.9]} />
                <meshStandardMaterial color="#1b1b1b" roughness={0.55} metalness={0.15} />
            </mesh>
            <mesh position={[0.34, 0.22, -0.05]} castShadow>
                <boxGeometry args={[0.05, 0.42, 0.9]} />
                <meshStandardMaterial color="#1b1b1b" roughness={0.55} metalness={0.15} />
            </mesh>

            {/* Pile de cartes inclinée à l'intérieur */}
            <mesh position={[0, 0.34, -0.26]} rotation={[-0.22, 0, 0]} castShadow>
                <boxGeometry args={[0.6, 0.52, 0.14]} />
                <meshStandardMaterial color="#f4f4ee" roughness={0.75} />
            </mesh>

            {/* Lèvre avant (là où sortent les cartes) */}
            <mesh position={[0, 0.13, 0.5]} rotation={[0.32, 0, 0]} castShadow>
                <boxGeometry args={[0.72, 0.14, 0.14]} />
                <meshStandardMaterial color="#7a1414" roughness={0.45} metalness={0.2} />
            </mesh>
        </group>
    );
}
