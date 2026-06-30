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
                <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#1E1E3A] bg-black/30 flex items-center justify-center">
                    <span className="text-[#252545] text-xs font-semibold">{seatNumber}</span>
                </div>
            </div>
        );
    }

    const ringColor = isCurrentUser
        ? 'border-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.4)]'
        : 'border-[#7C3AED]/60 shadow-[0_0_12px_rgba(124,58,237,0.2)]';

    const avatarBg = isCurrentUser ? 'bg-[#D4AF37]/10' : 'bg-[#7C3AED]/10';

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${ringColor} ${avatarBg}`}>
                {player.avatar ? (
                    <img src={player.avatar} alt={player.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <span className={`text-base font-black ${isCurrentUser ? 'text-[#D4AF37]' : 'text-[#A78BFA]'}`}>
                        {player.username[0].toUpperCase()}
                    </span>
                )}
            </div>
            <div className={`bg-black/80 border rounded-lg px-2.5 py-1 max-w-[84px] backdrop-blur-sm ${isCurrentUser ? 'border-[#D4AF37]/20' : 'border-[#7C3AED]/20'}`}>
                <p className="text-[11px] text-white font-semibold truncate text-center leading-tight">
                    {player.username}
                </p>
                {isCurrentUser && (
                    <p className="text-[9px] text-[#D4AF37] text-center font-bold">You</p>
                )}
            </div>
        </div>
    );
}
