'use client';

import PlayerSeat from './PlayerSeat';
import type { PokerLobbyPlayer } from './types';

type SeatPos = { top: string; left: string };

// Same positions as GameTable — seat 0 is bottom-center
const SEATS_5: SeatPos[] = [
    { top: '86%', left: '50%' },
    { top: '62%', left: '7%'  },
    { top: '16%', left: '22%' },
    { top: '16%', left: '78%' },
    { top: '62%', left: '93%' },
];

const SEATS_9: SeatPos[] = [
    { top: '88%', left: '50%' },
    { top: '70%', left: '10%' },
    { top: '44%', left: '1%'  },
    { top: '18%', left: '12%' },
    { top: '5%',  left: '30%' },
    { top: '5%',  left: '70%' },
    { top: '18%', left: '88%' },
    { top: '44%', left: '99%' },
    { top: '70%', left: '90%' },
];

type Props = {
    players: PokerLobbyPlayer[];
    maxPlayers: number;
    currentUserId: string;
};

export default function LobbyTable({ players, maxPlayers, currentUserId }: Props) {
    const positions = maxPlayers === 5 ? SEATS_5 : SEATS_9;

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
                style={{ boxShadow: '0 0 0 2px rgba(200,150,40,0.55), inset 0 0 0 1px rgba(255,210,80,0.20)' }}
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

                {/* Center logo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none pointer-events-none">
                    <span style={{ fontSize: '3rem', opacity: 0.07, lineHeight: 1 }}>♠</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ opacity: 0.07, color: '#fff' }}>
                        funPoker
                    </span>
                </div>
            </div>

            {/* ── Player seats ── */}
            {positions.map((pos, i) => (
                <div
                    key={i}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ top: pos.top, left: pos.left }}
                >
                    <PlayerSeat
                        seatNumber={i + 1}
                        player={players[i] ?? null}
                        isCurrentUser={players[i]?.id === currentUserId}
                    />
                </div>
            ))}
        </div>
    );
}
