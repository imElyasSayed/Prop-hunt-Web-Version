// Tell Skins / Stealth Rating.
//
// Every cosmetic skin publishes a *Stealth Rating* (a fidelity value 0..1).
// Flashier skins are STRUCTURALLY HARDER to hide in: they carry a permanent
// visual "tell" that shaves a little off your camo score (a fidelity penalty).
// In exchange, pulling off a hide in a flashy skin pays out more — the tell
// feeds an INVERSE-fidelity reward multiplier (see `stealthMultiplier`).
//
// HARD VETO (design pillar): a cosmetic may NEVER change *detection timing* —
// suspicion-to-tag seconds, tag range, or view range are global and untouched
// by skins. The only lever a skin pulls is (a) a small camo-score penalty and
// (b) its reward multiplier. Buying a flashier skin can never make you SAFER.
//
// MERGE COUPLING (nerve-engine): on `main` there is no Nerve Engine, so the
// stealth multiplier is surfaced here as a Splotch-Points multiplier on the
// result card. When merged with `nerve-engine`, multiply the *banked Nerve
// reward* by `stealthMultiplier(fidelity)` instead of (or on top of) the
// survival-time score — that is the "survive a stare in a flashy skin = bigger
// reward" loop the spec calls for.

export interface Skin {
  id: string;
  name: string;
  /** One-line shop blurb. */
  blurb: string;
  /**
   * Stealth Rating, 0..1. This is the camo fidelity the skin can reach:
   * 1.0 = plain (no tell, no penalty); lower = flashier tell = harder to hide.
   */
  fidelity: number;
  /** Fallback swatch color for the shop/scoreboard UI. */
  swatch: string;
  /** Skin-tell thumbnail art (SPLOTCH Design Vol.4). */
  art: string;
  /**
   * Cosmetic emissive tint applied to the blob's base material. Purely visual;
   * it does NOT enter camo scoring (camo reads the painted stamp colors only).
   */
  tint?: string;
  /** Cosmetic emissive intensity 0..1 for the tell shimmer (visual only). */
  glow: number;
}

// The three shipped example skins (+ plain). Ratings are published so players
// can see the trade-off before equipping — flashier = riskier = worth more.
export const SKINS: Skin[] = [
  {
    id: "plain",
    art: "/art/skin-plain.svg",
    name: "Plain Blob",
    blurb: "No tell. Full camo fidelity — the honest hider's choice.",
    fidelity: 1.0,
    swatch: "#fbf7f0",
    glow: 0,
  },
  {
    id: "golden",
    art: "/art/skin-golden.svg",
    name: "Golden",
    blurb: "A soft gilt sheen. Small tell, a little extra glory.",
    fidelity: 0.85,
    swatch: "#ffd023",
    tint: "#ffbf1a",
    glow: 0.28,
  },
  {
    id: "molten",
    art: "/art/skin-molten.svg",
    name: "Molten",
    blurb: "Cracks of lava breathe through. A real tell — and a real payout.",
    fidelity: 0.72,
    swatch: "#ff7a17",
    tint: "#ff4d17",
    glow: 0.45,
  },
  {
    id: "prism",
    art: "/art/skin-prism.svg",
    name: "Prism",
    blurb: "Refracts the light. Flashiest tell in the shop — hide in THIS and flex.",
    fidelity: 0.6,
    swatch: "#8a4cff",
    tint: "#0fd4e6",
    glow: 0.6,
  },
];

export const DEFAULT_SKIN_ID = "plain";

export function getSkin(id: string): Skin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

/**
 * Inverse-fidelity reward multiplier. Plain (1.0) → ×1.0; the flashier the
 * skin, the bigger the multiplier on points earned for surviving / banking
 * Nerve. Tuned so Prism (0.6) pays ~×1.8.
 */
export function stealthMultiplier(fidelity: number): number {
  return 1 + (1 - fidelity) * 2;
}

/**
 * Applies a skin's tell penalty to a raw camo score [0..1]. A flashier skin
 * can never fully vanish, so its best-case camo is scaled toward its fidelity.
 * NOTE: this only moves the camo *number*; it never touches detection *timing*.
 */
export function applyTellPenalty(rawCamo: number, fidelity: number): number {
  // Blend: keep most of the score, but bleed a fraction toward the fidelity
  // ceiling so a flashy skin reads a touch "off" even when well painted.
  const penalty = (1 - fidelity) * 0.5; // prism → -0.20 at most
  return Math.max(0, rawCamo * (1 - penalty));
}
