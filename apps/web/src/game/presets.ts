// Camo Preset Loadouts — save, name, and hot-swap favorite paint-jobs.
//
// A preset is just a saved stamp list (the same deterministic paint model the
// game already uses). Loading one during prep is pure CONVENIENCE, never power:
// it costs the exact paint budget the job represents (see store.loadStamps), so
// a preset is identical to having hand-painted it — and any free player can
// match the same look live. A few slots are free.
//
// Persistence is localStorage (client-only). MERGE COUPLING (multiplayer): keep
// presets local/cosmetic — never send them as authoritative state; the server
// only ever sees the resulting stamps, exactly as with manual painting.

import type { Stamp } from "./types";

export const FREE_PRESET_SLOTS = 3;
const KEY = "splotch:camo-presets:v1";

export interface Preset {
  id: string;
  name: string;
  stamps: Stamp[];
  /** dominant swatch color for the chip (cached at save time). */
  swatch: string;
}

function safeParse(raw: string | null): Preset[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as Preset[];
  } catch {
    /* corrupt store — start fresh */
  }
  return [];
}

export function loadPresets(): Preset[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

function persist(presets: Preset[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(presets));
  } catch {
    /* quota / privacy mode — presets just won't persist */
  }
}

let idSeq = 0;
function newId(): string {
  // avoid Date.now()/random restrictions in some sandboxes; monotonic is fine
  idSeq += 1;
  return `p${idSeq}_${idSeq * 2654435761 % 100000}`;
}

/** Dominant color of a stamp list, for the chip swatch. */
export function presetSwatch(stamps: Stamp[]): string {
  if (!stamps.length) return "#fbf7f0";
  // most-used color (cheap, good enough for a chip)
  const counts = new Map<string, number>();
  for (const s of stamps) counts.set(s.color, (counts.get(s.color) ?? 0) + 1);
  let best = "#fbf7f0";
  let bestN = -1;
  for (const [c, n] of counts) if (n > bestN) { best = c; bestN = n; }
  return best;
}

/** Save a new preset (returns the updated list, or the same list if full). */
export function savePreset(name: string, stamps: Stamp[]): Preset[] {
  const presets = loadPresets();
  if (presets.length >= FREE_PRESET_SLOTS) return presets; // slot-gated
  const preset: Preset = {
    id: newId(),
    name: name.trim() || `Loadout ${presets.length + 1}`,
    stamps: stamps.map((s) => ({ ...s })),
    swatch: presetSwatch(stamps),
  };
  const next = [...presets, preset];
  persist(next);
  return next;
}

export function deletePreset(id: string): Preset[] {
  const next = loadPresets().filter((p) => p.id !== id);
  persist(next);
  return next;
}
