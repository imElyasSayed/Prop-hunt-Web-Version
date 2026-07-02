// Small color helpers used for camouflage scoring.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h,
    16,
  );
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Perceptual-ish distance between two hex colors, normalized to 0..1. */
export function colorDistance(a: string, b: string): number {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  // Weighted euclidean (approx. human sensitivity), max ~ 764.
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  const dist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
  return Math.min(1, dist / 750);
}

/** 1 = identical, 0 = maximally different. */
export function colorMatch(a: string, b: string): number {
  return 1 - colorDistance(a, b);
}

/** Average two hex colors (used when a stamp overlaps existing paint). */
export function averageHex(a: string, b: string, t = 0.5): string {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const bb = Math.round(c1.b + (c2.b - c1.b) * t);
  return "#" + [r, g, bb].map((v) => v.toString(16).padStart(2, "0")).join("");
}
