'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Table3D from '../3d/Table3D';
import Dealer3D from '../3d/Dealer3D';
import Hand3D from '../3d/Hand3D';
import ChipStack3D from '../3d/Chip3D';
import { DEALER_HAND, SEATS } from '../3d/positions';
import { useBlackjack } from '../useBlackjack';
import { TableSnapshot } from '../types';
import { GazeProvider, ActionButton3D } from './gaze';

type Game = ReturnType<typeof useBlackjack>;

// Écartement des yeux (unités scène) — règle la profondeur ressentie.
const EYE_SEP = 0.055;

/**
 * Prend la main sur le rendu (priority 1) pour dessiner la scène DEUX fois,
 * côte à côte (œil gauche / droit) — mode Cardboard. La caméra suit la tête.
 */
function StereoRig({ quat }: { quat: React.RefObject<THREE.Quaternion> }) {
    const stereo = useMemo(() => {
        const s = new THREE.StereoCamera();
        s.eyeSep = EYE_SEP;
        return s;
    }, []);
    const size = useMemo(() => new THREE.Vector2(), []);

    useFrame(({ gl, scene, camera }) => {
        const cam = camera as THREE.PerspectiveCamera;
        if (quat.current) cam.quaternion.copy(quat.current);

        gl.getSize(size);
        const halfW = size.x / 2;
        cam.aspect = halfW / size.y;
        cam.updateProjectionMatrix();
        cam.updateMatrixWorld();
        stereo.update(cam);

        gl.setScissorTest(true);
        gl.setScissor(0, 0, halfW, size.y);
        gl.setViewport(0, 0, halfW, size.y);
        gl.render(scene, stereo.cameraL);
        gl.setScissor(halfW, 0, halfW, size.y);
        gl.setViewport(halfW, 0, halfW, size.y);
        gl.render(scene, stereo.cameraR);
        gl.setScissorTest(false);
    }, 1);

    return null;
}

/** Boutons d'action flottants selon la phase et le siège du joueur. */
function VRActions({ state, game, myId }: { state: TableSnapshot; game: Game; myId: string }) {
    const mySeat = state.seats.find((s) => s.playerId === myId);
    // Barre de contrôle basse et rapprochée → dégage la vue des cartes du croupier.
    const Y = 0.5;
    const Z = 2.0;
    const X = 0.72;

    if (!mySeat) {
        const canSit = state.phase === 'waiting' || state.phase === 'betting';
        if (!canSit) return null;
        const target = state.seats.find((s) => !s.playerId)?.index ?? 1;
        return <ActionButton3D id="sit" position={[0, Y, Z]} label="S'asseoir" color="#7C3AED" onSelect={() => game.sit(target)} />;
    }

    const i = mySeat.index;

    if (state.phase === 'betting') {
        return (
            <>
                <ActionButton3D id="bet25" position={[-X, Y, Z]} label="Miser +25" color="#D4AF37" onSelect={() => game.bet(i, Math.min(state.maxBet, mySeat.pendingBet + 25))} />
                {mySeat.pendingBet > 0 && <ActionButton3D id="clear" position={[0, Y, Z]} label="Retirer" color="#B91C1C" onSelect={() => game.bet(i, 0)} />}
                {mySeat.pendingBet > 0 && <ActionButton3D id="deal" position={[X, Y, Z]} label="Distribuer" color="#15803D" onSelect={() => game.dealNow()} />}
            </>
        );
    }

    if (state.phase === 'playerTurns' && state.activeSeat === i && state.activeHand != null) {
        const hand = mySeat.hands[state.activeHand];
        const canDouble = !!hand && hand.cards.length === 2 && game.balance >= hand.bet;
        return (
            <>
                <ActionButton3D id="hit" position={[-X, Y, Z]} label="Tirer" color="#15803D" onSelect={() => game.act(i, state.activeHand!, 'hit')} />
                <ActionButton3D id="stand" position={[canDouble ? 0 : X, Y, Z]} label="Rester" color="#B91C1C" onSelect={() => game.act(i, state.activeHand!, 'stand')} />
                {canDouble && <ActionButton3D id="double" position={[X, Y, Z]} label="Doubler" color="#1E40AF" onSelect={() => game.act(i, state.activeHand!, 'double')} />}
            </>
        );
    }

    return null;
}

export default function VRScene({ state, quat, game, myId }: { state: TableSnapshot; quat: React.RefObject<THREE.Quaternion>; game: Game; myId: string }) {
    const cardCount = state.dealer.cards.length + state.seats.reduce((n, s) => n + s.hands.reduce((m, h) => m + h.cards.length, 0), 0);

    return (
        <GazeProvider>
            <StereoRig quat={quat} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 9, 5]} intensity={1.0} castShadow />
            <directionalLight position={[-6, 5, -4]} intensity={0.3} />

            {/* Fond sombre */}
            <mesh position={[0, 2, -8]}>
                <planeGeometry args={[36, 20]} />
                <meshStandardMaterial color="#04120c" roughness={1} />
            </mesh>

            <Table3D />
            <Dealer3D dealSignal={cardCount} />
            <Hand3D cards={state.dealer.cards} basePos={DEALER_HAND} />

            {state.seats.map((seat) => {
                const s = SEATS[seat.index];
                if (!s || !seat.playerId) return null;
                const bet = seat.hands.reduce((n, h) => n + h.bet, 0);
                return (
                    <group key={seat.index}>
                        {seat.hands.map((h, hi) => (
                            <Hand3D
                                key={hi}
                                cards={h.cards}
                                doubled={h.status === 'doubled'}
                                basePos={[s.hand[0] + (hi - (seat.hands.length - 1) / 2) * 1.5, s.hand[1], s.hand[2]]}
                            />
                        ))}
                        {bet > 0 && <ChipStack3D amount={bet} position={[s.spot[0], s.spot[1], s.spot[2]]} />}
                    </group>
                );
            })}

            <VRActions state={state} game={game} myId={myId} />
        </GazeProvider>
    );
}
