// The active Canvas: floor, four walls, and the map's GLB prop kit. Reads the
// active map so switching Canvases re-themes the floor/walls and swaps props.
"use client";
import { useMemo } from "react";
import type { PropDef } from "./types";
import { ROOM_HALF, WALL_HEIGHT } from "./constants";
import { useModel } from "./models";
import { makePaperGrain } from "./surfaces";
import { activeMap } from "./maps";
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
  // subscribe so switching Canvases re-renders floor/walls/props
  const mapId = useGame((s) => s.mapId);
  const map = activeMap();
  const floorTex = useMemo(() => {
    const t = makePaperGrain(map.floorColor);
    t.repeat.set(S, S); // ~1 tile per world unit
    return t;
  }, [S, map.floorColor]);
  const wallTex = useMemo(() => {
    const t = makePaperGrain(map.wallColor);
    t.repeat.set(S, WALL_HEIGHT / 2);
    return t;
  }, [S, map.wallColor]);
  return (
    <group key={mapId}>
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

      {map.props.map((p) => (
        <Prop key={p.id} prop={p} />
      ))}
    </group>
  );
}
