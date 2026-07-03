// Pulse Ping VFX: the expanding sonar shockwave on the floor (textured with the
// asset-pack radial-rings art) plus a bobbing reveal marker (the downward pin
// sprite) over a revealed hider. Reads shared.pulse / shared.revealTimer each
// frame — no React re-renders.
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shared } from "./shared";
import { PULSE_RANGE } from "./constants";

function loadSvgTexture(
  url: string,
  w: number,
  h: number,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      resolve(tex);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function PulseRing() {
  const ring = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0fd4e6",
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  const markMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ff2e4f",
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  // wire the asset-pack SVGs onto the materials once loaded (cosmetic; the VFX
  // still works with the flat colors if a texture fails to load)
  useEffect(() => {
    let alive = true;
    loadSvgTexture("/art/pulse-shockwave.svg", 256, 256)
      .then((t) => {
        if (!alive) return;
        ringMat.map = t;
        ringMat.color.set("#ffffff");
        ringMat.needsUpdate = true;
      })
      .catch(() => {});
    loadSvgTexture("/art/pulse-reveal-marker.svg", 160, 200)
      .then((t) => {
        if (!alive) return;
        markMat.map = t;
        markMat.color.set("#ffffff");
        markMat.needsUpdate = true;
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ringMat, markMat]);

  useFrame((state, dt) => {
    const p = shared.pulse;
    const r = ring.current;
    if (r) {
      if (!p.active) {
        r.visible = false;
      } else {
        r.visible = true;
        let radius: number;
        let opacity: number;
        if (p.phase === "charging") {
          radius = 0.6 + p.t * 1.4;
          opacity = 0.35 + 0.35 * Math.sin(p.t * 24);
        } else {
          radius = 0.6 + p.t * PULSE_RANGE;
          opacity = (1 - p.t) * 0.75;
        }
        r.position.set(p.x, 0.06, p.z);
        // plane base is 2 units → scale by radius to span a 2·radius diameter
        r.scale.set(radius, radius, radius);
        ringMat.opacity = Math.max(0, opacity);
      }
    }

    const m = marker.current;
    if (m) {
      if (shared.revealTimer > 0) {
        m.visible = true;
        const t = state.clock.elapsedTime;
        m.position.set(
          shared.playerPos.x,
          1.9 + Math.sin(t * 8) * 0.18,
          shared.playerPos.z,
        );
        m.lookAt(camera.position); // billboard toward the camera
        markMat.opacity = 0.75 + 0.25 * Math.sin(t * 12);
      } else {
        m.visible = false;
      }
    }
  });

  return (
    <>
      {/* shockwave disc, laid flat on the floor */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      {/* downward pin marker over a revealed hider (camera-facing) */}
      <mesh ref={marker} material={markMat} visible={false}>
        <planeGeometry args={[0.7, 0.9]} />
      </mesh>
    </>
  );
}
