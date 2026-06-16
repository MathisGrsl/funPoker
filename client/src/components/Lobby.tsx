'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Lobby() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#090910] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
            </main>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen bg-[#090910] text-[#E2E2F0] flex flex-col">
            {/* background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#7C3AED] opacity-[0.04] blur-[160px]" />
            </div>

            {/* header */}
            <header className="relative z-10 border-b border-[#252540] bg-[#0F0F1C]/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                        <span className="text-white text-lg leading-none select-none">♠</span>
                    </div>
                    <span className="text-[#E2E2F0] font-bold text-lg tracking-tight">funPoker</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover ring-2 ring-[#252540]" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/50 flex items-center justify-center">
                                <span className="text-[#C4B5FD] text-sm font-semibold">
                                    {user.username[0].toUpperCase()}
                                </span>
                            </div>
                        )}
                        <span className="text-sm font-medium text-[#C4B5FD]">{user.username}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-xs text-[#9494B8] hover:text-[#E2E2F0] border border-[#252540] hover:border-[#7C3AED]/40 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
                    >
                        Log out
                    </button>
                </div>
            </header>

            {/* main content */}
            <div className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-10">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-[#E2E2F0]">
                        Welcome back, <span className="text-[#A78BFA]">{user.username}</span>
                    </h1>
                    <p className="text-[#9494B8] text-sm mt-1">Choose a table and start playing.</p>
                </div>

                {/* quick actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    <button className="group bg-[#7C3AED] hover:bg-[#6D28D9] rounded-2xl p-6 text-left transition-all duration-200 shadow-[0_4px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_40px_rgba(124,58,237,0.5)] cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </div>
                        <p className="font-semibold text-white text-base">Create a table</p>
                        <p className="text-white/60 text-sm mt-1">Start a private game with your friends.</p>
                    </button>

                    <button className="group bg-[#0F0F1C] hover:bg-[#161628] border border-[#252540] hover:border-[#7C3AED]/40 rounded-2xl p-6 text-left transition-all duration-200 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mb-4">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <p className="font-semibold text-[#E2E2F0] text-base">Join a table</p>
                        <p className="text-[#9494B8] text-sm mt-1">Enter a code to join a friend's game.</p>
                    </button>
                </div>

                {/* active tables */}
                <div>
                    <h2 className="text-sm font-semibold text-[#9494B8] uppercase tracking-wider mb-4">Active tables</h2>
                    <div className="bg-[#0F0F1C] border border-[#252540] rounded-2xl overflow-hidden">
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
        </main>
    );
}
