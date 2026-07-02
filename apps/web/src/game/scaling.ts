// Scale Roulette — each round rolls a body scale for the Chameleon (and, in the
// Mixed Handicap variant, a mismatched scale for the Hunter). Scale rebalances
// speed, detectability, and scoring so every size plays differently but fair.
export type ScaleKey = "teeny" | "normal" | "chonk" | "giga";

export interface ScaleTier {
  key: ScaleKey;
  label: string;
  emoji: string;
  /** Visual + collision size multiplier vs the normal blob. */
  scale: number;
  /** Move-speed multiplier (smaller = nippier). */
  speedMult: number;
  /** Detectability multiplier applied to the Hunter's camo threshold
   *  (>1 = easier to spot, <1 = harder to spot). */
  detectMult: number;
  /** Score multiplier — bigger, clumsier hiders are worth more if they survive. */
  scoreMult: number;
  blurb: string;
}

export const SCALE_TIERS: Record<ScaleKey, ScaleTier> = {
  teeny: {
    key: "teeny",
    label: "Teeny",
    emoji: "🐜",
    scale: 0.4,
    speedMult: 1.4,
    detectMult: 0.55,
    scoreMult: 0.7,
    blurb: "Tiny + nippy, hard to spot — but an easy hide, so low reward.",
  },
  normal: {
    key: "normal",
    label: "Normal",
    emoji: "🟣",
    scale: 1.0,
    speedMult: 1.0,
    detectMult: 1.0,
    scoreMult: 1.0,
    blurb: "The standard blob. Balanced speed, size, and scoring.",
  },
  chonk: {
    key: "chonk",
    label: "Chonk",
    emoji: "🫃",
    scale: 1.4,
    speedMult: 0.85,
    detectMult: 1.3,
    scoreMult: 1.25,
    blurb: "Bigger + slower, easier to clock. Survive for extra credit.",
  },
  giga: {
    key: "giga",
    label: "GIGA",
    emoji: "🐘",
    scale: 2.2,
    speedMult: 0.6,
    detectMult: 1.9,
    scoreMult: 1.7,
    blurb: "Enormous, sluggish, glaringly obvious. Surviving is a flex.",
  },
};

export const SCALE_KEYS: ScaleKey[] = ["teeny", "normal", "chonk", "giga"];

// Menu-selectable modes: a fixed size, a random spin, or the Mixed Handicap.
export type ScaleMode = ScaleKey | "roulette" | "mixed";

export interface ScaleModeDef {
  mode: ScaleMode;
  label: string;
  emoji: string;
  desc: string;
}

export const SCALE_MODES: ScaleModeDef[] = [
  { mode: "roulette", label: "Roulette", emoji: "🎰", desc: "Spin a random size each round" },
  { mode: "teeny", label: "Teeny", emoji: "🐜", desc: "0.4× — tiny & sneaky" },
  { mode: "normal", label: "Normal", emoji: "🟣", desc: "1.0× — balanced" },
  { mode: "chonk", label: "Chonk", emoji: "🫃", desc: "1.4× — beefy" },
  { mode: "giga", label: "GIGA", emoji: "🐘", desc: "2.2× — enormous" },
  { mode: "mixed", label: "Mixed Handicap", emoji: "⚖️", desc: "Teeny hider vs GIGA Hunter" },
];

/** Resolve the menu mode into concrete player/hunter scale keys for a round. */
export function resolveScales(mode: ScaleMode): {
  playerKey: ScaleKey;
  hunterKey: ScaleKey;
} {
  if (mode === "roulette") {
    const playerKey = SCALE_KEYS[Math.floor(Math.random() * SCALE_KEYS.length)];
    return { playerKey, hunterKey: "normal" };
  }
  if (mode === "mixed") {
    return { playerKey: "teeny", hunterKey: "giga" };
  }
  return { playerKey: mode, hunterKey: "normal" };
}
