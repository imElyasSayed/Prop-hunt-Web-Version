# SPLOTCH — base game (Phase 1 prototype)

The playable core loop, no crypto and none of the addendum features yet. You're a
**Chameleon**: paint your blob to match a surface, hide in plain sight, and survive
the AI **Hunter**.

## Run it

```bash
cd apps/web
npm install      # first time only
npm run dev
```

Open the printed URL (http://localhost:3000, or the next free port).

## How to play

- **PLAY** → **Paint phase** (25s): the Hunter is frozen.
  - **WASD / arrows** — move your blob around the room.
  - **Q / E** — spin your blob so you can paint every side.
  - **Click + drag on your blob** — spray paint. Pick colors + brush size at the
    bottom. **There is no undo** — every stroke spends from a finite paint budget.
  - Watch the **CAMO** meter: get it past the marked threshold (blended ✓) by
    matching the color of the prop you're standing against.
  - Press **START HUNT** when ready, or wait for the timer.
- **Hunt phase** (75s): the Hunter patrols.
  - If it gets you in its view cone **and** your camo is poor, it grows suspicious
    and closes in — get spotted at point-blank and you're **splatted**.
  - Blend well and it walks right past you.
  - **TAUNT** bait-button makes you detectable for ~2s (risk/reward).
- Survive the timer → **you win the Splotch Pot**.

## What's here

```
src/game/
  store.ts          phase machine (menu->prep->hunt->result), paint state, results
  Scene.tsx         Canvas, lights, camera-follow rig, per-frame game clock
  Room.tsx          the Canvas map ("The Studio"): floor, walls, paintable props
  Player.tsx        blob movement, paint-by-pointer, live camo scoring
  Hunter.tsx        AI: patrol / suspicion cone / chase / tag
  usePaintTexture.ts  deterministic stamp-list -> CanvasTexture (design's paint model)
  camo.ts / color.ts  nearest-surface detection + camouflage match scoring
  HUD.tsx           menu, prep controls, hunt HUD, result card
  constants.ts      all tunables (timings, speeds, palette, the level layout)
```

## Not built yet (by design)

Multiplayer/netcode, Solana wagers, and every feature in
`SPLOTCH-Features-Report-v2` (Silhouette Fold, sabotage, roles, etc.). This is the
**fun gate** — prove the paint-and-hide loop is fun first.
