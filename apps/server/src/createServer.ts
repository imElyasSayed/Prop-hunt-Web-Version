// Builds a configured Colyseus game server. Kept separate from the listen()
// entry point so integration tests can boot/stop it on an ephemeral port.
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MatchRoom } from "./rooms/MatchRoom.js";

export function createGameServer(): Server {
  const gameServer = new Server({
    transport: new WebSocketTransport(),
  });
  // Match rooms are isolated by their short room code: create passes a fresh
  // code, join reuses it, and the matchmaker keeps each code on its own room.
  gameServer.define("match", MatchRoom).filterBy(["roomCode"]);
  return gameServer;
}
