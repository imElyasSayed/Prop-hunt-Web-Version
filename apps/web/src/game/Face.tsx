// Splotchy's face: an eyes-only sprite overlay on the front of the blob that
// swaps expression by game state (neutral / spotted / smug / splatted).
// The sprites are transparent, so the blob shows through behind the eyes.
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { shared } from "./shared";

const FACE_URLS: Record<string, string> = {
  neutral: "/art/08-neutral.svg",
  spotted: "/art/11-spotted-wide-surprised-e.svg",
  smug: "/art/13-smug-half-lidded-taunt.svg",
  splatted: "/art/14-splatted.svg",
};

function loadSvgTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 200;
      c.height = 140;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 200, 140);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      resolve(tex);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function SplotchyFace() {
  const mesh = useRef<THREE.Mesh>(null);
  const textures = useRef<Record<string, THREE.Texture>>({});
  const current = useRef<string>("");

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  useEffect(() => {
    let alive = true;
    Promise.all(
      Object.entries(FACE_URLS).map(async ([k, url]) => {
        try {
          textures.current[k] = await loadSvgTexture(url);
        } catch {
          /* face is cosmetic; ignore load failures */
        }
      }),
    ).then(() => {
      if (alive && !material.map && textures.current.neutral) {
        material.map = textures.current.neutral;
        material.needsUpdate = true;
        current.current = "neutral";
      }
    });
    return () => {
      alive = false;
    };
  }, [material]);

  useFrame(() => {
    const s = useGame.getState();
    let expr = "neutral";
    if (s.phase === "result" && s.outcome === "splatted") expr = "splatted";
    else if (s.phase === "hunt" && shared.taunting) expr = "smug";
    else if (s.phase === "hunt" && s.beingWatched) expr = "spotted";
    if (expr !== current.current && textures.current[expr]) {
      material.map = textures.current[expr];
      material.needsUpdate = true;
      current.current = expr;
    }
    // Fade the eyes out with the blob as it folds into a prop, so a folded
    // hider doesn't give itself away with two floating eyeballs.
    material.opacity = 1 - shared.foldProgress * 0.95;
  });

  // Placed on the upper-front of the blob, facing +Z (toward the camera).
  return (
    <mesh ref={mesh} material={material} position={[0, 0.62, 0.5]}>
      <planeGeometry args={[0.92, 0.64]} />
    </mesh>
  );
}
