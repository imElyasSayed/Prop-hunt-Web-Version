// The 3D scene: canvas, lights, camera follow rig, and the per-frame clock
// that advances the phase machine and ends the hunt.
"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense, useRef } from "react";
import { Room } from "./Room";
import { Player } from "./Player";
import { Hunter } from "./Hunter";
import { AmbientDecals, EliminationSplat } from "./Decals";
import { useKeys } from "./useKeys";
import { useGame } from "./store";
import { shared } from "./shared";
import { HUNT_SECONDS } from "./constants";

function CameraRig() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  useFrame(() => {
    // follow the player from behind-and-above, pulling back for bigger blobs
    const p = shared.playerPos;
    const z = 0.85 + shared.playerScale * 0.42; // ~1.02 (Teeny) .. ~1.77 (GIGA)
    const desired = new THREE.Vector3(p.x, p.y + 7.5 * z, p.z + 9.5 * z);
    camera.position.lerp(desired, 0.08);
    target.current.lerp(
      new THREE.Vector3(p.x, p.y + 0.5 * shared.playerScale, p.z),
      0.12,
    );
    camera.lookAt(target.current);
  });
  return null;
}

function GameClock() {
  const tick = useGame((s) => s.tick);
  const survive = useGame((s) => s.survive);
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    tick(d);
    const s = useGame.getState();
    if (s.phase === "hunt" && s.survivedFor >= HUNT_SECONDS) {
      survive();
    }
  });
  return null;
}

export function Scene() {
  const keys = useKeys();
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 9, 16], fov: 55 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#fbf7f0"]} />
      <fog attach="fog" args={["#fbf7f0", 24, 46]} />
      <hemisphereLight args={["#ffffff", "#b9b4a8", 0.9]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <CameraRig />
      <GameClock />
      <Suspense fallback={null}>
        <Room />
        <AmbientDecals />
        <EliminationSplat />
        <Player keys={keys} />
        <Hunter />
      </Suspense>
    </Canvas>
  );
}
