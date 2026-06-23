'use client';

import { useState } from 'react';

type GameType = 'poker-5' | 'poker-9' | 'blackjack';

const GAME_OPTIONS: { id: GameType; label: string; suit: string }[] = [
    { id: 'poker-5', label: "Hold'em 5p", suit: '♠' },
    { id: 'poker-9', label: "Hold'em 9p", suit: '♣' },
    { id: 'blackjack', label: 'Blackjack', suit: '♥' },
];

function LockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

type Props = {
    onClose: () => void;
};

export default function MenuPrivateTournament({ onClose }: Props) {
    const [tab, setTab] = useState<'create' | 'join'>('create');
    const [roomCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [gameType, setGameType] = useState<GameType>('poker-5');

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0C0C1E] border border-[#D4AF37]/20 rounded-2xl w-full max-w-md shadow-[0_0_80px_rgba(212,175,55,0.06)] overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b border-[#1E1E3A]">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                                <LockIcon />
                            </div>
                            <div>
                                <h2 className="text-[#E2E2F0] font-semibold text-base leading-tight">Private Tournament</h2>
                                <p className="text-[#3A3A5C] text-xs mt-0.5">Invite-only · Play with friends</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-[#111127] hover:bg-[#1E1E3A] border border-[#1E1E3A] text-[#4A4A6A] hover:text-[#9494B8] flex items-center justify-center transition-all duration-150 cursor-pointer text-sm"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-[#06060F] rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setTab('create')}
                            className={`flex-1 text-sm py-2 rounded-lg font-semibold transition-all duration-150 cursor-pointer ${tab === 'create'
                                ? 'bg-[#D4AF37] text-[#060611] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                                : 'text-[#6B6B8A] hover:text-[#9494B8]'
                            }`}
                        >
                            Create Room
                        </button>
                        <button
                            onClick={() => setTab('join')}
                            className={`flex-1 text-sm py-2 rounded-lg font-semibold transition-all duration-150 cursor-pointer ${tab === 'join'
                                ? 'bg-[#D4AF37] text-[#060611] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                                : 'text-[#6B6B8A] hover:text-[#9494B8]'
                            }`}
                        >
                            Join Room
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-5">
                    {tab === 'create' ? (
                        <>
                            <div>
                                <p className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-[0.15em] mb-2.5">Game Type</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {GAME_OPTIONS.map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => setGameType(g.id)}
                                            className={`py-3 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all duration-150 cursor-pointer ${gameType === g.id
                                                ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                                                : 'border-[#1E1E3A] bg-[#06060F] text-[#4A4A6A] hover:border-[#2A2A4A] hover:text-[#9494B8]'
                                            }`}
                                        >
                                            <span className="text-lg">{g.suit}</span>
                                            <span>{g.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-[0.15em] mb-2.5">Your Room Code</p>
                                <div className="flex items-center gap-3 bg-[#06060F] border border-[#1E1E3A] rounded-xl px-4 py-3">
                                    <span className="flex-1 text-center text-2xl font-bold tracking-[0.35em] text-[#D4AF37] font-mono select-all">
                                        {roomCode}
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold transition-all duration-150 cursor-pointer"
                                    >
                                        {copied ? '✓ Done' : 'Copy'}
                                    </button>
                                </div>
                                <p className="text-xs text-[#3A3A5C] mt-2">Share this code with your friends to invite them.</p>
                            </div>

                            <button className="w-full py-3 bg-[#D4AF37] hover:bg-[#C9A227] text-[#060611] font-bold rounded-xl text-sm transition-all duration-150 cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.2)] hover:shadow-[0_0_35px_rgba(212,175,55,0.3)] mt-1">
                                Create & Wait for Players
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-[0.15em] mb-2.5">Room Code</p>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                                    placeholder="ABC123"
                                    maxLength={6}
                                    className="w-full bg-[#06060F] border border-[#1E1E3A] focus:border-[#D4AF37]/40 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.35em] text-[#D4AF37] font-mono placeholder:text-[#252545] placeholder:tracking-[0.15em] placeholder:text-lg outline-none transition-all duration-150"
                                />
                            </div>
                            <button
                                disabled={joinCode.length < 6}
                                className="w-full py-3 bg-[#D4AF37] hover:bg-[#C9A227] disabled:bg-[#1A1A30] disabled:text-[#3A3A5C] text-[#060611] font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.15)] hover:shadow-[0_0_35px_rgba(212,175,55,0.25)] disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                Join Room
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
