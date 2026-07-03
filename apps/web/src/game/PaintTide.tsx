// Paint Tide scene component: owns the per-frame sim + renders the telegraph
// floor line and the sweeping wet-paint wall. Force-recolors the player when
// the wall passes over them, and re-tints crossed prop surfaces.
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { shared } from "./shared";
import { PROPS, ROOM_HALF } from "./constants";
import { tideSweep } from "./sound";
import { useArtTexture } from "./artTexture";
import {
  tide,
  armTide,
  tideTelegraphAt,
  TIDE_TELEGRAPH,
  TIDE_SWEEP,
  TIDE_RETINT_MS,
  TIDE_WET_WINDOW,
} from "./tide";

const S = ROOM_HALF;

export function PaintTide() {
  const phase = useGame((s) => s.phase);
  const wall = useRef<THREE.Mesh>(null);
  const line = useRef<THREE.Mesh>(null);

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.72,
        roughness: 0.3,
        metalness: 0.1,
        emissive: new THREE.Color("#000"),
        emissiveIntensity: 0.4,
      }),
    [],
  );
  const lineMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, toneMapped: false }),
    [],
  );

  // Design Vol.5 art: foam on the wet wall, glowing dashed edge on the telegraph.
  const foamTex = useArtTexture("/art/tide-foam.svg", 256);
  const telegraphTex = useArtTexture("/art/tide-telegraph.svg", 256);
  useEffect(() => {
    if (foamTex) {
      foamTex.wrapS = foamTex.wrapT = THREE.RepeatWrapping;
      foamTex.repeat.set(6, 1);
      wallMat.map = foamTex;
      wallMat.needsUpdate = true;
    }
  }, [foamTex, wallMat]);
  useEffect(() => {
    if (telegraphTex) {
      telegraphTex.wrapS = telegraphTex.wrapT = THREE.RepeatWrapping;
      telegraphTex.repeat.set(8, 1);
      lineMat.map = telegraphTex;
      lineMat.needsUpdate = true;
    }
  }, [telegraphTex, lineMat]);

  useFrame((_, dtRaw) => {
    const wallMesh = wall.current;
    const lineMesh = line.current;
    if (!wallMesh || !lineMesh) return;
    if (phase !== "hunt") {
      wallMesh.visible = false;
      lineMesh.visible = false;
      return;
    }
    const dt = Math.min(dtRaw, 0.05);
    tide.clock += dt;

    // --- schedule the next tide ---
    if (!tide.telegraphing && !tide.sweeping) {
      const at = tideTelegraphAt(tide.count);
      if (tide.clock >= at) {
        armTide(tide.count);
        tide.telegraphing = true;
      }
    }

    // --- telegraph window: show the warning line where the wall will land ---
    if (tide.telegraphing) {
      const at = tideTelegraphAt(tide.count);
      const into = tide.clock - at;
      if (into >= TIDE_TELEGRAPH) {
        tide.telegraphing = false;
        tide.sweeping = true;
        tideSweep(); // low wet rumble as the wall releases
      }
    }

    // --- sweeping: advance the front, re-tint + wet-coat as it passes ---
    if (tide.sweeping) {
      const at = tideTelegraphAt(tide.count) + TIDE_TELEGRAPH;
      const into = tide.clock - at;
      tide.progress = Math.min(1, into / TIDE_SWEEP);
      tide.front = tide.start + (tide.end - tide.start) * tide.progress;

      // re-tint props the front has now crossed
      for (const p of PROPS) {
        const coord = tide.axis === "x" ? p.position[0] : p.position[2];
        const crossed =
          tide.dir === 1 ? coord <= tide.front : coord >= tide.front;
        const inBand =
          tide.dir === 1
            ? coord >= tide.start && coord <= tide.end
            : coord <= tide.start && coord >= tide.end;
        if (crossed && inBand && !tide.tintedProps.has(p.id)) {
          tide.tintedProps.set(p.id, {
            color: tide.color,
            exp: tide.clock + TIDE_RETINT_MS,
          });
        }
      }

      // wet-coat the player if the front is passing over them
      const pCoord =
        tide.axis === "x" ? shared.playerPos.x : shared.playerPos.z;
      const nearFront = Math.abs(pCoord - tide.front) < 0.9;
      const inSpan =
        tide.dir === 1
          ? pCoord >= tide.start && pCoord <= tide.end
          : pCoord <= tide.start && pCoord >= tide.end;
      if (nearFront && inSpan) {
        tide.wetColor = tide.color;
        tide.wetUntil = tide.clock + TIDE_WET_WINDOW;
      }

      if (tide.progress >= 1) {
        tide.sweeping = false;
        tide.count += 1;
      }
    }

    // --- render telegraph line ---
    if (tide.telegraphing) {
      lineMesh.visible = true;
      lineMat.color.set(tide.color);
      // pulse the telegraph
      lineMat.opacity = 0.35 + 0.25 * Math.abs(Math.sin(tide.clock * 6));
      // line sits at the sweep's leading edge (the wall's start line)
      positionBand(lineMesh, tide.axis, tide.start, 0.06);
    } else {
      lineMesh.visible = false;
    }

    // --- render sweeping wall ---
    if (tide.sweeping) {
      wallMesh.visible = true;
      wallMat.color.set(tide.color);
      wallMat.emissive.set(tide.color);
      positionBand(wallMesh, tide.axis, tide.front, 0.55);
    } else {
      wallMesh.visible = false;
    }
  });

  return (
    <group>
      {/* telegraph floor line (thin flat slab). Authored spanning local X. */}
      <mesh ref={line} material={lineMat}>
        <boxGeometry args={[S * 2, 0.06, 0.55]} />
      </mesh>
      {/* sweeping wet wall (a low translucent slab). Authored spanning local X. */}
      <mesh ref={wall} material={wallMat}>
        <boxGeometry args={[S * 2, 1.1, 0.5]} />
      </mesh>
    </group>
  );
}

// Position a band (authored spanning local X) perpendicular to the sweep axis
// at `coord`, hovering at height `y`. For an x-axis sweep the band must span Z,
// so it's rotated 90° about Y.
function positionBand(m: THREE.Mesh, axis: "x" | "z", coord: number, y: number) {
  m.position.y = y;
  if (axis === "x") {
    m.rotation.set(0, Math.PI / 2, 0);
    m.position.set(coord, y, 0);
  } else {
    m.rotation.set(0, 0, 0);
    m.position.set(0, y, coord);
  }
}
