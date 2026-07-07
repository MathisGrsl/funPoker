'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const DEG = Math.PI / 180;
const ZEE = new THREE.Vector3(0, 0, 1);
const Q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90° autour de X (écran → monde)
const _e = new THREE.Euler();
const _q0 = new THREE.Quaternion();

/** Oriente `out` depuis les angles du capteur (alpha/beta/gamma) + orientation écran. */
function deviceQuat(out: THREE.Quaternion, alpha: number, beta: number, gamma: number, orient: number) {
    _e.set(beta, alpha, -gamma, 'YXZ');
    out.setFromEuler(_e);
    out.multiply(Q1);
    out.multiply(_q0.setFromAxisAngle(ZEE, -orient));
}

/**
 * Suivi de la tête pour la VR : gyroscope du téléphone (Cardboard) si dispo/autorisé,
 * sinon glisser-souris (PC). Renvoie un quaternion à appliquer à la caméra.
 */
export function useHeadLook() {
    const quat = useRef(new THREE.Quaternion());
    const [gyro, setGyro] = useState(false);
    const drag = useRef({ on: false, x: 0, y: 0, yaw: 0, pitch: 0 });

    // Gyroscope
    useEffect(() => {
        if (!gyro) return;
        const onOrient = (e: DeviceOrientationEvent) => {
            if (e.alpha == null) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const angle = (screen.orientation?.angle ?? ((window as any).orientation ?? 0)) as number;
            deviceQuat(quat.current, (e.alpha ?? 0) * DEG, (e.beta ?? 0) * DEG, (e.gamma ?? 0) * DEG, angle * DEG);
        };
        window.addEventListener('deviceorientation', onOrient, true);
        return () => window.removeEventListener('deviceorientation', onOrient, true);
    }, [gyro]);

    // Glisser-souris (PC), seulement sans gyroscope
    useEffect(() => {
        if (gyro) return;
        const d = drag.current;
        const down = (e: PointerEvent) => { d.on = true; d.x = e.clientX; d.y = e.clientY; };
        const move = (e: PointerEvent) => {
            if (!d.on) return;
            d.yaw -= (e.clientX - d.x) * 0.005;
            d.pitch -= (e.clientY - d.y) * 0.005;
            d.pitch = Math.max(-1.2, Math.min(1.2, d.pitch));
            d.x = e.clientX;
            d.y = e.clientY;
            quat.current.setFromEuler(_e.set(d.pitch, d.yaw, 0, 'YXZ'));
        };
        const up = () => { d.on = false; };
        window.addEventListener('pointerdown', down);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return () => {
            window.removeEventListener('pointerdown', down);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, [gyro]);

    /** À appeler sur un geste utilisateur (bouton) : demande la permission iOS puis active le gyroscope. */
    const enableGyro = useCallback(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const DOE = (window as any).DeviceOrientationEvent;
        try {
            if (DOE && typeof DOE.requestPermission === 'function') {
                const res = await DOE.requestPermission();
                if (res === 'granted') setGyro(true);
            } else if (DOE) {
                setGyro(true);
            }
        } catch {
            /* refusé / non supporté : on garde le glisser-souris */
        }
    }, []);

    return { quat, enableGyro, gyro };
}
