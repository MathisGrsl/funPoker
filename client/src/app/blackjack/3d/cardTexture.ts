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
const GOLD = '#E7C24A';

function finalize(canvas: HTMLCanvasElement, key: string): THREE.Texture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    cache.set(key, tex);
    return tex;
}

export function cardFaceTexture(rank: Rank, suit: Suit, premium = false): THREE.Texture {
    const key = `f_${premium ? 'p_' : ''}${rank}_${suit}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const court = rank === 'J' || rank === 'Q' || rank === 'K';

    // Fond
    if (premium) {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#FCF9EF');
        g.addColorStop(1, '#EFE2BE');
        ctx.fillStyle = g;
    } else {
        ctx.fillStyle = '#FBFBF7';
    }
    roundRect(ctx, 2, 2, W - 4, H - 4, 24);
    ctx.fill();

    if (premium) {
        // Liseré doré + fin trait sombre
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 9;
        roundRect(ctx, 12, 12, W - 24, H - 24, 18);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 2;
        roundRect(ctx, 18, 18, W - 36, H - 36, 15);
        ctx.stroke();
        // Halo doré derrière le centre pour As & figures
        if (court || rank === 'A') {
            const rg = ctx.createRadialGradient(W / 2, H * 0.5, 8, W / 2, H * 0.5, 130);
            rg.addColorStop(0, 'rgba(231,194,74,0.38)');
            rg.addColorStop(1, 'rgba(231,194,74,0)');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, W, H);
        }
    }

    const color = suitColor(suit);
    const glyph = SUIT_GLYPH[suit];
    const cx = premium ? 36 : 30;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Coin haut-gauche
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillText(rank, cx, 44);
    ctx.font = '34px Arial, sans-serif';
    ctx.fillText(glyph, cx, 84);

    // Coin bas-droite (inversé)
    ctx.save();
    ctx.translate(W - cx, H - 44);
    ctx.rotate(Math.PI);
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillText(rank, 0, 0);
    ctx.font = '34px Arial, sans-serif';
    ctx.fillText(glyph, 0, 40);
    ctx.restore();

    // Centre : figures premium reçoivent une couronne dorée
    if (premium && court) {
        ctx.fillStyle = GOLD;
        ctx.font = '52px Arial, sans-serif';
        ctx.fillText('♛', W / 2, H * 0.29);
        ctx.fillStyle = color;
        ctx.font = 'bold 116px Arial, sans-serif';
        ctx.fillText(rank, W / 2, H * 0.53);
        ctx.font = '78px Arial, sans-serif';
        ctx.fillText(glyph, W / 2, H * 0.76);
    } else {
        ctx.font = 'bold 120px Arial, sans-serif';
        ctx.fillText(rank, W / 2, H * 0.42);
        ctx.font = '96px Arial, sans-serif';
        ctx.fillText(glyph, W / 2, H * 0.68);
    }

    return finalize(canvas, key);
}

export function cardBackTexture(premium = false): THREE.Texture {
    const key = premium ? 'back_p' : 'back';
    const cached = cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    if (premium) {
        const g = ctx.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, 280);
        g.addColorStop(0, '#2a2436');
        g.addColorStop(1, '#12101a');
        ctx.fillStyle = g;
        roundRect(ctx, 2, 2, W - 4, H - 4, 24);
        ctx.fill();

        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 8;
        roundRect(ctx, 14, 14, W - 28, H - 28, 16);
        ctx.stroke();

        // Rosace dorée
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.strokeStyle = 'rgba(231,194,74,0.55)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            ctx.rotate((Math.PI * 2) / 12);
            ctx.beginPath();
            ctx.ellipse(0, 46, 16, 46, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 62, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = GOLD;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '80px Arial, sans-serif';
        ctx.fillText('♠', W / 2, H / 2);
        return finalize(canvas, key);
    }

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

    return finalize(canvas, key);
}
