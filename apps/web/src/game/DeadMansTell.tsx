// Dead Man's Tell scene component: ticks the distress clock, raises the flare
// on a tag, and renders the ~4s distress flash + the ~20s paint-stain graves.
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { shared } from "./shared";
import { distressPulse } from "./sound";
import { useArtTexture } from "./artTexture";
import { distress, raiseFlare, DISTRESS_FLASH } from "./distress";

const GRAVE_POOL = 4; // MP-ready pool; SP uses one

export function DeadMansTell() {
  const flash = useRef<THREE.Mesh>(null);
  const graves = useRef<(THREE.Mesh | null)[]>([]);
  const raised = useRef(false);

  const flashMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ff2e4f",
        transparent: true,
        opacity: 0.6,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const graveMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#2a1420",
        transparent: true,
        opacity: 0.7,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  );

  // Design Vol.5 art: distress alarm ring + paint-stain grave.
  const ringTex = useArtTexture("/art/distress-ring.svg", 256);
  const graveTex = useArtTexture("/art/grave-stain.svg", 256);
  useEffect(() => {
    if (ringTex) {
      flashMat.map = ringTex;
      flashMat.color.set("#ffffff");
      flashMat.needsUpdate = true;
    }
  }, [ringTex, flashMat]);
  useEffect(() => {
    if (!graveTex) return;
    for (const m of graves.current) {
      if (m) {
        const gm = m.material as THREE.MeshBasicMaterial;
        gm.map = graveTex;
        gm.color.set("#ffffff");
        gm.needsUpdate = true;
      }
    }
  }, [graveTex]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    distress.clock += dt;

    const s = useGame.getState();
    const splatted = s.phase === "result" && s.outcome === "splatted";

    // raise the flare once, on the tag
    if (splatted && !raised.current) {
      raised.current = true;
      raiseFlare(shared.playerPos, shared.playerColor);
      distressPulse();
    }
    if (!splatted) raised.current = false;

    // prune expired graves
    if (distress.graves.length) {
      distress.graves = distress.graves.filter((g) => g.until > distress.clock);
    }

    // --- render distress flash (expanding pulse at the death spot) ---
    const fMesh = flash.current;
    if (fMesh) {
      const active = distress.flashUntil > distress.clock;
      fMesh.visible = active;
      if (active) {
        const t = 1 - (distress.flashUntil - distress.clock) / DISTRESS_FLASH; // 0..1
        const r = 0.6 + t * 2.4;
        fMesh.scale.setScalar(r);
        fMesh.position.set(distress.flashPos.x, 0.05, distress.flashPos.z);
        flashMat.opacity = 0.85 * (1 - t) * (0.6 + 0.4 * Math.abs(Math.sin(distress.clock * 12)));
      }
    }

    // --- render graves (paint-stain discs on the floor) ---
    for (let i = 0; i < GRAVE_POOL; i++) {
      const m = graves.current[i];
      if (!m) continue;
      const g = distress.graves[i];
      if (!g) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(g.pos.x, 0.03, g.pos.z);
      const life = (g.until - distress.clock) / 20; // 1 → 0
      // fade the stain out as it ages
      (m.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.45 * Math.max(0, life);
    }
  });

  return (
    <group>
      {/* distress alarm ring at the death spot (Design Vol.5) */}
      <mesh ref={flash} material={flashMat} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      {/* grave-stain pool (each its own material clone for independent fade) */}
      {Array.from({ length: GRAVE_POOL }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            graves.current[i] = el;
          }}
          material={graveMat.clone()}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <planeGeometry args={[2.4, 2.4]} />
        </mesh>
      ))}
    </group>
  );
}
