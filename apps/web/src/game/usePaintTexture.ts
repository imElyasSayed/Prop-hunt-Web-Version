// Builds a CanvasTexture for the avatar from the deterministic stamp list.
// Incrementally draws new stamps and reports the dominant painted color +
// coverage so camo can be scored without reading pixels back every frame.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Stamp } from "./types";
import { hexToRgb } from "./color";
import { BRUSHES, DEFAULT_BRUSH, drawBrush } from "./brushes";

const TEX = 256;

export function usePaintTexture(stamps: Stamp[]) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = TEX;
    c.height = TEX;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fbf7f0"; // blank white blob
    ctx.fillRect(0, 0, TEX, TEX);
    return c;
  }, []);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);

  const drawnCount = useRef(0);
  // Running accumulation for dominant color + coverage.
  const acc = useRef({ r: 0, g: 0, b: 0, area: 0 });

  useEffect(() => {
    const ctx = canvas.getContext("2d")!;
    // If stamps were reset (fewer than drawn), repaint from scratch.
    if (stamps.length < drawnCount.current) {
      ctx.fillStyle = "#fbf7f0";
      ctx.fillRect(0, 0, TEX, TEX);
      drawnCount.current = 0;
      acc.current = { r: 0, g: 0, b: 0, area: 0 };
    }
    for (let i = drawnCount.current; i < stamps.length; i++) {
      const s = stamps[i];
      const x = s.u * TEX;
      const y = s.v * TEX;
      const radius = Math.max(2, s.size * TEX);
      const brush = BRUSHES[DEFAULT_BRUSH];
      const a = drawBrush(ctx, brush, x, y, radius, s.color);
      const { r, g, b } = hexToRgb(s.color);
      acc.current.r += r * a;
      acc.current.g += g * a;
      acc.current.b += b * a;
      acc.current.area += a;
    }
    if (stamps.length !== drawnCount.current) {
      drawnCount.current = stamps.length;
      texture.needsUpdate = true;
    }
  }, [stamps, canvas, texture]);

  /** Dominant painted color as hex + coverage 0..1. */
  const getDominant = () => {
    const a = acc.current.area;
    if (a <= 0) return { color: "#fbf7f0", coverage: 0 };
    const r = Math.round(acc.current.r / a);
    const g = Math.round(acc.current.g / a);
    const b = Math.round(acc.current.b / a);
    const color =
      "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    // Coverage: total painted area vs the texture area, softly capped.
    const coverage = Math.min(1, a / (TEX * TEX * 0.5));
    return { color, coverage };
  };

  return { texture, getDominant };
}
