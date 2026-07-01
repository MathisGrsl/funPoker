'use client';

import { useEffect, useState } from 'react';
import { ChipDisc } from '../Chips';
import { CHIP_VALUES } from '../config';
import { useCountdown } from '../useCountdown';
import { Phase, PlayerAction, SnapshotHand, TableSnapshot } from '../types';

type Game = {
    state: TableSnapshot | null;
    balance: number;
    error: string | null;
    act: (seatIndex: number, handIndex: number, action: PlayerAction) => void;
    insure: (seatIndex: number, take: boolean) => void;
    bet: (seatIndex: number, amount: number) => void;
    rebet: () => void;
    dealNow: () => void;
    topup: () => void;
};

export default function Overlay({ game, myId, selectedChip, setSelectedChip, onLeave }: {
    game: Game; myId: string; selectedChip: number; setSelectedChip: (v: number) => void; onLeave: () => void;
}) {
    const state = game.state!;
    const seconds = useCountdown(state.deadline);

    // Décision d'assurance (locale, réinitialisée hors phase).
    const [insDecided, setInsDecided] = useState<number[]>([]);
    useEffect(() => { if (state.phase !== 'insurance') setInsDecided([]); }, [state.phase]);

    const activeSeat = state.activeSeat != null ? state.seats[state.activeSeat] : null;
    const myTurn = activeSeat?.playerId === myId && state.phase === 'playerTurns';
    const activeHand = myTurn && state.activeHand != null ? activeSeat!.hands[state.activeHand] : null;

    const mySeats = state.seats.filter((s) => s.playerId === myId);
    const insuranceSeats = state.phase === 'insurance'
        ? mySeats.filter((s) => s.hands[0] && !s.hands[0].insurance && !insDecided.includes(s.index))
        : [];
    const decideInsurance = (seatIndex: number, take: boolean) => {
        setInsDecided((d) => [...d, seatIndex]);
        game.insure(seatIndex, take);
    };
    const hasMyBet = mySeats.some((s) => s.pendingBet > 0);
    const hasLastBet = mySeats.some((s) => s.lastBet > 0);
    const committed = mySeats.some((s) => s.pendingBet > 0 || s.hands.length > 0);
    const broke = game.balance < state.minBet && !committed;

    // Retire (rembourse) toutes les mises en attente du joueur.
    const clearBets = () => mySeats.forEach((s) => { if (s.pendingBet > 0) game.bet(s.index, 0); });

    return (
        <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
            {/* Barre du haut */}
            <div className="flex items-center justify-between p-4">
                <button onClick={onLeave} className="pointer-events-auto rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white/80 hover:border-white/40 hover:text-white">
                    ← 2D
                </button>
                <PhaseBanner phase={state.phase} seconds={seconds} />
                <div className="rounded-lg bg-black/40 px-3 py-1.5 text-right">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Solde</p>
                    <p className="text-sm font-bold text-[#D4AF37]">{game.balance.toLocaleString()} 🪙</p>
                </div>
            </div>

            {/* Bas */}
            <div className="flex flex-col items-center gap-1.5 px-4 pb-1">
                {insuranceSeats.length > 0 && (
                    <div className="pointer-events-auto flex flex-col items-center gap-1.5">
                        <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/85">
                            Le croupier montre un As — assurance ? <span className="text-white/45">(pari optionnel, perdu si pas de blackjack)</span>
                        </span>
                        {insuranceSeats.map((s) => (
                            <div key={s.index} className="flex items-center gap-2">
                                <ActBtn label="Non merci" color="#15803D" onClick={() => decideInsurance(s.index, false)} />
                                <ActBtn label={`Assurance −${Math.floor(s.hands[0].bet / 2)} 🪙`} color="#3A3A5C" onClick={() => decideInsurance(s.index, true)} />
                            </div>
                        ))}
                    </div>
                )}

                {activeHand && (
                    <div className="pointer-events-auto flex gap-2">
                        <ActBtn label="Tirer" color="#15803D" onClick={() => game.act(activeSeat!.index, state.activeHand!, 'hit')} />
                        <ActBtn label="Rester" color="#B91C1C" onClick={() => game.act(activeSeat!.index, state.activeHand!, 'stand')} />
                        {canDouble(activeHand, game.balance) && <ActBtn label="Doubler" color="#1E40AF" onClick={() => game.act(activeSeat!.index, state.activeHand!, 'double')} />}
                        {canSplit(activeHand, game.balance, activeSeat!.hands.length) && <ActBtn label="Splitter" color="#7C3AED" onClick={() => game.act(activeSeat!.index, state.activeHand!, 'split')} />}
                    </div>
                )}

                {state.phase === 'betting' && (hasLastBet || hasMyBet) && (
                    <div className="pointer-events-auto flex gap-2">
                        {hasLastBet && <ActBtn label="↺ Rebet" color="#3A3A5C" onClick={game.rebet} />}
                        {hasMyBet && <ActBtn label="✕ Retirer" color="#B91C1C" onClick={clearBets} />}
                        {hasMyBet && <ActBtn label="▶ Lancer" color="#15803D" onClick={game.dealNow} />}
                    </div>
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
                            <button onClick={onLeave} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white">Retour</button>
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

function PhaseBanner({ phase, seconds }: { phase: Phase; seconds: number | null }) {
    const text: Record<Phase, string> = {
        waiting: 'En attente',
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
            {showTimer && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${seconds! <= 5 ? 'bg-[#EF4444]' : 'bg-[#D4AF37] text-black'}`}>{seconds}s</span>}
        </div>
    );
}

function ActBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform active:scale-95" style={{ background: color }}>
            {label}
        </button>
    );
}

function canDouble(hand: SnapshotHand, balance: number): boolean {
    return hand.cards.length === 2 && balance >= hand.bet;
}
function canSplit(hand: SnapshotHand, balance: number, handsCount: number): boolean {
    const [a, b] = hand.cards;
    if (!a || !b || 'hidden' in a || 'hidden' in b) return false;
    const rv = (r: string) => (r === 'A' ? 11 : r === 'K' || r === 'Q' || r === 'J' || r === '10' ? 10 : parseInt(r, 10));
    return hand.cards.length === 2 && rv(a.rank) === rv(b.rank) && balance >= hand.bet && handsCount < 4;
}
