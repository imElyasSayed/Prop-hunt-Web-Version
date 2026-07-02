// Line-of-sight test on the horizontal plane: is the segment between two points
// clear of every prop footprint? Used to gate the Pulse Ping — ducking behind a
// prop during the charge-up breaks LOS and dodges the sonar.
import { PROPS } from "./constants";

/** Segment (ax,az)->(bx,bz) vs an axis-aligned box (slab method, 2D). */
function segmentHitsBox(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  minX: number,
  minZ: number,
  maxX: number,
  maxZ: number,
): boolean {
  const dx = bx - ax;
  const dz = bz - az;
  let tmin = 0;
  let tmax = 1;
  // X slab
  if (Math.abs(dx) < 1e-6) {
    if (ax < minX || ax > maxX) return false;
  } else {
    let t1 = (minX - ax) / dx;
    let t2 = (maxX - ax) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  // Z slab
  if (Math.abs(dz) < 1e-6) {
    if (az < minZ || az > maxZ) return false;
  } else {
    let t1 = (minZ - az) / dz;
    let t2 = (maxZ - az) / dz;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/** True if nothing blocks the straight line between the two points. */
export function hasLineOfSight(
  ax: number,
  az: number,
  bx: number,
  bz: number,
): boolean {
  for (const p of PROPS) {
    const hx = p.size[0] / 2;
    const hz = p.size[2] / 2;
    if (
      segmentHitsBox(
        ax,
        az,
        bx,
        bz,
        p.position[0] - hx,
        p.position[2] - hz,
        p.position[0] + hx,
        p.position[2] + hz,
      )
    ) {
      return false;
    }
  }
  return true;
}
