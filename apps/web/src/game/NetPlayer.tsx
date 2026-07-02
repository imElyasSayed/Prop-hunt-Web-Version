// Renders one networked blob. The local player is client-predicted (integrate
// input immediately, then gently reconcile toward the server position); remote
// players are interpolated toward their authoritative position (~100 ms). Paint
// stamps, body scale, and fold state all come from the replicated schema.
"use client";
import { useMemo, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { spray } from "./sound";
import { useModel } from "./models";
import { collide } from "./collision";
import { BRUSHES, DEFAULT_BRUSH, drawBrush } from "./brushes";
import { SCALE_TIERS } from "../net/scaleTiers";
import { PLAYER_SPEED, PLAYER_RADIUS } from "./constants";
import { useNet } from "../net/netStore";
import { netShared } from "../net/netShared";
import type { Keys } from "./useKeys";
import type { NetStamp } from "../net/client";

const HUNTER_SPEED = 3.5;
const TEX = 256;

export function NetPlayer({
  id,
  role,
  isLocal,
  keys,
}: {
  id: string;
  role: "chameleon" | "hunter";
  isLocal: boolean;
  keys: RefObject<Keys>;
}) {
  const room = useNet((s) => s.room);
  const group = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Object3D>(null);
  const predicted = useRef(new THREE.Vector3(0, 0, isLocal ? 6 : 0));
  const drawn = useRef(0);
  const foldVis = useRef(0);
  const lastInputSent = useRef(0);
  const lastFold = useRef(false);
  const tintCol = useRef(new THREE.Color());
  const painting = useRef(false);
  const lastUV = useRef<{ u: number; v: number } | null>(null);
  const lastSpray = useRef(0);

  const canPaint = isLocal && role === "chameleon";
  const paintAt = (e: ThreeEvent<PointerEvent>) => {
    if (!canPaint || !e.uv || !room) return;
    const st = room.state;
    if (st.phase !== "prep" && st.phase !== "hunt") return;
    const u = e.uv.x;
    const v = 1 - e.uv.y;
    if (lastUV.current) {
      if (Math.hypot(u - lastUV.current.u, v - lastUV.current.v) < 0.02) return;
    }
    lastUV.current = { u, v };
    const { selectedColor, brushSize } = useGame.getState();
    room.send("paint", { u, v, color: selectedColor, size: brushSize });
    const now = performance.now();
    if (now - lastSpray.current > 55) {
      lastSpray.current = now;
      spray();
    }
  };

  // Paint canvas/texture (chameleons only carry paint).
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = TEX;
    c.height = TEX;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fbf7f0";
    ctx.fillRect(0, 0, TEX, TEX);
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  const paintMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }),
    [texture],
  );

  const obj = useModel(
    role === "hunter" ? "blob_hunter" : "blob_player",
    role === "hunter"
      ? undefined
      : (mesh) => {
          mesh.material = paintMat;
        },
  );

  useFrame((_, dtRaw) => {
    const g = group.current;
    const st = room?.state;
    if (!g || !st) return;
    const dt = Math.min(dtRaw, 0.05);
    const p = st.players.get(id);
    if (!p) return;
    const tier = SCALE_TIERS[p.scaleKey] ?? SCALE_TIERS.normal;

    // --- paint replay: draw any new stamps this player has accrued ---
    if (role === "chameleon") {
      const stamps = p.stamps;
      if (stamps.length < drawn.current) {
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#fbf7f0";
        ctx.fillRect(0, 0, TEX, TEX);
        drawn.current = 0;
      }
      if (stamps.length > drawn.current) {
        const ctx = canvas.getContext("2d")!;
        const brush = BRUSHES[DEFAULT_BRUSH];
        for (let i = drawn.current; i < stamps.length; i++) {
          const s: NetStamp = stamps[i];
          drawBrush(ctx, brush, s.u * TEX, s.v * TEX, Math.max(2, s.size * TEX), s.color);
        }
        drawn.current = stamps.length;
        texture.needsUpdate = true;
      }
    }

    const serverX = p.x;
    const serverZ = p.z;

    if (isLocal) {
      // --- client prediction: integrate our own input right away ---
      const k = keys.current;
      const moveOk =
        p.alive && !p.folded && (st.phase === "prep" || st.phase === "hunt") &&
        !(st.phase === "prep" && role === "hunter");
      if (moveOk) {
        let mx = 0;
        let mz = 0;
        if (k.forward) mz -= 1;
        if (k.back) mz += 1;
        if (k.left) mx -= 1;
        if (k.right) mx += 1;
        const base = role === "hunter" ? HUNTER_SPEED : PLAYER_SPEED;
        const speed = base * tier.speedMult;
        if (mx || mz) {
          const len = Math.hypot(mx, mz);
          const [cx, cz] = collide(
            predicted.current.x + (mx / len) * speed * dt,
            predicted.current.z + (mz / len) * speed * dt,
            PLAYER_RADIUS * tier.scale,
          );
          predicted.current.x = cx;
          predicted.current.z = cz;
          g.rotation.y = Math.atan2(mx, mz);
        }
        // send input to the server (throttled)
        const now = performance.now();
        if (now - lastInputSent.current > 50) {
          lastInputSent.current = now;
          room!.send("input", { dx: mx, dz: mz });
        }
        // fold key -> tell the server
        const wantFold = !!k.fold && st.phase === "hunt" && role === "chameleon";
        if (wantFold !== lastFold.current) {
          lastFold.current = wantFold;
          room!.send("fold", { folded: wantFold });
        }
      }
      // reconcile drift toward the authoritative position
      predicted.current.x += (serverX - predicted.current.x) * 0.1;
      predicted.current.z += (serverZ - predicted.current.z) * 0.1;
      g.position.x = predicted.current.x;
      g.position.z = predicted.current.z;
      netShared.localPos.set(predicted.current.x, 0.6, predicted.current.z);
      netShared.localRole = role;
      netShared.localScale = tier.scale;
    } else {
      // --- remote: interpolate toward the authoritative position ---
      g.position.x += (serverX - g.position.x) * 0.18;
      g.position.z += (serverZ - g.position.z) * 0.18;
      let dr = p.rot - g.rotation.y;
      while (dr > Math.PI) dr -= Math.PI * 2;
      while (dr < -Math.PI) dr += Math.PI * 2;
      g.rotation.y += dr * 0.2;
    }

    // --- fold + scale visuals ---
    foldVis.current += ((p.folded ? 1 : 0) - foldVis.current) * Math.min(1, dt * 6);
    const fv = foldVis.current;
    if (blob.current) {
      blob.current.scale.setScalar(tier.scale * (1 - fv * 0.35));
    }
    if (role === "chameleon") {
      paintMat.transparent = fv > 0.01 || !p.alive;
      paintMat.opacity = p.alive ? 1 - fv * 0.82 : 0.25;
    }
    // dim the dead
    g.visible = true;
    if (!p.alive && role === "chameleon") {
      tintCol.current.set("#888888");
      paintMat.color.lerp(tintCol.current, 0.04);
    }
  });

  return (
    <group
      ref={group}
      position={[0, 0, isLocal ? 6 : 0]}
      onPointerDown={
        canPaint
          ? (e) => {
              e.stopPropagation();
              painting.current = true;
              lastUV.current = null;
              paintAt(e);
            }
          : undefined
      }
      onPointerMove={canPaint ? (e) => painting.current && paintAt(e) : undefined}
      onPointerUp={canPaint ? () => (painting.current = false) : undefined}
      onPointerLeave={canPaint ? () => (painting.current = false) : undefined}
    >
      <primitive ref={blob} object={obj} />
    </group>
  );
}
