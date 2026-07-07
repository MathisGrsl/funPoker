'use client';

import type { GameState } from './types';

type Props = {
    state: GameState;
};

export default function WinnerBanner({ state }: Props) {
    if (state.phase !== 'between-rounds' || !state.winners || state.winners.length === 0) return null;

    return (
        <div className="absolute top-[3%] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-[#D4AF37]/50 rounded-xl px-4 py-2 flex items-center gap-3 shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-fade-in">
                <span className="text-[#D4AF37] text-xs font-black tracking-wide uppercase whitespace-nowrap">
                    {state.winners.length > 1 ? 'Split Pot' : 'Winner!'}
                </span>
                {state.winners.map(w => {
                    const player = state.players.find(p => p.userId === w.userId);
                    return (
                        <div key={w.userId} className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-white font-bold text-sm">{player?.username ?? 'Player'}</span>
                            <span className="text-[#D4AF37] font-semibold text-sm">+€{w.amount.toFixed(2)}</span>
                            {w.handName && (
                                <span className="text-[#A0A0C0] text-xs">· {w.handName}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
