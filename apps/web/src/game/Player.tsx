// The player's Chameleon blob: movement, paint-by-pointer, camo scoring, and
// the Silhouette Fold ability (collapse into a nearby prop's outline).
"use client";
import { useMemo, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { usePaintTexture } from "./usePaintTexture";
import { useModel } from "./models";
import { SplotchyFace } from "./Face";
import { spray, foldIn, foldPop } from "./sound";
import { nearestSurfaceColor, nearestProp, scoreCamo } from "./camo";
import { collide } from "./collision";
import { shared } from "./shared";
import type { Keys } from "./useKeys";
import type { PropDef } from "./types";
import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  FOLD_NEAR_DIST,
  FOLD_TO_FULL,
  FOLD_HIDDEN_AT,
  FOLD_MAX_CHARGE,
  FOLD_DRAIN_PER_SEC,
  FOLD_RECHARGE_PER_SEC,
} from "./constants";

const WHITE = new THREE.Color(0xffffff);

export function Player({ keys }: { keys: RefObject<Keys> }) {
  const group = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Object3D>(null);
  const painting = useRef(false);
  const lastUV = useRef<{ u: number; v: number } | null>(null);
  const camoThrottle = useRef(0);
  const lastSpray = useRef(0);

  // --- Silhouette Fold local state (per-frame, kept out of React) ---
  const foldProg = useRef(0); // 0..1
  const foldCharge = useRef(FOLD_MAX_CHARGE); // seconds of fold time left
  const foldTarget = useRef<PropDef | null>(null);
  const wasFolding = useRef(false);
  const tintCol = useRef(new THREE.Color());

  const stamps = useGame((s) => s.stamps);
  const phase = useGame((s) => s.phase);
  const addStamp = useGame((s) => s.addStamp);
  const setCamoScore = useGame((s) => s.setCamoScore);
  const setSurfaceColor = useGame((s) => s.setSurfaceColor);
  const setFold = useGame((s) => s.setFold);

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

    // --- Silhouette Fold ---
    // Only usable during the hunt. Reset to a full charge outside it.
    if (phase !== "hunt") {
      foldProg.current = 0;
      foldCharge.current = FOLD_MAX_CHARGE;
      foldTarget.current = null;
      wasFolding.current = false;
    } else {
      const near = nearestProp(g.position, FOLD_NEAR_DIST);
      // Can start a fold only next to a prop; once started, keep it while held.
      const wantFold =
        k.fold &&
        foldCharge.current > 0 &&
        (foldProg.current > 0.02 || !!near);
      if (wantFold) {
        if (foldProg.current <= 0.02 && near) foldTarget.current = near.prop;
        foldProg.current = Math.min(1, foldProg.current + dt / FOLD_TO_FULL);
        foldCharge.current = Math.max(
          0,
          foldCharge.current -
            dt * FOLD_DRAIN_PER_SEC * (0.3 + 0.7 * foldProg.current),
        );
        if (!wasFolding.current) {
          foldIn();
          wasFolding.current = true;
        }
      } else {
        // audible unfold pop if we were meaningfully folded
        if (wasFolding.current && foldProg.current > FOLD_HIDDEN_AT * 0.5) {
          foldPop();
        }
        wasFolding.current = false;
        foldProg.current = Math.max(0, foldProg.current - dt / (FOLD_TO_FULL * 0.6));
        if (foldProg.current === 0) {
          foldCharge.current = Math.min(
            FOLD_MAX_CHARGE,
            foldCharge.current + dt * FOLD_RECHARGE_PER_SEC,
          );
        }
      }
    }
    const fp = foldProg.current;
    const hidden = fp >= FOLD_HIDDEN_AT;
    const locked = fp > 0.05; // movement-locked while folding/folded
    shared.foldProgress = fp;
    shared.folded = hidden;

    // --- movement (world-axis, camera looks down -Z) ---
    if ((phase === "prep" || phase === "hunt") && !locked) {
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
    }
    shared.playerPos.set(g.position.x, 0.6, g.position.z);

    // --- spin the blob to paint all sides (prep only) ---
    if (blob.current && phase === "prep") {
      if (k.spinL) blob.current.rotation.y += dt * 2.2;
      if (k.spinR) blob.current.rotation.y -= dt * 2.2;
    }

    // --- fold visuals: morph the blob's silhouette toward the prop + fade ---
    if (blob.current) {
      const tp = foldTarget.current;
      let sx = 1;
      let sy = 1;
      let sz = 1;
      if (tp) {
        sx = THREE.MathUtils.clamp(tp.size[0] * 0.85, 0.6, 2.2);
        sy = THREE.MathUtils.clamp(tp.size[1] * 0.7, 0.6, 2.2);
        sz = THREE.MathUtils.clamp(tp.size[2] * 0.85, 0.6, 2.2);
      }
      blob.current.scale.set(
        THREE.MathUtils.lerp(1, sx, fp),
        THREE.MathUtils.lerp(1, sy, fp),
        THREE.MathUtils.lerp(1, sz, fp),
      );
    }
    paintMat.transparent = fp > 0.01;
    paintMat.opacity = 1 - fp * 0.85;
    if (foldTarget.current && fp > 0.01) {
      tintCol.current.set(foldTarget.current.color);
      paintMat.color.lerpColors(WHITE, tintCol.current, fp * 0.75);
    } else {
      paintMat.color.copy(WHITE);
    }

    // --- camo scoring (throttled push to store for the HUD) ---
    const { color, coverage } = getDominant();
    shared.playerColor = color;
    shared.coverage = coverage;
    const surf = nearestSurfaceColor(shared.playerPos);
    shared.nearestSurfaceColor = surf;
    const score = scoreCamo(color, coverage, surf);
    camoThrottle.current += dt;
    if (camoThrottle.current > 0.12) {
      camoThrottle.current = 0;
      setCamoScore(score);
      setSurfaceColor(surf);
      setFold(foldCharge.current / FOLD_MAX_CHARGE, hidden);
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
