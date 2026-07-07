'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Table3D from './Table3D';
import Seat3D from './Seat3D';
import CommunityCards3D from './CommunityCards3D';
import PotDisplay3D from './PotDisplay3D';
import BetFlights3D from './BetFlights3D';
import {
    ORBIT_MAX_DISTANCE, ORBIT_MAX_POLAR, ORBIT_MIN_DISTANCE, ORBIT_MIN_POLAR,
    SURFACE_Y, TABLE_CENTER, Vec3, getSeatLayout, myCameraPose,
} from './positions';
import type { GameState } from '../types';

type Props = {
    state: GameState;
    myId: string;
    resetViewRef: React.RefObject<() => void>;
};

function CameraRig({ mySpot, resetViewRef }: { mySpot: ReturnType<typeof myCameraPose>; resetViewRef: React.RefObject<() => void> }) {
    const { camera } = useThree();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controls = useRef<any>(null);

    const applyPose = useCallback(() => {
        camera.position.set(...mySpot.position);
        controls.current?.target.set(...mySpot.target);
        controls.current?.update();
    }, [camera, mySpot]);

    useEffect(() => {
        applyPose();
        resetViewRef.current = applyPose;
    }, [applyPose, resetViewRef]);

    return (
        <OrbitControls
            ref={controls}
            target={TABLE_CENTER}
            enablePan={false}
            minDistance={ORBIT_MIN_DISTANCE}
            maxDistance={ORBIT_MAX_DISTANCE}
            minPolarAngle={ORBIT_MIN_POLAR}
            maxPolarAngle={ORBIT_MAX_POLAR}
        />
    );
}

export default function Scene({ state, myId, resetViewRef }: Props) {
    const n = state.players.length;
    const layouts = useMemo(() => getSeatLayout(n), [n]);
    const me = state.players.find((p) => p.userId === myId);
    const myLogicalIdx = me?.seatIndex ?? 0;

    const seated = state.players.map((p) => {
        const visualIdx = (p.seatIndex - myLogicalIdx + n) % n;
        return { player: p, layout: layouts[visualIdx] };
    });

    const seatPos: Record<string, Vec3> = {};
    seated.forEach(({ player, layout }) => {
        seatPos[player.userId] = [
            (layout.spot[0] + layout.hand[0]) / 2,
            SURFACE_Y,
            (layout.spot[2] + layout.hand[2]) / 2,
        ];
    });

    const mySpot = myCameraPose(layouts[0]);

    return (
        <>
            <CameraRig mySpot={mySpot} resetViewRef={resetViewRef} />
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[3, 9, 4]}
                intensity={1.0}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />
            <directionalLight position={[-5, 6, -3]} intensity={0.35} />

            <Table3D playerCount={n} />

            {seated.map(({ player, layout }) => (
                <Seat3D
                    key={player.userId}
                    player={player}
                    layout={layout}
                    isMine={player.userId === myId}
                    isActing={player.userId === state.actingUserId}
                    bb={state.bb}
                />
            ))}

            <CommunityCards3D cards={state.communityCards} />
            <PotDisplay3D pot={state.pot} bb={state.bb} />
            <BetFlights3D players={state.players} phase={state.phase} winners={state.winners} seatPos={seatPos} />
        </>
    );
}
