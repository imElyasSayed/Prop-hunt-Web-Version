// Rotating Safe Zone + Pressure System (anti-camp). One component owns all four
// subsystems and renders their placeholder VFX:
//  (a) a relocating safe bubble (no tag/suspicion inside),
//  (b) Tell Debt — camping one coarse grid cell fills a hidden meter until your
//      silhouette ghosts through your camo (visible in the Hunter's cone),
//  (c) Redline Zones — over-camped cells seal for a while,
//  (d) a periodic Purge flush on the hottest cell.
// Logic writes scalar flags to `shared` (read by the Hunter) and a throttled
// snapshot to the store (read by the HUD). Runs only during the hunt.
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// SVG → CanvasTexture loader for the asset-pack ground art.
function loadSvgTexture(url: string, size = 256): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      c.getContext("2d")!.drawImage(img, 0, 0, size, size);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      resolve(t);
    };
    img.onerror = reject;
    img.src = url;
  });
}
import { useGame } from "./store";
import { shared } from "./shared";
import * as sfx from "./sound";
import {
  PROPS,
  CELL,
  SAFE_ZONE_RADIUS,
  SAFE_ZONE_RELOCATE,
  SAFE_ZONE_TELEGRAPH,
  TELL_TO_GHOST,
  TELL_DRAIN_ON_MOVE,
  REDLINE_HEAT,
  REDLINE_REOPEN,
  PURGE_INTERVAL,
  PURGE_TELEGRAPH,
  PURGE_FLUSH,
  PURGE_RADIUS,
  PURGE_REVEAL,
} from "./constants";

const REDLINE_POOL = 16;

function cellKey(x: number, z: number): string {
  return `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
}
function cellCenter(key: string): [number, number] {
  const [cx, cz] = key.split(",").map(Number);
  return [(cx + 0.5) * CELL, (cz + 0.5) * CELL];
}
function pickSafePoint(ax?: number, az?: number): [number, number] {
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() * 2 - 1) * 8;
    const z = (Math.random() * 2 - 1) * 8;
    let ok = true;
    for (const p of PROPS) {
      const dx = Math.abs(x - p.position[0]) - p.size[0] / 2;
      const dz = Math.abs(z - p.position[2]) - p.size[2] / 2;
      if (Math.hypot(Math.max(0, dx), Math.max(0, dz)) < 1.3) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    if (ax !== undefined && Math.hypot(x - ax, z - (az ?? 0)) < 5) continue;
    return [x, z];
  }
  return [0, 0];
}

export function Pressure() {
  const setPressure = useGame((s) => s.setPressure);

  const safe = useRef({ x: 0, z: 0, nx: 0, nz: 0, timer: SAFE_ZONE_RELOCATE, telegraph: false });
  const tell = useRef(0);
  const heat = useRef(new Map<string, number>());
  const redlines = useRef(new Map<string, number>());
  const curCell = useRef("");
  const purge = useRef({ phase: "idle" as "idle" | "telegraph" | "flush", timer: PURGE_INTERVAL, x: 0, z: 0 });
  const prevPhase = useRef("");
  const throttle = useRef(0);

  const safeRing = useRef<THREE.Mesh>(null);
  const safeDisc = useRef<THREE.Mesh>(null);
  const teleRing = useRef<THREE.Mesh>(null);
  const purgeRing = useRef<THREE.Mesh>(null);
  const ghost = useRef<THREE.Mesh>(null);
  const redlineMeshes = useRef<THREE.Mesh[]>([]);

  const mats = useMemo(() => {
    const base = (color: string, opacity: number, additive = true) =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped: false,
      });
    return {
      ring: base("#2fce6a", 0.7),
      disc: base("#2fce6a", 0.1),
      tele: base("#b4f531", 0.5),
      purge: base("#ff7a17", 0.6),
      ghost: base("#191225", 0.42, false),
      redline: base("#ff2e4f", 0.28, false),
    };
  }, []);

  // Wire the asset-pack ground art onto the materials (cosmetic; the flat-color
  // fallback still works if a texture fails to load).
  useEffect(() => {
    let alive = true;
    const put = (m: THREE.MeshBasicMaterial, url: string) =>
      loadSvgTexture(url)
        .then((t) => {
          if (!alive) return;
          m.map = t;
          m.color.set("#ffffff");
          m.needsUpdate = true;
        })
        .catch(() => {});
    put(mats.disc, "/art/safezone-ring.svg");
    put(mats.tele, "/art/safezone-telegraph.svg");
    put(mats.purge, "/art/purge-ring.svg");
    put(mats.redline, "/art/redline-tile.svg");
    return () => {
      alive = false;
    };
  }, [mats]);

  const hideAll = () => {
    [safeRing, safeDisc, teleRing, purgeRing, ghost].forEach(
      (r) => r.current && (r.current.visible = false),
    );
    redlineMeshes.current.forEach((m) => m && (m.visible = false));
  };

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const phase = useGame.getState().phase;

    if (phase !== "hunt") {
      hideAll();
      prevPhase.current = phase;
      return;
    }

    // entering the hunt: (re)initialise everything
    if (prevPhase.current !== "hunt") {
      const [sx, sz] = pickSafePoint();
      safe.current = { x: sx, z: sz, nx: sx, nz: sz, timer: SAFE_ZONE_RELOCATE, telegraph: false };
      tell.current = 0;
      heat.current.clear();
      redlines.current.clear();
      purge.current = { phase: "idle", timer: PURGE_INTERVAL, x: 0, z: 0 };
      curCell.current = cellKey(shared.playerPos.x, shared.playerPos.z);
    }
    prevPhase.current = phase;

    const px = shared.playerPos.x;
    const pz = shared.playerPos.z;
    const now = state.clock.elapsedTime;

    // --- (a) safe zone relocate ---
    const s = safe.current;
    s.timer -= dt;
    if (!s.telegraph && s.timer <= SAFE_ZONE_TELEGRAPH) {
      s.telegraph = true;
      const [nx, nz] = pickSafePoint(s.x, s.z);
      s.nx = nx;
      s.nz = nz;
    }
    if (s.timer <= 0) {
      s.x = s.nx;
      s.z = s.nz;
      s.timer = SAFE_ZONE_RELOCATE;
      s.telegraph = false;
      sfx.zoneShift();
    }
    const inSafe = Math.hypot(px - s.x, pz - s.z) <= SAFE_ZONE_RADIUS;
    shared.inSafeZone = inSafe;

    // --- (b) Tell Debt + (c) cell heat / redlines ---
    const ck = cellKey(px, pz);
    if (ck !== curCell.current) {
      curCell.current = ck;
      tell.current = Math.max(0, tell.current - TELL_TO_GHOST * TELL_DRAIN_ON_MOVE);
    }
    const redlined = redlines.current.has(ck);
    tell.current = Math.min(TELL_TO_GHOST, tell.current + dt * (redlined ? 2 : 1));
    heat.current.set(ck, (heat.current.get(ck) ?? 0) + dt);
    if (!redlined && (heat.current.get(ck) ?? 0) > REDLINE_HEAT) {
      redlines.current.set(ck, REDLINE_REOPEN);
      heat.current.set(ck, 0);
    }
    for (const [k, t] of redlines.current) {
      const nt = t - dt;
      if (nt <= 0) redlines.current.delete(k);
      else redlines.current.set(k, nt);
    }
    const tellNorm = tell.current / TELL_TO_GHOST;
    shared.tellDebt = tellNorm;
    shared.ghosting = tellNorm >= 1;

    // --- (d) Purge flush ---
    const pu = purge.current;
    if (pu.phase === "idle") {
      pu.timer -= dt;
      if (pu.timer <= 0) {
        let hot = "";
        let hv = 0;
        for (const [k, v] of heat.current) if (v > hv) { hv = v; hot = k; }
        const [hx, hz] = hot ? cellCenter(hot) : [px, pz];
        pu.x = hx;
        pu.z = hz;
        pu.phase = "telegraph";
        pu.timer = PURGE_TELEGRAPH;
        sfx.purgeAlarm();
      }
    } else if (pu.phase === "telegraph") {
      pu.timer -= dt;
      if (pu.timer <= 0) {
        pu.phase = "flush";
        pu.timer = PURGE_FLUSH;
      }
    } else {
      pu.timer -= dt;
      if (Math.hypot(px - pu.x, pz - pu.z) <= PURGE_RADIUS) {
        shared.forcedReveal = PURGE_REVEAL;
      }
      if (pu.timer <= 0) {
        pu.phase = "idle";
        pu.timer = PURGE_INTERVAL;
        heat.current.clear();
      }
    }
    if (shared.forcedReveal > 0)
      shared.forcedReveal = Math.max(0, shared.forcedReveal - dt);

    // --- visuals ---
    const pulse = 0.5 + 0.5 * Math.sin(now * 4);
    if (safeRing.current && safeDisc.current) {
      // the textured disc carries the whole sanctuary-ring art
      safeRing.current.visible = false;
      safeDisc.current.visible = true;
      safeDisc.current.position.set(s.x, 0.05, s.z);
      mats.disc.opacity = inSafe ? 1 : 0.82;
    }
    if (teleRing.current) {
      teleRing.current.visible = s.telegraph;
      if (s.telegraph) {
        teleRing.current.position.set(s.nx, 0.05, s.nz);
        mats.tele.opacity = 0.3 + 0.4 * pulse;
      }
    }
    if (purgeRing.current) {
      const active = pu.phase !== "idle";
      purgeRing.current.visible = active;
      if (active) {
        purgeRing.current.position.set(pu.x, 0.06, pu.z);
        const flushing = pu.phase === "flush";
        mats.purge.color.set(flushing ? "#ff2e4f" : "#ff7a17");
        mats.purge.opacity = flushing ? 0.85 : 0.35 + 0.4 * pulse;
        const r = flushing ? PURGE_RADIUS : PURGE_RADIUS * (0.6 + 0.4 * pulse);
        purgeRing.current.scale.set(r / PURGE_RADIUS, r / PURGE_RADIUS, 1);
      }
    }
    if (ghost.current) {
      ghost.current.visible = shared.ghosting;
      if (shared.ghosting) {
        ghost.current.position.set(px, 0.6, pz);
        mats.ghost.opacity = 0.3 + 0.2 * pulse;
      }
    }
    // redline pool
    const keys = [...redlines.current.keys()];
    redlineMeshes.current.forEach((m, i) => {
      if (!m) return;
      if (i < keys.length) {
        const [cx, cz] = cellCenter(keys[i]);
        m.visible = true;
        m.position.set(cx, 0.03, cz);
      } else {
        m.visible = false;
      }
    });
    mats.redline.opacity = 0.55 + 0.2 * pulse;

    // --- throttled HUD snapshot ---
    throttle.current += dt;
    if (throttle.current > 0.12) {
      throttle.current = 0;
      setPressure({
        safeTimer: Math.max(0, s.timer),
        safeRelocating: s.telegraph,
        inSafe,
        tellDebt: tellNorm,
        ghosting: shared.ghosting,
        purgeWarn: pu.phase === "telegraph",
      });
    }
  });

  return (
    <group>
      {/* textured ground planes carry the asset-pack ring art */}
      <mesh ref={safeDisc} rotation={[-Math.PI / 2, 0, 0]} material={mats.disc} visible={false}>
        <planeGeometry args={[SAFE_ZONE_RADIUS * 2, SAFE_ZONE_RADIUS * 2]} />
      </mesh>
      <mesh ref={safeRing} rotation={[-Math.PI / 2, 0, 0]} material={mats.ring} visible={false}>
        <ringGeometry args={[SAFE_ZONE_RADIUS - 0.18, SAFE_ZONE_RADIUS, 48]} />
      </mesh>
      <mesh ref={teleRing} rotation={[-Math.PI / 2, 0, 0]} material={mats.tele} visible={false}>
        <planeGeometry args={[SAFE_ZONE_RADIUS * 2, SAFE_ZONE_RADIUS * 2]} />
      </mesh>
      <mesh ref={purgeRing} rotation={[-Math.PI / 2, 0, 0]} material={mats.purge} visible={false}>
        <planeGeometry args={[PURGE_RADIUS * 2, PURGE_RADIUS * 2]} />
      </mesh>
      <mesh ref={ghost} material={mats.ghost} visible={false}>
        <sphereGeometry args={[0.62, 20, 16]} />
      </mesh>
      {Array.from({ length: REDLINE_POOL }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) redlineMeshes.current[i] = m;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          material={mats.redline}
          visible={false}
        >
          <planeGeometry args={[CELL - 0.2, CELL - 0.2]} />
        </mesh>
      ))}
    </group>
  );
}
