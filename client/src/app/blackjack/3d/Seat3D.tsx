'use client';

import { Html } from '@react-three/drei';
import ChipStack3D from './Chip3D';
import Hand3D from './Hand3D';
import { SEATS } from './positions';
import { Phase, SnapshotHand, SnapshotSeat } from '../types';

type Props = {
    seat: SnapshotSeat;
    isMine: boolean;
    isActiveSeat: boolean;
    phase: Phase;
    selectedChip: number;
    balance: number;
    maxBet: number;
    onSit: (i: number) => void;
    onBet: (i: number, amount: number) => void;
};

export default function Seat3D({ seat, isMine, isActiveSeat, phase, selectedChip, balance, maxBet, onSit, onBet }: Props) {
    const s = SEATS[seat.index];
    if (!s) return null;

    const occupied = !!seat.playerId;
    const canSit = phase === 'waiting' || phase === 'betting';
    const canBet = phase === 'betting' && isMine && occupied;
    const chipAmount = seat.pendingBet > 0 ? seat.pendingBet : seat.hands[0]?.bet ?? 0;
    const interactive = (!occupied && canSit) || canBet;

    const handleClick = () => {
        if (!occupied && canSit) onSit(seat.index);
        else if (canBet) onBet(seat.index, Math.min(maxBet, seat.pendingBet + selectedChip));
    };

    return (
        <group>
            {/* Zone cliquable (s'asseoir / miser) */}
            <mesh
                position={[s.spot[0], 0.12, s.spot[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={handleClick}
                onPointerOver={() => { if (interactive) document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'default'; }}
            >
                <circleGeometry args={[0.42, 40]} />
                <meshStandardMaterial color={isActiveSeat ? '#D4AF37' : '#ffffff'} transparent opacity={isActiveSeat ? 0.18 : occupied ? 0.0 : 0.05} />
            </mesh>

            {/* Jetons misés */}
            <ChipStack3D amount={chipAmount} position={[s.spot[0], s.spot[1], s.spot[2]]} />

            {/* Cartes (une main, ou plusieurs après split) */}
            {occupied && seat.hands.map((h, hi) => (
                <Hand3D key={hi} cards={h.cards} doubled={h.status === 'doubled'} basePos={[s.hand[0] + (hi - (seat.hands.length - 1) / 2) * 1.5, s.hand[1], s.hand[2]]} />
            ))}

            {/* Badge valeur (non cliquable) */}
            {occupied && seat.hands[0] && (
                <Html position={[s.hand[0], 0.5, s.hand[2] + 0.1]} center distanceFactor={9} zIndexRange={[20, 0]}>
                    <ValueBadge hand={seat.hands[0]} />
                </Html>
            )}

            {/* S'asseoir : juste un « + » au centre de la case */}
            {!occupied && canSit && (
                <Html position={[s.spot[0], s.spot[1], s.spot[2]]} center distanceFactor={10} zIndexRange={[20, 0]}>
                    <button
                        onClick={() => onSit(seat.index)}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-3xl font-bold leading-none text-[#D4AF37]/70 transition-colors hover:text-[#D4AF37]"
                    >
                        ＋
                    </button>
                </Html>
            )}

            {/* Pseudo seul, sous la case (dans le creux avant les boutons) */}
            {occupied && (
                <Html position={[s.spot[0], 0.05, s.spot[2] + 0.55]} center distanceFactor={7} zIndexRange={[20, 0]}>
                    <div className={`pointer-events-none whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${isMine ? 'border-[#D4AF37]/60 bg-black/65 text-white' : 'border-white/15 bg-black/55 text-white/90'}`}>
                        {seat.playerName}
                    </div>
                </Html>
            )}
        </group>
    );
}

function ValueBadge({ hand }: { hand: SnapshotHand }) {
    let label = String(hand.value);
    let cls = 'bg-black/70 text-white';
    if (hand.status === 'blackjack') { label = 'BJ'; cls = 'bg-[#D4AF37] text-black'; }
    else if (hand.status === 'bust') { label = `${hand.value} ✗`; cls = 'bg-[#B91C1C] text-white'; }

    const res = hand.result && { win: 'GAGNÉ', lose: 'PERDU', push: 'ÉGALITÉ', blackjack: '+3:2' }[hand.result];
    return (
        <div className="pointer-events-none flex items-center gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${cls}`}>{label}</span>
            {res && <span className="rounded-full bg-[#15803D] px-2 py-0.5 text-[10px] font-bold text-white">{res}</span>}
        </div>
    );
}
