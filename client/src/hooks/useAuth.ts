'use client';

import { useState, useEffect } from 'react';
import { SERVER_URL } from '@/globalVariables';

export type AuthUser = {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
};

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${SERVER_URL}/api/auth/me`, { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => setUser(data?.user ?? null))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const logout = async () => {
        await fetch(`${SERVER_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
        setUser(null);
    };

    return { user, loading, logout };
}
