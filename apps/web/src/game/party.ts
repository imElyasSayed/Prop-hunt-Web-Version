// Prop Party — Chaos Casual Mode.
//
// A low-stakes party playlist: a prop-DENSE, repeat-texture layout (lots of
// same-colored crates/barrels) so even a sloppy newbie morph blends somewhere;
// short rounds; frequent ambient whistles; a silly rotating modifier each round;
// forgiving detection. Vibes + challenge progress only — no wagers.
//
// The Mimic and every "harsh" system (Nerve drain, Paint Tide, Last Light, etc.)
// are GATED OUT of this queue. On `main` those live on other branches, so they're
// absent already; `party.active` is the flag the merge should check to keep them
// out (see isPartyGatedOut()).
//
// Prop-set swap is done here via activeProps() so camo/collision/Room/Hunter can
// share one source. MERGE COUPLING (map-expansion): fold PARTY_PROPS into the
// data-driven map registry as the "Party" canvas and drop this bespoke swap.

import type { PropDef } from "./types";
import { PROPS, HUNT_SECONDS, CAMO_SAFE_THRESHOLD } from "./constants";

/** Live party flag, kept in sync with the store's `mode` for frame-loop reads. */
export const party = { active: false };

// Short rounds + forgiving camo so casual morphs survive.
export const PARTY_HUNT_SECONDS = 50;
export const PARTY_CAMO_THRESHOLD = 0.5;
export const PARTY_WHISTLE_INTERVAL = 7; // ambient whistle cadence (s)

/** Current hunt length (party mode shortens it). */
export function huntSeconds(): number {
  return party.active ? PARTY_HUNT_SECONDS : HUNT_SECONDS;
}
/** Current camo safe threshold (party mode is more forgiving). */
export function camoThreshold(): number {
  return party.active ? PARTY_CAMO_THRESHOLD : CAMO_SAFE_THRESHOLD;
}

/** True if a "harsh"/Mimic system should be suppressed this round. */
export function isPartyGatedOut(): boolean {
  return party.active;
}

// --- Prop-dense repeat-texture party layout -------------------------------
// Many crates/barrels share a color on purpose (repeat texture = easy blend).
// Kept clear of the player spawn (0,0,6) and hunter spawn (0,0,-9).
const CRATE = "#c98a4b";
const BARREL = "#3f7d5a";
const POT = "#4a8f43";

function grid(): PropDef[] {
  const out: PropDef[] = [];
  let n = 0;
  // rows of repeated crates across the room, leaving lanes to move through
  const spots: [number, number, string, string, number][] = [
    // x, z, model, color, size
    [-8, -4, "crate_large", CRATE, 1.8],
    [-5, -4, "crate_small", CRATE, 1.2],
    [-2, -3, "barrel", BARREL, 1.3],
    [2, -3, "barrel", BARREL, 1.3],
    [5, -4, "crate_large", CRATE, 1.8],
    [8, -4, "crate_small", CRATE, 1.2],
    [-8, 0, "barrel", BARREL, 1.3],
    [-5, 1, "crate_large", CRATE, 1.8],
    [-2, 2, "plant_pot", POT, 1.4],
    [2, 2, "plant_pot", POT, 1.4],
    [5, 1, "crate_large", CRATE, 1.8],
    [8, 0, "barrel", BARREL, 1.3],
    [-7, 4, "crate_small", CRATE, 1.2],
    [-3, 4, "crate_large", CRATE, 1.8],
    [3, 4, "crate_large", CRATE, 1.8],
    [7, 4, "crate_small", CRATE, 1.2],
    [-9, 8, "barrel", BARREL, 1.3],
    [9, 8, "barrel", BARREL, 1.3],
  ];
  for (const [x, z, model, color, s] of spots) {
    out.push({
      id: `party-${n++}`,
      position: [x, s / 2, z],
      size: [s, s, s],
      color,
      model,
      rotationY: (n % 4) * 0.4,
    });
  }
  return out;
}

export const PARTY_PROPS: PropDef[] = grid();

/** The prop set in play this round. */
export function activeProps(): PropDef[] {
  return party.active ? PARTY_PROPS : PROPS;
}

// --- Silly rotating modifiers ---------------------------------------------
export interface PartyModifier {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
}
export const PARTY_MODIFIERS: PartyModifier[] = [
  { id: "bighead", name: "Big Head Mode", emoji: "🗿", blurb: "Chonky blobs all round." },
  { id: "turbo", name: "Turbo Paws", emoji: "⚡", blurb: "Zoomies engaged — everyone's faster." },
  { id: "bouncy", name: "Bouncy Blobs", emoji: "🫧", blurb: "Boing! Everyone hops." },
  { id: "floaty", name: "Floaty", emoji: "🎈", blurb: "Low-grav drift." },
  { id: "disco", name: "Disco Fever", emoji: "🕺", blurb: "Your blob won't stop shimmering." },
];
export function pickModifier(round: number): PartyModifier {
  return PARTY_MODIFIERS[round % PARTY_MODIFIERS.length];
}

// --- Vibes + challenge progress (localStorage) ----------------------------
const KEY = "splotch:party-progress:v1";
export interface PartyProgress {
  rounds: number;
  survivals: number;
}
export function partyProgress(): PartyProgress {
  if (typeof window === "undefined") return { rounds: 0, survivals: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PartyProgress;
  } catch {
    /* ignore */
  }
  return { rounds: 0, survivals: 0 };
}
export function bumpPartyProgress(survived: boolean): PartyProgress {
  const p = partyProgress();
  const next = { rounds: p.rounds + 1, survivals: p.survivals + (survived ? 1 : 0) };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}

// Party "level" = a light vibe metric from rounds played.
export function partyLevel(p: PartyProgress): number {
  return 1 + Math.floor(p.rounds / 3);
}
