'use client';

import type { PokerLobbyPlayer } from './types';

type Props = {
    seatNumber: number;
    player: PokerLobbyPlayer | null;
    isCurrentUser: boolean;
};

export default function PlayerSeat({ seatNumber, player, isCurrentUser }: Props) {
    if (!player) {
        return (
            <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#1E1E3A] bg-[#060612]/30 flex items-center justify-center">
                    <span className="text-[#252545] text-xs font-semibold">{seatNumber}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg ${
                isCurrentUser
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                    : 'border-[#7C3AED]/60 bg-[#7C3AED]/15 shadow-[0_0_15px_rgba(124,58,237,0.15)]'
            }`}>
                {player.avatar ? (
                    <img src={player.avatar} alt={player.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <span className={`text-base font-bold ${isCurrentUser ? 'text-[#D4AF37]' : 'text-[#A78BFA]'}`}>
                        {player.username[0].toUpperCase()}
                    </span>
                )}
            </div>
            <div className="bg-[#060612]/90 border border-[#1E1E3A] rounded-lg px-2 py-0.5 max-w-[80px]">
                <p className="text-[10px] text-[#C4C4E0] font-medium truncate text-center leading-tight">
                    {player.username}
                </p>
                {isCurrentUser && (
                    <p className="text-[8px] text-[#D4AF37] text-center font-bold">You</p>
                )}
            </div>
        </div>
    );
}
