// Module-level mutable refs for per-frame data that must NOT trigger React
// re-renders (positions, live camo color). Scene components read/write these
// each frame; the Zustand store only gets discrete/UI updates.
import * as THREE from "three";

export const shared = {
  playerPos: new THREE.Vector3(0, 0.6, 6),
  hunterPos: new THREE.Vector3(0, 0.6, -9),
  hunterDir: new THREE.Vector3(0, 0, 1),
  /** Effective dominant color of the player's avatar (white until painted). */
  playerColor: "#fbf7f0",
  /** How much of the avatar is painted, 0..1. */
  coverage: 0,
  /** Color of the surface the player is currently backed against. */
  nearestSurfaceColor: "#cfc9bd",
  /** True once the player has requested to end prep early / start moving. */
  taunting: false,
  /** Geometric: the Hunter's view cone is physically on the player right now
   *  (independent of camo — drives the Nerve Engine's "being watched" tension). */
  inCone: false,
  /** Seconds remaining of a Nerve break — a flinch that forces you detectable. */
  nerveBreak: 0,
};

export function resetShared() {
  shared.playerPos.set(0, 0.6, 6);
  shared.hunterPos.set(0, 0.6, -9);
  shared.hunterDir.set(0, 0, 1);
  shared.playerColor = "#fbf7f0";
  shared.coverage = 0;
  shared.nearestSurfaceColor = "#cfc9bd";
  shared.taunting = false;
  shared.inCone = false;
  shared.nerveBreak = 0;
}
