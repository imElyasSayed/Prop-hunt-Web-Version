// Decoy Shed — drop a frozen morph-snapshot clone of yourself to bait seekers.
//
// One charge per round. The decoy is a static snapshot of your current paint at
// the drop position: non-solid (no collision), lives ~25s, and whistles on its
// OWN timer to mask/mimic yours. If the Hunter commits to it and reaches tag
// range, it pops into splatter — a wasted seeker commit that pays you baited
// points (capped, since only one decoy exists per round). While they chase the
// fake, you slip away.
//
// TELLS (fair counterplay): a decoy never breathes / micro-idles (base blobs
// don't animate, so it already reads as unnaturally still) and — MERGE COUPLING
// with pulse-ping — should ping faintly under a Pulse sweep. On `main` there is
// no Pulse, so wire the faint decoy ping into los/pulse detection at merge time.
//
// Runtime state lives in module refs (like shared.ts). The DecoyShed component
// owns lifetime + whistle timing + rendering; the Hunter reads this to divert.

import * as THREE from "three";
import type { Stamp } from "./types";

export const DECOY_LIFETIME = 25; // seconds the decoy persists
export const DECOY_WHISTLE_INTERVAL = 5; // seconds between decoy whistles
export const DECOY_LURE_SECONDS = 3.5; // how long a whistle keeps the Hunter's interest
export const DECOY_BAIT_POINTS = 150; // awarded once if the Hunter pops the decoy

export interface DecoyState {
  active: boolean;
  popped: boolean;
  pos: THREE.Vector3;
  /** snapshot of the player's stamps at drop time (for rendering the clone). */
  stamps: Stamp[];
  /** age in seconds since drop (advanced by the DecoyShed component). */
  age: number;
  /** seconds until the next self-whistle. */
  whistleIn: number;
  /** while >0 the Hunter treats the decoy as a lure (recently whistled). */
  lure: number;
}

export const decoy: DecoyState = makeInitial();

function makeInitial(): DecoyState {
  return {
    active: false,
    popped: false,
    pos: new THREE.Vector3(),
    stamps: [],
    age: 0,
    whistleIn: DECOY_WHISTLE_INTERVAL,
    lure: 0,
  };
}

export function resetDecoy() {
  Object.assign(decoy, makeInitial());
  decoy.pos = new THREE.Vector3();
  decoy.stamps = [];
}

/** Drop a decoy at `pos` with a snapshot of `stamps`. */
export function dropDecoy(pos: THREE.Vector3, stamps: Stamp[]) {
  decoy.active = true;
  decoy.popped = false;
  decoy.pos = pos.clone();
  decoy.stamps = stamps.map((s) => ({ ...s }));
  decoy.age = 0;
  decoy.whistleIn = 1.2; // first whistle shortly after drop
  decoy.lure = DECOY_LURE_SECONDS; // fresh drop immediately draws attention
}

/** Pop the decoy (Hunter reached it). Returns true if it was a live pop. */
export function popDecoy(): boolean {
  if (!decoy.active || decoy.popped) return false;
  decoy.popped = true;
  decoy.active = false;
  decoy.lure = 0;
  return true;
}
