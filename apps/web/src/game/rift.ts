// Rift Modifier Wheel — every ~45 s the arena rolls a single public mutator
// (in multiplayer this roll is server-authoritative + broadcast, so there's no
// info asymmetry; single-player rolls it locally). Each mutator is a small
// tuning flag read by the Player/Hunter/sound; the wheel UI is the main piece.
export interface Rift {
  id: RiftId;
  label: string;
  emoji: string;
  color: string;
  blurb: string;
}

export type RiftId =
  | "lowgrav"
  | "mirror"
  | "silent"
  | "doublegaze"
  | "speedseekers";

export const RIFTS: Rift[] = [
  {
    id: "lowgrav",
    label: "Low Gravity",
    emoji: "🪶",
    color: "#0fd4e6",
    blurb: "Floaty, faster hops — take to the rafters.",
  },
  {
    id: "mirror",
    label: "Mirror Morph",
    emoji: "🪞",
    color: "#8a4cff",
    blurb: "Your camo auto-copies the last surface you touch.",
  },
  {
    id: "silent",
    label: "Silent Round",
    emoji: "🤫",
    color: "#b4f531",
    blurb: "No forced whistles or spot-blips — pure stealth.",
  },
  {
    id: "doublegaze",
    label: "Double Gaze",
    emoji: "👁️",
    color: "#ffd023",
    blurb: "The Hunter's stare builds suspicion twice as fast.",
  },
  {
    id: "speedseekers",
    label: "Speed Seekers",
    emoji: "⚡",
    color: "#ff2e9a",
    blurb: "The Hunter moves 50% faster.",
  },
];

export const RIFT_SPIN_MS = 2600; // wheel spin duration before it locks
export const RIFT_INTERVAL = 45; // seconds between rolls during the hunt

export function rollRiftIndex(): number {
  return Math.floor(Math.random() * RIFTS.length);
}
