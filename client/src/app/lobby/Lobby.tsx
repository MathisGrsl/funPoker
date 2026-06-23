'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import Navbar from './Navbar';
import Menu from './Menu';
import type { OnlineUser } from './types';

export default function Lobby() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const socket = connectSocket();
        socket.on('users:online', (users: OnlineUser[]) => setOnlineUsers(users));
        return () => {
            socket.off('users:online');
            disconnectSocket();
        };
    }, [user]);

    const handleLogout = async () => {
        disconnectSocket();
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#090910] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#06060F] text-[#E2E2F0] flex">

            {/* background glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/3 w-[700px] h-[350px] rounded-full bg-[#7C3AED] opacity-[0.04] blur-[160px]" />
                <div className="absolute top-0 right-1/4 w-[400px] h-[250px] rounded-full bg-[#D4AF37] opacity-[0.025] blur-[140px]" />
            </div>

            <Navbar user={user} onlineUsers={onlineUsers} onLogout={handleLogout} />

            <main className="ml-60 flex-1 flex justify-center relative z-10">
                <Menu username={user.username} />
            </main>
        </div>
    );
}
