'use client';

import Card from './Card';
import { DeckTheme } from './decks';
import { SnapshotDealer, isHidden } from './types';

/** Zone du croupier : ses cartes + sa valeur visible. */
export default function DealerArea({ dealer, deck }: { dealer: SnapshotDealer; deck: DeckTheme }) {
    const hasHidden = dealer.cards.some(isHidden);
    const overlap = 38;

    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Croupier</span>

            <div className="flex min-h-[130px] items-start">
                {dealer.cards.length === 0 ? (
                    <div className="h-[130px] w-[92px] rounded-[8%] border-2 border-dashed border-white/10" />
                ) : (
                    dealer.cards.map((card, i) => (
                        <div key={i} style={{ marginLeft: i === 0 ? 0 : -overlap }}>
                            <Card card={card} deck={deck} width={92} dealDelayMs={i * 120} dealFrom="shoe" />
                        </div>
                    ))
                )}
            </div>

            {dealer.cards.length > 0 && (
                <span className="rounded-full bg-black/70 px-3 py-1 text-sm font-bold text-white">
                    {dealer.value}{hasHidden ? ' +' : ''}
                </span>
            )}
        </div>
    );
}
