'use client';

type GameMode = {
    id: string;
    name: string;
    players: string;
    description: string;
    suit: string;
    badge?: string;
    theme: 'purple' | 'slate' | 'red' | 'gold';
};

const GAME_MODES: GameMode[] = [
    {
        id: 'poker-5',
        name: 'Texas Hold\'em',
        players: '5 players',
        description: 'Short table, fast and intense games.',
        suit: '♠',
        theme: 'purple',
    },
    {
        id: 'poker-9',
        name: 'Texas Hold\'em',
        players: '9 players',
        description: 'Full table, classic poker experience.',
        suit: '♣',
        theme: 'slate',
    },
    {
        id: 'blackjack',
        name: 'Blackjack',
        players: '1–7 players',
        description: 'Beat the dealer and get to 21.',
        suit: '♥',
        theme: 'red',
    },
    {
        id: 'poker-plus',
        name: 'PokerPlus',
        players: '5 players',
        description: 'Custom rules, wilds, and new thrills.',
        suit: '♦',
        theme: 'gold',
        badge: 'New',
    },
];

function getTheme(theme: GameMode['theme']) {
    switch (theme) {
        case 'purple': return {
            card: 'bg-[#7C3AED] hover:bg-[#6D28D9] shadow-[0_4px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_40px_rgba(124,58,237,0.5)]',
            iconBg: 'bg-white/10',
            suit: 'text-white',
            name: 'text-white',
            tag: 'bg-white/20 text-white/90',
            desc: 'text-white/60',
            btn: 'bg-white/20 hover:bg-white/30 text-white',
        };
        case 'slate': return {
            card: 'bg-[#0F0F1C] hover:bg-[#161628] border border-[#252540] hover:border-[#7C3AED]/40',
            iconBg: 'bg-[#7C3AED]/10 border border-[#7C3AED]/20',
            suit: 'text-[#A78BFA]',
            name: 'text-[#E2E2F0]',
            tag: 'bg-[#7C3AED]/20 text-[#A78BFA]',
            desc: 'text-[#9494B8]',
            btn: 'bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#A78BFA]',
        };
        case 'red': return {
            card: 'bg-[#0F0F1C] hover:bg-[#161628] border border-[#252540] hover:border-[#F87171]/40',
            iconBg: 'bg-[#F87171]/10 border border-[#F87171]/20',
            suit: 'text-[#F87171]',
            name: 'text-[#E2E2F0]',
            tag: 'bg-[#F87171]/20 text-[#F87171]',
            desc: 'text-[#9494B8]',
            btn: 'bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171]',
        };
        case 'gold': return {
            card: 'bg-[#0F0F1C] hover:bg-[#161628] border border-[#252540] hover:border-[#FBBF24]/40',
            iconBg: 'bg-[#FBBF24]/10 border border-[#FBBF24]/20',
            suit: 'text-[#FBBF24]',
            name: 'text-[#E2E2F0]',
            tag: 'bg-[#FBBF24]/20 text-[#FBBF24]',
            desc: 'text-[#9494B8]',
            btn: 'bg-[#FBBF24]/20 hover:bg-[#FBBF24]/30 text-[#FBBF24]',
        };
    }
}

type MenuProps = {
    username: string;
};

export default function Menu({ username }: MenuProps) {
    return (
        <div className="flex-1 px-8 py-10 max-w-4xl w-full">

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-[#E2E2F0]">
                    Welcome back, <span className="text-[#A78BFA]">{username}</span>
                </h1>
                <p className="text-[#9494B8] text-sm mt-1">Pick a game and start playing.</p>
            </div>

            {/* Game modes */}
            <div className="mb-10">
                <h2 className="text-xs font-semibold text-[#9494B8] uppercase tracking-wider mb-4">Choose a game</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {GAME_MODES.map((mode) => {
                        const t = getTheme(mode.theme);
                        return (
                            <button
                                key={mode.id}
                                className={`${t.card} rounded-2xl p-6 text-left transition-all duration-200 cursor-pointer group`}
                            >
                                {/* Top row: icon + badge */}
                                <div className="flex items-start justify-between mb-5">
                                    <div className={`w-11 h-11 rounded-xl ${t.iconBg} flex items-center justify-center`}>
                                        <span className={`text-xl leading-none select-none ${t.suit}`}>{mode.suit}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {mode.badge && (
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.tag}`}>
                                                {mode.badge}
                                            </span>
                                        )}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.tag}`}>
                                            {mode.players}
                                        </span>
                                    </div>
                                </div>

                                {/* Name + description */}
                                <p className={`font-semibold text-base mb-1 ${t.name}`}>{mode.name}</p>
                                <p className={`text-sm ${t.desc}`}>{mode.description}</p>

                                {/* CTA */}
                                <div className={`mt-5 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 ${t.btn}`}>
                                    Play
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-150">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active tables */}
            <div>
                <h2 className="text-xs font-semibold text-[#9494B8] uppercase tracking-wider mb-4">Active tables</h2>
                <div className="bg-[#0F0F1C] border border-[#252540] rounded-2xl">
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#161628] border border-[#252540] flex items-center justify-center">
                            <span className="text-[#4A4A6A] text-2xl select-none">♠</span>
                        </div>
                        <p className="text-[#9494B8] text-sm">No active tables yet.</p>
                        <p className="text-[#4A4A6A] text-xs">Create one to get started!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
