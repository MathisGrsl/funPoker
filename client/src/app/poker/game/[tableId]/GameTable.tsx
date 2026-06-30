'use client';

import GamePlayerSeat from './GamePlayerSeat';
import AnimatedCard from './AnimatedCard';
import PotDisplay from './PotDisplay';
import WinnerBanner from './WinnerBanner';
import type { GameState } from './types';

// Seat positions — index 0 = current user (always bottom-center)
const SEAT_POSITIONS: Record<number, { top: string; left: string }[]> = {
    2: [
        { top: '86%', left: '50%' },
        { top: '14%', left: '50%' },
    ],
    3: [
        { top: '86%', left: '50%' },
        { top: '14%', left: '25%' },
        { top: '14%', left: '75%' },
    ],
    4: [
        { top: '86%', left: '50%' },
        { top: '50%', left: '5%'  },
        { top: '14%', left: '50%' },
        { top: '50%', left: '95%' },
    ],
    5: [
        { top: '86%', left: '50%' },
        { top: '62%', left: '7%'  },
        { top: '16%', left: '22%' },
        { top: '16%', left: '78%' },
        { top: '62%', left: '93%' },
    ],
    6: [
        { top: '86%', left: '50%' },
        { top: '62%', left: '5%'  },
        { top: '20%', left: '18%' },
        { top: '14%', left: '50%' },
        { top: '20%', left: '82%' },
        { top: '62%', left: '95%' },
    ],
    9: [
        { top: '88%', left: '50%' },
        { top: '70%', left: '10%' },
        { top: '44%', left: '1%'  },
        { top: '18%', left: '12%' },
        { top: '5%',  left: '30%' },
        { top: '5%',  left: '70%' },
        { top: '18%', left: '88%' },
        { top: '44%', left: '99%' },
        { top: '70%', left: '90%' },
    ],
};

type Props = {
    state: GameState;
    currentUserId: string;
};

export default function GameTable({ state, currentUserId }: Props) {
    const n = state.players.length;
    const positions = SEAT_POSITIONS[n] ?? SEAT_POSITIONS[9];

    const myPlayer = state.players.find(p => p.userId === currentUserId);
    const myLogicalIdx = myPlayer?.seatIndex ?? 0;

    const communitySlots = Array.from({ length: 5 }, (_, i) => ({
        card: state.communityCards[i] ?? null,
    }));

    // Flop cards (0-2) stagger; turn (3) and river (4) appear instantly
    const COMMUNITY_DELAYS = [0, 80, 160, 0, 0];

    return (
        <div className="relative w-full select-none" style={{ aspectRatio: '2 / 1.15' }}>

            {/* ── Outer drop shadow ── */}
            <div
                className="absolute inset-[3%] rounded-[48%]"
                style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.85), 0 8px 24px rgba(0,0,0,0.6)' }}
            />

            {/* ── Mahogany wood rail ── */}
            <div
                className="absolute inset-[3%] rounded-[48%]"
                style={{
                    background: 'linear-gradient(145deg, #8B4220 0%, #5C2710 20%, #3A1608 38%, #2E1106 50%, #3A1608 62%, #5C2710 80%, #8B4220 100%)',
                    boxShadow: 'inset 0 4px 12px rgba(255,180,80,0.10), inset 0 -8px 24px rgba(0,0,0,0.55)',
                }}
            />

            {/* ── Gold trim ring ── */}
            <div
                className="absolute inset-[5.8%] rounded-[44%]"
                style={{
                    background: 'transparent',
                    boxShadow: '0 0 0 2px rgba(200,150,40,0.55), inset 0 0 0 1px rgba(255,210,80,0.20)',
                }}
            />

            {/* ── Felt playing surface ── */}
            <div
                className="absolute inset-[7%] rounded-[42%] overflow-hidden"
                style={{
                    background: 'radial-gradient(ellipse 85% 75% at 50% 42%, #1e6e3a 0%, #145228 40%, #0b3519 70%, #061e0e 100%)',
                }}
            >
                {/* Overhead spotlight glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 65% 55% at 50% 38%, rgba(255,255,255,0.045) 0%, transparent 70%)',
                    }}
                />

                {/* Inner felt decorative line */}
                <div
                    className="absolute inset-[3.5%] rounded-[42%] pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.06)' }}
                />

                {/* Community card runway — subtle lighter oval */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: '22%', left: '15%', right: '15%', bottom: '30%',
                        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.025) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }}
                />

                {/* ── Center content ── */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none">
                    {/* Community cards */}
                    <div className="flex items-center gap-2">
                        {communitySlots.map(({ card }, i) =>
                            card ? (
                                <AnimatedCard key={i} card={card} size="lg" dealDelay={COMMUNITY_DELAYS[i]} />
                            ) : (
                                <div
                                    key={i}
                                    className="w-16 h-[94px] rounded-lg"
                                    style={{
                                        background: 'rgba(0,0,0,0.18)',
                                        border: '1px dashed rgba(255,255,255,0.08)',
                                    }}
                                />
                            )
                        )}
                    </div>

                    {/* Pot + phase */}
                    <PotDisplay pot={state.pot} phase={state.phase} />

                    {/* Subtle logo when board is empty */}
                    {state.communityCards.length === 0 && state.phase === 'preflop' && (
                        <span style={{ fontSize: '2.5rem', opacity: 0.06, lineHeight: 1, marginTop: '0.25rem' }}>♠</span>
                    )}
                </div>

                {/* ── Winner overlay ── */}
                <WinnerBanner state={state} />
            </div>

            {/* ── Player seats ── */}
            {positions.map((pos, visualIdx) => {
                const logicalIdx = (myLogicalIdx + visualIdx) % n;
                const player = state.players.find(p => p.seatIndex === logicalIdx) ?? null;
                if (!player) return null;

                const topPct = parseFloat(pos.top);
                const cardBelow = topPct < 42;

                return (
                    <div
                        key={visualIdx}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ top: pos.top, left: pos.left }}
                    >
                        <GamePlayerSeat
                            player={player}
                            isCurrentUser={player.userId === currentUserId}
                            isActing={player.userId === state.actingUserId}
                            cardBelow={cardBelow}
                            roundNumber={state.roundNumber}
                        />
                    </div>
                );
            })}
        </div>
    );
}
