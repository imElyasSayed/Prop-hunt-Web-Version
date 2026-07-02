# SPLOTCH — base game (Phase 1 prototype)

**"Blend in. Cash out."**

SPLOTCH is a browser-based 3D hide-and-seek game where you paint your blobby
avatar to camouflage into a room, then survive a hunter sweeping for you. It's a
crypto-native take on the viral hit *Meccha Chameleon* — the twist that makes it
fun is **manual, skill-based, irreversible camouflage**: you hand-spray your own
body, there's no undo, and the best hiders blend in plain sight.

This repo is the **Phase 1 prototype — the "fun gate."** It's single-player (you
vs an AI Hunter), with no crypto and none of the larger design features yet. The
whole point of this phase is to prove the paint-and-hide loop is genuinely fun
before building multiplayer, wagers, or anything on top.

The game lives in **`apps/web/`**. Design docs (`SPLOTCH-Features-Report-v2`, the
plan) live at the repo root.

---

## Run it

```bash
cd apps/web
npm install      # first time only
npm run dev
```

Open the printed URL (http://localhost:3000, or the next free port).

Production build / type-check:

```bash
cd apps/web && npm run build
```

---

## Controls

| Input | Action |
|---|---|
| **WASD / arrows** | Move your blob |
| **Q / E** | Spin your blob (to paint every side) |
| **Click + drag on your blob** | Spray paint |
| Color swatches (bottom) | Pick paint color |
| Brush slider | Brush size |
| **START HUNT** button | End the paint phase early |
| **TAUNT** button | Bait the Hunter (makes you detectable ~2s) |

---

## The gameplay loop

A full round moves through four phases: **menu → paint → hunt → result**, then
loops back. One round is one **Splat**.

### 1. Menu
Title screen with the pitch and controls. Hit **PLAY** to start a round. Each
round resets your paint, position, and result.

### 2. Paint phase (`prep`, ~25s) — *the Hunter is frozen*
This is where you set up your disguise:
- **Move** to a prop whose color you want to match (a green barrel, a red sofa, a
  wooden crate…). Each prop is a distinct camouflage target.
- **Paint yourself** by clicking and dragging on your blob. Paint lays down as wet
  **splatter** in your chosen color. Use **Q/E** to spin the blob so you can cover
  all sides.
- **No undo.** Every stroke spends from a finite **paint budget** (the meter drains
  as you spray). Panic-spraying the wrong color is permanent — that tension is the
  whole point.
- The **CAMO meter** shows, live, how well your blob's dominant color matches the
  surface you're standing against. Push it past the marked threshold to read as
  **blended ✓**; below it you read as **OFF** and the Hunter can spot you.
- Press **START HUNT** when you're happy, or just wait for the timer.

### 3. Hunt phase (`hunt`, ~75s) — *the Hunter wakes up*
Now survive. The Hunter patrols the room on a waypoint route and hunts you:
- **Detection is conditional.** The Hunter only notices you when you're **inside
  its view cone AND poorly camouflaged** (camo below the safe threshold) — or while
  you're taunting. Blend well and it walks right past you, even up close.
- **Suspicion ramps.** While it can see a mismatch, a hidden suspicion meter fills
  (faster the worse your camo). Break line of sight or blend and it decays. When
  suspicion maxes out **and** the Hunter is within tag range, you're **splatted**.
- A **👁 SPOTTED — HOLD STILL** warning flashes when the Hunter has eyes on you.
- **TAUNT** is a bait button: it makes you detectable for ~2 seconds regardless of
  camo. Pure risk/reward — it's how you draw the Hunter somewhere, or how you die.
- **Splotchy's eyes** react to the state: **neutral** → **spotted** (when seen) →
  **smug** (while taunting) → **X-eyes** (when caught).

### 4. Result (`result`)
- **Survived:** you outlasted the timer without being tagged — *"you win the
  Splotch Pot."*
- **Splatted:** the Hunter caught you; a big **elimination splat** drops on the
  ground where you fell, and the card shows how long you survived.
- **PLAY AGAIN** returns to a fresh round.

---

## How the mechanics work

- **Paint model.** Paint is stored as an ordered list of **stamps** (`{u, v, color,
  size, seq}`) — the "deterministic stroke list" from the design doc — not a
  streamed texture. Each stamp is a cluster of circles (a splat shape) drawn onto
  the blob's `CanvasTexture`. This same representation is what will broadcast over
  the network in multiplayer, unchanged.
- **Camo scoring.** Each frame the game finds the nearest prop you're backed
  against, computes your blob's dominant painted color + coverage, and scores the
  color match (0–1). Low coverage caps the score (patchy paint reads as "off").
  This single number drives the CAMO meter and the Hunter's ability to detect you.
- **Hunter AI.** A small state machine: patrol waypoints → build suspicion when it
  sees a poorly-camouflaged you in its cone → chase your last-seen position → tag
  if suspicion is full and you're in range. All tunable.
- **Performance model.** Discrete/UI state lives in a **zustand** store; per-frame
  data (positions, live camo color) lives in module refs (`shared.ts`) so the 3D
  loop never triggers React re-renders.

Everything tunable — timings, speeds, Hunter FOV/range/suspicion, camo threshold,
paint budget, the level layout and palette — lives in
**`apps/web/src/game/constants.ts`**.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19**, TypeScript, Tailwind.
- **React Three Fiber / Three.js** for the 3D scene (client-only, `ssr:false`).
- **zustand** for game/UI state; per-frame data in module refs.
- **Baloo 2** + **Nunito** brand fonts via `next/font`; official SPLOTCH palette.

---

## Project layout

```
Paint Game/                        repo root
  README.md                        (this file)
  SPLOTCH-Features-Report-v2.md    the design/feature catalog
  apps/web/                        the game
    src/game/
      store.ts            phase machine (menu->prep->hunt->result), paint, results
      Scene.tsx           Canvas, lights, camera-follow rig, per-frame game clock
      Room.tsx            the Canvas map ("The Studio"): floor, walls, GLB props
      Player.tsx          blob movement, paint-by-pointer, live camo scoring
      Hunter.tsx          AI: patrol / suspicion cone / chase / tag
      Face.tsx            Splotchy's eyes overlay (expression swaps by game state)
      Decals.tsx          floor/wall decals + elimination splat + ambient set
      decalTextures.ts    cached SVG -> texture loader for the decals
      models.ts           GLB loader/clone helper + preload
      usePaintTexture.ts  deterministic stamp-list -> CanvasTexture (paint model)
      brushes.ts          splat brush stamp shapes (from the asset pack)
      surfaces.ts         procedural seamless paper-grain floor/wall texture
      camo.ts / color.ts  nearest-surface detection + camouflage match scoring
      useKeys.ts          keyboard input state
      shared.ts           module refs for per-frame data (positions, live camo)
      HUD.tsx             menu, prep controls, hunt HUD, result card, splat-O logo
      constants.ts        all tunables (timings, speeds, palette, level layout)
      types.ts            shared types (Stamp, PropDef, GamePhase, ...)
    public/
      models/*.glb        the prop kit + blob_player + blob_hunter (from Blender)
      art/*.svg           asset-pack SVGs (brush stamps, faces, decals, patterns)
    tools/                one-off scripts (GLB inspect, SVG extract)
```

---

## The SPLOTCH concept (design vision)

The full game (beyond this prototype) is themed and crypto-native:

| Thing | Name |
|---|---|
| The avatars | **Blobs** |
| Hiders | **Chameleons** |
| Seekers | **Hunters** |
| A round | **a Splat** |
| Wager token (devnet SPL) | **$SPLOT** |
| The match pot | **the Splotch Pot** |
| Protocol rake | **the Drip** |
| Getting caught | **splatted** |
| Maps | **Canvases** (The Studio, Neon Alley, …) |
| Cosmetics | **Paint Kits** (NFTs, later) |

In multiplayer, each lobby is a staked pot on **Solana** (devnet first): stake
`$SPLOT` → survive → surviving Chameleons split the pot; a small **Drip** goes to
the treasury. The crypto is a *mechanic*, not a sticker — see the design plan and
`SPLOTCH-Features-Report-v2` at the repo root.

---

## Art assets

- **3D models** (`apps/web/public/models/`): 11 GLBs — crate (×2), barrel, sofa,
  shelf, pillar, plant, desk, locker, plus `blob_player` and `blob_hunter`. Built
  in Blender to the exact dimensions in `constants.ts`, origin at base (sit on the
  floor at y=0).
- **2D assets** (`apps/web/public/art/`): 29 SVGs from the SPLOTCH asset pack.
  - **Wired in:** splat brush stamps (`brushes.ts`), Splotchy face sprites
    (`Face.tsx`), environment decals — floor splat, puddle, footprint, wall drip,
    and the elimination splat (`Decals.tsx`), the paper-grain surface texture
    (`surfaces.ts`), and the palette + fonts + splat-O logo.
  - **Extracted, not yet wired:** prop surface patterns (tile/wood/metal/fabric —
    the prop GLBs lack UVs, so these need a small rework) and the "The Studio"
    styleframe (a 2D mood reference, not a runtime asset).

---

## Status

**Phase 1 (the fun gate) is built.** Single-player paint-and-hide vs an AI Hunter,
with the real 3D model kit, Splotchy's reacting face, splatter paint, environment
decals, and full SPLOTCH branding. Production build passes (types + compile). The
2D pieces (menu, brush, faces, decals) are verified rendering; the composited 3D
scene should be eyeballed with `npm run dev` locally.

---

## Roadmap / next steps

The plan is explicit: **prove the loop is fun before building on top.**

0. **Playtest** — run it, play several rounds, decide if paint-to-hide-and-sweat-
   the-Hunter is fun. Tuning lives in `constants.ts` (camo threshold, Hunter FOV /
   speed / suspicion, timers, paint budget).
1. **Tune + polish** — adjust feel from the playtest; add **audio** (spray, whistle,
   splat — currently silent) and mobile touch controls.
2. **Silhouette Fold** — the flagship "become the furniture" ability; the feature
   that most differentiates SPLOTCH, still cheap to prototype single-player.
3. **Phase 2 — real-time multiplayer** — Colyseus authoritative server, lobbies +
   room codes, networked paint (the stamp list already broadcasts cleanly),
   server-validated tagging.
4. **Phase 3 — Solana devnet wagers** — after multiplayer (needs real lobbies to
   stake into).
5. **Phase 4+ — hardening & content** — trust-minimized settlement, then the
   features in `SPLOTCH-Features-Report-v2` (sabotage verbs, hidden roles, evidence
   systems, seasons).

### Not built yet (by design)

Multiplayer/netcode, Solana wagers, and every feature in
`SPLOTCH-Features-Report-v2`. Those come after the fun gate.
