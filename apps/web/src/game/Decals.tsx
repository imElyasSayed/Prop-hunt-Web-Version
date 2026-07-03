// Decal renderers: flat paint decals on the floor and walls, plus the
// elimination splat that drops where the player is caught.
"use client";
import { useEffect, useState } from "react";
import { useGame } from "./store";
import { shared } from "./shared";
import { DECALS, useDecalTexture, useSvgTextures, type DecalName } from "./decalTextures";
import { activeMap } from "./maps";

/** A paint decal laid flat on the floor. */
export function FloorDecal({
  name,
  x,
  z,
  width,
  rotation = 0,
  opacity = 1,
}: {
  name: DecalName;
  x: number;
  z: number;
  width: number;
  rotation?: number;
  opacity?: number;
}) {
  const tex = useDecalTexture(name);
  if (!tex) return null;
  const h = width / DECALS[name].aspect;
  return (
    <group position={[x, 0.015, z]} rotation={[0, rotation, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, h]} />
        <meshBasicMaterial
          map={tex}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          opacity={opacity}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** A decal on a wall (facing into the room). */
export function WallDecal({
  name,
  position,
  rotationY,
  width,
  opacity = 1,
}: {
  name: DecalName;
  position: [number, number, number];
  rotationY: number;
  width: number;
  opacity?: number;
}) {
  const tex = useDecalTexture(name);
  if (!tex) return null;
  const h = width / DECALS[name].aspect;
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[width, h]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        opacity={opacity}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Static ambient splats/puddles/drips that dress the Studio. */
export function AmbientDecals() {
  return (
    <group>
      <FloorDecal name="floorSplat" x={-3} z={2} width={3.4} rotation={0.6} opacity={0.9} />
      <FloorDecal name="puddle" x={4.5} z={-2} width={3.8} rotation={-0.4} opacity={0.85} />
      <FloorDecal name="floorSplat" x={9} z={-8} width={2.6} rotation={2.1} opacity={0.8} />
      <FloorDecal name="footprint" x={-8} z={9} width={3.2} rotation={1.2} opacity={0.7} />
      <FloorDecal name="puddle" x={-9} z={-7} width={2.8} rotation={1.7} opacity={0.75} />
      <WallDecal name="wallDrip" position={[-2, 1.4, -11.9]} rotationY={0} width={1.8} opacity={0.9} />
      <WallDecal name="wallDrip" position={[11.9, 1.7, 2]} rotationY={-Math.PI / 2} width={2.1} opacity={0.85} />
    </group>
  );
}

// Fixed open-floor scatter for per-map decals [x, z, width, rotation].
const MAP_DECAL_SPOTS: [number, number, number, number][] = [
  [-3, 2, 2.6, 0.5],
  [4.5, -2, 2.8, -0.4],
  [9, -8, 2.2, 2.1],
  [-8, 9, 2.4, 1.2],
  [-9, -7, 2.2, 1.7],
  [2, 9, 2.4, -1.1],
  [7, 4, 2.0, 0.3],
  [-2, -9, 2.2, 2.6],
];

/** Themed floor decals for the active Canvas (SPLOTCH Design Vol.4). Re-renders
 * when the map changes; cycles the map's 4 decal textures across the scatter. */
export function MapDecals() {
  const mapId = useGame((s) => s.mapId);
  const map = activeMap();
  const texs = useSvgTextures(map.decals);
  return (
    <group key={mapId}>
      {MAP_DECAL_SPOTS.map(([x, z, w, rot], i) => {
        const tex = texs[i % texs.length];
        if (!tex) return null;
        return (
          <group key={i} position={[x, 0.012, z]} rotation={[0, rot, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, w]} />
              <meshBasicMaterial
                map={tex}
                transparent
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-2}
                opacity={0.85}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** The big elimination splat that appears where the player is splatted. */
export function EliminationSplat() {
  const phase = useGame((s) => s.phase);
  const outcome = useGame((s) => s.outcome);
  const [spot, setSpot] = useState<{ x: number; z: number; rot: number } | null>(null);

  useEffect(() => {
    if (phase === "result" && outcome === "splatted") {
      // Snapshot the player's last position at the moment of the tag.
      setSpot({
        x: shared.playerPos.x,
        z: shared.playerPos.z,
        rot: shared.playerPos.x * 0.7 + shared.playerPos.z, // varied, deterministic
      });
    } else if (phase === "menu" || phase === "prep") {
      setSpot(null);
    }
  }, [phase, outcome]);

  if (!spot) return null;
  return (
    <FloorDecal name="elimination" x={spot.x} z={spot.z} width={4.2} rotation={spot.rot} />
  );
}
