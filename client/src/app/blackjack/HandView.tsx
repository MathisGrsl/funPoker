'use client';

import Card from './Card';
import { DeckTheme } from './decks';
import { SnapshotHand } from './types';

type Props = {
    hand: SnapshotHand;
    deck: DeckTheme;
    cardWidth?: number;
    active?: boolean;
};

/** Une main : cartes en éventail + pastille de valeur / résultat. */
export default function HandView({ hand, deck, cardWidth = 66, active = false }: Props) {
    const overlap = Math.round(cardWidth * 0.42);

    return (
        <div className={`flex flex-col items-center gap-1 rounded-xl p-1 transition-shadow ${active ? 'bj-seat-active bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]' : ''}`}>
            <div className="flex">
                {hand.cards.map((card, i) => (
                    <div key={i} style={{ marginLeft: i === 0 ? 0 : -overlap }}>
                        <Card card={card} deck={deck} width={cardWidth} dealDelayMs={i * 90} dealFrom="shoe" />
                    </div>
                ))}
            </div>
            <ValueBadge hand={hand} />
        </div>
    );
}

function ValueBadge({ hand }: { hand: SnapshotHand }) {
    let label = String(hand.value);
    let cls = 'bg-black/70 text-white';

    if (hand.status === 'blackjack') { label = 'BLACKJACK'; cls = 'bg-[#D4AF37] text-black'; }
    else if (hand.status === 'bust') { label = `${hand.value} • BRÛLÉ`; cls = 'bg-[#B91C1C] text-white'; }
    else if (hand.soft && hand.value <= 21) label = `${hand.value - 10}/${hand.value}`;

    const result = hand.result && RESULT_LABEL[hand.result];

    return (
        <div className="flex items-center gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${cls}`}>{label}</span>
            {result && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${RESULT_CLS[hand.result!]}`}>
                    {result}
                </span>
            )}
        </div>
    );
}

const RESULT_LABEL: Record<string, string> = {
    win: 'GAGNÉ',
    lose: 'PERDU',
    push: 'ÉGALITÉ',
    blackjack: '+3:2',
};

const RESULT_CLS: Record<string, string> = {
    win: 'bg-[#15803D] text-white',
    lose: 'bg-[#3A3A5C] text-white/70',
    push: 'bg-[#4A4A6A] text-white',
    blackjack: 'bg-[#D4AF37] text-black',
};
