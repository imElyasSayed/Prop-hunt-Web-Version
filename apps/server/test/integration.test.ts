// Headless integration tests: boot the real server on an ephemeral port and
// drive it with 2–4 colyseus.js bot clients (the same SDK the browser uses).
// Asserts join-by-code, role assignment, position/paint replication, valid vs
// invalid tag handling, phase transitions, and late-join snapshot replay.
import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "colyseus.js";
import type { Server } from "@colyseus/core";
import { createGameServer } from "../src/createServer.js";

const PORT = 2599;
const ENDPOINT = `ws://localhost:${PORT}`;

let server: Server;

before(async () => {
  server = createGameServer();
  await server.listen(PORT);
});

after(async () => {
  await server.gracefullyShutdown(false);
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitUntil(
  fn: () => boolean,
  timeout = 6000,
  interval = 25,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fn()) return;
    await sleep(interval);
  }
  throw new Error("timeout waiting for condition");
}

function newClient() {
  return new Client(ENDPOINT);
}

test("join-by-code, role assignment, and paint/position/late-join replication", async () => {
  const code = "MATCH1";
  const a = newClient();
  const roomA = await a.create("match", {
    roomCode: code,
    name: "Hunter-A",
    prepSeconds: 0.3,
    huntSeconds: 40,
    resultSeconds: 2,
  });
  await waitUntil(() => !!roomA.state && roomA.state.roomCode === code);
  assert.equal(roomA.state.roomCode, code, "room exposes its code");

  // Second client joins BY CODE and lands in the same room.
  const b = newClient();
  const roomB = await b.join("match", { roomCode: code, name: "Cham-B" });
  await waitUntil(() => roomB.state?.players?.size === 2);
  await waitUntil(() => roomA.state?.players?.size === 2);

  const aSelf = roomA.state.players.get(roomA.sessionId);
  const bSelf = roomB.state.players.get(roomB.sessionId);
  assert.equal(aSelf.role, "hunter", "first joiner is the Hunter");
  assert.equal(bSelf.role, "chameleon", "second joiner is a Chameleon");

  // Start the round; prep is tiny so we roll into hunt quickly.
  roomA.send("start");
  await waitUntil(() => roomA.state.phase === "hunt", 8000);

  // --- position replication: B moves +x, A sees it ---
  const bStartX = roomA.state.players.get(roomB.sessionId).x;
  roomB.send("input", { dx: 1, dz: 0 });
  await waitUntil(
    () => roomA.state.players.get(roomB.sessionId).x > bStartX + 0.5,
    6000,
  );
  roomB.send("input", { dx: 0, dz: 0 });
  assert.ok(
    roomA.state.players.get(roomB.sessionId).x > bStartX + 0.5,
    "B's server-authoritative position replicated to A",
  );

  // --- paint replication ---
  roomB.send("paint", { u: 0.5, v: 0.5, color: "#ff2e9a", size: 0.06 });
  roomB.send("paint", { u: 0.4, v: 0.6, color: "#0fd4e6", size: 0.05 });
  await waitUntil(
    () => roomA.state.players.get(roomB.sessionId).stamps.length === 2,
  );
  const firstStamp = roomA.state.players.get(roomB.sessionId).stamps[0];
  assert.equal(firstStamp.color, "#ff2e9a", "paint stamp replicated with color");
  assert.equal(firstStamp.seq, 0, "server assigns deterministic seq");

  // --- late-join snapshot replay: C joins now and still sees B's paint ---
  const c = newClient();
  const roomC = await c.join("match", { roomCode: code, name: "Cham-C" });
  await waitUntil(() => roomC.state?.players?.size === 3);
  await waitUntil(
    () => roomC.state.players.get(roomB.sessionId)?.stamps.length === 2,
  );
  assert.equal(
    roomC.state.players.get(roomB.sessionId).stamps.length,
    2,
    "late joiner replays the existing paint stamp list",
  );

  await roomA.leave();
  await roomB.leave();
  await roomC.leave();
});

test("tag validation: out-of-range rejected, in-range splats the right player", async () => {
  const code = "MATCH2";
  const a = newClient();
  const roomA = await a.create("match", {
    roomCode: code,
    name: "Hunter",
    prepSeconds: 0.3,
    huntSeconds: 60,
    resultSeconds: 2,
  });
  await waitUntil(() => !!roomA.state);
  const b = newClient();
  const roomB = await b.join("match", { roomCode: code, name: "Prey" });
  await waitUntil(() => roomA.state?.players?.size === 2 && !!roomB.state);

  roomA.send("start");
  await waitUntil(() => roomA.state.phase === "hunt", 8000);

  const bId = roomB.sessionId;

  // Invalid tag: hunter is nowhere near B → server must reject it.
  roomA.send("tag", { targetId: bId });
  await sleep(300);
  assert.equal(
    roomA.state.players.get(bId).alive,
    true,
    "out-of-range tag is rejected (B still alive)",
  );

  // Drive the hunter to the (stationary) prey with a persistent wall-follow so
  // a prop in the path can't wedge the bot forever, then tag once in range.
  let prevD = Infinity;
  let stuck = 0;
  let strafeSign = 1;
  const deadline = Date.now() + 14000;
  while (Date.now() < deadline && roomA.state.players.get(bId).alive) {
    const h = roomA.state.players.get(roomA.sessionId);
    const t = roomA.state.players.get(bId);
    const dx = t.x - h.x;
    const dz = t.z - h.z;
    const d = Math.hypot(dx, dz) || 1;
    let mx = dx / d;
    let mz = dz / d;
    if (prevD - d < 0.03) stuck += 1;
    else stuck = 0;
    prevD = d;
    if (stuck > 2) {
      // rotate the heading ~75° to slide along the obstacle (wall-follow)
      const ang = 1.3 * strafeSign;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const rx = mx * c - mz * s;
      const rz = mx * s + mz * c;
      mx = rx;
      mz = rz;
      if (stuck > 24) {
        strafeSign *= -1; // try circling the other way
        stuck = 3;
      }
    }
    roomA.send("input", { dx: mx, dz: mz });
    if (d < 1.5) roomA.send("tag", { targetId: bId });
    await sleep(50);
  }
  roomA.send("input", { dx: 0, dz: 0 });

  await waitUntil(() => roomA.state.players.get(bId).alive === false, 3000);
  assert.equal(
    roomA.state.players.get(bId).alive,
    false,
    "in-range tag splats the correct target",
  );
  assert.ok(
    roomA.state.players.get(roomA.sessionId).score >= 100,
    "hunter is awarded for a valid tag",
  );

  await roomA.leave();
  await roomB.leave();
});

test("round lifecycle: lobby → prep → hunt → result → lobby", async () => {
  const code = "MATCH3";
  const a = newClient();
  const roomA = await a.create("match", {
    roomCode: code,
    name: "Solo",
    prepSeconds: 0.25,
    huntSeconds: 0.25,
    resultSeconds: 0.25,
  });
  await waitUntil(() => typeof roomA.state?.phase === "string");
  assert.equal(roomA.state.phase, "lobby", "starts in the lobby");

  const seen: string[] = [];
  roomA.onStateChange(() => {
    const p = roomA.state.phase;
    if (seen[seen.length - 1] !== p) seen.push(p);
  });

  roomA.send("start");
  await waitUntil(
    () => seen.includes("prep") && seen.includes("hunt") && seen.includes("result"),
    6000,
  );
  await waitUntil(() => roomA.state.phase === "lobby", 4000);

  assert.ok(seen.includes("prep"), "entered prep");
  assert.ok(seen.includes("hunt"), "entered hunt");
  assert.ok(seen.includes("result"), "entered result");
  assert.equal(roomA.state.phase, "lobby", "returns to lobby after result");

  await roomA.leave();
});
