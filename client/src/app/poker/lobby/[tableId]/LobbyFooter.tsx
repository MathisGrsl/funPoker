'use client';

type Props = {
    playerCount: number;
    maxPlayers: number;
    onLeave: () => void;
};

export default function LobbyFooter({ playerCount, maxPlayers, onLeave }: Props) {
    const readyToStart = playerCount >= 2;

    return (
        <div className="px-4 pb-5 pt-3 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center gap-2">
                {readyToStart ? (
                    <>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <p className="text-green-400 text-sm font-semibold">Starting automatically…</p>
                    </>
                ) : (
                    <>
                        <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" />
                        <p className="text-[#6B6B8A] text-sm">
                            Waiting for {2 - playerCount} more player{playerCount === 1 ? '' : 's'}…
                        </p>
                    </>
                )}
            </div>

            <button
                onClick={onLeave}
                className="px-5 py-2 text-xs font-semibold text-[#6B6B8A] hover:text-[#F87171] bg-black/40 hover:bg-[#F87171]/10 border border-[#1E1E3A] hover:border-[#F87171]/30 rounded-xl transition-all cursor-pointer"
            >
                Leave
            </button>
        </div>
    );
}
