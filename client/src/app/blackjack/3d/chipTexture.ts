import * as THREE from 'three';
import { chipColor } from '../Chips';

// Textures de jetons dessinées sur canvas (dessus = valeur + créneaux, tranche = rayures).
const topCache = new Map<number, THREE.Texture>();
const sideCache = new Map<number, THREE.Texture>();

function textColor(bg: string): string {
    return bg === '#E5E7EB' ? '#1F2937' : '#FFFFFF';
}

/** Face supérieure : disque coloré, couronne de créneaux blancs, valeur au centre. */
export function chipTopTexture(value: number): THREE.Texture {
    const cached = topCache.get(value);
    if (cached) return cached;

    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = chipColor(value);

    // Disque de base
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.fill();

    // Couronne de créneaux blancs
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = S * 0.11;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(S / 2, S / 2, S * 0.42, a, a + Math.PI / 12);
        ctx.stroke();
    }

    // Disque intérieur
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.33, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Valeur
    ctx.fillStyle = textColor(c);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${S * 0.32}px Arial, sans-serif`;
    ctx.fillText(String(value), S / 2, S / 2 + 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    // Le capuchon du cylindre mappe la texture pivotée de 90° : on compense.
    tex.center.set(0.5, 0.5);
    tex.rotation = Math.PI / 2;
    topCache.set(value, tex);
    return tex;
}

/** Tranche : couleur du jeton + créneaux blancs répétés autour du cylindre. */
export function chipSideTexture(value: number): THREE.Texture {
    const cached = sideCache.get(value);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 8;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = chipColor(value);
    ctx.fillRect(0, 0, 32, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(22, 0, 10, 8); // créneau blanc
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(14, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    sideCache.set(value, tex);
    return tex;
}
