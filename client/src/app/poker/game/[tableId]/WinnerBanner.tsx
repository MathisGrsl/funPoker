'use client';

import type { GameState } from './types';

type Props = {
    state: GameState;
};

export default function WinnerBanner({ state }: Props) {
    if (state.phase !== 'between-rounds' || !state.winners || state.winners.length === 0) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-[#D4AF37]/50 rounded-2xl px-6 py-4 flex flex-col items-center gap-2 shadow-[0_0_40px_rgba(212,175,55,0.3)] animate-fade-in">
                <span className="text-[#D4AF37] text-lg font-black tracking-wide uppercase">
                    {state.winners.length > 1 ? 'Split Pot' : 'Winner!'}
                </span>
                {state.winners.map(w => {
                    const player = state.players.find(p => p.userId === w.userId);
                    return (
                        <div key={w.userId} className="flex flex-col items-center gap-0.5">
                            <span className="text-white font-bold text-base">{player?.username ?? 'Player'}</span>
                            <span className="text-[#D4AF37] font-semibold text-sm">+€{w.amount.toFixed(2)}</span>
                            {w.handName && (
                                <span className="text-[#A0A0C0] text-xs">{w.handName}</span>
                            )}
                        </div>
                    );
                })}
                <span className="text-[#3A3A5A] text-[10px] mt-1">Next hand in a moment…</span>
            </div>
        </div>
    );
}
