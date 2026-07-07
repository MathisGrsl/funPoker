import { SnapshotCard, Rank, Suit } from '../../../../blackjack/types';

const SUIT_MAP: Record<string, Suit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const RANK_MAP: Record<string, Rank> = { T: '10' };

/** Converts a 2-char poker code ("Ah", "Td", "back") into blackjack's `SnapshotCard` shape. */
export function toSnapshotCard(code: string | null | undefined): SnapshotCard {
    if (!code || code === 'back') return { hidden: true };
    const rankChar = code.slice(0, -1);
    const suitChar = code.slice(-1).toLowerCase();
    const rank = (RANK_MAP[rankChar] ?? rankChar) as Rank;
    const suit = SUIT_MAP[suitChar] ?? 'spades';
    return { rank, suit, hidden: false };
}
