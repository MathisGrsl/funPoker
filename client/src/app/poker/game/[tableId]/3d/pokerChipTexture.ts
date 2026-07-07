import * as THREE from 'three';

// Purely decorative chip look (no printed value — poker amounts are fractional and shown via the HUD instead).
const TIER_COLORS = ['#E5E7EB', '#EF4444', '#3B82F6', '#22C55E', '#111827', '#D4AF37'];

const topCache = new Map<number, THREE.Texture>();
const sideCache = new Map<number, THREE.Texture>();

function colorForTier(tier: number): string {
    return TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)];
}

export function pokerChipTopTexture(tier: number): THREE.Texture {
    const cached = topCache.get(tier);
    if (cached) return cached;

    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = colorForTier(tier);

    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = S * 0.11;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(S / 2, S / 2, S * 0.42, a, a + Math.PI / 12);
        ctx.stroke();
    }

    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.33, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    topCache.set(tier, tex);
    return tex;
}

export function pokerChipSideTexture(tier: number): THREE.Texture {
    const cached = sideCache.get(tier);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 8;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = colorForTier(tier);
    ctx.fillRect(0, 0, 32, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(22, 0, 10, 8);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(14, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    sideCache.set(tier, tex);
    return tex;
}

/** Visual-only chip count for an amount relative to the big blind — not an exact denomination breakdown. */
export function chipCountFor(amount: number, bb: number): number {
    if (amount <= 0 || bb <= 0) return 0;
    return Math.min(10, Math.max(1, Math.round(Math.sqrt(amount / bb))));
}
