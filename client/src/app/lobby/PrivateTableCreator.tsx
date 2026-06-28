'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import type { OnlineUser, PrivateTableState } from './types';

type Props = {
    onClose: () => void;
    onlineUsers: OnlineUser[];
    currentUserId: string;
};

function LockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

type InviteStatus = 'pending' | 'accepted' | 'declined' | 'joined' | null;

export default function PrivateTableCreator({ onClose, onlineUsers, currentUserId }: Props) {
    const [phase, setPhase] = useState<'creating' | 'lobby'>('creating');
    const [tableState, setTableState] = useState<PrivateTableState | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const socket = getSocket();

        socket.on('private:created', () => {
            setPhase('lobby');
        });

        socket.on('private:state', (state: PrivateTableState) => {
            setTableState(state);
        });

        // Create the table immediately on mount
        socket.emit('private:create');

        return () => {
            socket.off('private:created');
            socket.off('private:state');
        };
    }, []);

    const handleInvite = (targetUserId: string) => {
        if (!tableState) return;
        getSocket().emit('private:invite', { tableId: tableState.tableId, targetUserId });
    };

    const handleCopy = () => {
        if (!tableState?.roomCode) return;
        navigator.clipboard.writeText(tableState.roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getInviteStatus = (userId: string): InviteStatus => {
        if (!tableState) return null;
        if (tableState.players.some((p) => p.id === userId)) return 'joined';
        return tableState.invited.find((i) => i.id === userId)?.status ?? null;
    };

    const otherUsers = onlineUsers.filter((u) => u.id !== currentUserId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={phase === 'creating' ? onClose : undefined} />
            <div className="relative bg-[#0C0C1E] border border-[#D4AF37]/20 rounded-2xl w-full max-w-md shadow-[0_0_80px_rgba(212,175,55,0.06)] overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b border-[#1E1E3A] shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                                <LockIcon />
                            </div>
                            <div>
                                <h2 className="text-[#E2E2F0] font-semibold text-base leading-tight">Private Table</h2>
                                <p className="text-[#3A3A5C] text-xs mt-0.5">Texas Hold&apos;em · 9 players</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-[#111127] hover:bg-[#1E1E3A] border border-[#1E1E3A] text-[#4A4A6A] hover:text-[#9494B8] flex items-center justify-center transition-all duration-150 cursor-pointer text-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    {phase === 'creating' || !tableState ? (
                        /* Loading while server creates the table */
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
                            <p className="text-[#6B6B8A] text-sm">Creating your table…</p>
                        </div>
                    ) : (
                        <div className="px-6 py-5 flex flex-col gap-6">

                            {/* Room code */}
                            <div>
                                <p className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-[0.15em] mb-2.5">Room Code</p>
                                <div className="flex items-center gap-3 bg-[#06060F] border border-[#1E1E3A] rounded-xl px-4 py-3">
                                    <span className="flex-1 text-center text-2xl font-bold tracking-[0.35em] text-[#D4AF37] font-mono select-all">
                                        {tableState.roomCode}
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold transition-all duration-150 cursor-pointer"
                                    >
                                        {copied ? '✓ Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Players in table */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <p className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-[0.15em]">
                                        Players
                                    </p>
                                    <span className="text-[10px] font-semibold text-[#4A4A6A]">
                                        {tableState.players.length} / 9
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {tableState.players.map((p) => (
                                        <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 bg-[#06060F] border border-[#1E1E3A] rounded-xl">
                                            <div className="w-6 h-6 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/40 flex items-center justify-center shrink-0">
                                                <span className="text-[#C4B5FD] text-[10px] font-semibold">{p.username[0].toUpperCase()}</span>
                                            </div>
                                            <span className="text-sm text-[#C4C4E0] flex-1">{p.username}</span>
                                            {p.id === tableState.creatorId && (
                                                <span className="text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                                    Host
                                                </span>
                                            )}
                                            {p.id === currentUserId && p.id !== tableState.creatorId && (
                                                <span className="text-[9px] text-[#6B6B8A]">you</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Online players to invite */}
                            <div>
                                <p className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-[0.15em] mb-2.5">
                                    Invite Online Players
                                </p>
                                {otherUsers.length === 0 ? (
                                    <div className="flex flex-col items-center py-6 gap-2">
                                        <div className="w-9 h-9 rounded-xl bg-[#111127] border border-[#1E1E3A] flex items-center justify-center">
                                            <UserIcon />
                                        </div>
                                        <p className="text-[#4A4A6A] text-xs">No other players online.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {otherUsers.map((u) => {
                                            const status = getInviteStatus(u.id);
                                            const alreadyIn = status === 'joined';
                                            const invited = status !== null && status !== 'joined';

                                            return (
                                                <div key={u.id} className="flex items-center gap-2.5 px-3 py-2 bg-[#06060F] border border-[#1E1E3A] rounded-xl">
                                                    <div className="relative shrink-0">
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt={u.username} className="w-7 h-7 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/40 flex items-center justify-center">
                                                                <span className="text-[#C4B5FD] text-xs font-semibold">{u.username[0].toUpperCase()}</span>
                                                            </div>
                                                        )}
                                                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-[#0C0C1E]" />
                                                    </div>

                                                    <span className="text-sm text-[#C4C4E0] flex-1 truncate">{u.username}</span>

                                                    {alreadyIn ? (
                                                        <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg">
                                                            Joined
                                                        </span>
                                                    ) : status === 'pending' ? (
                                                        <span className="text-[10px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2 py-0.5 rounded-lg">
                                                            Pending…
                                                        </span>
                                                    ) : status === 'declined' ? (
                                                        <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg">
                                                            Declined
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleInvite(u.id)}
                                                            disabled={invited}
                                                            className="text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/20 hover:border-[#7C3AED]/40 px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer"
                                                        >
                                                            Invite
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Start game button */}
                            <button
                                disabled={tableState.players.length < 2}
                                className="w-full py-3 bg-[#D4AF37] hover:bg-[#C9A227] disabled:bg-[#1A1A30] disabled:text-[#3A3A5C] text-[#060611] font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.15)] hover:shadow-[0_0_35px_rgba(212,175,55,0.25)] disabled:shadow-none disabled:cursor-not-allowed mt-1"
                            >
                                {tableState.players.length < 2 ? 'Waiting for players…' : 'Start Game'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
