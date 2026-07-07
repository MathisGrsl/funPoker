'use client';

import PokerChipStack3D from './PokerChipStack3D';
import { POT_POS } from './positions';

// Pot amount/phase are shown in the side HUD (Overlay) instead of floating over the table.
export default function PotDisplay3D({ pot, bb }: { pot: number; bb: number }) {
    return <PokerChipStack3D amount={pot} bb={bb} position={POT_POS} tier={4} />;
}
