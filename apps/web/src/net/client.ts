// Thin wrapper around colyseus.js for connecting to the SPLOTCH match server.
// The dev server runs at ws://localhost:2567 (override with NEXT_PUBLIC_SERVER_URL).
import { Client, type Room } from "colyseus.js";

const ENDPOINT =
  process.env.NEXT_PUBLIC_SERVER_URL || "ws://localhost:2567";

// Minimal structural mirrors of the server schema (colyseus.js decodes into
// plain reactive objects; these types let us read them safely).
export interface NetStamp {
  u: number;
  v: number;
  color: string;
  size: number;
  seq: number;
}
export interface NetPlayer {
  id: string;
  name: string;
  role: "chameleon" | "hunter";
  x: number;
  z: number;
  rot: number;
  scaleKey: string;
  alive: boolean;
  folded: boolean;
  score: number;
  ready: boolean;
  stamps: ArrayLike<NetStamp> & Iterable<NetStamp>;
}
export interface NetMatchState {
  phase: "lobby" | "prep" | "hunt" | "result";
  timer: number;
  roomCode: string;
  players: {
    get(id: string): NetPlayer | undefined;
    forEach(cb: (p: NetPlayer, id: string) => void): void;
    size: number;
  };
}

export type MatchRoom = Room<NetMatchState>;

export function getClient(): Client {
  return new Client(ENDPOINT);
}

export async function createMatch(
  name: string,
  roomCode: string,
): Promise<MatchRoom> {
  return getClient().create<NetMatchState>("match", { name, roomCode });
}

export async function joinMatch(
  name: string,
  roomCode: string,
): Promise<MatchRoom> {
  return getClient().join<NetMatchState>("match", {
    name,
    roomCode: roomCode.toUpperCase(),
  });
}
