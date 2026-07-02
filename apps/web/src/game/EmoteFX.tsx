// Reveal Emote VFX — a placeholder particle flourish that bursts from the blob
// when you fire your equipped emote (confetti pop / sticker peel / melt drip).
// Reads shared.emote each frame; also ticks down the break-cover reveal timer.
// Real 2D emote animations slot in here later.
"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shared } from "./shared";
import { getEmote, EMOTE_DURATION } from "./emote";
import { PALETTE } from "./constants";

const POOL = 28;

export function EmoteFX() {
  const meshes = useRef<THREE.Mesh[]>([]);
  const vel = useRef(Array.from({ length: POOL }, () => ({ x: 0, y: 0, z: 0 })));
  const started = useRef(false);

  const mats = useMemo(
    () =>
      Array.from(
        { length: POOL },
        () =>
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            toneMapped: false,
            depthWrite: false,
          }),
      ),
    [],
  );

  const hideAll = () => meshes.current.forEach((m) => m && (m.visible = false));

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (shared.emoteReveal > 0)
      shared.emoteReveal = Math.max(0, shared.emoteReveal - dt);

    const em = shared.emote;
    if (!em.active) {
      if (started.current) {
        hideAll();
        started.current = false;
      }
      return;
    }
    em.t += dt;
    const prog = Math.min(1, em.t / EMOTE_DURATION);
    const px = shared.playerPos.x;
    const pz = shared.playerPos.z;

    if (!started.current) {
      started.current = true;
      const emote = getEmote(em.id);
      for (let i = 0; i < POOL; i++) {
        const a = Math.random() * Math.PI * 2;
        let vx = 0;
        let vy = 0;
        let vz = 0;
        if (em.id === "confetti") {
          const sp = 2 + Math.random() * 3;
          vx = Math.cos(a) * sp * 0.5;
          vz = Math.sin(a) * sp * 0.5;
          vy = 3 + Math.random() * 3;
          mats[i].color.set(PALETTE[i % PALETTE.length]);
        } else if (em.id === "peel") {
          const sp = 3 + Math.random() * 3;
          vx = Math.cos(a) * sp;
          vz = Math.sin(a) * sp;
          vy = 0.5 + Math.random() * 1.8;
          mats[i].color.set(emote.color);
        } else {
          // melt — low outward drip
          const sp = 0.5 + Math.random();
          vx = Math.cos(a) * sp * 0.4;
          vz = Math.sin(a) * sp * 0.4;
          vy = -0.4 - Math.random();
          mats[i].color.set(emote.color);
        }
        vel.current[i] = { x: vx, y: vy, z: vz };
        const m = meshes.current[i];
        if (m) {
          m.position.set(px, 0.7, pz);
          m.visible = true;
          m.scale.setScalar(0.14);
        }
      }
    }

    for (let i = 0; i < POOL; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const v = vel.current[i];
      v.y -= 6 * dt;
      m.position.x += v.x * dt;
      m.position.y += v.y * dt;
      m.position.z += v.z * dt;
      if (m.position.y < 0.05) m.position.y = 0.05;
      m.rotation.x += dt * 5;
      m.rotation.y += dt * 4;
      mats[i].opacity = Math.max(0, 1 - prog);
      m.scale.setScalar(0.14 * Math.max(0.02, 1 - prog * 0.6));
    }

    if (em.t >= EMOTE_DURATION) {
      em.active = false;
      em.t = 0;
      started.current = false;
      hideAll();
    }
  });

  return (
    <group>
      {Array.from({ length: POOL }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) meshes.current[i] = m;
          }}
          material={mats[i]}
          visible={false}
        >
          <boxGeometry args={[1, 1, 0.2]} />
        </mesh>
      ))}
    </group>
  );
}
