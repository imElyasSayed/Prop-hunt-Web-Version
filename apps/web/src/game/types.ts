// Core shared types for the SPLOTCH base game.

export type GamePhase = "menu" | "prep" | "hunt" | "result";

export type Role = "chameleon" | "hunter";

export type RoundOutcome = "survived" | "splatted" | null;

/**
 * A single paint stamp applied to the player's avatar.
 * This mirrors the "deterministic stroke list" model from the design doc:
 * paint is represented as an ordered list of stamps, not a streamed texture.
 * In the base game it only drives local rendering, but the shape is chosen so
 * it can later be broadcast/replayed for multiplayer without changing callers.
 */
export interface Stamp {
  /** UV coordinate on the avatar surface, 0..1 */
  u: number;
  v: number;
  /** hex color string, e.g. "#ff3ea5" */
  color: string;
  /** brush radius in UV space, 0..1 */
  size: number;
  /** per-avatar ordinal for deterministic ordering */
  seq: number;
}

/**
 * The "Answer-Check": the post-round readout of exactly why the round ended the
 * way it did — the tell that got you found, or the blend that saved you.
 */
export interface Tell {
  outcome: "survived" | "splatted";
  headline: string;
  detail: string;
  camoPct: number;
  paintColor: string;
  surfaceColor: string;
}

/** A prop the player can paint against and hide near, plus its "true" color. */
export interface PropDef {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  /** Dominant color of the prop, used for camouflage scoring. */
  color: string;
  /** GLB basename in /public/models (e.g. "crate_large"). */
  model: string;
  /** Optional Y rotation in radians for placement variety. */
  rotationY?: number;
}
