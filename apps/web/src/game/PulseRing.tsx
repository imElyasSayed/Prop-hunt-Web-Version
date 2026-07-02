// Pulse Ping VFX: the expanding sonar shockwave on the floor, plus a bobbing
// marker over a revealed hider. Reads shared.pulse / shared.revealTimer each
// frame (no React re-renders). Placeholder geometry — swap for a VFX-mesh later.
"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shared } from "./shared";
import { PULSE_RANGE } from "./constants";

export function PulseRing() {
  const ring = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Mesh>(null);

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0fd4e6",
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  const markMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ff2e4f",
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  useFrame((state, dt) => {
    const p = shared.pulse;
    const r = ring.current;
    if (r) {
      if (!p.active) {
        r.visible = false;
      } else {
        r.visible = true;
        let radius: number;
        let opacity: number;
        if (p.phase === "charging") {
          // a tight, pulsing warning ring at the Hunter's feet
          radius = 0.6 + p.t * 1.4;
          opacity = 0.35 + 0.35 * Math.sin(p.t * 24);
        } else {
          // the shockwave travelling outward
          radius = 0.6 + p.t * PULSE_RANGE;
          opacity = (1 - p.t) * 0.7;
        }
        r.position.set(p.x, 0.06, p.z);
        r.scale.set(radius, radius, radius);
        ringMat.opacity = Math.max(0, opacity);
      }
    }

    const m = marker.current;
    if (m) {
      if (shared.revealTimer > 0) {
        m.visible = true;
        const t = state.clock.elapsedTime;
        m.position.set(
          shared.playerPos.x,
          1.7 + Math.sin(t * 8) * 0.18,
          shared.playerPos.z,
        );
        m.rotation.y += dt * 3;
        markMat.opacity = 0.55 + 0.35 * Math.sin(t * 12);
      } else {
        m.visible = false;
      }
    }
  });

  return (
    <>
      {/* shockwave ring, laid flat on the floor */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
        <ringGeometry args={[0.9, 1.0, 48]} />
      </mesh>
      {/* downward marker cone over a revealed hider */}
      <mesh ref={marker} rotation={[Math.PI, 0, 0]} material={markMat} visible={false}>
        <coneGeometry args={[0.32, 0.6, 5]} />
      </mesh>
    </>
  );
}
