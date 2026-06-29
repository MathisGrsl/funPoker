'use client';

import PlayerSeat from './PlayerSeat';
import type { PokerLobbyPlayer } from './types';

type SeatPos = { top: string; left: string };

const SEATS_5: SeatPos[] = [
    { top: '82%', left: '50%' },
    { top: '58%', left: '10%' },
    { top: '14%', left: '24%' },
    { top: '14%', left: '76%' },
    { top: '58%', left: '90%' },
];

const SEATS_9: SeatPos[] = [
    { top: '84%', left: '50%' },
    { top: '70%', left: '14%' },
    { top: '44%', left: '3%'  },
    { top: '18%', left: '14%' },
    { top: '5%',  left: '33%' },
    { top: '5%',  left: '61%' },
    { top: '18%', left: '78%' },
    { top: '44%', left: '89%' },
    { top: '70%', left: '78%' },
];

type Props = {
    players: PokerLobbyPlayer[];
    maxPlayers: number;
    currentUserId: string;
};

export default function LobbyTable({ players, maxPlayers, currentUserId }: Props) {
    const positions = maxPlayers === 5 ? SEATS_5 : SEATS_9;

    return (
        <div className="relative w-full max-w-2xl" style={{ aspectRatio: '2 / 1.1' }}>
            {/* Outer rail */}
            <div className="absolute inset-[6%] rounded-[50%] bg-[#2D1800] shadow-[0_0_0_8px_#1A0E00,0_0_80px_rgba(0,0,0,0.9)]" />

            {/* Felt */}
            <div className="absolute inset-[9%] rounded-[50%] bg-[#0B3D20] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-[6%] rounded-[50%] border border-[#175C32]/60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none pointer-events-none">
                    <span className="text-[#175C32] text-5xl opacity-50">♠</span>
                    <span className="text-[#175C32] text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">funPoker</span>
                </div>
            </div>

            {/* Seats */}
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
