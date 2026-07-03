// Generic SVG -> CanvasTexture loader for wiring 2D design art onto 3D meshes.
// Rasterizes each SVG once at a fixed square size and caches it.
"use client";
import { useEffect, useState } from "react";
import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();
const pending = new Map<string, Promise<THREE.Texture>>();

function load(url: string, size: number): Promise<THREE.Texture> {
  const c = cache.get(url);
  if (c) return Promise.resolve(c);
  const inflight = pending.get(url);
  if (inflight) return inflight;
  const p = new Promise<THREE.Texture>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = size;
      cv.getContext("2d")!.drawImage(img, 0, 0, size, size);
      const t = new THREE.CanvasTexture(cv);
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

export function useArtTexture(url: string, size = 256): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(cache.get(url) ?? null);
  useEffect(() => {
    let alive = true;
    load(url, size).then((t) => alive && setTex(t)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [url, size]);
  return tex;
}
