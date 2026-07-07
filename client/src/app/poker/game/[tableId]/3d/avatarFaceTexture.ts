import * as THREE from 'three';

let cached: THREE.Texture | null = null;

/** A simple friendly cartoon face (dot eyes + smile) on a transparent canvas — fallback when no avatar photo is available. */
export function friendlyFaceTexture(): THREE.Texture {
    if (cached) return cached;
    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.ellipse(S * 0.35, S * 0.42, S * 0.055, S * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(S * 0.65, S * 0.42, S * 0.055, S * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = S * 0.045;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(S * 0.5, S * 0.48, S * 0.22, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    cached = tex;
    return tex;
}

/** Small deterministic palette of soft, friendly colors — non-aggressive by design. */
export const AVATAR_PALETTE = ['#F4A896', '#A8D8B9', '#A8C8E8', '#E8C8A8', '#C8A8E8', '#E8E0A8', '#F0B8D0', '#B8E0E0', '#D8C8F0'];

export function avatarColorFor(seatIndex: number): string {
    return AVATAR_PALETTE[seatIndex % AVATAR_PALETTE.length];
}
