import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/** Texture d'un bouton d'action VR : rectangle arrondi coloré + libellé blanc. */
export function vrButtonTexture(label: string, color: string): THREE.Texture {
    const key = `${label}_${color}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const W = 512;
    const H = 200;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Fond coloré
    ctx.fillStyle = color;
    roundRect(ctx, 8, 8, W - 16, H - 16, 34);
    ctx.fill();

    // Voile sombre pour la lisibilité + bordure claire
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    roundRect(ctx, 8, 8, W - 16, H - 16, 34);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 6;
    roundRect(ctx, 12, 12, W - 24, H - 24, 30);
    ctx.stroke();

    // Libellé
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = label.length > 8 ? 62 : 78;
    ctx.font = `bold ${size}px Arial, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillText(label, W / 2, H / 2 + 4);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    cache.set(key, tex);
    return tex;
}
