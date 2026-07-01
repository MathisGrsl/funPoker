'use client';

import { useEffect, useState } from 'react';
import { useChipFly } from './ChipFly';
import ChipStack from './ChipStack';
import CircularTimer from './CircularTimer';
import HandView from './HandView';
import { TURN_MS } from './config';
import { DeckTheme } from './decks';
import { Phase, PlayerAction, SnapshotHand, SnapshotSeat } from './types';

type Props = {
    seat: SnapshotSeat;
    deck: DeckTheme;
    phase: Phase;
    isMine: boolean;
    isActiveSeat: boolean;
    activeHand: number | null;
    balance: number;
    selectedChip: number;
    minBet: number;
    maxBet: number;
    turnDeadline: number | null;
    onSit: (seatIndex: number) => void;
    onLeave: (seatIndex: number) => void;
    onBet: (seatIndex: number, amount: number) => void;
    onAct: (seatIndex: number, handIndex: number, action: PlayerAction) => void;
    onInsure: (seatIndex: number, take: boolean) => void;
};

export default function Seat(props: Props) {
    const { seat, deck, phase, isMine, isActiveSeat, activeHand, balance, selectedChip, minBet, maxBet, turnDeadline } = props;
    const { registerEl, fly } = useChipFly();

    const occupied = !!seat.playerId;
    const canSit = phase === 'waiting' || phase === 'betting';
    const canBet = phase === 'betting' && isMine && occupied;
    const myTurn = isMine && isActiveSeat && phase === 'playerTurns';
    const activeHandObj = myTurn && activeHand != null ? seat.hands[activeHand] : null;
    const firstHand = seat.hands[0];

    // Décision d'assurance (locale, réinitialisée hors phase).
    const [insDecided, setInsDecided] = useState(false);
    useEffect(() => { if (phase !== 'insurance') setInsDecided(false); }, [phase]);
    const showInsurance = phase === 'insurance' && isMine && firstHand && !insDecided && !firstHand.insurance;

    const addChip = () => {
        const next = Math.min(maxBet, seat.pendingBet + selectedChip);
        if (next === seat.pendingBet) return;
        props.onBet(seat.index, next);
        fly('tray', `box-${seat.index}`, selectedChip);
    };

    const decide = (take: boolean) => { setInsDecided(true); props.onInsure(seat.index, take); };

    return (
        <div className="flex w-[116px] flex-col items-center gap-1.5">
            {/* Cartes */}
            <div className="flex h-[100px] items-end justify-center">
                {seat.hands.map((hand, hi) => (
                    <HandView key={hi} hand={hand} deck={deck} active={isActiveSeat && activeHand === hi} cardWidth={54} />
                ))}
            </div>

            {/* Case de mise + timer */}
            <div className="relative">
                <div
                    ref={(el) => registerEl(`box-${seat.index}`, el)}
                    onClick={canBet ? addChip : !occupied && canSit ? () => props.onSit(seat.index) : undefined}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors ${
                        isMine ? 'border-[#D4AF37]/75' : 'border-white/20'
                    } ${canBet || (!occupied && canSit) ? 'cursor-pointer border-dashed hover:bg-[#D4AF37]/10' : ''}`}
                    style={{ boxShadow: 'inset 0 0 16px rgba(0,0,0,0.45)' }}
                >
                    {seat.pendingBet > 0 ? (
                        <ChipStack amount={seat.pendingBet} size={30} />
                    ) : canBet ? (
                        <span className="text-[10px] text-white/45">miser</span>
                    ) : !occupied && canSit ? (
                        <span className="text-2xl font-bold leading-none text-[#D4AF37]/70">＋</span>
                    ) : null}
                </div>

                {firstHand?.insurance ? (
                    <span className="absolute -left-2 -top-1 rounded-full bg-[#2563EB] px-1.5 py-0.5 text-[9px] font-bold text-white">ASSU. {firstHand.insurance}</span>
                ) : null}

                {turnDeadline != null && (
                    <div className="absolute -right-7 top-1/2 -translate-y-1/2">
                        <CircularTimer deadline={turnDeadline} durationMs={TURN_MS} />
                    </div>
                )}
            </div>

            {/* Plaque joueur (le « + » de la case sert à s'asseoir) */}
            {occupied && (
                <div className={`w-full rounded-lg border px-2 py-1 text-center ${isMine ? 'border-[#D4AF37]/50 bg-black/40' : 'border-white/10 bg-black/25'}`}>
                    <p className="truncate text-[11px] font-semibold text-white">{seat.playerName}</p>
                    <p className="text-[10px] text-[#D4AF37]">{balance.toLocaleString()} 🪙</p>
                </div>
            )}

            {/* Assurance */}
            {showInsurance && (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-[#9CC2FF]">Assurance ?</span>
                    <div className="flex gap-1">
                        <ActBtn label={`Oui (${Math.floor((firstHand?.bet ?? 0) / 2)})`} color="#2563EB" onClick={() => decide(true)} />
                        <ActBtn label="Non" color="#3A3A5C" onClick={() => decide(false)} />
                    </div>
                </div>
            )}

            {/* Actions du tour */}
            {activeHandObj && (
                <ActionButtons hand={activeHandObj} balance={balance} handsCount={seat.hands.length} onAct={(a) => props.onAct(seat.index, activeHand!, a)} />
            )}

            {/* Retirer / quitter */}
            {canBet && seat.pendingBet > 0 && (
                <button onClick={() => props.onBet(seat.index, 0)} className="text-[10px] text-white/40 hover:text-white/70">retirer</button>
            )}
            {isMine && canSit && seat.pendingBet === 0 && (
                <button onClick={() => props.onLeave(seat.index)} className="text-[10px] text-white/35 hover:text-white/60">quitter</button>
            )}
        </div>
    );
}

function ActionButtons({ hand, balance, handsCount, onAct }: { hand: SnapshotHand; balance: number; handsCount: number; onAct: (a: PlayerAction) => void }) {
    const twoCards = hand.cards.length === 2;
    const canDouble = twoCards && balance >= hand.bet;
    const canSplit = twoCards && isPair(hand) && balance >= hand.bet && handsCount < 4;

    return (
        <div className="grid grid-cols-2 gap-1">
            <ActBtn label="Tirer" color="#15803D" onClick={() => onAct('hit')} />
            <ActBtn label="Rester" color="#B91C1C" onClick={() => onAct('stand')} />
            {canDouble && <ActBtn label="Doubler" color="#1E40AF" onClick={() => onAct('double')} />}
            {canSplit && <ActBtn label="Splitter" color="#7C3AED" onClick={() => onAct('split')} />}
        </div>
    );
}

function ActBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform active:scale-95"
            style={{ background: color }}
        >
            {label}
        </button>
    );
}

function isPair(hand: SnapshotHand): boolean {
    const [a, b] = hand.cards;
    if (!a || !b || 'hidden' in a || 'hidden' in b) return false;
    return rankValue(a.rank) === rankValue(b.rank);
}

function rankValue(rank: string): number {
    if (rank === 'A') return 11;
    if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return 10;
    return parseInt(rank, 10);
}
