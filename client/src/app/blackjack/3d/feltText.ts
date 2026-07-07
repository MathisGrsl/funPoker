import * as THREE from 'three';

let cached: THREE.Texture | null = null;

/** Écrit un texte le long d'un arc (chaque lettre orientée sur la tangente). */
export function arcText(
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    radius: number,
    spread: number,
    font: string,
    color: string,
) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const n = text.length;
    const per = spread / n;
    const start = -Math.PI / 2 - spread / 2; // milieu du texte en haut du cercle
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

/** Texte du tapis (transparent) : « Blackjack pays 3 to 2 », assurance, règle du croupier. */
export function feltTextTexture(): THREE.Texture {
    if (cached) return cached;
    const W = 1024;
    const H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Arcs concentriques (même centre), rapprochés : blanche au-dessus, jaune juste en dessous.
    arcText(ctx, 'BLACKJACK PAYS 3 TO 2', W / 2, H * 1.8, H * 1.5, 1.0, 'bold 52px Arial, sans-serif', '#F4F7FF');
    arcText(ctx, 'INSURANCE      PAYS 2 TO 1', W / 2, H * 1.8, H * 1.34, 0.92, 'bold 36px Arial, sans-serif', '#E7BE52');

    // Règle du croupier, droite.
    ctx.font = 'italic 30px Arial, sans-serif';
    ctx.fillStyle = '#D3E6DB';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Dealer must stand on all 17', W / 2, H * 0.66);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    cached = tex;
    return tex;
}
