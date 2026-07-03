// The 3D scene: canvas, lights, camera follow rig, and the per-frame clock
// that advances the phase machine and ends the hunt.
"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
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
  const spectating = useGame((s) => s.spectating);
  useFrame(() => {
    // In spectate mode the OrbitControls own the camera — don't fight them.
    if (spectating) return;
    // follow the player from behind-and-above
    const p = shared.playerPos;
    const desired = new THREE.Vector3(p.x, p.y + 7.5, p.z + 9.5);
    camera.position.lerp(desired, 0.08);
    target.current.lerp(new THREE.Vector3(p.x, p.y + 0.5, p.z), 0.12);
    camera.lookAt(target.current);
  });
  return null;
}

// Free-cam controls, only mounted while spectating the frozen scene.
function SpectateControls() {
  const spectating = useGame((s) => s.spectating);
  if (!spectating) return null;
  return (
    <OrbitControls
      makeDefault
      enablePan
      target={[0, 0.6, 0]}
      minDistance={4}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
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
      <SpectateControls />
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
