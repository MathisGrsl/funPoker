'use client';

/** Paliers de jetons (valeur + couleur) façon casino. */
export const CHIP_TIERS = [
    { v: 500, color: '#6D28D9' },
    { v: 100, color: '#18181B' },
    { v: 50, color: '#EA580C' },
    { v: 25, color: '#15803D' },
    { v: 10, color: '#2563EB' },
    { v: 5, color: '#DC2626' },
    { v: 1, color: '#E5E7EB' },
] as const;

export function chipColor(value: number): string {
    for (const t of CHIP_TIERS) if (value >= t.v) return t.color;
    return CHIP_TIERS[CHIP_TIERS.length - 1].color;
}

function textColor(bg: string): string {
    return bg === '#E5E7EB' ? '#1F2937' : '#FFFFFF';
}

/** Décompose un montant en jetons (du plus gros au plus petit), plafonné. */
export function decomposeChips(amount: number, max = 6): number[] {
    const out: number[] = [];
    let rest = amount;
    for (const t of CHIP_TIERS) {
        while (rest >= t.v && out.length < max) {
            out.push(t.v);
            rest -= t.v;
        }
    }
    return out;
}

/** Un jeton réaliste : base, reflets, créneaux de bord, valeur centrale. */
export function ChipDisc({ value, size = 40 }: { value: number; size?: number }) {
    const c = chipColor(value);
    const txt = textColor(c);
    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* base + reflet */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: c,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.55), inset 0 -2px 4px rgba(0,0,0,0.35)',
                }}
            />
            <div
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.4), transparent 55%)' }}
            />
            {/* créneaux de bord (edge spots) */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'repeating-conic-gradient(#FFFFFF 0deg 13deg, transparent 13deg 45deg)',
                    WebkitMaskImage: 'radial-gradient(circle, transparent 58%, #000 60%)',
                    maskImage: 'radial-gradient(circle, transparent 58%, #000 60%)',
                    opacity: 0.85,
                }}
            />
            {/* disque intérieur + valeur */}
            <div
                className="absolute rounded-full flex items-center justify-center"
                style={{ inset: '21%', background: c, border: '1px dashed rgba(255,255,255,0.55)' }}
            >
                <span style={{ color: txt, fontWeight: 800, fontSize: size * 0.3, lineHeight: 1 }}>{value}</span>
            </div>
        </div>
    );
}

export default ChipDisc;
