// Distress Morph — the Dead Man's Tell.
//
// When a hider is tagged, they raise a *flare*: a ~4s distress-texture flash on
// their morph + a soft audio pulse audible to living hiders, and they leave a
// ~20s paint-stain "grave" where they fell. Outlasting a partner's flare by
// ~20s grants a "Sole Survivor" bonus. One flare per genuine tag.
//
// Base-compatible scaffold: single-player has ONE hider (you), so the death
// side (flash + pulse + grave) is fully playable and verifiable here. The
// "audible to living hiders" broadcast and the Sole-Survivor payout are
// MP-shaped — the module models them (flares list + soleSurvivorBonus) so the
// full loop drops in when merged with `multiplayer`.
//
// MERGE COUPLING (multiplayer): raiseFlare() should fire on the server-validated
// tag for ANY hider and replicate to all clients; each surviving client then
// runs the Sole-Survivor timer against the received flare. In SP only your own
// flare exists.

import * as THREE from "three";

export const DISTRESS_FLASH = 4; // s the distress texture flashes on the morph
export const GRAVE_LIFETIME = 20; // s the paint-stain grave persists
export const SOLE_SURVIVOR_WINDOW = 20; // s you must outlast a partner's flare
export const SOLE_SURVIVOR_BONUS = 200;

export interface Flare {
  id: number;
  pos: THREE.Vector3;
  color: string;
  /** distress.clock timestamp when raised. */
  raisedAt: number;
}

export interface Grave {
  pos: THREE.Vector3;
  color: string;
  /** distress.clock timestamp when it expires. */
  until: number;
}

export interface DistressState {
  /** free-running clock (ticks every frame incl. the result screen). */
  clock: number;
  flares: Flare[];
  graves: Grave[];
  /** distress.clock time the local morph's distress flash ends (0 = none). */
  flashUntil: number;
  flashColor: string;
  flashPos: THREE.Vector3;
}

let flareSeq = 0;

export const distress: DistressState = makeInitial();

function makeInitial(): DistressState {
  return {
    clock: 0,
    flares: [],
    graves: [],
    flashUntil: 0,
    flashColor: "#ff2e4f",
    flashPos: new THREE.Vector3(),
  };
}

export function resetDistress() {
  Object.assign(distress, makeInitial());
  distress.flares = [];
  distress.graves = [];
  distress.flashPos = new THREE.Vector3();
  flareSeq = 0;
}

/** Raise the one-per-tag flare + grave at `pos`. */
export function raiseFlare(pos: THREE.Vector3, color: string): Flare {
  const flare: Flare = { id: flareSeq++, pos: pos.clone(), color, raisedAt: distress.clock };
  distress.flares.push(flare);
  distress.graves.push({ pos: pos.clone(), color, until: distress.clock + GRAVE_LIFETIME });
  distress.flashUntil = distress.clock + DISTRESS_FLASH;
  distress.flashColor = color;
  distress.flashPos.copy(pos);
  return flare;
}

/**
 * Sole-Survivor bonus: total points a still-living hider earns for outlasting
 * each partner flare by SOLE_SURVIVOR_WINDOW. In SP this is 0 (no partners) —
 * it's here so the MP merge just feeds it the received flares + your alive-time.
 */
export function soleSurvivorBonus(flares: Flare[], nowClock: number): number {
  let bonus = 0;
  for (const f of flares) {
    if (nowClock - f.raisedAt >= SOLE_SURVIVOR_WINDOW) bonus += SOLE_SURVIVOR_BONUS;
  }
  return bonus;
}
