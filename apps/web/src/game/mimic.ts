// The Mimic + Confessional Vote — hidden-role scaffold.
//
// One hider is secretly the Mimic, scored ONLY by causing a teammate's tag
// (~13% spawn, so most rounds are honest). Sabotage reuses existing verbs — a
// decoy/whistle aimed AT an ally, a gaze-bait beacon that lures the Hunter onto
// them. HARD RULE: no MEASURABLE sabotage = zero score (see mimicScore).
//
// The round resolves with a fast Confessional Vote: an anonymized evidence feed
// → everyone votes who the Mimic was. Correct majority = Detective bonus; a
// Mimic who survives the vote = Getaway bonus. Gated OUT of newbie/Prop-Party.
//
// Base-compatible SINGLE-PLAYER scaffold: SP has no real teammates, so the lobby
// (you + 4 AI suspects) and the sabotage/vote loop are modeled here and shown as
// a demo. MERGE COUPLING (multiplayer): drive role assignment + sabotage
// validation + the vote from the authoritative server; a sabotage only "counts"
// when the server observes it measurably affecting a real ally's tag.

export const MIMIC_SPAWN_CHANCE = 0.13; // ~13% of rounds YOU are the Mimic
export const SABOTAGE_POINTS = 120; // per measurable sabotage (Mimic only)
export const DETECTIVE_BONUS = 150; // correct vote
export const GETAWAY_BONUS = 220; // Mimic survives the vote

export interface Suspect {
  idx: number;
  name: string;
  color: string;
  /** mugshot token art (SPLOTCH Confessional Vote Kit). */
  art: string;
}

// The lobby roster (index 0 is always "You").
export const SUSPECTS: Suspect[] = [
  { idx: 0, name: "You", color: "#ff2e9a", art: "/art/suspect-you.svg" },
  { idx: 1, name: "Pip", color: "#0fd4e6", art: "/art/suspect-pip.svg" },
  { idx: 2, name: "Bloop", color: "#b4f531", art: "/art/suspect-bloop.svg" },
  { idx: 3, name: "Gus", color: "#ff7a17", art: "/art/suspect-gus.svg" },
  { idx: 4, name: "Nova", color: "#8a4cff", art: "/art/suspect-nova.svg" },
];

export type SabotageKind = "gaze-bait" | "decoy-lure" | "whistle-lure";

export interface SabotageEvent {
  t: number; // round-time
  targetIdx: number; // which ally it was aimed at
  kind: SabotageKind;
}

export interface MimicResolution {
  detective: boolean; // vote picked the real Mimic
  getaway: boolean; // Mimic survived the vote
  detectiveBonus: number;
  getawayBonus: number;
  mimicIdx: number;
  youWereMimic: boolean;
  mimicScore: number;
}

export interface MimicState {
  mode: boolean;
  youAreMimic: boolean;
  mimicIdx: number;
  sabotage: SabotageEvent[];
  resolution: MimicResolution | null;
}

export const mimic: MimicState = makeInitial();

function makeInitial(): MimicState {
  return { mode: false, youAreMimic: false, mimicIdx: 0, sabotage: [], resolution: null };
}

/** Assign roles for a fresh Mimic round. */
export function startMimicRound() {
  const youAreMimic = Math.random() < MIMIC_SPAWN_CHANCE;
  const mimicIdx = youAreMimic ? 0 : 1 + Math.floor(Math.random() * (SUSPECTS.length - 1));
  Object.assign(mimic, {
    mode: true,
    youAreMimic,
    mimicIdx,
    sabotage: [],
    resolution: null,
  });
}

export function exitMimicMode() {
  Object.assign(mimic, makeInitial());
  mimic.sabotage = [];
}

/** Log a measurable sabotage aimed at an ally (only scores if you're the Mimic). */
export function logSabotage(targetIdx: number, kind: SabotageKind, t: number) {
  mimic.sabotage.push({ t, targetIdx, kind });
}

/**
 * Mimic score. HARD RULE: zero unless there was MEASURABLE sabotage. In SP a
 * logged sabotage beacon is the measurable proxy; in MP it must have provably
 * contributed to an ally's tag.
 */
export function mimicScore(): number {
  if (!mimic.youAreMimic) return 0;
  return mimic.sabotage.length > 0 ? mimic.sabotage.length * SABOTAGE_POINTS : 0;
}

const KIND_LABEL: Record<SabotageKind, string> = {
  "gaze-bait": "planted a gaze-bait beacon",
  "decoy-lure": "aimed a decoy at",
  "whistle-lure": "whistled toward",
};

export type EvidenceKind = "sabotage" | "noise" | "empty";
export interface EvidenceLine {
  kind: EvidenceKind;
  /** round-time stamp, or "" for non-timed lines. */
  t: string;
  text: string;
}

/**
 * Anonymized evidence feed for the Confessional card. Sabotage beats are shown
 * without naming the actor (that's the whole guessing game); one honest-noise
 * line per non-mimic keeps it ambiguous. Each line carries its `kind` so the UI
 * can show the matching icon (redacted actor / sabotage beat / empty-state).
 */
export function buildEvidence(): EvidenceLine[] {
  const lines: EvidenceLine[] = [];
  for (const s of mimic.sabotage) {
    const target = SUSPECTS[s.targetIdx]?.name ?? "an ally";
    lines.push({
      kind: "sabotage",
      t: `0:${Math.floor(s.t).toString().padStart(2, "0")}`,
      text: `Someone ${KIND_LABEL[s.kind]} ${target}.`,
    });
  }
  // ambient honest-noise so a clean round isn't a dead giveaway
  const noise = [
    "A whistle echoed from the west corner.",
    "Two blobs crossed paths by the pillar.",
    "A splat landed near the sofa.",
    "Someone repainted late in the round.",
  ];
  for (let i = 0; i < 3; i++) lines.push({ kind: "noise", t: "", text: noise[i % noise.length] });
  if (!mimic.sabotage.length) {
    lines.push({ kind: "empty", t: "", text: "No measurable sabotage detected this round." });
  }
  return lines;
}

/** Resolve the vote given the picked suspect + whether the round was survived. */
export function resolveVote(pickedIdx: number, survived: boolean): MimicResolution {
  const detective = pickedIdx === mimic.mimicIdx;
  // The Mimic "survived the vote" if they weren't correctly fingered. In SP, if
  // YOU are the Mimic also require you outlived the Hunter; AI mimics are
  // assumed to have survived for the demo.
  const mimicOutlived = mimic.youAreMimic ? survived : true;
  const getaway = !detective && mimicOutlived;
  const res: MimicResolution = {
    detective,
    getaway,
    detectiveBonus: detective ? DETECTIVE_BONUS : 0,
    getawayBonus: getaway ? GETAWAY_BONUS : 0,
    mimicIdx: mimic.mimicIdx,
    youWereMimic: mimic.youAreMimic,
    mimicScore: mimicScore(),
  };
  mimic.resolution = res;
  return res;
}
