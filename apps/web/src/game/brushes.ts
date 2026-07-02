// Brush stamp shapes, taken from the SPLOTCH asset pack (each stamp is a
// cluster of circles in a 120x120 box centred at 60,60). Drawing the cluster
// instead of a single dot makes paint read as wet splatter.
export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

// viewBox is 0..120, centre 60,60. Values copied from public/art/*.svg.
export const BRUSHES: Record<string, Circle[]> = {
  splat: [
    { cx: 60, cy: 60, r: 25 },
    { cx: 37, cy: 43, r: 15 },
    { cx: 85, cy: 42, r: 14 },
    { cx: 90, cy: 76, r: 13 },
    { cx: 64, cy: 90, r: 15 },
    { cx: 35, cy: 80, r: 13 },
    { cx: 50, cy: 29, r: 10 },
    { cx: 101, cy: 52, r: 5 },
    { cx: 26, cy: 58, r: 6 },
  ],
  dab: [
    { cx: 60, cy: 60, r: 31 },
    { cx: 86, cy: 50, r: 12 },
    { cx: 40, cy: 84, r: 14 },
    { cx: 83, cy: 82, r: 9 },
    { cx: 98, cy: 34, r: 5 },
  ],
  dot: [{ cx: 60, cy: 60, r: 38 }],
};

export type BrushName = keyof typeof BRUSHES;
export const DEFAULT_BRUSH: BrushName = "splat";

/**
 * Draw a brush stamp centred at (x,y) in canvas pixels, sized so the stamp's
 * overall radius is `radiusPx`. Returns the painted area (px^2) for coverage.
 */
export function drawBrush(
  ctx: CanvasRenderingContext2D,
  brush: Circle[],
  x: number,
  y: number,
  radiusPx: number,
  color: string,
): number {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const c of brush) {
    const cx = x + ((c.cx - 60) / 60) * radiusPx;
    const cy = y + ((c.cy - 60) / 60) * radiusPx;
    const r = Math.max(0.5, (c.r / 60) * radiusPx);
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
  ctx.fill();
  // Rough painted area for coverage tracking.
  return radiusPx * radiusPx * 1.6;
}
