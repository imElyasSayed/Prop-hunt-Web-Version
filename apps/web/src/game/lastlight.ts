// Last Light — End-Game Chaos.
//
// In the final LAST_LIGHT_SECONDS of the hunt, four things escalate at once to
// guarantee a climactic finish:
//   1. the safe zone collapses to a tiny contested sphere at map center that
//      pays a big survival bonus for holding it;
//   2. surviving hiders emit a rising pulse glow (they light up as time runs
//      out — a fair, telegraphed tell);
//   3. seekers gain +30% speed;
//   4. a paint front sweeps once across the map, color-breaking memorized
//      hiding spots (crossed surfaces re-tint, so old camo no longer matches).
//
// Runtime state lives in module refs (like shared.ts). The `LastLight` scene
// component drives the sim; camo.ts reads the color-break tints; Player/Hunter
// read the glow + speed flags via `shared`.
//
// MERGE COUPLING:
//  - safe-zone: the collapsing sphere here should retarget onto safe-zone's
//    relocating bubble as its final position instead of hard-centering at 0,0.
//  - rift-wheel (speedseekers) / paint-tide: both also want a seeker-speed and
//    a surface-tint channel — unify on `shared.seekerSpeedMult` and one tint map
//    at merge time rather than keeping parallel copies.

import { ROOM_HALF } from "./constants";

export const LAST_LIGHT_SECONDS = 45; // final window length
export const SPHERE_START_R = 7.5;
export const SPHERE_END_R = 1.9;
export const SEEKER_SPEED_MULT = 1.3;
export const SPHERE_BONUS_RATE = 40; // survival bonus points per second held
export const FRONT_SWEEP_SECONDS = 4;

// Palette to color-break surfaces toward (vivid, deliberately un-propish).
const BREAK_COLORS = ["#ff2e9a", "#0fd4e6", "#b4f531", "#8a4cff", "#ff7a17"];

export interface LastLightState {
  active: boolean;
  /** 0..1 progress through the final window (drives glow + shrink). */
  intensity: number;
  /** current safe-sphere radius. */
  sphereR: number;
  /** accumulated survival bonus for time spent inside the sphere. */
  bonus: number;
  /** true while the player is inside the contested sphere. */
  insideSphere: boolean;
  /** one-shot paint front position (z), and whether it has finished. */
  frontZ: number;
  frontDone: boolean;
  /** color-break tints: prop id -> vivid color. */
  brokenProps: Map<string, string>;
}

export const lastLight: LastLightState = makeInitial();

function makeInitial(): LastLightState {
  return {
    active: false,
    intensity: 0,
    sphereR: SPHERE_START_R,
    bonus: 0,
    insideSphere: false,
    frontZ: -ROOM_HALF,
    frontDone: false,
    brokenProps: new Map(),
  };
}

export function resetLastLight() {
  Object.assign(lastLight, makeInitial());
  lastLight.brokenProps = new Map();
}

/** Deterministic color-break pick for a prop (stable per id). */
export function breakColorFor(propId: string): string {
  let h = 0;
  for (let i = 0; i < propId.length; i++) h = (h * 31 + propId.charCodeAt(i)) | 0;
  return BREAK_COLORS[Math.abs(h) % BREAK_COLORS.length];
}

/** Color-break override for camo: the vivid tint a crossed prop now reads as. */
export function brokenOverride(propId: string): string | null {
  return lastLight.brokenProps.get(propId) ?? null;
}
