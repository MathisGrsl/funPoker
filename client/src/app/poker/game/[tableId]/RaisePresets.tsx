'use client';

import type { GameState, GamePlayerState } from './types';

type Props = {
    state: GameState;
    me: GamePlayerState;
    onRaise: (target: number) => void;
    onAllIn: () => void;
};

function r2(n: number) {
    return Math.round(n * 100) / 100;
}

function fmt(n: number) {
    return `€${n.toFixed(2)}`;
}

export default function RaisePresets({ state, me, onRaise, onAllIn }: Props) {
    const callAmount = r2(Math.min(state.currentBet - me.bet, me.chips));
    const minRaise = r2(state.currentBet * 2);
    const maxRaise = r2(me.bet + me.chips); // all-in target

    const canRaise = maxRaise > state.currentBet;
    if (!canRaise) return null;

    // Preset targets (absolute total commitment this street)
    const twoBB = r2(Math.min(Math.max(minRaise, r2(2 * state.bb)), maxRaise));
    const threeBB = r2(Math.min(Math.max(minRaise, r2(3 * state.bb)), maxRaise));
    // Pot-sized raise: raise TO (2×currentBet + pot - myBet) = pot after call + currentBet
    const potTarget = r2(Math.min(Math.max(minRaise, r2(2 * state.currentBet + state.pot - me.bet)), maxRaise));

    // Only show a preset if it differs from the others enough to be useful
    const presets: { label: string; target: number; sub: string }[] = [];

    if (twoBB < maxRaise) presets.push({ label: '2BB', target: twoBB, sub: fmt(twoBB) });
    if (threeBB < maxRaise && threeBB !== twoBB) presets.push({ label: '3BB', target: threeBB, sub: fmt(threeBB) });
    if (potTarget < maxRaise && potTarget !== threeBB && potTarget !== twoBB) presets.push({ label: 'Pot', target: potTarget, sub: fmt(potTarget) });

    return (
        <div className="flex gap-2 w-full">
            {presets.map(({ label, target, sub }) => (
                <button
                    key={label}
                    onClick={() => onRaise(target)}
                    className="flex-1 flex flex-col items-center py-1.5 rounded-lg bg-[#111127] hover:bg-[#1a1a38] border border-[#1E1E3A] hover:border-[#7C3AED]/50 text-[#A78BFA] hover:text-white transition-all cursor-pointer"
                >
                    <span className="text-xs font-bold">{label}</span>
                    <span className="text-[10px] text-[#6B6B8A]">{sub}</span>
                </button>
            ))}

            {/* All-In always shown at the end */}
            <button
                onClick={onAllIn}
                className="flex-1 flex flex-col items-center py-1.5 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37] hover:text-white transition-all cursor-pointer"
            >
                <span className="text-xs font-bold">All-In</span>
                <span className="text-[10px] text-[#A07830]">{fmt(maxRaise)}</span>
            </button>
        </div>
    );
}
