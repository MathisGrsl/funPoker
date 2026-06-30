'use client';

import AnimatedCard from './AnimatedCard';
import type { GamePlayerState } from './types';

type Props = {
    player: GamePlayerState;
    isCurrentUser: boolean;
    isActing: boolean;
    cardBelow?: boolean; // true for seats in the top half of the table
    roundNumber?: number;
};

export default function GamePlayerSeat({ player, isCurrentUser, isActing, cardBelow = false, roundNumber = 0 }: Props) {
    const isFolded = player.status === 'folded';
    const isAllIn = player.status === 'all-in';

    const ringColor = isActing
        ? 'border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.6)]'
        : isCurrentUser
        ? 'border-[#D4AF37]/50 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
        : 'border-[#7C3AED]/50 shadow-[0_0_12px_rgba(124,58,237,0.15)]';

    const avatarBg = isCurrentUser ? 'bg-[#D4AF37]/10' : 'bg-[#7C3AED]/10';

    const cards = player.holeCards && (
        <div className="flex gap-1">
            {player.holeCards.map((c, i) => (
                <AnimatedCard key={`${roundNumber}-${i}`} card={c} size="sm" dealDelay={i * 110} />
            ))}
        </div>
    );

    return (
        <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${isFolded ? 'opacity-35' : 'opacity-100'}`}>
            {/* Cards above (for bottom seats) */}
            {!cardBelow && cards}

            {/* Avatar */}
            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${ringColor} ${avatarBg} ${isActing ? 'animate-pulse' : ''}`}>
                {player.avatar ? (
                    <img src={player.avatar} alt={player.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <span className={`text-lg font-black ${isCurrentUser ? 'text-[#D4AF37]' : 'text-[#A78BFA]'}`}>
                        {player.username[0].toUpperCase()}
                    </span>
                )}

                {/* Position badge */}
                {player.isDealer && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center shadow z-10 border border-gray-200">D</span>
                )}
                {!player.isDealer && player.isSB && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 text-white text-[8px] font-black flex items-center justify-center shadow z-10">SB</span>
                )}
                {!player.isDealer && player.isBB && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[8px] font-black flex items-center justify-center shadow z-10">BB</span>
                )}

                {/* Acting glow pulse */}
                {isActing && (
                    <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37] animate-ping opacity-40" />
                )}
            </div>

            {/* Info plate */}
            <div className={`relative bg-black/80 border rounded-lg px-2.5 py-1 text-center min-w-[76px] backdrop-blur-sm ${isActing ? 'border-[#D4AF37]/40' : isCurrentUser ? 'border-[#D4AF37]/20' : 'border-[#7C3AED]/20'}`}>
                <p className="text-[11px] text-white font-semibold truncate max-w-[72px] leading-tight">{player.username}</p>
                <p className={`text-xs font-bold ${isCurrentUser ? 'text-[#D4AF37]' : 'text-[#A78BFA]'}`}>
                    €{player.chips.toFixed(2)}
                </p>
                {player.bet > 0 && (
                    <p className="text-[9px] text-green-400 font-medium">bet €{player.bet.toFixed(2)}</p>
                )}
                {isAllIn && (
                    <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-white bg-red-600 rounded px-1.5 py-px whitespace-nowrap">ALL-IN</span>
                )}
            </div>

            {/* Cards below (for top seats) */}
            {cardBelow && cards && <div className="mt-1">{cards}</div>}
        </div>
    );
}
