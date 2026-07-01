'use client';

import Card3D from './Card3D';
import { CARD_FAN_ROT, CARD_FAN_X, Vec3 } from './positions';
import { SnapshotCard } from '../types';

/** Une main : cartes en éventail à plat. `doubled` → la dernière est croisée (double). */
export default function Hand3D({ cards, basePos, doubled = false, dealDelayBase = 0 }: { cards: SnapshotCard[]; basePos: Vec3; doubled?: boolean; dealDelayBase?: number }) {
    const n = cards.length;
    return (
        <group>
            {cards.map((c, i) => {
                const isDouble = doubled && i === n - 1;
                const off = i - (n - 1) / 2;
                if (isDouble) {
                    // Carte de "double" : croisée (90°), centrée entre les deux et posée tout en haut.
                    return (
                        <Card3D
                            key={i}
                            card={c}
                            position={[basePos[0], basePos[1] + 0.07, basePos[2] - 0.52]}
                            rotationY={Math.PI / 2}
                            dealDelay={dealDelayBase + i * 0.12}
                        />
                    );
                }
                return (
                    <Card3D
                        key={i}
                        card={c}
                        position={[basePos[0] + off * CARD_FAN_X, basePos[1] + i * 0.002, basePos[2] + i * 0.014]}
                        rotationY={-off * CARD_FAN_ROT}
                        dealDelay={dealDelayBase + i * 0.12}
                    />
                );
            })}
        </group>
    );
}
