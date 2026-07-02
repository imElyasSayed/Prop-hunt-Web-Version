// The networked 3D scene: the shared map plus one NetPlayer per roster entry.
// The camera follows the local player's predicted position.
"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense, useRef } from "react";
import { Room } from "./Room";
import { AmbientDecals } from "./Decals";
import { NetPlayer } from "./NetPlayer";
import { useKeys } from "./useKeys";
import { useNet } from "../net/netStore";
import { netShared } from "../net/netShared";

function NetCamera() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  useFrame(() => {
    const p = netShared.localPos;
    const z = 0.85 + netShared.localScale * 0.42;
    const desired = new THREE.Vector3(p.x, p.y + 7.5 * z, p.z + 9.5 * z);
    camera.position.lerp(desired, 0.08);
    target.current.lerp(new THREE.Vector3(p.x, p.y + 0.5, p.z), 0.12);
    camera.lookAt(target.current);
  });
  return null;
}

export function NetScene() {
  const keys = useKeys();
  const roster = useNet((s) => s.roster);
  const myId = useNet((s) => s.myId);

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
      <NetCamera />
      <Suspense fallback={null}>
        <Room />
        <AmbientDecals />
        {roster.map((r) => (
          <NetPlayer
            key={r.id}
            id={r.id}
            role={r.role}
            isLocal={r.id === myId}
            keys={keys}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
