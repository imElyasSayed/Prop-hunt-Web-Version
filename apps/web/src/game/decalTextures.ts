// Environment paint decals (floor splats, puddles, wall drips, the elimination
// splat). SVGs are rasterized to cached textures and drawn on flat planes.
"use client";
import { useEffect, useState } from "react";
import * as THREE from "three";

// Decal source files + their intrinsic aspect (width / height).
export const DECALS = {
  floorSplat: { url: "/art/16-floor-splat-primary-pain.svg", aspect: 200 / 170 },
  puddle: { url: "/art/17-puddle-glossy-wet-pool-w.svg", aspect: 220 / 150 },
  wallDrip: { url: "/art/18-wall-drip-vertical-runs-.svg", aspect: 150 / 200 },
  footprint: { url: "/art/19-footprint-smear-dragged-.svg", aspect: 240 / 140 },
  elimination: { url: "/art/20-elimination-splat.svg", aspect: 260 / 210 },
} as const;

export type DecalName = keyof typeof DECALS;

const cache = new Map<string, THREE.Texture>();
const pending = new Map<string, Promise<THREE.Texture>>();

function loadDecal(url: string, aspect: number): Promise<THREE.Texture> {
  const cached = cache.get(url);
  if (cached) return Promise.resolve(cached);
  const inflight = pending.get(url);
  if (inflight) return inflight;
  const w = 256;
  const h = Math.round(256 / aspect);
  const p = new Promise<THREE.Texture>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      cache.set(url, t);
      resolve(t);
    };
    img.onerror = reject;
    img.src = url;
  });
  pending.set(url, p);
  return p;
}

export function useDecalTexture(name: DecalName): THREE.Texture | null {
  const { url, aspect } = DECALS[name];
  const [tex, setTex] = useState<THREE.Texture | null>(cache.get(url) ?? null);
  useEffect(() => {
    let alive = true;
    loadDecal(url, aspect)
      .then((t) => alive && setTex(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url, aspect]);
  return tex;
}
