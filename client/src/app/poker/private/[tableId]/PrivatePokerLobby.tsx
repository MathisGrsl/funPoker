'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { connectSocket, getSocket } from '@/lib/socket';
import type { OnlineUser, PrivateTableState } from '@/app/lobby/types';

const SEAT_POSITIONS = [
    { top: '88%', left: '50%' },
    { top: '70%', left: '10%' },
    { top: '44%', left: '1%'  },
    { top: '18%', left: '12%' },
    { top: '5%',  left: '30%' },
    { top: '5%',  left: '70%' },
    { top: '18%', left: '88%' },
    { top: '44%', left: '99%' },
    { top: '70%', left: '90%' },
];

const BLIND_OPTIONS = [
    { sb: '0.10', bb: '0.20', label: '€0.10 / €0.20', stack: '€20' },
    { sb: '0.50', bb: '1.00', label: '€0.50 / €1.00', stack: '€100' },
    { sb: '1.00', bb: '2.00', label: '€1.00 / €2.00', stack: '€200' },
    { sb: '5.00', bb: '10.00', label: '€5 / €10', stack: '€1 000' },
];

type Props = { tableId: string };

export default function PrivatePokerLobby({ tableId }: Props) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [tableState, setTableState] = useState<PrivateTableState | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!notFound) return;
        const t = setTimeout(() => router.push('/lobby'), 2000);
        return () => clearTimeout(t);
    }, [notFound, router]);
    const [selectedBlinds, setSelectedBlinds] = useState(BLIND_OPTIONS[2]);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const socket = connectSocket();

        const handleOnline = (users: OnlineUser[]) => setOnlineUsers(users);
        const handleState = (state: PrivateTableState) => setTableState(state);
        const handleNotFound = () => setNotFound(true);
        const handleGameStarted = ({ tableId: gameTableId }: { tableId: string }) => {
            router.push(`/poker/game/${gameTableId}`);
        };
        const doRejoin = () => socket.emit('private:rejoin', { tableId });

        socket.on('users:online', handleOnline);
        socket.on('private:state', handleState);
        socket.on('private:not_found', handleNotFound);
        socket.on('private:game_started', handleGameStarted);
        socket.on('connect', doRejoin);

        if (socket.connected) doRejoin();

        return () => {
            socket.off('users:online', handleOnline);
            socket.off('private:state', handleState);
            socket.off('private:not_found', handleNotFound);
            socket.off('private:game_started', handleGameStarted);
            socket.off('connect', doRejoin);
        };
    }, [user, tableId]);

    const handleInvite = useCallback((targetUserId: string) => {
        getSocket().emit('private:invite', { tableId, targetUserId });
    }, [tableId]);

    const handleStart = useCallback(() => {
        getSocket().emit('private:start', { tableId, sb: selectedBlinds.sb, bb: selectedBlinds.bb });
    }, [tableId, selectedBlinds]);

    const getStatus = (uid: string) => {
        if (!tableState) return null;
        if (tableState.players.some((p) => p.id === uid)) return 'joined';
        return tableState.invited.find((i) => i.id === uid)?.status ?? null;
    };

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading || (!tableState && !notFound)) {
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
                    <p className="text-[#3A3A5A] text-sm">Loading table…</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-[#06060F] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <p className="text-[#E2E2F0] font-semibold">Table not found</p>
                    <p className="text-[#4A4A6A] text-xs">Redirecting to lobby…</p>
                    <div className="w-5 h-5 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    const isCreator = tableState!.creatorId === user!.id;
    const playerCount = tableState!.players.length;
    const otherUsers = onlineUsers.filter((u) => u.id !== user!.id);

    return (
        <div className="min-h-screen bg-[#06060F] text-[#E2E2F0] flex">

            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/3 w-[700px] h-[350px] rounded-full bg-[#7C3AED] opacity-[0.04] blur-[160px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full bg-[#D4AF37] opacity-[0.025] blur-[150px]" />
            </div>

            {/* ── Left sidebar ─────────────────────────────────────────────────── */}
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

                {/* Online players list */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-semibold text-[#6B6B8A] uppercase tracking-wider">
                            {isCreator ? 'Invite players' : 'Online'}
                        </span>
                        <span className="text-[11px] font-semibold bg-[#7C3AED]/20 text-[#A78BFA] px-2 py-0.5 rounded-full">
                            {otherUsers.length}
                        </span>
                    </div>

                    {otherUsers.length === 0 ? (
                        <p className="text-xs text-[#3A3A5A] text-center pt-6">No other players online</p>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {otherUsers.map((u) => {
                                const status = getStatus(u.id);
                                return (
                                    <li
                                        key={u.id}
                                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-[#0C0C1E] border border-[#1A1A30] hover:border-[#2A2A4A] transition-colors"
                                    >
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

                                        <span className="text-xs text-[#C4C4E0] flex-1 truncate">{u.username}</span>

                                        {status === 'joined' ? (
                                            <span className="text-[9px] font-bold text-green-400 shrink-0">✓ In</span>
                                        ) : status === 'pending' ? (
                                            <span className="text-[9px] font-semibold text-[#D4AF37] shrink-0 animate-pulse">Sent…</span>
                                        ) : status === 'declined' ? (
                                            <span className="text-[9px] font-semibold text-red-400 shrink-0">Declined</span>
                                        ) : isCreator ? (
                                            <button
                                                onClick={() => handleInvite(u.id)}
                                                className="text-[9px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/25 border border-[#7C3AED]/20 hover:border-[#7C3AED]/50 px-2 py-1 rounded-md transition-all cursor-pointer shrink-0"
                                            >
                                                Invite
                                            </button>
                                        ) : null}
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
                            <span className="text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-1.5 py-0.5 rounded-md shrink-0">Host</span>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main content ─────────────────────────────────────────────────── */}
            <main className="ml-64 flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-6 gap-5">

                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                        <span className="text-[#D4AF37] text-xs select-none">♦</span>
                        <span className="text-[10px] font-bold text-[#3A3A5C] uppercase tracking-[0.2em]">Private Table</span>
                        <span className="text-[#D4AF37] text-xs select-none">♦</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#E2E2F0]">Texas Hold&apos;em</h1>
                    <p className="text-[#4A4A6A] text-xs mt-1">
                        {playerCount} / 9 seats · {isCreator ? 'Invite players from the sidebar' : 'Waiting for the host to start'}
                    </p>
                </div>

                {/* Premium poker table */}
                <div className="relative w-full select-none" style={{ maxWidth: 'min(calc(100vw - 280px), 860px)', aspectRatio: '2 / 1.15' }}>

                    {/* Drop shadow */}
                    <div
                        className="absolute inset-[3%] rounded-[48%]"
                        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.85), 0 8px 24px rgba(0,0,0,0.6)' }}
                    />

                    {/* Mahogany wood rail */}
                    <div
                        className="absolute inset-[3%] rounded-[48%]"
                        style={{
                            background: 'linear-gradient(145deg, #8B4220 0%, #5C2710 20%, #3A1608 38%, #2E1106 50%, #3A1608 62%, #5C2710 80%, #8B4220 100%)',
                            boxShadow: 'inset 0 4px 12px rgba(255,180,80,0.10), inset 0 -8px 24px rgba(0,0,0,0.55)',
                        }}
                    />

                    {/* Gold trim ring */}
                    <div
                        className="absolute inset-[5.8%] rounded-[44%]"
                        style={{ boxShadow: '0 0 0 2px rgba(200,150,40,0.55), inset 0 0 0 1px rgba(255,210,80,0.20)' }}
                    />

                    {/* Felt */}
                    <div
                        className="absolute inset-[7%] rounded-[42%] overflow-hidden"
                        style={{ background: 'radial-gradient(ellipse 85% 75% at 50% 42%, #1e6e3a 0%, #145228 40%, #0b3519 70%, #061e0e 100%)' }}
                    >
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 38%, rgba(255,255,255,0.045) 0%, transparent 70%)' }}
                        />
                        <div
                            className="absolute inset-[3.5%] rounded-[42%] pointer-events-none"
                            style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.06)' }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none pointer-events-none">
                            <span style={{ fontSize: '3rem', opacity: 0.07, lineHeight: 1 }}>♠</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ opacity: 0.07, color: '#fff' }}>funPoker</span>
                        </div>
                    </div>

                    {/* Seats */}
                    {SEAT_POSITIONS.map((pos, i) => {
                        const player = tableState!.players[i] ?? null;
                        const isHost = player?.id === tableState!.creatorId;

                        return (
                            <div
                                key={i}
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ top: pos.top, left: pos.left }}
                            >
                                {player ? (
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                                            isHost
                                                ? 'border-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.4)] bg-[#D4AF37]/10'
                                                : 'border-[#7C3AED]/60 shadow-[0_0_12px_rgba(124,58,237,0.2)] bg-[#7C3AED]/10'
                                        }`}>
                                            {player.avatar ? (
                                                <img src={player.avatar} alt={player.username} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span className={`text-base font-black ${isHost ? 'text-[#D4AF37]' : 'text-[#A78BFA]'}`}>
                                                    {player.username[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`bg-black/80 border rounded-lg px-2.5 py-1 max-w-[84px] backdrop-blur-sm ${isHost ? 'border-[#D4AF37]/20' : 'border-[#7C3AED]/20'}`}>
                                            <p className="text-[11px] text-white font-semibold truncate text-center leading-tight">{player.username}</p>
                                            {isHost && <p className="text-[9px] text-[#D4AF37] text-center font-bold">Host</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#1E1E3A] bg-black/30 flex items-center justify-center">
                                        <span className="text-[#252545] text-xs font-semibold">{i + 1}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom controls */}
                <div className="flex flex-col items-center gap-4 w-full" style={{ maxWidth: '420px' }}>
                    {isCreator ? (
                        <>
                            {/* Blind selector */}
                            <div className="w-full flex flex-col gap-2">
                                <p className="text-[11px] font-semibold text-[#6B6B8A] uppercase tracking-wider text-center">Blinds</p>
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {BLIND_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.label}
                                            onClick={() => setSelectedBlinds(opt)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                                selectedBlinds.label === opt.label
                                                    ? 'bg-[#7C3AED]/30 border-[#7C3AED] text-[#A78BFA]'
                                                    : 'bg-black/30 border-[#1E1E3A] text-[#4A4A6A] hover:border-[#3A3A5A] hover:text-[#6B6B8A]'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-[#3A3A5A] text-center">
                                    Starting stack · {selectedBlinds.stack} (100 BB)
                                </p>
                            </div>

                            <button
                                onClick={handleStart}
                                disabled={playerCount < 2}
                                className="w-full px-8 py-3.5 bg-[#D4AF37] hover:bg-[#C9A227] disabled:bg-[#1A1A30] disabled:text-[#3A3A5C] text-[#060611] font-bold rounded-xl text-sm transition-all cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.35)] disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                {playerCount < 2 ? 'Waiting for players…' : `Start Game · ${playerCount} players`}
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-[#4A4A6A] text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                            Waiting for the host to start the game…
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
