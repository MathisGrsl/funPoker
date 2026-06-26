'use client';

import { useEffect, useState } from 'react';

/**
 * Anneau de compte à rebours (style casino) autour du joueur actif.
 * `deadline` = epoch ms de fin ; `durationMs` = durée totale pour la jauge.
 */
export default function CircularTimer({ deadline, durationMs, size = 46 }: { deadline: number; durationMs: number; size?: number }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(id);
    }, []);

    const remaining = Math.max(0, deadline - now);
    const fraction = Math.max(0, Math.min(1, remaining / durationMs));
    const seconds = Math.ceil(remaining / 1000);

    const stroke = 4;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const danger = seconds <= 5;
    const color = danger ? '#EF4444' : '#D4AF37';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - fraction)}
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
            </svg>
            <span
                className={`absolute inset-0 flex items-center justify-center font-bold ${danger ? 'text-red-400' : 'text-white'}`}
                style={{ fontSize: size * 0.34 }}
            >
                {seconds}
            </span>
        </div>
    );
}
