'use client';

import { useEffect, useState } from 'react';

/** Secondes restantes avant `deadline` (epoch ms), ou null si pas de minuteur. */
export function useCountdown(deadline: number | null): number | null {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!deadline) return;
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, [deadline]);

    if (!deadline) return null;
    return Math.max(0, Math.ceil((deadline - now) / 1000));
}
