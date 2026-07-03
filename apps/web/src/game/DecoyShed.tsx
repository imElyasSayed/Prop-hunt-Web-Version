// Decoy Shed scene component: renders the frozen morph-snapshot clone, drives
// its lifetime + self-whistle timer, and expires it. The Hunter (see Hunter.tsx)
// reads the decoy runtime to divert toward it and pop it on contact.
"use client";
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePaintTexture } from "./usePaintTexture";
import { useModel } from "./models";
import { whistle } from "./sound";
import { useArtTexture } from "./artTexture";
import type { Stamp } from "./types";
import {
  decoy,
  DECOY_LIFETIME,
  DECOY_WHISTLE_INTERVAL,
  DECOY_LURE_SECONDS,
} from "./decoy";

const POP_SECONDS = 0.6;

export function DecoyShed() {
  const [snap, setSnap] = useState<Stamp[]>([]);
  const [visible, setVisible] = useState(false);
  const group = useRef<THREE.Group>(null);
  const wasActive = useRef(false);

  const { texture } = usePaintTexture(snap);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xffffff,
        roughness: 0.6,
        transparent: true,
        opacity: 0.9,
      }),
    [texture],
  );
  const blobObj = useModel("blob_player", (mesh) => {
    mesh.material = mat;
  });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);

    // drop edge: snapshot the stamps and show the clone
    if (decoy.active && !wasActive.current) {
      wasActive.current = true;
      setSnap(decoy.stamps);
      setVisible(true);
    }
    if (!decoy.active) {
      if (wasActive.current) {
        wasActive.current = false;
        setVisible(false);
      }
      return;
    }

    // lifetime + self-whistle
    decoy.age += dt;
    decoy.lure = Math.max(0, decoy.lure - dt);
    decoy.whistleIn -= dt;
    if (decoy.whistleIn <= 0) {
      decoy.whistleIn = DECOY_WHISTLE_INTERVAL;
      decoy.lure = DECOY_LURE_SECONDS;
      whistle(); // its own timer, masking yours
    }
    if (decoy.age >= DECOY_LIFETIME) {
      decoy.active = false; // fades out quietly when time's up
    }

    if (group.current) {
      group.current.position.set(decoy.pos.x, 0, decoy.pos.z);
      // decoys never breathe / micro-idle — dead still (the tell).
    }
  });

  if (!visible) return null;
  return (
    <group ref={group}>
      <primitive object={blobObj} />
    </group>
  );
}

// Decoy pop burst (Design Vol.5): a violet paint-splatter that bursts where the
// Hunter tags the fake. Always mounted; fires on the decoy.popped edge.
export function DecoyPop() {
  const burst = useRef<THREE.Mesh>(null);
  const t = useRef(-1); // <0 = idle
  const prevPopped = useRef(false);
  const popTex = useArtTexture("/art/decoy-pop.svg", 256);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    [],
  );
  useMemo(() => {
    if (popTex) {
      mat.map = popTex;
      mat.needsUpdate = true;
    }
  }, [popTex, mat]);

  useFrame((_, dtRaw) => {
    const m = burst.current;
    if (!m) return;
    if (decoy.popped && !prevPopped.current) {
      t.current = 0; // start the burst
      m.position.set(decoy.pos.x, 0.06, decoy.pos.z);
    }
    prevPopped.current = decoy.popped;
    if (t.current < 0) {
      m.visible = false;
      return;
    }
    t.current += Math.min(dtRaw, 0.05);
    const k = t.current / POP_SECONDS;
    if (k >= 1) {
      t.current = -1;
      m.visible = false;
      return;
    }
    m.visible = true;
    m.scale.setScalar(1.4 + k * 3.4); // expand
    mat.opacity = 0.95 * (1 - k);
  });

  return (
    <mesh ref={burst} material={mat} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
