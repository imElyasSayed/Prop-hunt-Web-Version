// Determines which surface the player is "backed against" and how well the
// avatar's dominant color blends into it.
import * as THREE from "three";
import { FLOOR_COLOR } from "./constants";
import { colorMatch, averageHex } from "./color";
import { activeProps } from "./party";

const tmp = new THREE.Vector3();

/** Returns the color of the nearest prop within reach, else the floor color. */
export function nearestSurfaceColor(pos: THREE.Vector3): string {
  let best: string = FLOOR_COLOR;
  let bestDist = 3.6; // must be reasonably close to "back against" a prop
  for (const p of activeProps()) {
    // horizontal distance to prop centre, minus half its footprint
    const dx = Math.abs(pos.x - p.position[0]) - p.size[0] / 2;
    const dz = Math.abs(pos.z - p.position[2]) - p.size[2] / 2;
    const d = Math.hypot(Math.max(0, dx), Math.max(0, dz));
    if (d < bestDist) {
      bestDist = d;
      best = p.color;
    }
  }
  return best;
}

/**
 * Camo score 0..1. Combines how close the avatar's effective color is to the
 * backdrop with how much of the avatar is actually painted (an unpainted white
 * blob only blends into white surfaces).
 */
export function scoreCamo(
  avatarColor: string,
  coverage: number,
  surfaceColor: string,
): number {
  // "paintedness": you read as fully painted once ~35% of the blob is covered.
  const painted = Math.min(1, coverage / 0.35);
  // Effective color = white base blended toward the painted color.
  const effective = averageHex("#fbf7f0", avatarColor, painted);
  const match = colorMatch(effective, surfaceColor);
  // Painting the *right* color to full coverage should score near-perfect.
  return Math.max(0, Math.min(1, match * (0.78 + 0.22 * painted)));
}

export { tmp };
