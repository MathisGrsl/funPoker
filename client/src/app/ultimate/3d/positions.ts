// Repère : feutre à y ≈ SURFACE_Y, croupier + cartes communes au fond (-Z),
// 6 sièges joueurs en arc sur l'avant, caméra qui regarde vers le croupier.
export type Vec3 = [number, number, number];

export const SURFACE_Y = 0.11;

export const CAMERA_POS: Vec3 = [0, 5.4, 8.6];
export const CAMERA_FOV = 44;
export const CAMERA_TARGET: Vec3 = [0, 0, -0.7];

export const ORBIT_MIN_DISTANCE = 5;
export const ORBIT_MAX_DISTANCE = 12;
export const ORBIT_MIN_POLAR = Math.PI / 7;
export const ORBIT_MAX_POLAR = Math.PI / 2.15;

// Ellipse table (x = grand axe, z = petit axe).
export const FELT_RADIUS = { x: 5.2, z: 3.4 };
export const RAIL_RADIUS = { x: 5.7, z: 3.8 };

export const DEALER_POS: Vec3 = [0, SURFACE_Y, -3.4]; // avatar croupier
export const DEALER_HAND: Vec3 = [0, SURFACE_Y, -2.5]; // ses 2 cartes
export const COMMUNITY_BASE: Vec3 = [0, SURFACE_Y, -1.05]; // 5 cartes communes
export const COMMUNITY_SPACING = 0.84;

export const CARD_FAN_X = 0.4;

// Réglage des avatars JOUEURS uniquement (le croupier n'est pas concerné).
export const PLAYER_SCALE = 0.8; // taille des joueurs
export const PLAYER_Y = -0.75; // abaissement (on voit par-dessus)
export const PLAYER_OUT = 0.7; // recul vers l'extérieur (derrière le rail)

export type UltSeatLayout = { spot: Vec3; hand: Vec3; bet: Vec3; rotationY: number };

// Positions (x, z) des 6 sièges, de gauche à droite en arc sur l'avant.
const SPOTS: [number, number][] = [
    [-4.35, 0.7],
    [-3.15, 2.3],
    [-1.15, 3.1],
    [1.15, 3.1],
    [3.15, 2.3],
    [4.35, 0.7],
];

/** Angle Y pour que l'avatar (visage +Z) regarde le centre. */
function facing(x: number, z: number): number {
    return Math.atan2(x, z) + Math.PI;
}

export const SEATS: UltSeatLayout[] = SPOTS.map(([x, z]) => ({
    spot: [x, SURFACE_Y, z],
    hand: [x * 0.56, SURFACE_Y, z * 0.56 - 0.2],
    bet: [x * 0.76, SURFACE_Y, z * 0.76],
    rotationY: facing(x, z),
}));

/** Les 4 cases de mise autour du point `bet` (grille 2×2), couleurs de la 2D. */
export const BET_SPOTS = [
    { key: 'ante', label: 'ANTE', color: '#D4AF37', dx: -0.28, dz: -0.28 },
    { key: 'blind', label: 'BLIND', color: '#9CC2FF', dx: 0.28, dz: -0.28 },
    { key: 'trips', label: 'TRIPS', color: '#F472B6', dx: -0.28, dz: 0.28 },
    { key: 'play', label: 'PLAY', color: '#34D399', dx: 0.28, dz: 0.28 },
] as const;

export type BetKey = (typeof BET_SPOTS)[number]['key'];
