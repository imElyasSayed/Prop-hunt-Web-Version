// Last Light scene driver: runs the end-game escalation sim and renders the
// collapsing safe sphere + its floor ring + the one-shot color-break front.
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { shared } from "./shared";
import { PROPS, ROOM_HALF, HUNT_SECONDS } from "./constants";
import { lastLightStart } from "./sound";
import {
  lastLight,
  breakColorFor,
  LAST_LIGHT_SECONDS,
  SPHERE_START_R,
  SPHERE_END_R,
  SEEKER_SPEED_MULT,
  SPHERE_BONUS_RATE,
  FRONT_SWEEP_SECONDS,
} from "./lastlight";
import { useArtTexture } from "./artTexture";

const S = ROOM_HALF;

export function LastLight() {
  const phase = useGame((s) => s.phase);
  const sphere = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const front = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const wasActive = useRef(false);
  const frontElapsed = useRef(0);

  // Design Vol.5 art: the contested-sphere boundary marker + survivor glow halo.
  const sphereTex = useArtTexture("/art/lastlight-sphere.svg", 256);
  const glowTex = useArtTexture("/art/lastlight-glow.svg", 256);
  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false, color: "#b4f531" }),
    [],
  );

  const sphereMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#b4f531",
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.BackSide,
        toneMapped: false,
      }),
    [],
  );
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#b4f531",
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const frontMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff2e9a",
        emissive: new THREE.Color("#ff2e9a"),
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7,
      }),
    [],
  );

  // Route the boundary-marker art onto the floor ring + the halo onto the glow.
  useEffect(() => {
    if (sphereTex) {
      ringMat.map = sphereTex;
      ringMat.color.set("#ffffff"); // let the art's own colors read true
      ringMat.needsUpdate = true;
    }
  }, [sphereTex, ringMat]);
  useEffect(() => {
    if (glowTex) {
      glowMat.map = glowTex;
      glowMat.needsUpdate = true;
    }
  }, [glowTex, glowMat]);

  useFrame((_, dtRaw) => {
    const sMesh = sphere.current;
    const rMesh = ring.current;
    const fMesh = front.current;
    const gMesh = glow.current;
    if (!sMesh || !rMesh || !fMesh) return;
    const dt = Math.min(dtRaw, 0.05);

    if (phase !== "hunt") {
      sMesh.visible = rMesh.visible = fMesh.visible = false;
      if (gMesh) gMesh.visible = false;
      shared.seekerSpeedMult = 1;
      shared.survivorGlow = 0;
      lastLight.active = false;
      wasActive.current = false;
      return;
    }

    const survivedFor = useGame.getState().survivedFor;
    const remaining = HUNT_SECONDS - survivedFor;
    const active = remaining <= LAST_LIGHT_SECONDS;
    lastLight.active = active;

    if (!active) {
      sMesh.visible = rMesh.visible = fMesh.visible = false;
      if (gMesh) gMesh.visible = false;
      shared.seekerSpeedMult = 1;
      shared.survivorGlow = 0;
      return;
    }

    // just entered Last Light → sting + arm the front sweep
    if (!wasActive.current) {
      wasActive.current = true;
      frontElapsed.current = 0;
      lastLight.frontDone = false;
      lastLightStart();
    }

    const intensity = Math.max(0, Math.min(1, 1 - remaining / LAST_LIGHT_SECONDS));
    lastLight.intensity = intensity;
    lastLight.sphereR = SPHERE_START_R + (SPHERE_END_R - SPHERE_START_R) * intensity;

    // seekers faster, survivor lights up
    shared.seekerSpeedMult = SEEKER_SPEED_MULT;
    shared.survivorGlow = intensity;

    // contested sphere: accrue big bonus for holding the shrinking zone
    const pd = Math.hypot(shared.playerPos.x, shared.playerPos.z);
    const inside = pd < lastLight.sphereR;
    lastLight.insideSphere = inside;
    if (inside) {
      lastLight.bonus += dt * SPHERE_BONUS_RATE * (0.6 + intensity);
    }

    // one-shot paint front color-breaks memorized spots
    if (!lastLight.frontDone) {
      frontElapsed.current += dt;
      const prog = Math.min(1, frontElapsed.current / FRONT_SWEEP_SECONDS);
      lastLight.frontZ = -S + 2 * S * prog;
      for (const p of PROPS) {
        if (p.position[2] <= lastLight.frontZ && !lastLight.brokenProps.has(p.id)) {
          lastLight.brokenProps.set(p.id, breakColorFor(p.id));
        }
      }
      if (prog >= 1) lastLight.frontDone = true;
      fMesh.visible = true;
      fMesh.position.z = lastLight.frontZ;
    } else {
      fMesh.visible = false;
    }

    // --- render sphere + ring ---
    sMesh.visible = true;
    rMesh.visible = true;
    const r = lastLight.sphereR;
    sMesh.scale.setScalar(r);
    // pulse the ring so the contested zone reads as "hot"
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(survivedFor * 4));
    rMesh.scale.setScalar(r);
    ringMat.opacity = 0.55 + 0.35 * pulse; // art keeps its own colors
    const col = inside ? "#b4f531" : "#ff2e9a";
    sphereMat.color.set(col);

    // survivor glow halo follows the player, breathing with intensity
    if (gMesh) {
      gMesh.visible = true;
      gMesh.position.set(shared.playerPos.x, 0.04, shared.playerPos.z);
      const gs = 2.2 + 0.4 * Math.sin(survivedFor * 5);
      gMesh.scale.setScalar(gs);
      glowMat.opacity = (0.35 + 0.4 * intensity) * (0.7 + 0.3 * pulse);
      glowMat.color.set(inside ? "#b4f531" : "#ff8fd0");
    }
  });

  return (
    <group>
      {/* collapsing safe sphere (translucent dome; unit radius, scaled) */}
      <mesh ref={sphere} material={sphereMat} position={[0, 0.9, 0]}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      {/* contested-boundary marker (Design Vol.5 art; 2-unit plane, scaled by r) */}
      <mesh ref={ring} material={ringMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      {/* survivor glow halo (follows the player) */}
      <mesh ref={glow} material={glowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} visible={false}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      {/* one-shot color-break front slab sweeping +z */}
      <mesh ref={front} material={frontMat} position={[0, 0.5, -S]}>
        <boxGeometry args={[S * 2, 1, 0.4]} />
      </mesh>
    </group>
  );
}
