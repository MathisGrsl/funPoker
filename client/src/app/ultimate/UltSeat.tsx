'use client';

import Card from '@/app/blackjack/Card';
import ChipStack from '@/app/blackjack/ChipStack';
import CircularTimer from '@/app/blackjack/CircularTimer';
import { DEFAULT_DECK } from '@/app/blackjack/decks';
import { TURN_MS } from './config';
import { BetOutcome, Phase, SnapshotSeat, UltAction } from './types';

type Props = {
    seat: SnapshotSeat;
    phase: Phase;
    isMine: boolean;
    isActiveSeat: boolean;
    balance: number;
    selectedChip: number;
    minAnte: number;
    maxAnte: number;
    turnDeadline: number | null;
    onSit: (i: number) => void;
    onLeave: (i: number) => void;
    onAnte: (i: number, amount: number) => void;
    onTrips: (i: number, amount: number) => void;
    onAct: (i: number, action: UltAction) => void;
};

export default function UltSeat(props: Props) {
    const { seat, phase, isMine, isActiveSeat, balance, selectedChip, maxAnte, turnDeadline } = props;
    const occupied = !!seat.playerId;
    const canSit = phase === 'waiting' || phase === 'betting';
    const canBet = phase === 'betting' && isMine && occupied;
    const myTurn = isMine && isActiveSeat && (phase === 'preflop' || phase === 'flop' || phase === 'river');
    const committed = seat.ante + seat.blind + seat.trips + seat.play;
    const net = (seat.payout ?? 0) - committed;

    const addAnte = () => props.onAnte(seat.index, Math.min(maxAnte, seat.ante + selectedChip));
    const addTrips = () => props.onTrips(seat.index, Math.min(maxAnte, seat.trips + selectedChip));

    return (
        <div className="flex w-[118px] flex-col items-center gap-1">
            {/* Cartes du joueur */}
            <div className="flex h-[78px] items-end justify-center gap-0.5">
                {seat.hole.map((c, i) => (
                    <Card key={i} card={c} deck={DEFAULT_DECK} width={44} dealFrom="shoe" dealDelayMs={i * 80} />
                ))}
            </div>

            {/* Spots de mise (grille 2×2) */}
            <div className="relative grid grid-cols-2 gap-1">
                <BetSpot label="ANTE" amount={seat.ante} accent="#D4AF37" clickable={canBet} onClick={addAnte} onClear={() => props.onAnte(seat.index, 0)} />
                <BetSpot label="BLIND" amount={seat.blind} accent="#9CC2FF" />
                <BetSpot label="TRIPS" amount={seat.trips} accent="#F472B6" clickable={canBet} onClick={addTrips} onClear={() => props.onTrips(seat.index, 0)} />
                <BetSpot label="PLAY" amount={seat.play} accent="#34D399" active={seat.decision === 'played'} />

                {turnDeadline != null && (
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                        <CircularTimer deadline={turnDeadline} durationMs={TURN_MS} />
                    </div>
                )}
            </div>

            {/* Statut de décision (hors showdown) */}
            {phase !== 'showdown' && occupied && seat.decision !== 'none' && seat.decision !== 'pending' && (
                <DecisionBadge decision={seat.decision} />
            )}

            {/* Plaque / s'asseoir (repris du blackjack) */}
            {occupied ? (
                <div className={`w-full rounded-lg border px-2 py-1 text-center ${isMine ? 'border-[#D4AF37]/50 bg-black/40' : 'border-white/10 bg-black/25'}`}>
                    <p className="truncate text-[11px] font-semibold text-white">{seat.playerName}</p>
                    <p className="text-[10px] text-[#D4AF37]">{balance.toLocaleString()} 🪙</p>
                </div>
            ) : (
                <button
                    onClick={() => props.onSit(seat.index)}
                    disabled={!canSit}
                    className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] text-white/40 transition-colors hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <span className="text-base leading-none">＋</span>
                    s'asseoir
                </button>
            )}

            {/* Actions du tour */}
            {myTurn && <Actions phase={phase} ante={seat.ante} balance={balance} onAct={(a) => props.onAct(seat.index, a)} />}

            {/* Résultat au showdown */}
            {phase === 'showdown' && occupied && seat.results && (
                <div className="flex flex-col items-center gap-0.5">
                    {seat.handName && <span className="text-[10px] font-semibold text-white/70">{seat.handName}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${net > 0 ? 'bg-[#15803D] text-white' : net < 0 ? 'bg-[#7f1d1d] text-white/80' : 'bg-[#3A3A5C] text-white'}`}>
                        {net > 0 ? `+${net}` : net < 0 ? `${net}` : '±0'}
                    </span>
                </div>
            )}

            {/* Retirer / quitter */}
            {canBet && (seat.ante > 0 || seat.trips > 0) && (
                <button onClick={() => { props.onAnte(seat.index, 0); props.onTrips(seat.index, 0); }} className="text-[10px] text-white/40 hover:text-white/70">tout retirer</button>
            )}
            {isMine && canSit && seat.ante === 0 && (
                <button onClick={() => props.onLeave(seat.index)} className="text-[10px] text-white/35 hover:text-white/60">quitter</button>
            )}
        </div>
    );
}

function BetSpot({ label, amount, accent, clickable, active, onClick, onClear }: {
    label: string; amount: number; accent: string; clickable?: boolean; active?: boolean; onClick?: () => void; onClear?: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <button
                onClick={clickable ? onClick : undefined}
                disabled={!clickable}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${clickable ? 'cursor-pointer border-dashed hover:bg-white/5' : ''} ${active ? 'animate-pulse' : ''}`}
                style={{ borderColor: amount > 0 || active ? accent : 'rgba(255,255,255,0.18)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)' }}
            >
                {amount > 0 ? <ChipStack amount={amount} size={22} /> : null}
            </button>
            <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: amount > 0 ? accent : 'rgba(255,255,255,0.3)' }}>{label}</span>
        </div>
    );
}

function DecisionBadge({ decision }: { decision: string }) {
    const map: Record<string, { t: string; c: string }> = {
        checked: { t: 'CHECK', c: 'bg-[#3A3A5C]' },
        played: { t: 'MISE', c: 'bg-[#15803D]' },
        folded: { t: 'COUCHÉ', c: 'bg-[#7f1d1d]' },
    };
    const m = map[decision];
    if (!m) return null;
    return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${m.c}`}>{m.t}</span>;
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
                    { label: 'Fold', action: 'fold', color: '#7f1d1d', cost: 0 },
                    { label: 'Play ×1', action: 'play1x', color: '#15803D', cost: ante },
                ];

    return (
        <div className="flex flex-wrap justify-center gap-1">
            {list.map((b) => (
                <button
                    key={b.action}
                    onClick={() => onAct(b.action)}
                    disabled={b.cost > balance}
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: b.color }}
                    title={b.cost > 0 ? `${b.cost} 🪙` : undefined}
                >
                    {b.label}
                </button>
            ))}
        </div>
    );
}
