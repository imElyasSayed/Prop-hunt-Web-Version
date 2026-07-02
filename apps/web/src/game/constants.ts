// Tunable constants + static level data for the SPLOTCH base game.
import type { PropDef } from "./types";

// ---- Brand palette (official SPLOTCH hexes from the brand kit) ----
export const PALETTE = [
  "#ff2e9a", // hot magenta
  "#0fd4e6", // electric cyan
  "#b4f531", // acid lime
  "#ff7a17", // tangerine
  "#8a4cff", // violet
  "#ffd023", // sun yellow
  "#fbf7f0", // paper white
  "#191225", // splat black
] as const;

// ---- Round timing (seconds) ----
export const PREP_SECONDS = 35;
export const HUNT_SECONDS = 95;

// ---- Paint economy ----
// A finite paint budget makes the "no undo" rule bite (design pillar).
export const PAINT_BUDGET = 240;
// Cost per stamp is proportional to brush area; this is the base unit.
export const PAINT_COST_PER_STAMP = 1;

// ---- Movement ----
export const PLAYER_SPEED = 4.2; // units/sec
export const HUNTER_SPEED = 3.5; // slightly slower than the player
export const PLAYER_RADIUS = 0.5;

// ---- Arena bounds (square room centred on origin) ----
export const ROOM_HALF = 12; // walls at +/- ROOM_HALF
export const WALL_HEIGHT = 5;

// ---- Hunter detection ----
export const HUNTER_VIEW_RANGE = 9; // how far the hunter can "see"
export const HUNTER_FOV_DOT = 0.55; // cos of half-FOV; higher = narrower cone
export const HUNTER_TAG_RANGE = 1.6; // must be this close to splatter you
// How long a mismatched, in-view player must be watched before being spotted.
export const HUNTER_SUSPICION_TO_TAG = 1.4; // seconds at full mismatch

// ---- Camouflage scoring ----
// Below this match [0..1] against the nearest surface, you read as "wrong".
export const CAMO_SAFE_THRESHOLD = 0.6;

// ---- Nerve Engine (tension only — NOT coupled to any payout/money) ----
// Holding still, well-hidden, while the Hunter's cone rakes over you banks a
// private Nerve multiplier and pays tension points — but your camo stability
// drains, and if it cracks you flinch into visibility. Moving resets it.
export const NERVE_MAX = 3.0;            // multiplier ceiling
export const NERVE_RAMP = 0.42;          // multiplier gained per second under the cone
export const NERVE_DECAY = 0.7;          // multiplier lost per second when not watched
export const STAB_DRAIN = 0.34;          // camo stability lost per second while sweating
export const STAB_RECOVER = 0.5;         // stability regained per second when safe
export const NERVE_BREAK_TIME = 1.4;     // seconds forced-detectable after a crack
export const NERVE_POINTS_RATE = 45;     // tension points per second at nerve x1

// The single Canvas (map) shipped in the base game: "The Studio".
// `position` is the collision-box CENTER; models (origin at their base) are
// placed on the floor at [x, 0, z] since centerY == height/2 for every prop.
export const PROPS: PropDef[] = [
  { id: "crate-1", position: [-6, 0.9, -5], size: [1.8, 1.8, 1.8], color: "#c98a4b", model: "crate_large", rotationY: 0.3 },
  { id: "crate-2", position: [-4.4, 0.6, -5.6], size: [1.2, 1.2, 1.2], color: "#c98a4b", model: "crate_small", rotationY: -0.5 },
  { id: "barrel-1", position: [6.5, 1.1, -6], size: [1.3, 2.2, 1.3], color: "#3f7d5a", model: "barrel" },
  { id: "barrel-2", position: [7.8, 1.1, -4.4], size: [1.3, 2.2, 1.3], color: "#3f7d5a", model: "barrel" },
  { id: "sofa", position: [-7, 0.8, 6], size: [4.2, 1.6, 1.8], color: "#b23a48", model: "sofa", rotationY: Math.PI },
  { id: "shelf", position: [8, 1.8, 5], size: [1, 3.6, 3.4], color: "#7a6a58", model: "shelf", rotationY: -Math.PI / 2 },
  { id: "plant-pot", position: [2, 0.7, 8], size: [1.4, 1.4, 1.4], color: "#4a8f43", model: "plant_pot" },
  { id: "pillar", position: [0, 2.5, 0], size: [1.6, 5, 1.6], color: "#d8d2c4", model: "pillar" },
  { id: "desk", position: [5, 0.7, 6], size: [3, 1.4, 1.6], color: "#8a6d4f", model: "desk", rotationY: Math.PI },
  { id: "locker", position: [-8.5, 1.6, -1], size: [1.4, 3.2, 1.4], color: "#4f6d8a", model: "locker", rotationY: Math.PI / 2 },
];

// Floor + wall colors — warm paper tones so painted players pop against them.
export const FLOOR_COLOR = "#e4ddcd";
export const WALL_COLOR = "#efe9dd";
