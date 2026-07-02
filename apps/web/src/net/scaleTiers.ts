// Body-scale tiers the server assigns per round (scaleKey → size/speed). Kept
// self-contained in the multiplayer feature so it doesn't depend on the
// scale-roulette branch; mirrors the server's gameConfig SCALE_TIERS.
export interface ScaleTier {
  scale: number;
  speedMult: number;
}

export const SCALE_TIERS: Record<string, ScaleTier> = {
  teeny: { scale: 0.4, speedMult: 1.4 },
  normal: { scale: 1.0, speedMult: 1.0 },
  chonk: { scale: 1.4, speedMult: 0.85 },
  giga: { scale: 2.2, speedMult: 0.6 },
};
