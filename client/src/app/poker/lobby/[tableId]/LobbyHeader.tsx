'use client';

type Props = {
    gameMode: string;
    sb: string;
    bb: string;
    playerCount: number;
    maxPlayers: number;
};

export default function LobbyHeader({ gameMode, sb, bb, playerCount, maxPlayers }: Props) {
    const label = gameMode === 'poker-5' ? "Texas Hold'em · 5 players" : "Texas Hold'em · 9 players";

    return (
        <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[#D4AF37] text-xs select-none">♦</span>
                <span className="text-[10px] font-bold text-[#3A3A5C] uppercase tracking-[0.2em]">Matchmaking</span>
                <span className="text-[#D4AF37] text-xs select-none">♦</span>
            </div>
            <h1 className="text-3xl font-bold text-[#E2E2F0]">{label}</h1>
            <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-xs font-semibold text-[#A78BFA] bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-2.5 py-1 rounded-lg">
                    Blinds €{sb} / €{bb}
                </span>
                <span className="text-[#4A4A6A] text-xs">
                    {playerCount} / {maxPlayers} players
                </span>
            </div>
        </div>
    );
}
