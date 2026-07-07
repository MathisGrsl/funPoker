'use client';

import { ChipDisc } from '@/app/blackjack/Chips';
import { useCountdown } from '@/app/blackjack/useCountdown';
import { CHIP_VALUES } from '../config';
import { Phase, SnapshotSeat, TableSnapshot, UltAction } from '../types';

type Game = {
    state: TableSnapshot | null;
    balance: number;
    error: string | null;
    sit: (i: number) => void;
    ante: (i: number, amount: number) => void;
    trips: (i: number, amount: number) => void;
    act: (i: number, action: UltAction) => void;
    rebet: () => void;
    dealNow: () => void;
    topup: () => void;
};

export default function UltOverlay({ game, myId, selectedChip, setSelectedChip, onBack2D, onResetView }: {
    game: Game; myId: string; selectedChip: number; setSelectedChip: (v: number) => void; onBack2D: () => void; onResetView: () => void;
}) {
    const state = game.state!;
    const seconds = useCountdown(state.deadline);

    const mySeats = state.seats.filter((s) => s.playerId === myId);
    const activeSeat = state.activeSeat != null ? state.seats[state.activeSeat] : null;
    const myTurn = activeSeat?.playerId === myId && (state.phase === 'preflop' || state.phase === 'flop' || state.phase === 'river');

    const hasMyBet = mySeats.some((s) => s.ante > 0);
    const hasLastBet = mySeats.some((s) => s.lastAnte > 0);
    const committed = mySeats.some((s) => s.ante > 0 || s.hole.length > 0);
    const broke = game.balance < state.minAnte * 2 && !committed;

    const clearBets = () => mySeats.forEach((s) => { if (s.ante > 0) game.ante(s.index, 0); if (s.trips > 0) game.trips(s.index, 0); });

    return (
        <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
            {/* Barre du haut */}
            <div className="flex items-center justify-between p-4">
                <button onClick={onBack2D} className="pointer-events-auto rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white/80 hover:border-white/40 hover:text-white">
                    ← 2D
                </button>
                <PhaseBanner phase={state.phase} seconds={seconds} />
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-black/40 px-3 py-1.5 text-right">
                        <p className="text-[10px] uppercase tracking-wide text-white/40">Solde</p>
                        <p className="text-sm font-bold text-[#D4AF37]">{game.balance.toLocaleString()} 🪙</p>
                    </div>
                    <button onClick={onResetView} className="pointer-events-auto rounded-lg border border-[#D4AF37]/40 bg-black/40 px-3 py-1.5 text-sm font-semibold text-[#E7C24A] hover:border-[#D4AF37]">
                        🎥 Vue
                    </button>
                </div>
            </div>

            {/* Bas */}
            <div className="flex flex-col items-center gap-1.5 px-4 pb-2">
                {myTurn && activeSeat && (
                    <Actions phase={state.phase} ante={activeSeat.ante} balance={game.balance} onAct={(a) => game.act(activeSeat.index, a)} />
                )}

                {state.phase === 'betting' && (hasLastBet || hasMyBet) && (
                    <div className="pointer-events-auto flex gap-2">
                        {hasLastBet && <Btn label="↺ Rebet" color="#3A3A5C" onClick={game.rebet} />}
                        {hasMyBet && <Btn label="✕ Retirer" color="#B91C1C" onClick={clearBets} />}
                        {hasMyBet && <Btn label="▶ Distribuer" color="#15803D" onClick={game.dealNow} />}
                    </div>
                )}

                {state.phase === 'betting' && (
                    <p className="rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70">
                        Clique la case <span className="font-bold text-[#D4AF37]">ANTE</span> (ou <span className="font-bold text-[#F472B6]">TRIPS</span>) d'un siège pour miser
                    </p>
                )}

                <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-black/45 px-4 py-2 ring-1 ring-white/10">
                    {CHIP_VALUES.map((v) => (
                        <button key={v} onClick={() => setSelectedChip(v)} className={`transition-transform ${selectedChip === v ? '-translate-y-1.5 scale-110 drop-shadow-[0_4px_8px_rgba(212,175,55,0.5)]' : 'opacity-85 hover:opacity-100'}`}>
                            <ChipDisc value={v} size={40} />
                        </button>
                    ))}
                </div>
            </div>

            {broke && (
                <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-[340px] rounded-2xl border border-white/10 bg-[#0E0E20] p-7 text-center shadow-2xl">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#B91C1C]/20 text-3xl">💸</div>
                        <h3 className="text-xl font-bold text-white">Plus de jetons</h3>
                        <p className="mt-1.5 text-sm text-white/60">Refais le plein ou retourne au lobby.</p>
                        <div className="mt-5 flex flex-col gap-2">
                            <button onClick={game.topup} className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black">Recevoir 1000 jetons 🪙</button>
                            <button onClick={onBack2D} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white">Retour 2D</button>
                        </div>
                    </div>
                </div>
            )}

            {game.error && (
                <div className="fixed bottom-28 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium text-white shadow-lg">{game.error}</div>
            )}
        </div>
    );
}

function Actions({ phase, ante, balance, onAct }: { phase: Phase; ante: number; balance: number; onAct: (a: UltAction) => void }) {
    const list: { label: string; action: UltAction; color: string; cost: number }[] =
        phase === 'preflop'
            ? [
                { label: 'Check', action: 'check', color: '#3A3A5C', cost: 0 },
                { label: 'Play ×3', action: 'play3x', color: '#1E40AF', cost: ante * 3 },
                { label: 'Play ×4', action: 'play4x', color: '#15803D', cost: ante * 4 },
            ]
            : phase === 'flop'
                ? [
                    { label: 'Check', action: 'check', color: '#3A3A5C', cost: 0 },
                    { label: 'Play ×2', action: 'play2x', color: '#15803D', cost: ante * 2 },
                ]
                : [
                    { label: 'Se coucher', action: 'fold', color: '#7f1d1d', cost: 0 },
                    { label: 'Play ×1', action: 'play1x', color: '#15803D', cost: ante },
                ];

    return (
        <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
            {list.map((b) => (
                <button
                    key={b.action}
                    onClick={() => onAct(b.action)}
                    disabled={b.cost > balance}
                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: b.color }}
                    title={b.cost > 0 ? `${b.cost} 🪙` : undefined}
                >
                    {b.label}
                </button>
            ))}
        </div>
    );
}

function Btn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform active:scale-95" style={{ background: color }}>
            {label}
        </button>
    );
}

function PhaseBanner({ phase, seconds }: { phase: Phase; seconds: number | null }) {
    const text: Record<Phase, string> = {
        waiting: 'En attente — asseyez-vous',
        betting: 'Faites vos jeux · lancement dans',
        preflop: 'Préflop — Check ou Play ×4/×3',
        flop: 'Flop — Check ou Play ×2',
        river: 'River — Play ×1 ou se coucher',
        showdown: 'Abattage',
    };
    const showTimer = (phase === 'betting' || phase === 'preflop' || phase === 'flop' || phase === 'river') && seconds != null;
    return (
        <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5">
            <span className="text-sm font-medium text-white/85">{text[phase]}</span>
            {showTimer && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${seconds! <= 5 ? 'bg-[#EF4444]' : 'bg-[#D4AF37] text-black'}`}>{seconds}s</span>}
        </div>
    );
}
