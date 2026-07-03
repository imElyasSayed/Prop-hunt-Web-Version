// The Canvas ("The Studio"): floor, four walls, and the GLB prop kit.
"use client";
import { useMemo } from "react";
import * as THREE from "three";
import type { PropDef } from "./types";
import { ROOM_HALF, WALL_HEIGHT, FLOOR_COLOR, WALL_COLOR } from "./constants";
import { useModel } from "./models";
import { makePaperGrain } from "./surfaces";
import { activeProps } from "./party";
import { useGame } from "./store";

function Prop({ prop }: { prop: PropDef }) {
  const obj = useModel(prop.model);
  // Models have their origin at the base, so place them on the floor (y=0)
  // at the prop's horizontal centre.
  return (
    <primitive
      object={obj}
      position={[prop.position[0], 0, prop.position[2]]}
      rotation={[0, prop.rotationY ?? 0, 0]}
    />
  );
}

export function Room() {
  const S = ROOM_HALF;
  const floorTex = useMemo(() => {
    const t = makePaperGrain(FLOOR_COLOR);
    t.repeat.set(S, S); // ~1 tile per world unit
    return t;
  }, [S]);
  const wallTex = useMemo(() => {
    const t = makePaperGrain(WALL_COLOR);
    t.repeat.set(S, WALL_HEIGHT / 2);
    return t;
  }, [S]);
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[S * 2, S * 2]} />
        <meshStandardMaterial map={floorTex} roughness={0.95} />
      </mesh>

      {/* walls */}
      {[
        { pos: [0, WALL_HEIGHT / 2, -S] as const, rot: [0, 0, 0] as const },
        { pos: [0, WALL_HEIGHT / 2, S] as const, rot: [0, Math.PI, 0] as const },
        { pos: [-S, WALL_HEIGHT / 2, 0] as const, rot: [0, Math.PI / 2, 0] as const },
        { pos: [S, WALL_HEIGHT / 2, 0] as const, rot: [0, -Math.PI / 2, 0] as const },
      ].map((w, i) => (
        <mesh key={i} position={w.pos} rotation={w.rot} receiveShadow>
          <planeGeometry args={[S * 2, WALL_HEIGHT]} />
          <meshStandardMaterial map={wallTex} roughness={0.95} />
        </mesh>
      ))}

      <PropSet />
    </group>
  );
}

// The active prop set — re-reads when the game mode changes (Prop Party swaps
// in a denser layout).
function PropSet() {
  // subscribe so switching to/from Prop Party re-renders the props
  useGame((s) => s.mode);
  return (
    <>
      {activeProps().map((p) => (
        <Prop key={p.id} prop={p} />
      ))}
    </>
  );
}
