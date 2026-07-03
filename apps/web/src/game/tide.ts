// Paint Tide — a telegraphed wall of wet paint that sweeps ~1/4 of the map.
//
// Runtime state lives in module refs (like `shared.ts`) so the per-frame sim
// and the camo scorer can read/write it without React re-renders. The `Tide`
// scene component owns the sim (advancing `clock`, scheduling events, moving
// the front); `camo.ts` reads the re-tint overrides; `Player.tsx` reads the
// wet-coat to force-recolor the caught hider.

import { ROOM_HALF } from "./constants";

// --- tuning ---------------------------------------------------------------
export const TIDE_FIRST_AT = 22; // s into the hunt before the first tide
export const TIDE_INTERVAL = 55; // s between tides
export const TIDE_TELEGRAPH = 6; // s the warning line shows before the sweep
export const TIDE_SWEEP = 4; // s the wall takes to cross its band
export const TIDE_SPAN = ROOM_HALF / 2; // world units swept (~1/4 of the 24-wide map)
export const TIDE_RETINT_MS = 25; // s a crossed surface stays re-tinted
export const TIDE_WET_WINDOW = 6; // s a caught hider stays wet-matched

// Vivid wet hues, cycled per tide.
const TIDE_COLORS = ["#0fd4e6", "#ff2e9a", "#b4f531", "#ff7a17"];

// Four sweep configs (axis + direction), cycled per tide.
type Axis = "x" | "z";
interface Sweep {
  axis: Axis;
  dir: 1 | -1;
}
const SWEEPS: Sweep[] = [
  { axis: "x", dir: 1 },
  { axis: "z", dir: 1 },
  { axis: "x", dir: -1 },
  { axis: "z", dir: -1 },
];

export interface TideState {
  /** Hunt-phase clock in seconds (advanced by the Tide component). */
  clock: number;
  /** Index of the next tide to fire. */
  count: number;
  /** telegraph shown, wall not yet moving. */
  telegraphing: boolean;
  /** wall currently sweeping. */
  sweeping: boolean;
  /** 0..1 progress of the current sweep (for VFX). */
  progress: number;
  axis: Axis;
  dir: 1 | -1;
  /** World coord of the sweep's leading edge along `axis`. */
  front: number;
  /** Start / end coord of this sweep along `axis`. */
  start: number;
  end: number;
  color: string;
  /** Re-tinted props: id -> { color, game-clock expiry (seconds) }. */
  tintedProps: Map<string, { color: string; exp: number }>;
  /** Player wet-coat: color + expiry clock; wetUntil<=clock means dry. */
  wetColor: string;
  wetUntil: number;
}

export const tide: TideState = makeInitial();

function makeInitial(): TideState {
  return {
    clock: 0,
    count: 0,
    telegraphing: false,
    sweeping: false,
    progress: 0,
    axis: "x",
    dir: 1,
    front: -ROOM_HALF,
    start: -ROOM_HALF,
    end: -ROOM_HALF + TIDE_SPAN,
    color: TIDE_COLORS[0],
    tintedProps: new Map(),
    wetColor: TIDE_COLORS[0],
    wetUntil: 0,
  };
}

export function resetTide() {
  const t = makeInitial();
  Object.assign(tide, t);
  tide.tintedProps = new Map();
}

/** When does the Nth tide's telegraph begin? */
export function tideTelegraphAt(n: number): number {
  return TIDE_FIRST_AT + n * TIDE_INTERVAL;
}

/** Configure the tide runtime for the Nth sweep (called at telegraph start). */
export function armTide(n: number) {
  const sweep = SWEEPS[n % SWEEPS.length];
  tide.axis = sweep.axis;
  tide.dir = sweep.dir;
  tide.color = TIDE_COLORS[n % TIDE_COLORS.length];
  const edge = sweep.dir === 1 ? -ROOM_HALF : ROOM_HALF;
  tide.start = edge;
  tide.end = edge + sweep.dir * TIDE_SPAN;
  tide.front = edge;
  tide.progress = 0;
}

/** Is the player wet-coated right now? */
export function isWet(): boolean {
  return tide.wetUntil > tide.clock;
}

/**
 * Re-tint override for camo: if `prop`'s footprint sits in a currently-tinted
 * band, return the wet color; else null. Uses the prop's coord along the active
 * axis at the time it was crossed (stored in tintedProps by the sim).
 */
export function tintOverride(propId: string): string | null {
  const t = tide.tintedProps.get(propId);
  if (t === undefined) return null;
  if (t.exp <= tide.clock) {
    tide.tintedProps.delete(propId);
    return null;
  }
  return t.color;
}
