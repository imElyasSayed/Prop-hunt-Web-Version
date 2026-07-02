# SPLOTCH match server

Authoritative real-time multiplayer for SPLOTCH, built on **Colyseus 0.16**.

## Run

```bash
cd apps/server
npm install       # first time only
npm run dev       # ws://localhost:2567  (tsx watch)
# or: npm start
```

The web client connects to `ws://localhost:2567` by default; override with
`NEXT_PUBLIC_SERVER_URL` in the web app.

## Test (headless, no browser)

```bash
npm test          # boots the server + drives 2–4 colyseus.js bot clients
```

The integration suite asserts: join-by-code, role assignment, server-authoritative
position replication, paint-stamp replication + late-join snapshot replay,
**valid vs invalid tag validation**, and the round lifecycle
(lobby → prep → hunt → result → lobby).

## What the server owns (never trust the client)

- **Positions** — clients send movement *input*; the server integrates it at a
  clamped speed and resolves collision (`gameConfig.collide`).
- **Roles** — first joiner is the Hunter, the rest are Chameleons.
- **Round lifecycle + timers** — a 20 Hz simulation loop.
- **Tag validation** — a hunter sends a `tag` intent; the server re-checks role,
  phase, target liveness, and range before it lands.
- **Paint** — clients send `paint` stamps; the server appends them to that
  player's replicated stamp list and rebroadcasts. Late joiners replay the list
  automatically via the schema snapshot.

## Layout

```
src/
  index.ts              listen() entry point (PORT, default 2567)
  createServer.ts       builds/​configures the Server (define "match" + filterBy roomCode)
  gameConfig.ts         authoritative constants, scale tiers, collision, room-code gen
  schema/MatchState.ts  @colyseus/schema replicated state (players, stamps, phase…)
  rooms/MatchRoom.ts    the authoritative room: input, paint, fold, tag, lifecycle
test/
  integration.test.ts   bot-client integration tests (node --test via tsx)
```

Dev is local `ws://`; Fly.io hosting comes later.
