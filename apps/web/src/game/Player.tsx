// The player's Chameleon blob: movement, paint-by-pointer, camo scoring.
"use client";
import { useMemo, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { usePaintTexture } from "./usePaintTexture";
import { useModel } from "./models";
import { SplotchyFace } from "./Face";
import { spray } from "./sound";
import { nearestSurfaceColor, scoreCamo } from "./camo";
import { collide } from "./collision";
import { shared } from "./shared";
import type { Keys } from "./useKeys";
import { PLAYER_SPEED, PLAYER_RADIUS } from "./constants";

export function Player({ keys }: { keys: RefObject<Keys> }) {
  const group = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Object3D>(null);
  const painting = useRef(false);
  const lastUV = useRef<{ u: number; v: number } | null>(null);
  const camoThrottle = useRef(0);
  const lastSpray = useRef(0);

  const stamps = useGame((s) => s.stamps);
  const phase = useGame((s) => s.phase);
  const addStamp = useGame((s) => s.addStamp);
  const setCamoScore = useGame((s) => s.setCamoScore);
  const setSurfaceColor = useGame((s) => s.setSurfaceColor);
  const modifier = useGame((s) => s.partyModifier); // Prop Party silly modifier

  const { texture, getDominant } = usePaintTexture(stamps);

  // Load the blob model and route the paint texture onto its material so
  // painting draws directly on the avatar.
  const paintMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.6,
      emissive: new THREE.Color("#000000"),
      emissiveIntensity: 0,
    });
    return m;
  }, [texture]);
  const blobObj = useModel("blob_player", (mesh) => {
    mesh.material = paintMat;
  });

  const paintAt = (e: ThreeEvent<PointerEvent>) => {
    if (phase !== "prep" || !e.uv) return;
    const u = e.uv.x;
    const v = 1 - e.uv.y;
    // throttle by UV distance so a drag lays a smooth line, not a blob-storm
    if (lastUV.current) {
      const du = u - lastUV.current.u;
      const dv = v - lastUV.current.v;
      if (Math.hypot(du, dv) < 0.02) return;
    }
    lastUV.current = { u, v };
    const before = useGame.getState().paintLeft;
    addStamp(u, v);
    // spray tick (throttled) only when paint was actually applied
    if (useGame.getState().paintLeft < before) {
      const now = performance.now();
      if (now - lastSpray.current > 55) {
        lastSpray.current = now;
        spray();
      }
    }
  };

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const k = keys.current;

    // Prop Party modifiers (cosmetic + light speed tweaks).
    const speedMult = modifier === "turbo" ? 1.4 : modifier === "floaty" ? 1.15 : 1;

    // --- movement (world-axis, camera looks down -Z) ---
    if (phase === "prep" || phase === "hunt") {
      let mx = 0;
      let mz = 0;
      if (k.forward) mz -= 1;
      if (k.back) mz += 1;
      if (k.left) mx -= 1;
      if (k.right) mx += 1;
      if (mx || mz) {
        const len = Math.hypot(mx, mz);
        const nx = g.position.x + (mx / len) * PLAYER_SPEED * speedMult * dt;
        const nz = g.position.z + (mz / len) * PLAYER_SPEED * speedMult * dt;
        const [cx, cz] = collide(nx, nz, PLAYER_RADIUS);
        g.position.x = cx;
        g.position.z = cz;
      }
      shared.playerPos.set(g.position.x, 0.6, g.position.z);
    }

    // --- spin the blob to paint all sides (prep only) ---
    if (blob.current && phase === "prep") {
      if (k.spinL) blob.current.rotation.y += dt * 2.2;
      if (k.spinR) blob.current.rotation.y -= dt * 2.2;
    }

    // --- Prop Party cosmetic modifiers on the blob mesh (never affect camo) ---
    if (blob.current) {
      const t = state.clock.elapsedTime;
      const scale = modifier === "bighead" ? 1.4 : 1;
      blob.current.scale.setScalar(scale);
      let bob = 0;
      if (modifier === "bouncy") bob = Math.abs(Math.sin(t * 6)) * 0.35;
      else if (modifier === "floaty") bob = Math.sin(t * 2) * 0.18 + 0.1;
      blob.current.position.y = bob;
      if (modifier === "disco") {
        paintMat.emissive.setHSL((t * 0.4) % 1, 0.9, 0.5);
        paintMat.emissiveIntensity = 0.4 + 0.3 * Math.sin(t * 8);
      } else {
        paintMat.emissiveIntensity = 0;
      }
    }

    // --- camo scoring (throttled push to store for the HUD) ---
    const { color, coverage } = getDominant();
    shared.playerColor = color;
    shared.coverage = coverage;
    const surf = nearestSurfaceColor(shared.playerPos);
    shared.nearestSurfaceColor = surf;
    const score = scoreCamo(color, coverage, surf);
    camoThrottle.current += dt;
    if (camoThrottle.current > 0.15) {
      camoThrottle.current = 0;
      setCamoScore(score);
      setSurfaceColor(surf);
    }
  });

  return (
    <group
      ref={group}
      position={[0, 0, 6]}
      onPointerDown={(e) => {
        if (phase !== "prep") return;
        e.stopPropagation();
        painting.current = true;
        lastUV.current = null;
        paintAt(e);
      }}
      onPointerMove={(e) => {
        if (painting.current) paintAt(e);
      }}
      onPointerUp={() => {
        painting.current = false;
      }}
      onPointerLeave={() => {
        painting.current = false;
      }}
    >
      {/* Splotchy blob (GLB); paint texture is applied to its material. */}
      <primitive ref={blob} object={blobObj} />
      {/* Eyes overlay — parented to the group so it stays camera-facing. */}
      <SplotchyFace />
    </group>
  );
}
