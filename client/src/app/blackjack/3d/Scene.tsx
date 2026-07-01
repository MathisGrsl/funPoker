'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import Table3D from './Table3D';
import Shoe3D from './Shoe3D';
import Dealer3D from './Dealer3D';
import Hand3D from './Hand3D';
import Seat3D from './Seat3D';
import WinLossChips from './WinLossChips';
import { CAMERA_LOOK, DEALER_HAND } from './positions';
import { TableSnapshot, isHidden } from '../types';

type Props = {
    state: TableSnapshot;
    myId: string;
    selectedChip: number;
    onSit: (i: number) => void;
    onBet: (i: number, amount: number) => void;
};

function CameraRig() {
    const { camera } = useThree();
    useEffect(() => {
        camera.lookAt(CAMERA_LOOK[0], CAMERA_LOOK[1], CAMERA_LOOK[2]);
    }, [camera]);
    return null;
}

export default function Scene({ state, myId, selectedChip, onSit, onBet }: Props) {
    const dealerHasHidden = state.dealer.cards.some((c) => isHidden(c));

    return (
        <>
            <CameraRig />
            <ambientLight intensity={0.55} />
            <directionalLight
                position={[4, 9, 5]}
                intensity={1.0}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />
            <directionalLight position={[-6, 5, -4]} intensity={0.3} />

            <Table3D />
            <Shoe3D />
            <Dealer3D />

            {/* Croupier */}
            <Hand3D cards={state.dealer.cards} basePos={DEALER_HAND} />
            {state.dealer.cards.length > 0 && (
                <Html position={[DEALER_HAND[0], 0.6, DEALER_HAND[2] - 0.25]} center distanceFactor={9} zIndexRange={[20, 0]}>
                    <div className="pointer-events-none rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        {state.dealer.value}{dealerHasHidden ? ' +' : ''}
                    </div>
                </Html>
            )}

            {/* Sièges */}
            {state.seats.map((seat) => (
                <Seat3D
                    key={seat.index}
                    seat={seat}
                    isMine={seat.playerId === myId}
                    isActiveSeat={state.activeSeat === seat.index}
                    phase={state.phase}
                    selectedChip={selectedChip}
                    balance={seat.playerId ? state.balances[seat.playerId] ?? 0 : 0}
                    maxBet={state.maxBet}
                    onSit={onSit}
                    onBet={onBet}
                />
            ))}

            <WinLossChips state={state} />
        </>
    );
}
