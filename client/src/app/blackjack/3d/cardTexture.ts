import * as THREE from 'three';
import type { Rank, Suit } from '../types';
import { SUIT_GLYPH, suitColor } from '../cardVisuals';

// Textures de cartes dessinées sur canvas (pas d'assets externes), mises en cache.
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

const W = 256;
const H = 358;

export function cardFaceTexture(rank: Rank, suit: Suit): THREE.Texture {
    const key = `f_${rank}_${suit}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FBFBF7';
    roundRect(ctx, 2, 2, W - 4, H - 4, 24);
    ctx.fill();

    const color = suitColor(suit);
    const glyph = SUIT_GLYPH[suit];
    ctx.fillStyle = color;

    // Coin haut-gauche
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillText(rank, 30, 40);
    ctx.font = '34px Arial, sans-serif';
    ctx.fillText(glyph, 30, 80);

    // Coin bas-droite (inversé)
    ctx.save();
    ctx.translate(W - 30, H - 40);
    ctx.rotate(Math.PI);
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillText(rank, 0, 0);
    ctx.font = '34px Arial, sans-serif';
    ctx.fillText(glyph, 0, 40);
    ctx.restore();

    // Centre : gros rang + enseigne (lisible en 3D)
    ctx.font = 'bold 120px Arial, sans-serif';
    ctx.fillText(rank, W / 2, H * 0.42);
    ctx.font = '96px Arial, sans-serif';
    ctx.fillText(glyph, W / 2, H * 0.68);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    cache.set(key, tex);
    return tex;
}

export function cardBackTexture(): THREE.Texture {
    const key = 'back';
    const cached = cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#7C3AED');
    grad.addColorStop(1, '#4C1D95');
    ctx.fillStyle = grad;
    roundRect(ctx, 2, 2, W - 4, H - 4, 24);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 6;
    roundRect(ctx, 24, 24, W - 48, H - 48, 16);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '90px Arial, sans-serif';
    ctx.fillText('♠', W / 2, H / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    cache.set(key, tex);
    return tex;
}
