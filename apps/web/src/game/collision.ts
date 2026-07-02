// Shared circle-vs-props + room-bounds collision. Used by both the player and
// the Hunter so neither can walk through props or walls.
import { ROOM_HALF, PROPS } from "./constants";

export function collide(x: number, z: number, radius: number): [number, number] {
  const lim = ROOM_HALF - radius - 0.1;
  x = Math.max(-lim, Math.min(lim, x));
  z = Math.max(-lim, Math.min(lim, z));
  for (const p of PROPS) {
    const hx = p.size[0] / 2 + radius;
    const hz = p.size[2] / 2 + radius;
    const dx = x - p.position[0];
    const dz = z - p.position[2];
    if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
      // push out along the axis of least penetration
      const px = hx - Math.abs(dx);
      const pz = hz - Math.abs(dz);
      if (px < pz) x = p.position[0] + Math.sign(dx || 1) * hx;
      else z = p.position[2] + Math.sign(dz || 1) * hz;
    }
  }
  return [x, z];
}
