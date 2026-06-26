'use client';

import { CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { Card as TCard, Rank, SnapshotCard, Suit, isHidden } from './types';
import { DeckTheme, courtImage } from './decks';
import { PIP_LAYOUT, SUIT_GLYPH, isCourt, suitColor } from './cardVisuals';
import { useChipFlyOptional } from './ChipFly';

type Props = {
    card?: SnapshotCard;
    deck: DeckTheme;
    /** Largeur en px ; la hauteur suit le ratio 2.5:3.5. */
    width?: number;
    dealDelayMs?: number;
    /** Clé d'ancrage d'où la carte « arrive » (ex. 'shoe'). */
    dealFrom?: string;
    className?: string;
};

export default function Card({ card, deck, width = 92, dealDelayMs = 0, dealFrom, className = '' }: Props) {
    const height = Math.round(width * 1.4);
    const hidden = !card || isHidden(card);
    const known = card && !isHidden(card) ? (card as TCard) : null;

    // Animation d'arrivée depuis le sabot.
    const fly = useChipFlyOptional();
    const ref = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
    const [landed, setLanded] = useState(!dealFrom);

    useLayoutEffect(() => {
        if (!dealFrom || !fly) { setLanded(true); return; }
        const anchor = fly.anchorPoint(dealFrom);
        const el = ref.current;
        if (!anchor || !el) { setLanded(true); return; }
        const r = el.getBoundingClientRect();
        setOffset({ x: anchor.x - (r.left + r.width / 2), y: anchor.y - (r.top + r.height / 2) });

        let alive = true;
        const raf = requestAnimationFrame(() => requestAnimationFrame(() => { if (alive) setLanded(true); }));
        return () => { alive = false; cancelAnimationFrame(raf); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let dealStyle: CSSProperties;
    if (!dealFrom) dealStyle = {};
    else if (!landed && !offset) dealStyle = { opacity: 0 };
    else if (!landed && offset) dealStyle = { transform: `translate(${offset.x}px, ${offset.y}px) rotate(-9deg) scale(0.9)`, opacity: 1 };
    else dealStyle = {
        transform: 'translate(0,0) rotate(0deg) scale(1)',
        opacity: 1,
        transition: `transform 0.4s cubic-bezier(0.2,0.7,0.2,1) ${dealDelayMs}ms, opacity 0.25s ${dealDelayMs}ms`,
    };

    return (
        <div
            ref={ref}
            className={`${dealFrom ? '' : 'bj-card-enter'} ${className}`}
            style={{ width, height, perspective: 1000, ...(dealFrom ? {} : { animationDelay: `${dealDelayMs}ms` }), ...dealStyle }}
        >
            <div
                className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
                style={{ transform: hidden ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                <div className="absolute inset-0 [backface-visibility:hidden]">
                    {known && <CardFront card={known} deck={deck} width={width} />}
                </div>
                <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: 'rotateY(180deg)' }}>
                    <CardBack color={deck.backColor} />
                </div>
            </div>
        </div>
    );
}

function CardFront({ card, deck, width }: { card: TCard; deck: DeckTheme; width: number }) {
    const color = suitColor(card.suit);
    const court = isCourt(card.rank);

    return (
        <div
            className="relative h-full w-full overflow-hidden rounded-[8%] bg-[#FBFBF7] shadow-[0_2px_8px_rgba(0,0,0,0.45)] ring-1 ring-black/10"
            style={{ fontSize: width * 0.2 }}
        >
            {court ? (
                <CourtFace rank={card.rank} glyph={SUIT_GLYPH[card.suit]} color={color} img={courtImage(deck, card.rank)} />
            ) : (
                <CardCenter card={card} color={color} />
            )}
            <Corner rank={card.rank} suit={card.suit} color={color} overPhoto={court} position="tl" />
            <Corner rank={card.rank} suit={card.suit} color={color} overPhoto={court} position="br" />
        </div>
    );
}

function Corner({ rank, suit, color, overPhoto, position }: { rank: Rank; suit: Suit; color: string; overPhoto: boolean; position: 'tl' | 'br' }) {
    const place = position === 'tl' ? 'top-[5%] left-[6%]' : 'bottom-[5%] right-[6%] rotate-180';
    const glyphColor = overPhoto ? (suit === 'hearts' || suit === 'diamonds' ? '#FF7A7A' : '#FFFFFF') : color;

    return (
        <div
            className={`absolute ${place} z-10 flex flex-col items-center leading-none ${overPhoto ? 'rounded-md bg-black/55 px-1 py-0.5' : ''}`}
            style={{ color: overPhoto ? '#FFFFFF' : color }}
        >
            <span className="font-bold" style={{ fontSize: '0.95em' }}>{rank}</span>
            <span style={{ fontSize: '0.8em', color: glyphColor }}>{SUIT_GLYPH[suit]}</span>
        </div>
    );
}

function CourtFace({ rank, glyph, color, img }: { rank: Rank; glyph: string; color: string; img?: string }) {
    const [failed, setFailed] = useState(false);

    if (img && !failed) {
        return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={img} alt={rank} className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} />
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: `linear-gradient(160deg, ${color}22, ${color}05)`, color }}>
            <span className="font-extrabold" style={{ fontSize: '2.6em' }}>{rank}</span>
            <span style={{ fontSize: '1.5em' }}>{glyph}</span>
        </div>
    );
}

function CardCenter({ card, color }: { card: TCard; color: string }) {
    const glyph = SUIT_GLYPH[card.suit];

    if (card.rank === 'A') {
        return (
            <span className="absolute inset-0 flex items-center justify-center" style={{ color, fontSize: '3em' }}>
                {glyph}
            </span>
        );
    }

    const pips = PIP_LAYOUT[card.rank] ?? [];
    return (
        <>
            {pips.map((p, i) => (
                <span
                    key={i}
                    className="absolute"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: `translate(-50%, -50%)${p.y > 50 ? ' rotate(180deg)' : ''}`,
                        color,
                        fontSize: '1.5em',
                        lineHeight: 1,
                    }}
                >
                    {glyph}
                </span>
            ))}
        </>
    );
}

function CardBack({ color }: { color: string }) {
    return (
        <div
            className="flex h-full w-full items-center justify-center rounded-[8%] shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
            style={{ background: `repeating-linear-gradient(45deg, ${color} 0 7px, rgba(0,0,0,0.22) 7px 14px)` }}
        >
            <div className="flex h-[78%] w-[58%] items-center justify-center rounded-[12%] border-2 border-white/40">
                <span className="text-white/70" style={{ fontSize: '1.4rem' }}>♠</span>
            </div>
        </div>
    );
}
