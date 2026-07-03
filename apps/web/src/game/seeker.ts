// Seeker Toolkit — three seeker-side systems, runtime state in module refs.
//
// (a) Second Look — a cooldown-gated close-inspect. When the Hunter gets a
//     mid-confidence read on a suspected prop, it commits to a deliberate
//     inspect: a correct read (still mismatched) = catch + small bonus; a wrong
//     read (you held still and blended) = a cooldown penalty that buys you time.
// (b) Escalation Clock — as the round timer drains, scan radius/frequency and
//     "last-hider heat" rise (telegraphed + skill-mitigable), ending in a HARD
//     end-of-round reveal so there is never an unfindable stalemate.
// (c) Visual Whistle — every involuntary tell also fires an on-screen ripple +
//     caption (accessibility, driven in the HUD from the store's tell flags).
//
// In single-player the seeker is the AI Hunter, so (a) and (b) are AI-driven and
// fully playable here. MERGE COUPLING (multiplayer): expose Second Look as a
// human-seeker action (a bound "inspect" input, server-validated like a tag) and
// drive the Escalation Clock from the authoritative round timer so all clients
// agree; the hard reveal must be server-issued.

import { HUNT_SECONDS } from "./constants";

// --- Escalation ---
export const ESCALATION_START = 0.45; // fraction of the hunt before it ramps
export const HARD_REVEAL_AT = 8; // s remaining → forced reveal (no stalemate)
export const ESCALATION_RANGE_BONUS = 0.5; // +50% view range at full escalation
export const ESCALATION_SUSPICION_BONUS = 0.6; // +60% suspicion rate at full

// --- Second Look ---
export const INSPECT_TIME = 1.1; // s the Hunter freezes to inspect
export const INSPECT_TRIGGER_DIST = 4.2; // must be this close to inspect
export const INSPECT_SUSPICION_LO = 0.4; // inspect fires in this suspicion band
export const INSPECT_COOLDOWN = 6; // s penalty after a wrong read
export const SECOND_LOOK_BONUS = 60; // seeker bonus for a correct inspect (MP)

export interface SeekerState {
  /** 0..1 escalation ramp over the hunt. */
  escalation: number;
  /** Hunter currently mid-inspect (Second Look). */
  inspecting: boolean;
  /** seconds left in the current inspect. */
  inspectLeft: number;
  /** seconds left on the wrong-read cooldown. */
  inspectCooldown: number;
  /** true in the final HARD_REVEAL_AT seconds — player forced detectable. */
  hardReveal: boolean;
  /** outcome tag of the last inspect for HUD feedback ('' | 'correct' | 'wrong'). */
  lastInspect: string;
  lastInspectAt: number;
}

export const seeker: SeekerState = makeInitial();

function makeInitial(): SeekerState {
  return {
    escalation: 0,
    inspecting: false,
    inspectLeft: 0,
    inspectCooldown: 0,
    hardReveal: false,
    lastInspect: "",
    lastInspectAt: -999,
  };
}

export function resetSeeker() {
  Object.assign(seeker, makeInitial());
}

/** Compute the escalation ramp 0..1 from hunt elapsed seconds. */
export function computeEscalation(survivedFor: number): number {
  const f = survivedFor / HUNT_SECONDS; // 0..1 through the hunt
  if (f <= ESCALATION_START) return 0;
  return Math.min(1, (f - ESCALATION_START) / (1 - ESCALATION_START));
}
