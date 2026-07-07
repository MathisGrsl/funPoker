export type Vec3 = [number, number, number];
export type SeatLayout = { spot: Vec3; hand: Vec3; rotationY: number };

export const SURFACE_Y = 0.11;
export const TABLE_CENTER: Vec3 = [0, 0, 0];

// Felt / rail ellipse radii (x = long side, z = short side).
export const FELT_RADIUS: { x: number; z: number } = { x: 4.6, z: 3.1 };
export const RAIL_RADIUS: { x: number; z: number } = { x: 5.0, z: 3.4 };

// Per-seat ellipses: avatars sit just outside the rail, hole cards land on the felt.
const SPOT_RADIUS = { x: 5.3, z: 3.7 };
const HAND_RADIUS = { x: 3.4, z: 2.1 };

export const POT_POS: Vec3 = [0, SURFACE_Y, 0.75];
export const COMMUNITY_BASE: Vec3 = [0, SURFACE_Y, -0.75];
export const COMMUNITY_SPACING = 0.78;

export const CARD_FAN_X = 0.42;
export const CARD_FAN_ROT = 0.12;

export const CAMERA_FOV = 45;
// Kept well clear of the seated avatar's own body (~1 unit envelope) so the default
// view looks over its shoulder instead of clipping through its head.
export const CAMERA_HEIGHT = 2.6;
export const CAMERA_BACK_OFFSET = 3.2;

export const ORBIT_MIN_DISTANCE = 4;
export const ORBIT_MAX_DISTANCE = 9.5;
export const ORBIT_MIN_POLAR = Math.PI / 6;
export const ORBIT_MAX_POLAR = Math.PI / 2.15;

/** Angle (rad) that makes an object at `spot` face `TABLE_CENTER`. */
function facingAngle(x: number, z: number): number {
    return Math.atan2(x, z);
}

/** Seat 0 is always the bottom (nearest-camera) seat, matching the 2D `SEAT_POSITIONS` convention. */
function buildLayout(n: number): SeatLayout[] {
    const seats: SeatLayout[] = [];
    for (let i = 0; i < n; i++) {
        const theta = Math.PI / 2 + (i * 2 * Math.PI) / n;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const spot: Vec3 = [SPOT_RADIUS.x * cos, SURFACE_Y, SPOT_RADIUS.z * sin];
        const hand: Vec3 = [HAND_RADIUS.x * cos, SURFACE_Y, HAND_RADIUS.z * sin];
        seats.push({ spot, hand, rotationY: facingAngle(spot[0], spot[2]) });
    }
    return seats;
}

export const SEAT_LAYOUTS: Record<number, SeatLayout[]> = {
    2: buildLayout(2),
    3: buildLayout(3),
    4: buildLayout(4),
    5: buildLayout(5),
    6: buildLayout(6),
    9: buildLayout(9),
};

export function getSeatLayout(playerCount: number): SeatLayout[] {
    return SEAT_LAYOUTS[playerCount] ?? SEAT_LAYOUTS[9];
}

/** Default "sitting at my seat" camera pose: behind + above my spot, looking at table center. */
export function myCameraPose(mySeat: SeatLayout): { position: Vec3; target: Vec3 } {
    const [sx, , sz] = mySeat.spot;
    const dist = Math.hypot(sx, sz) || 1;
    const outX = sx / dist;
    const outZ = sz / dist;
    return {
        position: [sx + outX * CAMERA_BACK_OFFSET, SURFACE_Y + CAMERA_HEIGHT, sz + outZ * CAMERA_BACK_OFFSET],
        target: TABLE_CENTER,
    };
}
