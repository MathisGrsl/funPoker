// Repère : le tapis (feutre) est à y = 0, la caméra regarde vers le croupier (-Z).
export type Vec3 = [number, number, number];

export const CAMERA_POS: Vec3 = [0, 5.3, 8.7];
export const CAMERA_FOV = 42;
export const CAMERA_LOOK: Vec3 = [0, -0.25, -1.0];

// La surface du feutre est à y ≈ 0.08 : tout ce qui est posé dessus doit être AU-DESSUS.
export const SURFACE_Y = 0.11;
export const SHOE_POS: Vec3 = [3.7, 0.8, -2.7];
export const DEALER_HAND: Vec3 = [0, SURFACE_Y, -1.9];

/** 3 sièges : `spot` = case de mise (jetons), `hand` = cartes du joueur. */
export const SEATS: { spot: Vec3; hand: Vec3 }[] = [
    { spot: [-2.3, SURFACE_Y, 2.0], hand: [-2.0, SURFACE_Y, 0.9] },
    { spot: [0, SURFACE_Y, 2.5], hand: [0, SURFACE_Y, 1.35] },
    { spot: [2.3, SURFACE_Y, 2.0], hand: [2.0, SURFACE_Y, 0.9] },
];

export const CARD_FAN_X = 0.42;
export const CARD_FAN_ROT = 0.12;
