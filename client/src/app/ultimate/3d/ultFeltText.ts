import * as THREE from 'three';

let cached: THREE.Texture | null = null;

/** Écrit un texte le long d'un arc (chaque lettre orientée sur la tangente). */
function arcText(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, radius: number, spread: number, font: string, color: string) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const n = text.length;
    const per = spread / n;
    const start = -Math.PI / 2 - spread / 2;
    for (let i = 0; i < n; i++) {
        const a = start + per * (i + 0.5);
        ctx.save();
        ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
    }
    ctx.restore();
}

/** Texte du tapis (transparent) : titre du jeu + rappel de règle, face aux joueurs. */
export function ultFeltTextTexture(): THREE.Texture {
    if (cached) return cached;
    const W = 1024;
    const H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    arcText(ctx, "ULTIMATE TEXAS HOLD'EM", W / 2, H * 1.75, H * 1.45, 1.05, 'bold 52px Arial, sans-serif', '#E8D9A8');
    arcText(ctx, 'BLIND PAYS ON STRAIGHT OR BETTER', W / 2, H * 1.75, H * 1.28, 0.95, 'bold 30px Arial, sans-serif', '#C9A24B');

    ctx.font = 'italic 28px Arial, sans-serif';
    ctx.fillStyle = '#D3E6DB';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Dealer qualifies with a pair or better', W / 2, H * 0.7);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    cached = tex;
    return tex;
}
