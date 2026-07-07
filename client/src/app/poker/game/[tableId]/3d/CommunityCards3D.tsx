'use client';

import Card3D from '../../../../blackjack/3d/Card3D';
import { toSnapshotCard } from './pokerCardAdapter';
import { COMMUNITY_BASE, COMMUNITY_SPACING } from './positions';

// Flop cards (0-2) stagger in; turn (3) and river (4) appear instantly — mirrors the 2D table's COMMUNITY_DELAYS.
const DEAL_DELAYS = [0, 0.15, 0.3, 0, 0];

/**
 * Each slot is keyed by its fixed index, so a card that's already on the board keeps its
 * React instance (and therefore its already-settled position) — only newly revealed slots
 * mount fresh and play the deal-in animation.
 */
export default function CommunityCards3D({ cards }: { cards: string[] }) {
    const slots = Array.from({ length: 5 }, (_, i) => cards[i] ?? null);
    const totalWidth = (slots.length - 1) * COMMUNITY_SPACING;

    return (
        <group>
            {slots.map((code, i) => {
                if (!code) return null;
                const x = COMMUNITY_BASE[0] - totalWidth / 2 + i * COMMUNITY_SPACING;
                return (
                    <Card3D
                        key={i}
                        card={toSnapshotCard(code)}
                        position={[x, COMMUNITY_BASE[1], COMMUNITY_BASE[2]]}
                        dealDelay={DEAL_DELAYS[i]}
                    />
                );
            })}
        </group>
    );
}
