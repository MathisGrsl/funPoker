'use client';

import { useRef, useEffect, useState } from 'react';
import type { AuthUser } from '@/hooks/useAuth';
import type { OnlineUser } from './types';

type NavbarProps = {
    user: AuthUser;
    onlineUsers: OnlineUser[];
    onLogout: () => void;
};

export default function Navbar({ user, onlineUsers, onLogout }: NavbarProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setSettingsOpen(false);
            }
        }
        if (settingsOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [settingsOpen]);

    return (
        <aside className="w-60 shrink-0 fixed inset-y-0 left-0 flex flex-col bg-[#0F0F1C] border-r border-[#252540] z-20">

            {/* Logo */}
            <div className="px-5 py-5 border-b border-[#252540]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                        <span className="text-white text-lg leading-none select-none">♠</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-[#E2E2F0]">funPoker</span>
                </div>
            </div>

            {/* Online players */}
            <div className="flex-1 overflow-y-auto px-4 py-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-[#9494B8] uppercase tracking-wider">Online</span>
                    <span className="text-xs font-semibold bg-[#7C3AED]/20 text-[#A78BFA] px-2 py-0.5 rounded-full">
                        {onlineUsers.length}
                    </span>
                </div>

                {onlineUsers.length === 0 ? (
                    <p className="text-xs text-[#4A4A6A] text-center pt-4">No one online yet.</p>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {onlineUsers.map((u) => (
                            <li key={u.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#161628] transition-colors">
                                <div className="relative shrink-0">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt={u.username} className="w-7 h-7 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/40 flex items-center justify-center">
                                            <span className="text-[#C4B5FD] text-xs font-semibold">
                                                {u.username[0].toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0F0F1C]" />
                                </div>
                                <span className={`text-sm truncate ${u.id === user.id ? 'text-[#A78BFA] font-medium' : 'text-[#C4C4E0]'}`}>
                                    {u.username}
                                    {u.id === user.id && <span className="text-[#6B6B8A] font-normal"> (you)</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Bottom: user + settings */}
            <div className="border-t border-[#252540] p-3 relative" ref={settingsRef}>

                {/* Settings panel */}
                {settingsOpen && (
                    <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#161628] border border-[#252540] rounded-xl p-4 shadow-xl">
                        <p className="text-xs text-[#6B6B8A] mb-3 uppercase tracking-wider font-semibold">Account</p>
                        <div className="flex items-center gap-3 mb-4">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-full object-cover ring-2 ring-[#252540]" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/50 flex items-center justify-center shrink-0">
                                    <span className="text-[#C4B5FD] text-sm font-semibold">{user.username[0].toUpperCase()}</span>
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#E2E2F0] truncate">{user.username}</p>
                                <p className="text-xs text-[#6B6B8A] truncate">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full text-sm text-[#F87171] hover:text-white bg-[#F87171]/10 hover:bg-[#F87171]/20 border border-[#F87171]/20 hover:border-[#F87171]/40 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer text-left"
                        >
                            Log out
                        </button>
                    </div>
                )}

                {/* User row */}
                <button
                    onClick={() => setSettingsOpen((v) => !v)}
                    className={`flex items-center gap-3 w-full px-2 py-2 rounded-xl transition-all duration-150 cursor-pointer group ${settingsOpen ? 'bg-[#161628]' : 'hover:bg-[#161628]'}`}
                >
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover ring-2 ring-[#252540] shrink-0" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/50 flex items-center justify-center shrink-0">
                            <span className="text-[#C4B5FD] text-sm font-semibold">{user.username[0].toUpperCase()}</span>
                        </div>
                    )}
                    <span className="text-sm font-medium text-[#C4B5FD] truncate flex-1 text-left">{user.username}</span>
                    <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={`shrink-0 transition-all duration-200 ${settingsOpen ? 'rotate-45 text-[#A78BFA]' : 'text-[#6B6B8A] group-hover:text-[#9494B8]'}`}
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}
