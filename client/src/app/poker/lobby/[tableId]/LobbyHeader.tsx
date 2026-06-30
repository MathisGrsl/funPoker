'use client';

type Props = {
    gameMode: string;
    sb: string;
    bb: string;
    playerCount: number;
    maxPlayers: number;
};

export default function LobbyHeader({ gameMode, sb, bb, playerCount, maxPlayers }: Props) {
    const label = gameMode === 'poker-5' ? "5-max" : "9-max";

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-[#0d0d20]">
            <div className="flex items-center gap-2 text-xs text-[#6B6B8A]">
                <span className="font-bold text-[#A78BFA]">Texas Hold&apos;em</span>
                <span>·</span>
                <span>{label}</span>
                <span>·</span>
                <span>€{sb} / €{bb}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-pulse" />
                <span className="text-xs text-[#6B6B8A]">{playerCount} / {maxPlayers} seated</span>
            </div>
        </div>
    );
}
