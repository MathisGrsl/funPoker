'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import type { OnlineUser, PrivateTableState } from '@/app/lobby/types';

// 9 seat positions around an oval table (top%, left% from container)
const SEAT_POSITIONS = [
    { top: '84%', left: '50%' },  // 1 — bottom-center (host)
    { top: '70%', left: '14%' },  // 2 — bottom-left
    { top: '44%', left: '3%'  },  // 3 — left
    { top: '18%', left: '14%' },  // 4 — top-left
    { top: '5%',  left: '33%' },  // 5 — top-left-center
    { top: '5%',  left: '61%' },  // 6 — top-right-center
    { top: '18%', left: '78%' },  // 7 — top-right
    { top: '44%', left: '89%' },  // 8 — right
    { top: '70%', left: '78%' },  // 9 — bottom-right
];

type Props = { tableId: string };

export default function PrivatePokerLobby({ tableId }: Props) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [tableState, setTableState] = useState<PrivateTableState | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const socket = connectSocket();

        socket.on('users:online', (users: OnlineUser[]) => setOnlineUsers(users));
        socket.on('private:state', (state: PrivateTableState) => setTableState(state));
        socket.on('private:not_found', () => setNotFound(true));

        // Join the private socket room and get current state
        socket.emit('private:rejoin', { tableId });

        return () => {
            socket.off('users:online');
            socket.off('private:state');
            socket.off('private:not_found');
            disconnectSocket();
        };
    }, [user, tableId]);

    const handleInvite = useCallback((targetUserId: string) => {
        getSocket().emit('private:invite', { tableId, targetUserId });
    }, [tableId]);

    const getStatus = (uid: string) => {
        if (!tableState) return null;
        if (tableState.players.some((p) => p.id === uid)) return 'joined';
        return tableState.invited.find((i) => i.id === uid)?.status ?? null;
    };

    if (loading || (!user && !notFound)) {
        return (
            <div className="min-h-screen bg-[#090910] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[#E2E2F0] text-lg font-semibold mb-2">Table not found</p>
                    <button onClick={() => router.push('/lobby')} className="text-[#A78BFA] text-sm hover:underline cursor-pointer">
                        Back to lobby
                    </button>
                </div>
            </div>
        );
    }

    const isCreator = tableState?.creatorId === user!.id;
    const playerCount = tableState?.players.length ?? 1;
    const otherUsers = onlineUsers.filter((u) => u.id !== user!.id);

    return (
        <div className="min-h-screen bg-[#06060F] text-[#E2E2F0] flex">

            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/3 w-[700px] h-[350px] rounded-full bg-[#7C3AED] opacity-[0.04] blur-[160px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full bg-[#D4AF37] opacity-[0.025] blur-[150px]" />
            </div>

            {/* ── Left sidebar ── */}
            <aside className="w-64 shrink-0 fixed inset-y-0 left-0 flex flex-col bg-[#08081A] border-r border-[#1A1A30] z-20">

                {/* Logo */}
                <div className="px-5 py-5 border-b border-[#1A1A30]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.45)]">
                            <span className="text-white text-lg leading-none select-none">♠</span>
                        </div>
                        <div>
                            <span className="font-bold text-base tracking-tight text-[#E2E2F0]">funPoker</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[#D4AF37] text-[9px] select-none">♦</span>
                                <span className="text-[9px] font-semibold text-[#3A3A5C] uppercase tracking-widest">Private</span>
                                <span className="text-[#D4AF37] text-[9px] select-none">♦</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back to lobby */}
                <div className="px-4 py-3 border-b border-[#1A1A30]">
                    <button
                        onClick={() => router.push('/lobby')}
                        className="flex items-center gap-2 text-xs text-[#6B6B8A] hover:text-[#9494B8] transition-colors cursor-pointer"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 5l-7 7 7 7" />
                        </svg>
                        Back to lobby
                    </button>
                </div>

                {/* Online players to invite */}
                <div className="flex-1 overflow-y-auto px-4 py-5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-[#9494B8] uppercase tracking-wider">Online</span>
                        <span className="text-xs font-semibold bg-[#7C3AED]/20 text-[#A78BFA] px-2 py-0.5 rounded-full">
                            {otherUsers.length}
                        </span>
                    </div>

                    {otherUsers.length === 0 ? (
                        <p className="text-xs text-[#4A4A6A] text-center pt-4">No other players online.</p>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {otherUsers.map((u) => {
                                const status = getStatus(u.id);
                                return (
                                    <li
                                        key={u.id}
                                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-[#0C0C1E] border border-[#1A1A30] hover:border-[#2A2A4A] transition-colors"
                                    >
                                        {/* Avatar */}
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

                                        {/* Name */}
                                        <span className="text-xs text-[#C4C4E0] flex-1 truncate">{u.username}</span>

                                        {/* Status / Invite button */}
                                        {status === 'joined' ? (
                                            <span className="text-[9px] font-bold text-green-400 shrink-0">✓ Joined</span>
                                        ) : status === 'pending' ? (
                                            <span className="text-[9px] font-semibold text-[#D4AF37] shrink-0 animate-pulse">Sent…</span>
                                        ) : status === 'declined' ? (
                                            <span className="text-[9px] font-semibold text-red-400 shrink-0">Declined</span>
                                        ) : (
                                            <button
                                                onClick={() => handleInvite(u.id)}
                                                className="text-[9px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/25 border border-[#7C3AED]/20 hover:border-[#7C3AED]/50 px-2 py-1 rounded-md transition-all cursor-pointer shrink-0"
                                            >
                                                Invite
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Current user footer */}
                <div className="border-t border-[#1A1A30] px-4 py-3">
                    <div className="flex items-center gap-3 px-1 py-1.5">
                        {user!.avatar ? (
                            <img src={user!.avatar} alt={user!.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/50 flex items-center justify-center shrink-0">
                                <span className="text-[#C4B5FD] text-sm font-semibold">{user!.username[0].toUpperCase()}</span>
                            </div>
                        )}
                        <span className="text-sm font-medium text-[#C4B5FD] truncate flex-1">{user!.username}</span>
                        {isCreator && (
                            <span className="text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-1.5 py-0.5 rounded-md shrink-0">
                                Host
                            </span>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="ml-64 flex-1 flex flex-col items-center justify-center relative z-10 p-8 gap-8">

                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-[#D4AF37] text-xs select-none">♦</span>
                        <span className="text-[10px] font-bold text-[#3A3A5C] uppercase tracking-[0.2em]">Private Table</span>
                        <span className="text-[#D4AF37] text-xs select-none">♦</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#E2E2F0]">Texas Hold&apos;em</h1>
                    <p className="text-[#4A4A6A] text-sm mt-1.5">
                        {playerCount} / 9 players · {isCreator ? 'Invite players from the sidebar' : 'Waiting for the host to start'}
                    </p>
                </div>

                {/* Poker table */}
                <div className="relative w-full max-w-2xl" style={{ aspectRatio: '2 / 1.1' }}>

                    {/* Outer rail */}
                    <div className="absolute inset-[6%] rounded-[50%] bg-[#2D1800] shadow-[0_0_0_8px_#1A0E00,0_0_80px_rgba(0,0,0,0.9)]" />

                    {/* Felt surface */}
                    <div className="absolute inset-[9%] rounded-[50%] bg-[#0B3D20] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
                        {/* Inner felt line */}
                        <div className="absolute inset-[6%] rounded-[50%] border border-[#175C32]/60" />
                        {/* Center logo */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none pointer-events-none">
                            <span className="text-[#175C32] text-5xl opacity-50">♠</span>
                            <span className="text-[#175C32] text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">funPoker</span>
                        </div>
                    </div>

                    {/* Seats */}
                    {SEAT_POSITIONS.map((pos, i) => {
                        const seatNum = i + 1;
                        const player = tableState?.players[i] ?? null;
                        const isHost = player?.id === tableState?.creatorId;

                        return (
                            <div
                                key={seatNum}
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ top: pos.top, left: pos.left }}
                            >
                                {player ? (
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 ${
                                            isHost
                                                ? 'border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                                                : 'border-[#7C3AED]/70 bg-gradient-to-br from-[#7C3AED]/30 to-[#7C3AED]/10 shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                                        }`}>
                                            <span className={`text-base font-bold ${isHost ? 'text-[#D4AF37]' : 'text-[#A78BFA]'}`}>
                                                {player.username[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="bg-[#060612]/90 backdrop-blur-sm border border-[#1E1E3A] rounded-lg px-2 py-0.5 max-w-[76px]">
                                            <p className="text-[10px] text-[#C4C4E0] font-medium truncate text-center leading-tight">
                                                {player.username}
                                            </p>
                                            {isHost && (
                                                <p className="text-[8px] text-[#D4AF37] text-center font-bold uppercase tracking-wide">Host</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#1E1E3A] bg-[#060612]/40 flex items-center justify-center">
                                            <span className="text-[#252545] text-xs font-semibold">{seatNum}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Start button / waiting message */}
                <div className="flex flex-col items-center gap-2">
                    {isCreator ? (
                        <button
                            disabled={playerCount < 2}
                            className="px-12 py-3.5 bg-[#D4AF37] hover:bg-[#C9A227] disabled:bg-[#1A1A30] disabled:text-[#3A3A5C] text-[#060611] font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.35)] disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            {playerCount < 2 ? 'Waiting for players…' : `Start Game · ${playerCount} players`}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-[#4A4A6A] text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                            Waiting for the host to start the game…
                        </div>
                    )}
                    <p className="text-[#2A2A4A] text-xs">Texas Hold&apos;em · 9 players max · Blinds 10 / 20</p>
                </div>
            </main>
        </div>
    );
}
