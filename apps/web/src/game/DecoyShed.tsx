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
import type { Stamp } from "./types";
import {
  decoy,
  DECOY_LIFETIME,
  DECOY_WHISTLE_INTERVAL,
  DECOY_LURE_SECONDS,
} from "./decoy";

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
