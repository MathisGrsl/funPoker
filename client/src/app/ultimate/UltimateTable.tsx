'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChipDisc } from '@/app/blackjack/Chips';
import { ChipFlyProvider, useChipFly } from '@/app/blackjack/ChipFly';
import { useCountdown } from '@/app/blackjack/useCountdown';
import Board from './Board';
import UltSeat from './UltSeat';
import { CHIP_VALUES } from './config';
import { useUltimate } from './useUltimate';
import { Phase, TableSnapshot } from './types';

export default function UltimateTable({ tableId = 'ult-1' }: { tableId?: string }) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const game = useUltimate(tableId, user?.id);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    if (loading || !game.state || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#07140f]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
        );
    }

    return (
        <ChipFlyProvider>
            <FeltScene game={game} myId={user.id} onLeaveTable={() => router.push('/lobby')} on3D={() => router.push('/ultimate/3d')} />
        </ChipFlyProvider>
    );
}

type Game = ReturnType<typeof useUltimate>;

function FeltScene({ game, myId, onLeaveTable, on3D }: { game: Game; myId: string; onLeaveTable: () => void; on3D: () => void }) {
    const state = game.state as TableSnapshot;
    const { registerEl } = useChipFly();
    const [selectedChip, setSelectedChip] = useState(25);
    const seconds = useCountdown(state.deadline);

    const mySeats = state.seats.filter((s) => s.playerId === myId);
    const hasMyBet = mySeats.some((s) => s.ante > 0);
    const hasLastBet = mySeats.some((s) => s.lastAnte > 0);
    const committed = mySeats.some((s) => s.ante > 0 || s.hole.length > 0);
    const broke = game.balance < state.minAnte * 2 && !committed;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#07140f] text-white">
            <header className="relative z-20 flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                    <button onClick={onLeaveTable} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white">
                        ← Lobby
                    </button>
                    <button onClick={on3D} className="rounded-lg border border-[#7C3AED]/50 bg-[#7C3AED]/15 px-3 py-1.5 text-sm font-semibold text-[#C4B5FD] transition-colors hover:bg-[#7C3AED]/25">
                        🎲 3D
                    </button>
                </div>
                <PhaseBanner phase={state.phase} seconds={seconds} />
                <div className="rounded-lg bg-black/40 px-3 py-1.5 text-right">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Solde</p>
                    <p className="text-sm font-bold text-[#D4AF37]">{game.balance.toLocaleString()} 🪙</p>
                </div>
            </header>

            <div className="relative mx-auto w-full max-w-5xl px-4">
                <div className="relative" style={{ aspectRatio: '2 / 1.32' }}>
                    {/* Rail */}
                    <div className="absolute inset-0 rounded-[50%] shadow-[0_30px_70px_rgba(0,0,0,0.65)]" style={{ background: 'linear-gradient(#3a2912, #1b1308)' }} />
                    {/* Feutre */}
                    <div
                        className="absolute inset-[2.6%] rounded-[50%]"
                        style={{ background: 'radial-gradient(ellipse at 50% 40%, #157951 0%, #0c4a32 52%, #062a1d 100%)', boxShadow: 'inset 0 0 90px rgba(0,0,0,0.55)' }}
                    >
                        <div className="absolute inset-[4%] rounded-[50%] border border-[#1f7a45]/40" />
                    </div>

                    {/* Accessoires */}
                    <div className="absolute left-[7%] top-[10%] z-10"><CashierRack registerEl={registerEl} /></div>
                    <div className="absolute right-[7%] top-[10%] z-10"><Shoe registerEl={registerEl} /></div>

                    {/* Board au centre */}
                    <div className="absolute left-1/2 top-[32%] z-10 -translate-x-1/2 -translate-y-1/2">
                        <Board dealer={state.dealer} community={state.community} />
                    </div>

                    {/* Sièges disposés en arrondi autour de l'ovale */}
                    {state.seats.map((seat, i) => {
                        const pos = SEATS_6[i] ?? { left: '50%', top: '88%' };
                        return (
                            <div key={seat.index} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: pos.left, top: pos.top }}>
                                <UltSeat
                                    seat={seat}
                                    phase={state.phase}
                                    isMine={seat.playerId === myId}
                                    isActiveSeat={state.activeSeat === seat.index}
                                    balance={seat.playerId ? state.balances[seat.playerId] ?? 0 : 0}
                                    selectedChip={selectedChip}
                                    minAnte={state.minAnte}
                                    maxAnte={state.maxAnte}
                                    turnDeadline={state.activeSeat === seat.index && (state.phase === 'preflop' || state.phase === 'flop' || state.phase === 'river') ? state.deadline : null}
                                    onSit={game.sit}
                                    onLeave={game.leaveSeat}
                                    onAnte={game.ante}
                                    onTrips={game.trips}
                                    onAct={game.act}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Barre d'actions + rail */}
            <div className="relative z-20 mt-4 flex flex-col items-center gap-3 pb-6">
                {state.phase === 'betting' && (hasLastBet || hasMyBet) && (
                    <div className="flex gap-2">
                        {hasLastBet && <BarBtn label="↺ Rebet" color="#3A3A5C" onClick={game.rebet} />}
                        {hasMyBet && <BarBtn label="▶ Distribuer" color="#15803D" onClick={game.dealNow} />}
                    </div>
                )}
                <ChipRail selected={selectedChip} onSelect={setSelectedChip} registerEl={registerEl} />
            </div>

            {broke && <BrokeOverlay onTopup={game.topup} onLeave={onLeaveTable} />}

            {game.error && (
                <div className="fixed bottom-28 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium shadow-lg">{game.error}</div>
            )}
        </div>
    );
}

function PhaseBanner({ phase, seconds }: { phase: Phase; seconds: number | null }) {
    const text: Record<Phase, string> = {
        waiting: 'En attente — asseyez-vous pour lancer',
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
            {showTimer && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${seconds! <= 5 ? 'bg-[#EF4444]' : 'bg-[#D4AF37] text-black'}`}>{seconds}s</span>
            )}
        </div>
    );
}

function BarBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform active:scale-95" style={{ background: color }}>
            {label}
        </button>
    );
}

function ChipRail({ selected, onSelect, registerEl }: { selected: number; onSelect: (v: number) => void; registerEl: (k: string, el: HTMLElement | null) => void }) {
    return (
        <div ref={(el) => registerEl('tray', el)} className="flex items-center gap-3 rounded-2xl bg-black/40 px-5 py-3 ring-1 ring-white/10">
            {CHIP_VALUES.map((v) => (
                <button
                    key={v}
                    onClick={() => onSelect(v)}
                    className={`transition-transform ${selected === v ? '-translate-y-1.5 scale-110 drop-shadow-[0_4px_8px_rgba(212,175,55,0.5)]' : 'opacity-85 hover:opacity-100'}`}
                >
                    <ChipDisc value={v} size={44} />
                </button>
            ))}
        </div>
    );
}

function BrokeOverlay({ onTopup, onLeave }: { onTopup: () => void; onLeave: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[340px] rounded-2xl border border-white/10 bg-[#0E0E20] p-7 text-center shadow-2xl">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#B91C1C]/20 text-3xl">💸</div>
                <h3 className="text-xl font-bold text-white">Plus de jetons</h3>
                <p className="mt-1.5 text-sm text-white/60">Tu n'as plus de quoi miser. Refais le plein ou retourne au lobby.</p>
                <div className="mt-5 flex flex-col gap-2">
                    <button onClick={onTopup} className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black transition-transform active:scale-95">Recevoir 1000 jetons 🪙</button>
                    <button onClick={onLeave} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white">Retour au lobby</button>
                </div>
            </div>
        </div>
    );
}

function CashierRack({ registerEl }: { registerEl: (k: string, el: HTMLElement | null) => void }) {
    return (
        <div ref={(el) => registerEl('cashier', el)} className="flex gap-1 rounded-lg bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
            {[500, 100, 25, 5].map((v) => <ChipDisc key={v} value={v} size={22} />)}
        </div>
    );
}

function Shoe({ registerEl }: { registerEl: (k: string, el: HTMLElement | null) => void }) {
    return (
        <div ref={(el) => registerEl('shoe', el)} className="flex h-12 w-10 items-end justify-center rounded-md bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] shadow-lg ring-1 ring-black/40">
            <div className="mb-1 h-8 w-7 rounded-sm bg-[#FBFBF7]/90" />
        </div>
    );
}

/** Positions des 6 sièges en arrondi autour du bas de l'ovale (left/top en %). */
const SEATS_6 = [
    { left: '7%', top: '41%' },
    { left: '13%', top: '71%' },
    { left: '35%', top: '83%' },
    { left: '65%', top: '83%' },
    { left: '87%', top: '71%' },
    { left: '93%', top: '41%' },
];
