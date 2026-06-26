'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DealerArea from './DealerArea';
import FeltArc from './FeltArc';
import Seat from './Seat';
import { ChipDisc, decomposeChips } from './Chips';
import { ChipFlyProvider, useChipFly } from './ChipFly';
import { CHIP_VALUES } from './config';
import { PROFESSOR_DECK } from './decks';
import { useBlackjack } from './useBlackjack';
import { useCountdown } from './useCountdown';
import { Phase, TableSnapshot } from './types';

export default function BlackjackTable({ tableId = 'main-1' }: { tableId?: string }) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const game = useBlackjack(tableId, user?.id);

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
            <FeltScene game={game} myId={user.id} onLeaveTable={() => router.push('/lobby')} />
        </ChipFlyProvider>
    );
}

type Game = ReturnType<typeof useBlackjack>;

function FeltScene({ game, myId, onLeaveTable }: { game: Game; myId: string; onLeaveTable: () => void }) {
    const state = game.state as TableSnapshot;
    const { registerEl, fly } = useChipFly();
    const [selectedChip, setSelectedChip] = useState(25);
    const seconds = useCountdown(state.deadline);
    const deck = PROFESSOR_DECK;

    const mySeats = state.seats.filter((s) => s.playerId === myId);
    const hasMyBet = mySeats.some((s) => s.pendingBet > 0);
    const hasLastBet = mySeats.some((s) => s.lastBet > 0);
    const committed = mySeats.some((s) => s.pendingBet > 0 || s.hands.length > 0);
    const broke = game.balance < state.minBet && !committed;

    // Gains : les jetons sortent de la caisse vers les cases gagnantes au règlement.
    const prevPhase = useRef<Phase | null>(null);
    useEffect(() => {
        if (state.phase === 'settle' && prevPhase.current !== 'settle') {
            state.seats.forEach((s) => {
                if (!s.playerId) return;
                s.hands.forEach((h) => {
                    if ((h.result === 'win' || h.result === 'blackjack') && h.payout) {
                        // Gains : la caisse paie la case.
                        decomposeChips(h.payout, 4).forEach((v, i) => fly('cashier', `box-${s.index}`, v, { delay: i * 120, size: 28 }));
                    } else if (h.result === 'lose' && h.bet) {
                        // Pertes : la mise part de la case vers la banque du croupier.
                        decomposeChips(h.bet, 4).forEach((v, i) => fly(`box-${s.index}`, 'cashier', v, { delay: i * 100, size: 26 }));
                    }
                });
            });
        }
        prevPhase.current = state.phase;
    }, [state.phase, state.seats, fly]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#07140f] text-white">
            {/* Barre du haut */}
            <header className="relative z-20 flex items-center justify-between px-5 py-3">
                <button onClick={onLeaveTable} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white">
                    ← Lobby
                </button>
                <PhaseBanner phase={state.phase} seconds={seconds} />
                <div className="rounded-lg bg-black/40 px-3 py-1.5 text-right">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Solde</p>
                    <p className="text-sm font-bold text-[#D4AF37]">{game.balance.toLocaleString()} 🪙</p>
                </div>
            </header>

            {/* Table */}
            <div className="relative mx-auto max-w-4xl px-4">
                <div
                    className="relative rounded-[40px] rounded-b-[120px] px-6 pb-14 pt-4 ring-[10px] ring-[#0b3322]"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 32%, #157951 0%, #0c4a32 46%, #073322 100%)',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 0 120px rgba(0,0,0,0.35)',
                    }}
                >
                    {/* Accessoires */}
                    <div className="flex items-start justify-between">
                        <DiscardTray />
                        <ChipRack registerEl={registerEl} />
                        <Shoe registerEl={registerEl} />
                    </div>

                    {/* Croupier + titre + bandeau (empilés, sans chevauchement) */}
                    <div className="mt-1 flex flex-col items-center gap-1">
                        <DealerArea dealer={state.dealer} deck={deck} />
                        <div className="text-center leading-tight">
                            <h2 className="text-3xl font-extrabold tracking-wide text-[#EAF2FF]">Black <span className="text-[#83B0FF]">♠</span> Jack</h2>
                            <p className="text-[11px] font-semibold tracking-[0.32em] text-[#C9A24B]">MULTI-HAND</p>
                        </div>
                        <FeltArc className="w-[min(560px,92%)]" />
                    </div>

                    {/* Cases en arc léger */}
                    <div className="mt-2 flex items-end justify-center gap-1">
                        {state.seats.map((seat) => (
                            <div key={seat.index} style={{ transform: `translateY(${arcOffset(seat.index, state.seats.length)}px)` }}>
                                <Seat
                                    seat={seat}
                                    deck={deck}
                                    phase={state.phase}
                                    isMine={seat.playerId === myId}
                                    isActiveSeat={state.activeSeat === seat.index}
                                    activeHand={state.activeHand}
                                    balance={seat.playerId ? state.balances[seat.playerId] ?? 0 : 0}
                                    selectedChip={selectedChip}
                                    minBet={state.minBet}
                                    maxBet={state.maxBet}
                                    turnDeadline={state.phase === 'playerTurns' && state.activeSeat === seat.index ? state.deadline : null}
                                    onSit={game.sit}
                                    onLeave={game.leaveSeat}
                                    onBet={game.bet}
                                    onAct={game.act}
                                    onInsure={game.insure}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Barre d'actions + rail de jetons */}
            <div className="relative z-20 mt-4 flex flex-col items-center gap-3 pb-6">
                {state.phase === 'betting' && (hasLastBet || hasMyBet) && (
                    <div className="flex gap-2">
                        {hasLastBet && <BarBtn label="↺ Rebet" color="#3A3A5C" onClick={game.rebet} />}
                        {hasMyBet && <BarBtn label="▶ Lancer la partie" color="#15803D" onClick={game.dealNow} />}
                    </div>
                )}
                <ChipRail selected={selectedChip} onSelect={setSelectedChip} registerEl={registerEl} />
            </div>

            {broke && <BrokeOverlay onTopup={game.topup} onLeave={onLeaveTable} />}

            {game.error && (
                <div className="fixed bottom-28 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium shadow-lg">
                    {game.error}
                </div>
            )}
        </div>
    );
}

function PhaseBanner({ phase, seconds }: { phase: Phase; seconds: number | null }) {
    const text: Record<Phase, string> = {
        waiting: 'En attente — asseyez-vous pour lancer',
        betting: 'Faites vos jeux · lancement dans',
        dealing: 'Distribution…',
        insurance: 'Assurance ?',
        playerTurns: 'Aux joueurs',
        dealerTurn: 'Le croupier joue',
        settle: 'Résultats',
    };
    const showTimer = (phase === 'betting' || phase === 'insurance') && seconds != null;
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
                    <ChipDisc value={v} size={46} />
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
                    <button onClick={onTopup} className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black transition-transform active:scale-95">
                        Recevoir 1000 jetons 🪙
                    </button>
                    <button onClick={onLeave} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white">
                        Retour au lobby
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Caisse du croupier (départ des jetons de gain). */
function ChipRack({ registerEl }: { registerEl: (k: string, el: HTMLElement | null) => void }) {
    return (
        <div ref={(el) => registerEl('cashier', el)} className="flex gap-1 rounded-lg bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
            {[500, 100, 25, 5].map((v) => (
                <ChipDisc key={v} value={v} size={24} />
            ))}
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

function DiscardTray() {
    return <div className="h-9 w-11 rounded-md bg-black/30 ring-1 ring-white/10" />;
}

/** Arc léger : centre légèrement plus bas (bowl). */
function arcOffset(index: number, count: number): number {
    const center = (count - 1) / 2;
    const dist = Math.abs(index - center) / center;
    return Math.round((1 - dist * dist) * 14);
}
