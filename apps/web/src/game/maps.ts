// Data-driven map system ("Canvases"). Each map bundles its own layout, prop
// kit, palette/materials, patrol waypoints and camo targets — the level is no
// longer hard-coded to The Studio.
//
// Camo (nearestSurfaceColor), collision (collide), the Hunter's patrol, the Room
// renderer and the Scene environment all read the ACTIVE map via activeMap() /
// mapProps(), so adding a Canvas is pure data (plus its GLB props).
//
// New props for the three added maps were generated headless in Blender (see
// scratchpad/generate_props.py) to the existing kit's conventions: low-poly,
// flat-shaded, origin at base, exact game-unit sizes, one mesh per GLB.
//
// MERGE COUPLING: prop-party's PARTY_PROPS and any other bespoke prop swap
// should fold into this registry as their own MapDef at merge time.

import type { PropDef } from "./types";
import { PROPS as STUDIO_PROPS, FLOOR_COLOR, WALL_COLOR } from "./constants";

export interface MapDef {
  id: string;
  name: string;
  blurb: string;
  floorColor: string;
  wallColor: string;
  /** scene background + fog color. */
  bgColor: string;
  props: PropDef[];
  /** open-floor Hunter patrol waypoints [x, z]. */
  waypoints: [number, number][];
  /** map-select card illustration (SPLOTCH Design Vol.4). */
  art: string;
  /** 4 themed floor decal SVGs scattered on this Canvas. */
  decals: string[];
}

// --- The Studio (the shipped base map) ------------------------------------
const STUDIO: MapDef = {
  id: "studio",
  art: "/art/map-studio.svg",
  decals: ["/art/dec-studio-1.svg","/art/dec-studio-2.svg","/art/dec-studio-3.svg","/art/dec-studio-4.svg"],
  name: "The Studio",
  blurb: "Warm paper tones. The original Canvas.",
  floorColor: FLOOR_COLOR,
  wallColor: WALL_COLOR,
  bgColor: "#fbf7f0",
  props: STUDIO_PROPS,
  waypoints: [
    [-4, -2], [4, -2], [8, -1], [4, 3], [-3, 3], [0, -8], [-4, 2],
  ],
};

// --- Neon Alley (dark cyberpunk backstreet) -------------------------------
const NEON_ALLEY: MapDef = {
  id: "neon-alley",
  art: "/art/map-neonalley.svg",
  decals: ["/art/dec-neon-1.svg","/art/dec-neon-2.svg","/art/dec-neon-3.svg","/art/dec-neon-4.svg"],
  name: "Neon Alley",
  blurb: "Rain-slick backstreet. Hide among skips, drums and vending glow.",
  floorColor: "#17151f",
  wallColor: "#221f38",
  bgColor: "#0e0c16",
  props: [
    { id: "na-dump-1", position: [-7, 0.6, -5], size: [1.9, 1.2, 1.1], color: "#1f6f6f", model: "na_dumpster", rotationY: 0.2 },
    { id: "na-dump-2", position: [-8.5, 0.6, 3], size: [1.9, 1.2, 1.1], color: "#1f6f6f", model: "na_dumpster", rotationY: -0.4 },
    { id: "na-vend-1", position: [8, 1.2, -4], size: [1.2, 2.4, 1.0], color: "#c81e7a", model: "na_vending", rotationY: -Math.PI / 2 },
    { id: "na-vend-2", position: [8.4, 1.2, 5.5], size: [1.2, 2.4, 1.0], color: "#c81e7a", model: "na_vending", rotationY: -Math.PI / 2 },
    { id: "na-drum-1", position: [3, 0.9, -6], size: [1.2, 1.8, 1.2], color: "#0fd4e6", model: "na_drum" },
    { id: "na-drum-2", position: [4.4, 0.9, -5], size: [1.2, 1.8, 1.2], color: "#0fd4e6", model: "na_drum" },
    { id: "na-barr-1", position: [-2, 0.5, 5], size: [1.6, 1.0, 0.5], color: "#ff7a17", model: "na_barrier", rotationY: 0.3 },
    { id: "na-barr-2", position: [1.5, 0.5, 6.5], size: [1.6, 1.0, 0.5], color: "#ff7a17", model: "na_barrier", rotationY: -0.2 },
    { id: "na-crate", position: [-6, 0.9, -1], size: [1.8, 1.8, 1.8], color: "#c98a4b", model: "crate_large", rotationY: 0.5 },
  ],
  waypoints: [
    [-3, -2], [3, -2], [6, 1], [0, 3], [-4, 6], [5, 8], [0, -8],
  ],
};

// --- Toy Box (bright primary-colored playroom) ----------------------------
const TOY_BOX: MapDef = {
  id: "toy-box",
  art: "/art/map-toybox.svg",
  decals: ["/art/dec-toy-1.svg","/art/dec-toy-2.svg","/art/dec-toy-3.svg","/art/dec-toy-4.svg"],
  name: "Toy Box",
  blurb: "Giant blocks and a beach ball. Loud, primary, and forgiving.",
  floorColor: "#ffe6a8",
  wallColor: "#ffd0e0",
  bgColor: "#fff3d2",
  props: [
    { id: "tb-red-1", position: [-6, 0.75, -4], size: [1.5, 1.5, 1.5], color: "#e23b3b", model: "tb_block_red", rotationY: 0.2 },
    { id: "tb-red-2", position: [5.5, 0.75, 5], size: [1.5, 1.5, 1.5], color: "#e23b3b", model: "tb_block_red", rotationY: -0.5 },
    { id: "tb-blue-1", position: [-5, 0.75, 4], size: [1.5, 1.5, 1.5], color: "#2f6fd0", model: "tb_block_blue", rotationY: 0.4 },
    { id: "tb-blue-2", position: [6, 0.75, -5], size: [1.5, 1.5, 1.5], color: "#2f6fd0", model: "tb_block_blue" },
    { id: "tb-ball-1", position: [2, 0.75, 3], size: [1.5, 1.5, 1.5], color: "#ffd023", model: "tb_ball" },
    { id: "tb-ball-2", position: [-8, 0.75, 0], size: [1.5, 1.5, 1.5], color: "#ffd023", model: "tb_ball" },
    { id: "tb-dom-1", position: [8, 0.9, 1], size: [0.8, 1.8, 0.4], color: "#b4f531", model: "tb_domino", rotationY: 0.6 },
    { id: "tb-dom-2", position: [0, 0.9, -6], size: [0.8, 1.8, 0.4], color: "#b4f531", model: "tb_domino", rotationY: -0.3 },
    { id: "tb-crate", position: [3, 0.6, 8], size: [1.2, 1.2, 1.2], color: "#c98a4b", model: "crate_small", rotationY: 0.5 },
  ],
  waypoints: [
    [-3, -2], [3, -2], [7, 3], [0, 5], [-6, 6], [-3, 2], [0, -8],
  ],
};

// --- Backrooms (liminal mono-yellow) --------------------------------------
const BACKROOMS: MapDef = {
  id: "backrooms",
  art: "/art/map-backrooms.svg",
  decals: ["/art/dec-back-1.svg","/art/dec-back-2.svg","/art/dec-back-3.svg","/art/dec-back-4.svg"],
  name: "Backrooms",
  blurb: "Mono-yellow and endless. Match the walls or vanish behind a beam.",
  floorColor: "#a89b3f",
  wallColor: "#c9bd5e",
  bgColor: "#b6a94e",
  props: [
    { id: "br-beam-1", position: [-5, 2.5, -4], size: [1.0, 5.0, 1.0], color: "#d8cfa8", model: "br_beam" },
    { id: "br-beam-2", position: [5, 2.5, -4], size: [1.0, 5.0, 1.0], color: "#d8cfa8", model: "br_beam" },
    { id: "br-beam-3", position: [5, 2.5, 4], size: [1.0, 5.0, 1.0], color: "#d8cfa8", model: "br_beam" },
    { id: "br-beam-4", position: [-5, 2.5, 4], size: [1.0, 5.0, 1.0], color: "#d8cfa8", model: "br_beam" },
    { id: "br-box-1", position: [-8, 0.7, 0], size: [1.4, 1.4, 1.4], color: "#c2a260", model: "br_box", rotationY: 0.3 },
    { id: "br-box-2", position: [8, 0.7, -1], size: [1.4, 1.4, 1.4], color: "#c2a260", model: "br_box", rotationY: -0.4 },
    { id: "br-cab-1", position: [0, 1.0, -7], size: [1.3, 2.0, 0.7], color: "#b8ad8a", model: "br_cabinet" },
    { id: "br-cab-2", position: [-8, 1.0, 6], size: [1.3, 2.0, 0.7], color: "#b8ad8a", model: "br_cabinet", rotationY: 0.5 },
    { id: "br-cab-3", position: [8, 1.0, 6], size: [1.3, 2.0, 0.7], color: "#b8ad8a", model: "br_cabinet", rotationY: -0.5 },
  ],
  waypoints: [
    [-2, -2], [2, -2], [8, 2], [0, 2], [-8, 3], [0, 8], [0, -8],
  ],
};

export const MAPS: MapDef[] = [STUDIO, NEON_ALLEY, TOY_BOX, BACKROOMS];
export const DEFAULT_MAP_ID = "studio";

// Active map lives in a module ref so per-frame readers (camo/collision) don't
// pay a store lookup. Kept in sync by the store's setMap action.
const state = { active: STUDIO };

export function setActiveMap(id: string) {
  state.active = MAPS.find((m) => m.id === id) ?? STUDIO;
}
export function activeMap(): MapDef {
  return state.active;
}
export function mapProps(): PropDef[] {
  return state.active.props;
}
export function getMap(id: string): MapDef {
  return MAPS.find((m) => m.id === id) ?? STUDIO;
}

// GLB basenames used across all maps (for preloading).
export const MAP_MODEL_NAMES = [
  "na_dumpster", "na_vending", "na_barrier", "na_drum",
  "tb_block_red", "tb_block_blue", "tb_ball", "tb_domino",
  "br_box", "br_cabinet", "br_beam",
];
