// Networked-game store. Holds the live Colyseus room plus a React-facing
// snapshot (phase/timer/roster) refreshed on each state change. Per-frame data
// (positions, paint) is read straight off room.state by the 3D components —
// it never flows through React, mirroring the single-player shared-refs model.
import { create } from "zustand";
import {
  createMatch,
  joinMatch,
  type MatchRoom,
  type NetPlayer,
} from "./client";

export interface RosterEntry {
  id: string;
  name: string;
  role: "chameleon" | "hunter";
  alive: boolean;
  score: number;
  scaleKey: string;
}

interface NetState {
  room: MatchRoom | null;
  myId: string;
  connecting: boolean;
  error: string | null;
  active: boolean; // true once we have joined a room
  roomCode: string;
  phase: "lobby" | "prep" | "hunt" | "result";
  timer: number;
  roster: RosterEntry[];

  create: (name: string) => Promise<void>;
  join: (name: string, code: string) => Promise<void>;
  start: () => void;
  leave: () => void;
}

function shortCode(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

export const useNet = create<NetState>((set, get) => {
  function bind(room: MatchRoom) {
    const refresh = () => {
      const st = room.state;
      const roster: RosterEntry[] = [];
      st.players.forEach((p: NetPlayer) => {
        roster.push({
          id: p.id,
          name: p.name,
          role: p.role,
          alive: p.alive,
          score: p.score,
          scaleKey: p.scaleKey,
        });
      });
      roster.sort((a, b) => b.score - a.score);
      set({
        roomCode: st.roomCode,
        phase: st.phase,
        timer: st.timer,
        roster,
      });
    };
    room.onStateChange(refresh);
    room.onLeave(() => set({ active: false, room: null }));
    set({
      room,
      myId: room.sessionId,
      active: true,
      connecting: false,
      error: null,
    });
    // one initial refresh once the first patch arrives
    setTimeout(refresh, 60);
  }

  return {
    room: null,
    myId: "",
    connecting: false,
    error: null,
    active: false,
    roomCode: "",
    phase: "lobby",
    timer: 0,
    roster: [],

    create: async (name) => {
      set({ connecting: true, error: null });
      try {
        const room = await createMatch(name || "Blob", shortCode());
        bind(room);
      } catch (e) {
        set({ connecting: false, error: friendly(e) });
      }
    },
    join: async (name, code) => {
      set({ connecting: true, error: null });
      try {
        const room = await joinMatch(name || "Blob", code);
        bind(room);
      } catch (e) {
        set({ connecting: false, error: friendly(e) });
      }
    },
    start: () => get().room?.send("start"),
    leave: () => {
      get().room?.leave();
      set({ active: false, room: null, roster: [], phase: "lobby" });
    },
  };
});

function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/not found|no rooms/i.test(msg)) return "No match with that code.";
  if (/refused|failed to fetch|network|ECONN/i.test(msg))
    return "Can't reach the server. Is it running on :2567?";
  return msg || "Connection failed.";
}
