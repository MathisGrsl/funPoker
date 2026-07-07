import * as THREE from 'three';
import { arcText } from '../../../../blackjack/3d/feltText';

let cached: THREE.Texture | null = null;

/** Felt branding (transparent): "TEXAS HOLD'EM" arced top and bottom, mirroring blackjack's feltText style. */
export function pokerFeltTextTexture(): THREE.Texture {
    if (cached) return cached;
    const W = 1024;
    const H = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    arcText(ctx, "TEXAS HOLD'EM", W / 2, H / 2, H * 0.42, 1.1, 'bold 46px Arial, sans-serif', '#F4F7FF');

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.PI);
    arcText(ctx, 'NO LIMIT', 0, 0, H * 0.42, 0.7, 'bold 34px Arial, sans-serif', '#E7BE52');
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    cached = tex;
    return tex;
}
