'use client';

import { useEffect, useRef, useState } from 'react';
import CardDisplay from './CardDisplay';

type Size = 'sm' | 'md' | 'lg';
type Phase = 'entering' | 'idle' | 'flip-out' | 'flip-in';

type Props = {
    card: string;
    size?: Size;
    dealDelay?: number; // ms stagger before entrance starts
};

export default function AnimatedCard({ card, size, dealDelay = 0 }: Props) {
    const [displayCard, setDisplayCard] = useState(card);
    const [phase, setPhase] = useState<Phase>('entering');
    const prevCardRef = useRef(card);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function clearTimer() {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }

    // Switch to idle after entrance animation finishes
    useEffect(() => {
        timerRef.current = setTimeout(() => setPhase('idle'), dealDelay + 500);
        return clearTimer;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Detect card value changes and decide animation
    useEffect(() => {
        const prev = prevCardRef.current;
        prevCardRef.current = card;
        if (prev === card) return;

        if (prev === 'back' && card !== 'back') {
            // Showdown reveal → flip
            clearTimer();
            setPhase('flip-out');
            timerRef.current = setTimeout(() => {
                setDisplayCard(card);
                setPhase('flip-in');
                timerRef.current = setTimeout(() => setPhase('idle'), 220);
            }, 200);
        } else if (card === 'back' && prev !== 'back') {
            // New round: face-down deal → re-play entrance
            clearTimer();
            setDisplayCard(card);
            setPhase('entering');
            timerRef.current = setTimeout(() => setPhase('idle'), dealDelay + 500);
        } else {
            setDisplayCard(card);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [card]);

    useEffect(() => clearTimer, []);

    const styleMap: Record<Phase, React.CSSProperties> = {
        entering:   { animation: `pk-deal 0.42s cubic-bezier(0.34, 1.4, 0.64, 1) ${dealDelay}ms both` },
        idle:       {},
        'flip-out': { animation: 'pk-flip-out 0.2s ease-in forwards' },
        'flip-in':  { animation: 'pk-flip-in 0.2s ease-out forwards' },
    };

    return (
        <div style={{ ...styleMap[phase], willChange: 'transform, opacity, filter' }}>
            <CardDisplay card={displayCard} size={size} />
        </div>
    );
}
