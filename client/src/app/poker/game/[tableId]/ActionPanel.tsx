'use client';

import { useState, useEffect } from 'react';
import type { GameState, GamePlayerState } from './types';

type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

type Props = {
    state: GameState;
    currentUserId: string;
    onAction: (action: ActionType, amount?: number) => void;
};

function r2(n: number) { return Math.round(n * 100) / 100; }

export default function ActionPanel({ state, currentUserId, onAction }: Props) {
    const isMyTurn = state.actingUserId === currentUserId && state.phase !== 'between-rounds';
    const me = state.players.find((p: GamePlayerState) => p.userId === currentUserId);

    const minRaise = r2(state.currentBet * 2);
    const maxRaise = r2((me?.bet ?? 0) + (me?.chips ?? 0));
    const step = state.bb;

    const [raiseTarget, setRaiseTarget] = useState(minRaise);

    // Reset when the acting player changes (new turn) or minRaise changes
    useEffect(() => {
        setRaiseTarget(r2(Math.min(Math.max(minRaise, minRaise), maxRaise)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.actingUserId, state.roundNumber]);

    if (!isMyTurn || !me || me.status !== 'active') return null;

    const canCheck = r2(me.bet) >= r2(state.currentBet);
    const callAmount = r2(Math.min(state.currentBet - me.bet, me.chips));
    const canRaise = maxRaise > r2(state.currentBet);

    // Preset targets (absolute total bet for this street)
    const twoBB = r2(Math.min(Math.max(minRaise, r2(2 * state.bb)), maxRaise));
    const threeBB = r2(Math.min(Math.max(minRaise, r2(3 * state.bb)), maxRaise));
    const potTarget = r2(Math.min(Math.max(minRaise, r2(2 * state.currentBet + state.pot - me.bet)), maxRaise));

    const clamped = r2(Math.min(Math.max(raiseTarget, minRaise), maxRaise));
    const isAllIn = clamped >= maxRaise;

    function adjustRaise(delta: number) {
        setRaiseTarget(r2(Math.min(Math.max(clamped + delta, minRaise), maxRaise)));
    }

    type Preset = { label: string; value: number };
    const presets: Preset[] = [];
    if (twoBB < maxRaise) presets.push({ label: '2BB', value: twoBB });
    if (threeBB < maxRaise && threeBB !== twoBB) presets.push({ label: '3BB', value: threeBB });
    if (potTarget < maxRaise && potTarget !== threeBB && potTarget !== twoBB) presets.push({ label: 'Pot', value: potTarget });
    presets.push({ label: 'All-In', value: maxRaise });

    return (
        <div className="w-full flex flex-col gap-2">
            {canRaise && (
                <>
                    {/* Presets — only set the target, don't fire action */}
                    <div className="flex gap-1.5">
                        {presets.map(({ label, value }) => {
                            const isAllin = value >= maxRaise;
                            const active = clamped === value;
                            return (
                                <button
                                    key={label}
                                    onClick={() => setRaiseTarget(value)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                        isAllin
                                            ? active
                                                ? 'bg-[#D4AF37]/35 border-[#D4AF37]/80 text-white'
                                                : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] hover:border-[#D4AF37]/60'
                                            : active
                                                ? 'bg-[#7C3AED]/35 border-[#7C3AED]/80 text-white'
                                                : 'bg-[#111127] border-[#1E1E3A] text-[#A78BFA] hover:border-[#7C3AED]/50 hover:text-white'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Amount adjuster with + / − */}
                    <div className="flex items-center gap-2 bg-[#0D0D1F] border border-[#1E1E3A] rounded-xl px-3 py-2">
                        <button
                            onClick={() => adjustRaise(-step)}
                            disabled={clamped <= minRaise}
                            className="w-9 h-9 rounded-lg bg-[#1A1A30] hover:bg-[#2A2A50] text-white font-bold text-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed select-none"
                        >
                            −
                        </button>

                        <div className="flex-1 text-center">
                            <p className={`font-black text-xl leading-none ${isAllIn ? 'text-[#D4AF37]' : 'text-white'}`}>
                                €{clamped.toFixed(2)}
                            </p>
                            <p className="text-[#3A3A5A] text-[9px] mt-0.5 uppercase tracking-wide">
                                {isAllIn ? 'all-in' : 'raise to'}
                            </p>
                        </div>

                        <button
                            onClick={() => adjustRaise(step)}
                            disabled={clamped >= maxRaise}
                            className="w-9 h-9 rounded-lg bg-[#1A1A30] hover:bg-[#2A2A50] text-white font-bold text-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed select-none"
                        >
                            +
                        </button>
                    </div>
                </>
            )}

            {/* Primary actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => onAction('fold')}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-800/50 border border-red-800/40 hover:border-red-600/60 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                >
                    Fold
                </button>

                {canCheck ? (
                    <button
                        onClick={() => onAction('check')}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#111127] hover:bg-[#1a1a38] border border-[#1E1E3A] hover:border-[#3A3A6A] text-[#A78BFA] hover:text-white transition-all cursor-pointer"
                    >
                        Check
                    </button>
                ) : (
                    <button
                        onClick={() => onAction('call')}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-900/30 hover:bg-blue-800/50 border border-blue-800/40 hover:border-blue-600/60 text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                    >
                        Call €{callAmount.toFixed(2)}
                    </button>
                )}

                {canRaise && (
                    isAllIn ? (
                        <button
                            onClick={() => onAction('all-in')}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 border border-[#D4AF37]/50 hover:border-[#D4AF37]/80 text-[#D4AF37] hover:text-white transition-all cursor-pointer"
                        >
                            All-In
                        </button>
                    ) : (
                        <button
                            onClick={() => onAction('raise', clamped)}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#7C3AED]/25 hover:bg-[#7C3AED]/50 border border-[#7C3AED]/50 hover:border-[#7C3AED]/90 text-[#A78BFA] hover:text-white transition-all cursor-pointer"
                        >
                            Bet €{clamped.toFixed(2)}
                        </button>
                    )
                )}
            </div>
        </div>
    );
}
