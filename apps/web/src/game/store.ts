// Central game store: phase machine, paint state, timers, results.
// Per-frame transforms (player/hunter positions) live in refs inside the
// scene components, NOT here — the store only holds discrete/UI-facing state.
import { create } from "zustand";
import type { GamePhase, RoundOutcome, Stamp, Tell } from "./types";
import { PAINT_BUDGET, PALETTE, PREP_SECONDS } from "./constants";
import { shared } from "./shared";
import { buildTell } from "./tell";

interface GameState {
  phase: GamePhase;
  role: "chameleon"; // base game: player is always the Chameleon vs an AI Hunter
  timeLeft: number; // seconds remaining in the current timed phase
  stamps: Stamp[];
  paintLeft: number;
  selectedColor: string;
  brushSize: number; // UV-space radius
  outcome: RoundOutcome;
  survivedFor: number; // seconds survived into the hunt (for the result card)
  /** The camo match [0..1] of the player's dominant paint vs nearest surface. */
  camoScore: number;
  /** Color of the surface the player is currently backed against (for the eyedropper). */
  surfaceColor: string;
  /** True while the hunter currently has the player in its suspicion cone. */
  beingWatched: boolean;
  /** The Answer-Check readout for the round result (null until the round ends). */
  tell: Tell | null;

  // ---- actions ----
  startPrep: () => void;
  beginHunt: () => void;
  tick: (dt: number) => void;
  addStamp: (u: number, v: number) => void;
  setColor: (c: string) => void;
  setBrushSize: (s: number) => void;
  setCamoScore: (s: number) => void;
  setSurfaceColor: (c: string) => void;
  setWatched: (w: boolean) => void;
  splatPlayer: () => void;
  survive: () => void;
  reset: () => void;
}

let seqCounter = 0;

export const useGame = create<GameState>((set, get) => ({
  phase: "menu",
  role: "chameleon",
  timeLeft: 0,
  stamps: [],
  paintLeft: PAINT_BUDGET,
  selectedColor: PALETTE[0],
  brushSize: 0.06,
  outcome: null,
  survivedFor: 0,
  camoScore: 0,
  surfaceColor: "#e4ddcd",
  beingWatched: false,
  tell: null,

  startPrep: () => {
    seqCounter = 0;
    set({
      phase: "prep",
      timeLeft: PREP_SECONDS,
      stamps: [],
      paintLeft: PAINT_BUDGET,
      outcome: null,
      survivedFor: 0,
      camoScore: 0,
      beingWatched: false,
      tell: null,
    });
  },

  beginHunt: () => {
    const { phase } = get();
    if (phase !== "prep") return;
    set({ phase: "hunt", timeLeft: 0 });
  },

  tick: (dt) => {
    const s = get();
    if (s.phase === "prep") {
      const t = s.timeLeft - dt;
      if (t <= 0) {
        // Prep over -> hunt begins.
        set({ phase: "hunt", timeLeft: 0 });
      } else {
        set({ timeLeft: t });
      }
    } else if (s.phase === "hunt") {
      set({ survivedFor: s.survivedFor + dt });
    }
  },

  addStamp: (u, v) => {
    const s = get();
    if (s.phase !== "prep") return; // no undo AND no repaint mid-hunt in base game
    if (s.paintLeft <= 0) return;
    const stamp: Stamp = {
      u,
      v,
      color: s.selectedColor,
      size: s.brushSize,
      seq: seqCounter++,
    };
    set({
      stamps: [...s.stamps, stamp],
      paintLeft: Math.max(0, s.paintLeft - 1),
    });
  },

  setColor: (c) => set({ selectedColor: c }),
  setBrushSize: (s) => set({ brushSize: s }),
  setCamoScore: (s) => set({ camoScore: s }),
  setSurfaceColor: (c) => set({ surfaceColor: c }),
  setWatched: (w) => set({ beingWatched: w }),

  splatPlayer: () => {
    const s = get();
    if (s.phase !== "hunt") return;
    const tell = buildTell({
      outcome: "splatted",
      camo: s.camoScore,
      coverage: shared.coverage,
      paintColor: shared.playerColor,
      surfaceColor: shared.nearestSurfaceColor,
      taunting: shared.taunting,
    });
    set({ phase: "result", outcome: "splatted", tell });
  },

  survive: () => {
    const s = get();
    if (s.phase !== "hunt") return;
    const tell = buildTell({
      outcome: "survived",
      camo: s.camoScore,
      coverage: shared.coverage,
      paintColor: shared.playerColor,
      surfaceColor: shared.nearestSurfaceColor,
      taunting: shared.taunting,
    });
    set({ phase: "result", outcome: "survived", tell });
  },

  reset: () => set({ phase: "menu", outcome: null }),
}));
