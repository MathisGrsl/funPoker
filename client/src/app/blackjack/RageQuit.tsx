'use client';

import { CSSProperties } from 'react';

const DEBRIS = ['🃏', '🂡', '🪙', '💰', '💥', '🂱', '🃞', '💢', '🃍', '🂮', '🪙', '💥'];

/** Overlay plein écran : flash rouge + « RAGE QUIT » + débris projetés. Monté le temps de l'animation. */
export default function RageQuit() {
    return (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
            {/* Flash rouge */}
            <div
                className="bj-rage-flash absolute inset-0"
                style={{ background: 'radial-gradient(circle at 50% 42%, rgba(220,38,38,0.55), rgba(90,0,0,0.85))' }}
            />

            {/* Débris projetés depuis le centre */}
            <div className="absolute left-1/2 top-[56%]">
                {Array.from({ length: 24 }).map((_, i) => {
                    const a = (i / 24) * Math.PI * 2 + (i % 2 ? 0.28 : 0);
                    const dist = 240 + (i % 5) * 64;
                    return (
                        <span
                            key={i}
                            className="bj-debris-p absolute block"
                            style={{
                                '--tx': `${Math.cos(a) * dist}px`,
                                '--ty': `${Math.sin(a) * dist - 140}px`,
                                '--rot': `${(i % 2 ? 1 : -1) * (200 + i * 22)}deg`,
                                fontSize: 26 + (i % 4) * 9,
                                animationDelay: `${(i % 6) * 22}ms`,
                            } as CSSProperties}
                        >
                            {DEBRIS[i % DEBRIS.length]}
                        </span>
                    );
                })}
            </div>

            {/* Texte */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-7xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">😤</div>
                    <div className="mt-1 text-4xl font-black tracking-[0.2em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">RAGE QUIT</div>
                </div>
            </div>
        </div>
    );
}
