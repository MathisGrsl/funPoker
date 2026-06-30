'use client';

import { useEffect, useState } from 'react';
import type { InviteData } from './types';

const TIMEOUT_SECONDS = 30;

type Props = {
    invite: InviteData;
    onAccept: () => void;
    onDecline: () => void;
};

export default function InviteNotification({ invite, onAccept, onDecline }: Props) {
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(interval);
                    onDecline();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [onDecline]);

    const progress = (timeLeft / TIMEOUT_SECONDS) * 100;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-[#0C0C1E] border border-[#D4AF37]/30 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.12)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Countdown progress bar */}
            <div className="h-0.5 bg-[#1A1A30] relative">
                <div
                    className="h-full bg-[#D4AF37] transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="p-4">
                {/* Icon + text */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                        <span className="text-[#D4AF37] text-xl leading-none select-none">♠</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[#E2E2F0] text-sm font-semibold">Private Table Invite</p>
                        <p className="text-[#9494B8] text-xs mt-0.5 leading-relaxed">
                            <span className="text-[#A78BFA] font-medium">{invite.creatorUsername}</span>
                            {' '}invited you to a{' '}
                            <span className="text-[#E2E2F0]">Texas Hold&apos;em</span>
                            {' '}9-player table
                        </p>
                    </div>
                </div>

                {/* Accept / Decline */}
                <div className="flex gap-2">
                    <button
                        onClick={onAccept}
                        className="flex-1 py-2 bg-[#D4AF37] hover:bg-[#C9A227] text-[#060611] text-sm font-bold rounded-xl transition-all duration-150 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)]"
                    >
                        Accept
                    </button>
                    <button
                        onClick={onDecline}
                        className="flex-1 py-2 bg-[#111127] hover:bg-[#1A1A35] border border-[#1E1E3A] hover:border-[#2A2A4A] text-[#9494B8] hover:text-[#C4C4E0] text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer"
                    >
                        Decline
                    </button>
                </div>

                <p className="text-center text-[10px] text-[#3A3A5C] mt-2.5">
                    Expires in {timeLeft}s
                </p>
            </div>
        </div>
    );
}
