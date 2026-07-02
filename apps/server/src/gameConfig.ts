// Authoritative game configuration for the server sim. Mirrors the web client's
// constants (apps/web/src/game/constants.ts + scaling.ts) so the shared world
// rules match — but the server is the source of truth for anything that matters.

export const TICK_HZ = 20;
export const TICK_MS = 1000 / TICK_HZ;

export const ROOM_HALF = 12;
export const PLAYER_SPEED = 4.2;
export const HUNTER_SPEED = 3.5;
export const PLAYER_RADIUS = 0.5;
export const HUNTER_RADIUS = 0.62;

// Hunters must be at least this close to a target to land a valid tag.
export const TAG_RANGE = 1.6;

export const PREP_SECONDS = 30;
export const HUNT_SECONDS = 90;
export const RESULT_SECONDS = 6;

// Scale tiers (subset of the client's — enough to drive speed/size/detect).
export interface ScaleTier {
  scale: number;
  speedMult: number;
}
export const SCALE_TIERS: Record<string, ScaleTier> = {
  teeny: { scale: 0.4, speedMult: 1.4 },
  normal: { scale: 1.0, speedMult: 1.0 },
  chonk: { scale: 1.4, speedMult: 0.85 },
  giga: { scale: 2.2, speedMult: 0.6 },
};
export const SCALE_KEYS = ["teeny", "normal", "chonk", "giga"];

// Prop footprints for collision (x, z centre + half-extents), from the web map.
interface Box {
  x: number;
  z: number;
  hx: number;
  hz: number;
}
export const PROP_BOXES: Box[] = [
  { x: -6, z: -5, hx: 0.9, hz: 0.9 },
  { x: -4.4, z: -5.6, hx: 0.6, hz: 0.6 },
  { x: 6.5, z: -6, hx: 0.65, hz: 0.65 },
  { x: 7.8, z: -4.4, hx: 0.65, hz: 0.65 },
  { x: -7, z: 6, hx: 2.1, hz: 0.9 },
  { x: 8, z: 5, hx: 0.5, hz: 1.7 },
  { x: 2, z: 8, hx: 0.7, hz: 0.7 },
  { x: 0, z: 0, hx: 0.8, hz: 0.8 },
  { x: 5, z: 6, hx: 1.5, hz: 0.8 },
  { x: -8.5, z: -1, hx: 0.7, hz: 0.7 },
];

/** Circle-vs-props + room-bounds resolution (mirrors the client's collide()). */
export function collide(
  x: number,
  z: number,
  radius: number,
): [number, number] {
  const lim = ROOM_HALF - radius - 0.1;
  x = Math.max(-lim, Math.min(lim, x));
  z = Math.max(-lim, Math.min(lim, z));
  for (const p of PROP_BOXES) {
    const hx = p.hx + radius;
    const hz = p.hz + radius;
    const dx = x - p.x;
    const dz = z - p.z;
    if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
      const px = hx - Math.abs(dx);
      const pz = hz - Math.abs(dz);
      if (px < pz) x = p.x + Math.sign(dx || 1) * hx;
      else z = p.z + Math.sign(dz || 1) * hz;
    }
  }
  return [x, z];
}

/** Short, unambiguous room code (no easily-confused chars). */
export function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
