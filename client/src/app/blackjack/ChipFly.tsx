'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ChipDisc } from './Chips';

type Point = { x: number; y: number };
type Flight = { id: number; from: Point; to: Point; value: number; size: number; delay: number };

interface ChipFlyAPI {
    /** Enregistre un point d'ancrage (clé → élément DOM). */
    registerEl: (key: string, el: HTMLElement | null) => void;
    /** Anime un jeton volant d'un point ancré vers un autre. */
    fly: (fromKey: string, toKey: string, value: number, opts?: { size?: number; delay?: number }) => void;
    /** Centre écran d'un ancrage (pour animer les cartes depuis le sabot). */
    anchorPoint: (key: string) => Point | null;
}

const Ctx = createContext<ChipFlyAPI | null>(null);

export function useChipFly(): ChipFlyAPI {
    const api = useContext(Ctx);
    if (!api) throw new Error('useChipFly must be used within <ChipFlyProvider>');
    return api;
}

/** Variante non bloquante (renvoie null hors provider). */
export function useChipFlyOptional(): ChipFlyAPI | null {
    return useContext(Ctx);
}

const center = (el: HTMLElement): Point => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

export function ChipFlyProvider({ children }: { children: React.ReactNode }) {
    const els = useRef(new Map<string, HTMLElement>());
    const [flights, setFlights] = useState<Flight[]>([]);
    const nextId = useRef(1);

    const registerEl = useCallback((key: string, el: HTMLElement | null) => {
        if (el) els.current.set(key, el);
        else els.current.delete(key);
    }, []);

    const fly = useCallback<ChipFlyAPI['fly']>((fromKey, toKey, value, opts = {}) => {
        const from = els.current.get(fromKey);
        const to = els.current.get(toKey);
        if (!from || !to) return;
        const id = nextId.current++;
        setFlights((f) => [...f, { id, from: center(from), to: center(to), value, size: opts.size ?? 34, delay: opts.delay ?? 0 }]);
    }, []);

    const remove = useCallback((id: number) => setFlights((f) => f.filter((x) => x.id !== id)), []);

    const anchorPoint = useCallback((key: string): Point | null => {
        const el = els.current.get(key);
        return el ? center(el) : null;
    }, []);

    return (
        <Ctx.Provider value={{ registerEl, fly, anchorPoint }}>
            {children}
            <div className="pointer-events-none fixed inset-0 z-50">
                {flights.map((flight) => (
                    <FlyingChip key={flight.id} flight={flight} onDone={() => remove(flight.id)} />
                ))}
            </div>
        </Ctx.Provider>
    );
}

function FlyingChip({ flight, onDone }: { flight: Flight; onDone: () => void }) {
    const [launched, setLaunched] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setLaunched(true));
        const t = setTimeout(onDone, flight.delay + 650);
        return () => { cancelAnimationFrame(raf); clearTimeout(t); };
    }, [flight.delay, onDone]);

    const dx = flight.to.x - flight.from.x;
    const dy = flight.to.y - flight.from.y;

    return (
        <div
            style={{
                position: 'fixed',
                left: flight.from.x,
                top: flight.from.y,
                transform: `translate(-50%, -50%) translate(${launched ? dx : 0}px, ${launched ? dy : 0}px) scale(${launched ? 1 : 0.7})`,
                opacity: launched ? 1 : 0.4,
                transition: `transform 0.55s cubic-bezier(0.4, 0.1, 0.2, 1) ${flight.delay}ms, opacity 0.3s ${flight.delay}ms`,
            }}
        >
            <ChipDisc value={flight.value} size={flight.size} />
        </div>
    );
}
