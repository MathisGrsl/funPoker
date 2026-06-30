'use client';

type Props = {
    pot: number;
    phase: string;
};

const PHASE_LABEL: Record<string, string> = {
    preflop: 'PRE-FLOP',
    flop: 'FLOP',
    turn: 'TURN',
    river: 'RIVER',
    showdown: 'SHOWDOWN',
    'between-rounds': '',
};

export default function PotDisplay({ pot, phase }: Props) {
    return (
        <div className="flex flex-col items-center gap-1 select-none pointer-events-none">
            {pot > 0 && (
                <div className="flex items-center gap-1.5 bg-black/50 border border-[#D4AF37]/40 rounded-full px-3 py-1 shadow-[0_0_12px_rgba(212,175,55,0.15)]">
                    <span className="text-[#D4AF37] text-[10px]">●</span>
                    <span className="text-[#D4AF37] text-xs font-bold tracking-wide">€{pot.toFixed(2)}</span>
                </div>
            )}
            {phase && PHASE_LABEL[phase] && (
                <span className="text-[#2a8a4a] text-[9px] font-bold uppercase tracking-[0.25em]">
                    {PHASE_LABEL[phase]}
                </span>
            )}
        </div>
    );
}
