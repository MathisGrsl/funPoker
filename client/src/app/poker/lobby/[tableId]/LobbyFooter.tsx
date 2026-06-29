'use client';

type Props = {
    playerCount: number;
    maxPlayers: number;
    onLeave: () => void;
};

export default function LobbyFooter({ playerCount, maxPlayers, onLeave }: Props) {
    const remaining = maxPlayers - playerCount;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-pulse" />
                <p className="text-[#6B6B8A] text-sm">
                    {remaining > 0
                        ? `Waiting for ${remaining} more player${remaining > 1 ? 's' : ''}…`
                        : 'Table full — starting soon…'}
                </p>
            </div>

            <button
                onClick={onLeave}
                className="px-6 py-2 text-xs font-semibold text-[#6B6B8A] hover:text-[#F87171] bg-[#111127] hover:bg-[#F87171]/10 border border-[#1E1E3A] hover:border-[#F87171]/30 rounded-xl transition-all duration-150 cursor-pointer"
            >
                Leave Queue
            </button>

            <p className="text-[#2A2A4A] text-xs">Texas Hold&apos;em · Blinds auto-posted</p>
        </div>
    );
}
