// Reveal Emotes — cosmetic "break cover" flourishes. Firing one drops your camo
// for ~2 s (you read as detectable, exactly like a taunt) then re-blends: the
// RISK is identical no matter which emote you own, so it's pure prestige. Capped
// at one per life. The equipped emote also composites into the Trophy Card
// (batch 1) when you're caught. 2D-art placeholder — real animations are a need.
export type EmoteId = "peel" | "melt" | "confetti";

export interface Emote {
  id: EmoteId;
  label: string;
  emoji: string;
  color: string;
  blurb: string;
}

export const EMOTES: Emote[] = [
  {
    id: "peel",
    label: "Sticker Peel",
    emoji: "🩹",
    color: "#0fd4e6",
    blurb: "Your camo peels off like a sticker.",
  },
  {
    id: "melt",
    label: "Melt & Reform",
    emoji: "🫠",
    color: "#8a4cff",
    blurb: "Slump into goo, then snap back together.",
  },
  {
    id: "confetti",
    label: "Confetti Burst",
    emoji: "🎉",
    color: "#ff2e9a",
    blurb: "Blow your cover in a confetti pop.",
  },
];

export const EMOTE_DURATION = 2.0; // seconds the flourish + break-cover lasts

export function getEmote(id: EmoteId): Emote {
  return EMOTES.find((e) => e.id === id) ?? EMOTES[0];
}
