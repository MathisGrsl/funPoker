'use client';

import { useState } from 'react';
import MenuPrivateTournament from './MenuPrivateTournament';

type GameMode = {
    id: string;
    name: string;
    players: string;
    description: string;
    suit: string;
    badge?: string;
    theme: 'purple' | 'red' | 'gold';
};

const GAME_MODES: GameMode[] = [
    {
        id: 'poker-5',
        name: "Texas Hold'em",
        players: '2–5 players',
        description: 'Short table, fast and intense games.',
        suit: '♠',
        theme: 'purple',
    },
    {
        id: 'poker-9',
        name: "Texas Hold'em",
        players: '2–9 players',
        description: 'Full table, classic poker experience.',
        suit: '♣',
        theme: 'purple',
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
        players: '2–5 players',
        description: 'Custom rules, wilds, and new thrills.',
        suit: '♦',
        theme: 'gold',
        badge: 'New',
    },
];

type Theme = {
    border: string;
    iconBg: string;
    suit: string;
    tag: string;
    btn: string;
    glow: string;
};

function getTheme(theme: GameMode['theme']): Theme {
    switch (theme) {
        case 'purple': return {
            border: 'border-[#1E1E3A] hover:border-[#7C3AED]/50',
            iconBg: 'bg-[#7C3AED]/10 border border-[#7C3AED]/20',
            suit: 'text-[#A78BFA]',
            tag: 'bg-[#7C3AED]/15 text-[#A78BFA]',
            btn: 'bg-[#7C3AED]/15 hover:bg-[#7C3AED]/25 border border-[#7C3AED]/20 hover:border-[#7C3AED]/40 text-[#A78BFA]',
            glow: 'hover:shadow-[0_4px_40px_rgba(124,58,237,0.08)]',
        };
        case 'red': return {
            border: 'border-[#1E1E3A] hover:border-[#EF4444]/50',
            iconBg: 'bg-[#EF4444]/10 border border-[#EF4444]/20',
            suit: 'text-[#F87171]',
            tag: 'bg-[#EF4444]/15 text-[#F87171]',
            btn: 'bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/20 hover:border-[#EF4444]/40 text-[#F87171]',
            glow: 'hover:shadow-[0_4px_40px_rgba(239,68,68,0.08)]',
        };
        case 'gold': return {
            border: 'border-[#1E1E3A] hover:border-[#D4AF37]/50',
            iconBg: 'bg-[#D4AF37]/10 border border-[#D4AF37]/20',
            suit: 'text-[#D4AF37]',
            tag: 'bg-[#D4AF37]/15 text-[#D4AF37]',
            btn: 'bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 text-[#D4AF37]',
            glow: 'hover:shadow-[0_4px_40px_rgba(212,175,55,0.08)]',
        };
    }
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#1E1E3A]" />
            <span className="text-[10px] font-bold text-[#3A3A5C] uppercase tracking-[0.2em] shrink-0">{label}</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#1E1E3A]" />
        </div>
    );
}

function LockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-150">
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    );
}

type MenuProps = {
    username: string;
};

export default function Menu({ username }: MenuProps) {
    const [privateGameOpen, setPrivateGameOpen] = useState(false);

    return (
        <>
            {privateGameOpen && <MenuPrivateTournament onClose={() => setPrivateGameOpen(false)} />}

            <div className="flex-1 px-8 py-10 w-full">

                {/* Hero header */}
                <div className="mb-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#D4AF37] text-xs select-none">♦</span>
                        <span className="text-[10px] font-bold text-[#3A3A5C] uppercase tracking-[0.2em]">Casino Lobby</span>
                        <span className="text-[#D4AF37] text-xs select-none">♦</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#E2E2F0]">
                        Welcome back, <span className="text-[#A78BFA]">{username}</span>
                    </h1>
                    <p className="text-[#4A4A6A] text-sm mt-1.5">
                        Pick a game or invite your friends to a private room.
                    </p>
                </div>

                {/* Game modes */}
                <SectionDivider label="Choose a game" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {GAME_MODES.map((mode) => {
                        const t = getTheme(mode.theme);
                        return (
                            <button
                                key={mode.id}
                                className={`relative bg-[#0C0C1E] hover:bg-[#111127] border ${t.border} rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer group overflow-hidden ${t.glow} min-h-[170px]`}
                            >
                                {/* Background decorative suit */}
                                <span className="absolute right-4 top-4 text-7xl opacity-[0.03] select-none pointer-events-none text-white leading-none">
                                    {mode.suit}
                                </span>

                                {/* Top row */}
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className={`w-10 h-10 rounded-xl ${t.iconBg} flex items-center justify-center`}>
                                        <span className={`text-lg leading-none select-none ${t.suit}`}>{mode.suit}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {mode.badge && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.tag}`}>
                                                {mode.badge}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#111127] border border-[#1E1E3A] text-[#4A4A6A]">
                                            {mode.players}
                                        </span>
                                    </div>
                                </div>

                                {/* Text */}
                                <div className="relative z-10">
                                    <p className="font-semibold text-[#E2E2F0] text-base mb-1">{mode.name}</p>
                                    <p className="text-sm text-[#6B6B8A]">{mode.description}</p>
                                </div>

                                {/* CTA */}
                                <div className={`mt-4 relative z-10 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 ${t.btn}`}>
                                    Play
                                    <ArrowIcon />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Private Tournament */}
                <SectionDivider label="Private Game" />

                <button
                    onClick={() => setPrivateGameOpen(true)}
                    className="w-full relative bg-[#0C0C1E] hover:bg-[#0E0E20] border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer group overflow-hidden hover:shadow-[0_4px_40px_rgba(212,175,55,0.05)]"
                >
                    {/* Gold gradient wash */}
                    <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-[#D4AF37]/[0.025] to-transparent pointer-events-none" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-[0.04] select-none pointer-events-none text-[#D4AF37] leading-none">♛</span>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                            <LockIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <p className="font-semibold text-[#E2E2F0] text-base">Private Tournament</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-[#D4AF37] uppercase tracking-wide">
                                    Friends only
                                </span>
                            </div>
                            <p className="text-sm text-[#6B6B8A]">Create a private room and share the code to play with your friends.</p>
                        </div>
                        <div className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] transition-all duration-150">
                            Open
                            <ArrowIcon />
                        </div>
                    </div>
                </button>

                {/* Active tables */}
                <SectionDivider label="Active Tables" />

                <div className="bg-[#0C0C1E] border border-[#1E1E3A] rounded-2xl">
                    <div className="flex flex-col items-center justify-center py-14 gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#111127] border border-[#1E1E3A] flex items-center justify-center">
                            <span className="text-[#2A2A4A] text-2xl select-none">♠</span>
                        </div>
                        <p className="text-[#4A4A6A] text-sm">No active tables yet.</p>
                        <p className="text-[#2A2A4A] text-xs">Create a game to get started.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
