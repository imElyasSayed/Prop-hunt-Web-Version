// Spectate-to-Clip / Ghost Director — round recorder + clip export.
//
// Eliminated players don't hit a dead screen: they drop into a free-cam
// spectator over the frozen scene (SP) — later, live survivors (MP) — and get
// their round as a lightweight "clip": a timeline of tagged moments they can
// star ("ping a clip timestamp") and one-tap export.
//
// The recorder logs discrete round beats (start, spotted, taunt, decoy, tag,
// survive) with their round-time. Real video capture / GIF export is a media-
// pipeline deliverable (collected as a 2D/video need); export here bundles the
// clip metadata (starred beats + round summary) to the clipboard.
//
// MERGE COUPLING (multiplayer): the recorder should ingest the authoritative
// event stream (server-validated tags, whistles) for ALL players so a spectator
// can scrub any survivor's feed, and the free-cam should target live survivor
// positions rather than a frozen snapshot.

export interface ClipEvent {
  /** round-time in seconds when it happened. */
  t: number;
  label: string;
  /** accent color for the timeline dot. */
  tone: string;
  /** starred = included in the exported clip. */
  starred: boolean;
}

export interface ClipState {
  events: ClipEvent[];
  /** round summary, filled at the end. */
  outcome: "survived" | "splatted" | null;
  duration: number;
}

export const clip: ClipState = { events: [], outcome: null, duration: 0 };

export function resetClip() {
  clip.events = [];
  clip.outcome = null;
  clip.duration = 0;
}

export function recordEvent(t: number, label: string, tone = "#8a4cff") {
  clip.events.push({ t, label, tone, starred: false });
}

export function finalizeClip(outcome: "survived" | "splatted", duration: number) {
  clip.outcome = outcome;
  clip.duration = duration;
  // auto-star the climactic beat (the tag or the survive)
  const last = clip.events[clip.events.length - 1];
  if (last) last.starred = true;
}

export function toggleStar(i: number) {
  const e = clip.events[i];
  if (e) e.starred = !e.starred;
}

function fmtT(t: number) {
  return `0:${Math.max(0, Math.floor(t)).toString().padStart(2, "0")}`;
}

/** Build a shareable text summary of the clip (starred beats). */
export function exportClipText(): string {
  const starred = clip.events.filter((e) => e.starred);
  const lines = [
    "SPLOTCH — round clip 🎬",
    `Result: ${clip.outcome ?? "—"} · lasted ${fmtT(clip.duration)}`,
    "Highlights:",
    ...(starred.length
      ? starred.map((e) => `  ${fmtT(e.t)}  ${e.label}`)
      : ["  (no beats pinged)"]),
    "#SPLOTCH  Blend in. Cash out.",
  ];
  return lines.join("\n");
}
