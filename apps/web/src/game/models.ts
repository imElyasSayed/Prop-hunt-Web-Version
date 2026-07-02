// Helpers for loading the GLB kit from /public/models.
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export const MODEL_NAMES = [
  "crate_large",
  "crate_small",
  "barrel",
  "sofa",
  "shelf",
  "pillar",
  "plant_pot",
  "desk",
  "locker",
  "blob_player",
  "blob_hunter",
] as const;

export const modelUrl = (name: string) => `/models/${name}.glb`;

// Warm the cache so the first round doesn't pop-in.
MODEL_NAMES.forEach((n) => useGLTF.preload(modelUrl(n)));

/**
 * Returns a cloned scene for a model with shadows enabled. Cloning lets the
 * same GLB (e.g. two barrels) be placed multiple times without sharing a node.
 * `onMesh` can customize each mesh (e.g. swap in the paint texture material).
 */
export function useModel(
  name: string,
  onMesh?: (mesh: THREE.Mesh) => void,
): THREE.Object3D {
  const { scene } = useGLTF(modelUrl(name));
  return useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        onMesh?.(mesh);
      }
    });
    return clone;
    // onMesh is intentionally excluded: callers pass a stable-enough fn and we
    // only need to rebuild when the source scene changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
}
