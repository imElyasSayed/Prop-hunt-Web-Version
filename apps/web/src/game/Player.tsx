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
import { SCALE_TIERS } from "./scaling";
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
  const playerScaleKey = useGame((s) => s.playerScaleKey);
  const tier = SCALE_TIERS[playerScaleKey];
  const addStamp = useGame((s) => s.addStamp);
  const setCamoScore = useGame((s) => s.setCamoScore);
  const setSurfaceColor = useGame((s) => s.setSurfaceColor);

  const { texture, getDominant } = usePaintTexture(stamps);

  // Load the blob model and route the paint texture onto its material so
  // painting draws directly on the avatar.
  const paintMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.6,
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

    // --- Scale Roulette: size, speed, and detectability for this round ---
    if (blob.current) blob.current.scale.setScalar(tier.scale);
    shared.playerScale = tier.scale;
    shared.detectMult = tier.detectMult;
    const speed = PLAYER_SPEED * tier.speedMult;
    const radius = PLAYER_RADIUS * tier.scale;

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
        const nx = g.position.x + (mx / len) * speed * dt;
        const nz = g.position.z + (mz / len) * speed * dt;
        const [cx, cz] = collide(nx, nz, radius);
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
