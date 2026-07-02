// Per-frame networked data kept out of React (mirrors the single-player
// shared.ts pattern). The camera and tag logic read the local player's live
// predicted position from here without triggering re-renders.
import * as THREE from "three";

export const netShared = {
  localPos: new THREE.Vector3(0, 0.6, 6),
  localRole: "chameleon" as "chameleon" | "hunter",
  localScale: 1,
};
