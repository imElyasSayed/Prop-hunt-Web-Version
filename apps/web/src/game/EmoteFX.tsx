// Reveal Emote VFX — a 3D particle burst that erupts from the blob when you fire
// your equipped emote. Each emote has its OWN burst style so it reads at a
// glance, complementing the 2D sprite-sheet flourish (EmoteOverlay):
//   • confetti — brand-palette paper flutters up-and-out, tumbles, then falls
//   • peel     — cyan/white sticker flakes fling outward and spin flat
//   • melt      — violet goo droplets ooze downward, stretching as they drip
// Reads shared.emote each frame; also ticks down the break-cover reveal timer.
"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shared } from "./shared";
import { getEmote, EMOTE_DURATION } from "./emote";
import { PALETTE } from "./constants";

const POOL = 40;

interface Particle {
  vx: number;
  vy: number;
  vz: number;
  spin: number; // rotation speed
  axis: number; // 0=x,1=y,2=z primary tumble axis
  base: number; // base scale
  stretch: number; // current vertical stretch (melt)
}

export function EmoteFX() {
  const meshes = useRef<THREE.Mesh[]>([]);
  const parts = useRef<Particle[]>(
    Array.from({ length: POOL }, () => ({ vx: 0, vy: 0, vz: 0, spin: 0, axis: 1, base: 0.14, stretch: 1 })),
  );
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
            side: THREE.DoubleSide,
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
    const kind = em.id;

    // --- spawn the burst on the first active frame ---
    if (!started.current) {
      started.current = true;
      const emote = getEmote(em.id);
      for (let i = 0; i < POOL; i++) {
        const a = Math.random() * Math.PI * 2;
        const p = parts.current[i];
        if (kind === "confetti") {
          const sp = 2.5 + Math.random() * 3.5;
          p.vx = Math.cos(a) * sp * 0.55;
          p.vz = Math.sin(a) * sp * 0.55;
          p.vy = 3.4 + Math.random() * 3.2; // pops upward
          p.spin = 6 + Math.random() * 8;
          p.axis = Math.floor(Math.random() * 3); // tumbles on any axis
          p.base = 0.09 + Math.random() * 0.07;
          p.stretch = 1;
          mats[i].color.set(PALETTE[i % PALETTE.length]); // full brand rainbow
        } else if (kind === "peel") {
          const sp = 3.5 + Math.random() * 3.5;
          p.vx = Math.cos(a) * sp; // flings outward hard
          p.vz = Math.sin(a) * sp;
          p.vy = 1.2 + Math.random() * 2.2;
          p.spin = 9 + Math.random() * 7; // fast flat spin
          p.axis = 1; // spin flat like a peeled sticker
          p.base = 0.14 + Math.random() * 0.08; // bigger flakes
          p.stretch = 1;
          mats[i].color.set(i % 2 ? emote.color : "#fbf7f0"); // cyan + paper backing
        } else {
          // melt — droplets ooze down, barely outward
          const sp = 0.4 + Math.random() * 0.9;
          p.vx = Math.cos(a) * sp * 0.35;
          p.vz = Math.sin(a) * sp * 0.35;
          p.vy = -0.3 - Math.random() * 0.8; // sags downward
          p.spin = 0.5 + Math.random();
          p.axis = 2;
          p.base = 0.08 + Math.random() * 0.06;
          p.stretch = 1;
          mats[i].color.set(i % 3 === 0 ? "#a06bff" : emote.color); // violet goo
        }
        const m = meshes.current[i];
        if (m) {
          m.position.set(px, kind === "melt" ? 0.9 : 0.7, pz);
          m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
          m.visible = true;
          m.scale.setScalar(p.base);
        }
      }
    }

    // --- per-frame update, styled by emote ---
    for (let i = 0; i < POOL; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const p = parts.current[i];

      if (kind === "melt") {
        // slow ooze; stretch vertically into a drip; pool near the floor
        p.vy -= 1.4 * dt;
        m.position.x += p.vx * dt;
        m.position.y += p.vy * dt;
        m.position.z += p.vz * dt;
        if (m.position.y < 0.06) {
          m.position.y = 0.06;
          p.vy = 0;
          p.vx *= 0.6;
          p.vz *= 0.6;
        }
        p.stretch = Math.min(2.6, p.stretch + dt * 2.2);
        m.rotation.z += p.spin * dt * 0.3;
        m.scale.set(p.base / Math.sqrt(p.stretch), p.base * p.stretch, p.base);
        mats[i].opacity = Math.max(0, 1 - prog * 0.9);
      } else {
        // confetti / peel — ballistic with gravity + tumble
        p.vy -= (kind === "confetti" ? 5.5 : 7) * dt;
        m.position.x += p.vx * dt;
        m.position.y += p.vy * dt;
        m.position.z += p.vz * dt;
        if (m.position.y < 0.05) {
          m.position.y = 0.05;
          p.vy *= -0.28; // tiny bounce
          p.vx *= 0.7;
          p.vz *= 0.7;
        }
        // air drag on confetti so it flutters rather than rockets
        if (kind === "confetti") {
          p.vx *= 1 - dt * 1.6;
          p.vz *= 1 - dt * 1.6;
        }
        if (p.axis === 0) m.rotation.x += p.spin * dt;
        else if (p.axis === 1) m.rotation.y += p.spin * dt;
        else m.rotation.z += p.spin * dt;
        m.rotation.x += dt * 2; // subtle secondary tumble
        mats[i].opacity = Math.max(0, 1 - prog);
        m.scale.setScalar(p.base * Math.max(0.15, 1 - prog * 0.5));
      }
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
          {/* thin paper/flake/droplet quad; behavior + scale differ per emote */}
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
