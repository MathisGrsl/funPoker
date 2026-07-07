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
                    <CardBack color={deck.backColor} premium={!!deck.premium} accent={deck.accent} />
                </div>
            </div>
        </div>
    );
}

function CardFront({ card, deck, width }: { card: TCard; deck: DeckTheme; width: number }) {
    const color = suitColor(card.suit);
    const court = isCourt(card.rank);
    const premium = !!deck.premium;
    const gold = deck.accent ?? '#E7C24A';
    const hasImg = !!courtImage(deck, card.rank);
    const overPhoto = premium ? court && hasImg : court;
    const halo = premium && (card.rank === 'A' || court); // As & figures brillent

    return (
        <div
            className={`relative h-full w-full overflow-hidden rounded-[8%] ${halo ? 'bj-royal-glow' : ''} ${premium ? '' : 'bg-[#FBFBF7] shadow-[0_2px_8px_rgba(0,0,0,0.45)] ring-1 ring-black/10'}`}
            style={{
                fontSize: width * 0.2,
                ...(premium
                    ? {
                          background: 'linear-gradient(158deg, #FCF9EF 0%, #EFE2BE 100%)',
                          boxShadow: `0 2px 9px rgba(0,0,0,0.5), inset 0 0 0 2px ${gold}, inset 0 0 0 3.5px rgba(0,0,0,0.18)`,
                      }
                    : {}),
            }}
        >
            {court ? (
                <CourtFace rank={card.rank} glyph={SUIT_GLYPH[card.suit]} color={color} img={courtImage(deck, card.rank)} premium={premium} gold={gold} />
            ) : (
                <CardCenter card={card} color={color} premium={premium} gold={gold} />
            )}
            <Corner rank={card.rank} suit={card.suit} color={color} overPhoto={overPhoto} position="tl" premium={premium} gold={gold} />
            <Corner rank={card.rank} suit={card.suit} color={color} overPhoto={overPhoto} position="br" premium={premium} gold={gold} />
            {premium && <span className="bj-foil" />}
        </div>
    );
}

function Corner({ rank, suit, color, overPhoto, position, premium, gold }: { rank: Rank; suit: Suit; color: string; overPhoto: boolean; position: 'tl' | 'br'; premium?: boolean; gold?: string }) {
    const place = position === 'tl' ? 'top-[5%] left-[6%]' : 'bottom-[5%] right-[6%] rotate-180';
    const glyphColor = overPhoto ? (suit === 'hearts' || suit === 'diamonds' ? '#FF7A7A' : '#FFFFFF') : color;

    return (
        <div
            className={`absolute ${place} z-10 flex flex-col items-center leading-none ${overPhoto ? 'rounded-md bg-black/55 px-1 py-0.5' : ''}`}
            style={{ color: overPhoto ? '#FFFFFF' : color, ...(premium && !overPhoto ? { textShadow: `0 0 3px ${gold}99` } : {}) }}
        >
            <span className="font-bold" style={{ fontSize: '0.95em' }}>{rank}</span>
            <span style={{ fontSize: '0.8em', color: glyphColor }}>{SUIT_GLYPH[suit]}</span>
        </div>
    );
}

function CourtFace({ rank, glyph, color, img, premium, gold }: { rank: Rank; glyph: string; color: string; img?: string; premium?: boolean; gold?: string }) {
    const [failed, setFailed] = useState(false);

    if (img && !failed) {
        return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={img} alt={rank} className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} />
        );
    }

    if (premium) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.05em]" style={{ background: `radial-gradient(ellipse at 50% 40%, ${gold}2e, transparent 72%)` }}>
                <span style={{ fontSize: '1.05em', color: gold, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}>♛</span>
                <span className="font-extrabold" style={{ fontSize: '2.4em', color, textShadow: `0 0 7px ${gold}88` }}>{rank}</span>
                <span style={{ fontSize: '1.35em', color }}>{glyph}</span>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: `linear-gradient(160deg, ${color}22, ${color}05)`, color }}>
            <span className="font-extrabold" style={{ fontSize: '2.6em' }}>{rank}</span>
            <span style={{ fontSize: '1.5em' }}>{glyph}</span>
        </div>
    );
}

function CardCenter({ card, color, premium, gold }: { card: TCard; color: string; premium?: boolean; gold?: string }) {
    const glyph = SUIT_GLYPH[card.suit];
    const shadow = premium ? { textShadow: `0 1px 4px ${gold}66` } : {};

    if (card.rank === 'A') {
        return (
            <span className="absolute inset-0 flex items-center justify-center" style={{ color, fontSize: '3em', ...shadow }}>
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
                        ...shadow,
                    }}
                >
                    {glyph}
                </span>
            ))}
        </>
    );
}

function CardBack({ color, premium, accent }: { color: string; premium?: boolean; accent?: string }) {
    const gold = accent ?? '#E7C24A';

    if (premium) {
        return (
            <div
                className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[8%]"
                style={{
                    background: `radial-gradient(ellipse at 50% 38%, #2a2436 0%, ${color} 72%)`,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 0 0 2px ${gold}, inset 0 0 0 4px rgba(0,0,0,0.35)`,
                }}
            >
                <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                        height: '62%',
                        width: '62%',
                        border: `2px solid ${gold}`,
                        background: `repeating-conic-gradient(from 0deg, ${gold}22 0deg 12deg, transparent 12deg 24deg)`,
                    }}
                >
                    <span style={{ color: gold, fontSize: '1.4rem', filter: `drop-shadow(0 0 5px ${gold})` }}>♠</span>
                </div>
                <span className="bj-foil" />
            </div>
        );
    }

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
