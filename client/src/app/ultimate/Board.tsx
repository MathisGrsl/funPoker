'use client';

import Card from '@/app/blackjack/Card';
import { DEFAULT_DECK } from '@/app/blackjack/decks';
import { SnapshotCard } from './types';

type Props = {
    dealer: { cards: SnapshotCard[]; handName?: string };
    community: SnapshotCard[];
};

export default function Board({ dealer, community }: Props) {
    return (
        <div className="flex flex-col items-center gap-3">
            {/* Croupier */}
            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Croupier</span>
                <div className="flex gap-1">
                    {dealer.cards.length === 0
                        ? [0, 1].map((i) => <Slot key={i} w={66} />)
                        : dealer.cards.map((c, i) => <Card key={i} card={c} deck={DEFAULT_DECK} width={66} dealFrom="shoe" dealDelayMs={i * 100} />)}
                </div>
                {dealer.handName && (
                    <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#E8C66B]">{dealer.handName}</span>
                )}
            </div>

            {/* Cartes communes */}
            <div className="flex items-center gap-1.5">
                {community.map((c, i) => <Card key={i} card={c} deck={DEFAULT_DECK} width={72} dealFrom="shoe" dealDelayMs={i * 90} />)}
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C9A24B]/70">Ultimate Texas Hold'em</span>
        </div>
    );
}

function Slot({ w }: { w: number }) {
    return <div className="rounded-[8%] border-2 border-dashed border-white/10" style={{ width: w, height: Math.round(w * 1.4) }} />;
}
