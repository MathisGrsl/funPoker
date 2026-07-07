'use client';

import ActionPanel from '../ActionPanel';
import type { GameState } from '../types';

type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

type Props = {
    state: GameState;
    currentUserId: string;
    onAction: (action: ActionType, amount?: number) => void;
    onBack2D: () => void;
    onResetView: () => void;
};

const PHASE_LABEL: Record<GameState['phase'], string> = {
    preflop: 'Preflop',
    flop: 'Flop',
    turn: 'Turn',
    river: 'River',
    showdown: 'Showdown',
    'between-rounds': 'Next hand…',
};

export default function Overlay({ state, currentUserId, onAction, onBack2D, onResetView }: Props) {
    const isMyTurn = state.actingUserId === currentUserId && state.phase !== 'between-rounds';
    const waitingFor = !isMyTurn && state.phase !== 'between-rounds' && state.actingUserId
        ? state.players.find((p) => p.userId === state.actingUserId)?.username ?? 'opponent'
        : null;
    const me = state.players.find((p) => p.userId === currentUserId);

    return (
        <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
            {/* Top bar */}
            <div className="flex items-center justify-between p-4">
                <button
                    onClick={onBack2D}
                    className="pointer-events-auto rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white cursor-pointer"
                >
                    ← 2D
                </button>
                <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 text-xs text-white/70">
                    <span className="font-bold text-[#A78BFA]">Texas Hold&apos;em</span>
                    <span>·</span>
                    <span>€{state.sb}/{state.bb}</span>
                    <span>·</span>
                    <span>Hand #{state.roundNumber}</span>
                </div>
                <button
                    onClick={onResetView}
                    className="pointer-events-auto rounded-lg border border-[#7C3AED]/50 bg-[#7C3AED]/15 px-3 py-1.5 text-sm font-semibold text-[#C4B5FD] transition-colors hover:bg-[#7C3AED]/25 cursor-pointer"
                >
                    🎥 Reset view
                </button>
            </div>

            {/* Bottom bar */}
            <div className="px-3 pb-4 pt-1 flex flex-col items-center gap-2">
                {isMyTurn && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                        <p className="text-[#D4AF37] text-xs font-semibold">Your turn</p>
                    </div>
                )}
                {waitingFor && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-pulse" />
                        <p className="text-white/60 text-xs">Waiting for {waitingFor}…</p>
                    </div>
                )}
                <div className="pointer-events-auto flex items-end gap-3 w-full max-w-2xl">
                    {me && (
                        <div className="flex flex-col gap-1 shrink-0 rounded-xl border border-white/10 bg-black/55 px-3 py-2">
                            <div>
                                <p className="text-[9px] uppercase tracking-wide text-white/40">You</p>
                                <p className="text-sm font-bold text-[#D4AF37] whitespace-nowrap max-w-[110px] truncate">{me.username}</p>
                                <p className="text-xs text-white/70">€{me.chips.toFixed(2)}</p>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div>
                                <p className="text-[9px] uppercase tracking-wide text-white/40">{PHASE_LABEL[state.phase]}</p>
                                <p className="text-sm font-bold text-[#D4AF37]">Pot €{state.pot.toFixed(2)}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex-1">
                        <ActionPanel state={state} currentUserId={currentUserId} onAction={onAction} />
                    </div>
                </div>
            </div>
        </div>
    );
}
