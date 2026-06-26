'use client';

import { ChipDisc, decomposeChips } from './Chips';

/** Pile de jetons posée sur une case, représentant un montant. */
export default function ChipStack({ amount, size = 38 }: { amount: number; size?: number }) {
    if (amount <= 0) return null;

    const chips = decomposeChips(amount);
    const step = size * 0.16; // chevauchement vertical

    return (
        <div className="relative flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size + step * (chips.length - 1) }}>
                {chips.map((v, i) => (
                    <div key={i} className="absolute left-0" style={{ bottom: i * step }}>
                        <ChipDisc value={v} size={size} />
                    </div>
                ))}
            </div>
            <span className="mt-0.5 rounded-full bg-black/70 px-1.5 text-[10px] font-bold leading-tight text-[#D4AF37]">
                {amount.toLocaleString()}
            </span>
        </div>
    );
}
