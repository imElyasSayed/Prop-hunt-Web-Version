// The player's Chameleon blob: movement, paint-by-pointer, camo scoring.
"use client";
import { useMemo, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { usePaintTexture } from "./usePaintTexture";
import { useModel } from "./models";
import { SplotchyFace } from "./Face";
import { NervePlate } from "./NervePlate";
import { spray, heartbeat, nerveCrack } from "./sound";
import { nearestSurfaceColor, scoreCamo } from "./camo";
import { collide } from "./collision";
import { shared } from "./shared";
import type { Keys } from "./useKeys";
import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  CAMO_SAFE_THRESHOLD,
  NERVE_MAX,
  NERVE_RAMP,
  NERVE_DECAY,
  STAB_DRAIN,
  STAB_RECOVER,
  NERVE_BREAK_TIME,
  NERVE_POINTS_RATE,
} from "./constants";

export function Player({ keys }: { keys: RefObject<Keys> }) {
  const group = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Object3D>(null);
  const painting = useRef(false);
  const lastUV = useRef<{ u: number; v: number } | null>(null);
  const camoThrottle = useRef(0);
  const lastSpray = useRef(0);

  // --- Nerve Engine per-frame state (kept out of React) ---
  const nerve = useRef(1);
  const stability = useRef(1);
  const nervePoints = useRef(0);
  const peakNerve = useRef(1);
  const hbTimer = useRef(0);

  const stamps = useGame((s) => s.stamps);
  const phase = useGame((s) => s.phase);
  const addStamp = useGame((s) => s.addStamp);
  const setCamoScore = useGame((s) => s.setCamoScore);
  const setSurfaceColor = useGame((s) => s.setSurfaceColor);
  const setNerveState = useGame((s) => s.setNerveState);

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
        const nx = g.position.x + (mx / len) * PLAYER_SPEED * dt;
        const nz = g.position.z + (mz / len) * PLAYER_SPEED * dt;
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

    // --- camo scoring (throttled push to store for the HUD) ---
    const { color, coverage } = getDominant();
    shared.playerColor = color;
    shared.coverage = coverage;
    const surf = nearestSurfaceColor(shared.playerPos);
    shared.nearestSurfaceColor = surf;
    const score = scoreCamo(color, coverage, surf);

    // --- Nerve Engine: sweat while hidden under the cone; move to reset ---
    if (phase === "hunt") {
      if (shared.nerveBreak > 0)
        shared.nerveBreak = Math.max(0, shared.nerveBreak - dt);
      const moving = !!(k.forward || k.back || k.left || k.right);
      const hidden = score >= CAMO_SAFE_THRESHOLD && !shared.taunting;
      const sweating = shared.inCone && hidden && !moving;
      if (moving) {
        // break the trance — safe, but you forfeit the banked multiplier
        nerve.current = 1;
        stability.current = 1;
      } else if (sweating) {
        nerve.current = Math.min(NERVE_MAX, nerve.current + dt * NERVE_RAMP);
        stability.current = Math.max(0, stability.current - dt * STAB_DRAIN);
        nervePoints.current += dt * NERVE_POINTS_RATE * nerve.current;
        peakNerve.current = Math.max(peakNerve.current, nerve.current);
        if (stability.current <= 0) {
          // crack: flinch into visibility and lose the multiplier
          shared.nerveBreak = NERVE_BREAK_TIME;
          nerve.current = 1;
          stability.current = 0.4;
          nerveCrack();
        }
      } else {
        stability.current = Math.min(1, stability.current + dt * STAB_RECOVER);
        nerve.current = Math.max(1, nerve.current - dt * NERVE_DECAY);
      }
      // heartbeat cadence tightens as nerve climbs
      if (sweating || nerve.current > 1.04) {
        hbTimer.current += dt;
        const f = (nerve.current - 1) / (NERVE_MAX - 1);
        const interval = 1.15 - f * 0.8; // calm 1.15s -> frantic 0.35s
        if (hbTimer.current >= interval) {
          hbTimer.current = 0;
          heartbeat(nerve.current);
        }
      } else {
        hbTimer.current = 0;
      }
    } else {
      nerve.current = 1;
      stability.current = 1;
      hbTimer.current = 0;
      // fresh round: clear the bank (but keep it through the result screen)
      if (phase === "prep" || phase === "menu") {
        nervePoints.current = 0;
        peakNerve.current = 1;
      }
    }

    camoThrottle.current += dt;
    if (camoThrottle.current > 0.12) {
      camoThrottle.current = 0;
      setCamoScore(score);
      setSurfaceColor(surf);
      setNerveState(
        nerve.current,
        stability.current,
        Math.round(nervePoints.current),
        peakNerve.current,
      );
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
      {/* Floating Nerve nameplate above the blob. */}
      <NervePlate />
    </group>
  );
}
