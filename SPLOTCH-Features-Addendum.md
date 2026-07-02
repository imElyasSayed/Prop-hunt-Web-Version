# SPLOTCH — Features Addendum: Sabotage, Map Systems & Objectives

Companion to `MORPH-Features-Report.pdf`. Same method (propose → debate → adversarial hardening),
same score format: **fun / streamability / retention / feasibility / exploit-resistance** out of 5.
24 new features across the categories the original catalog under-serves: Among Us-style sabotage &
social deduction, interactive map systems, objectives/tasks, evidence systems, hider co-op, seeker
economy, and round structure. Every feature was red-teamed against the wager invariant:

> **THE POT INVARIANT:** no mechanic may move stake from player A to player B outside standard
> win/loss resolution. All bonuses pay from the rake-funded side-pool, capped at that match's rake.
> Litmus test: *"Can two accounts in a private lobby end a match with more combined SOL than they
> entered with, or can one player reduce a non-consenting teammate's win probability?"* If either
> is yes, it does not ship in staked lobbies.

---

## The signature moves (this addendum's differentiators)

- **Touch-Up Orders is the keystone** — the Among Us "task loop" translated into paint: camo dries
  out, forcing perfect hiders to move. It kills the genre's degenerate strategy (statue camping),
  gives seekers a learnable rhythm, gives bluffers something to fake, and doubles as the anti-stall
  backbone that protects the wager clock. Everything else hangs off it.
- **Drip Ducts + Fresh Coat Drips + Dust Ledger + Topple Trail form an EVIDENCE GRAMMAR** — the
  seeker's game stops being "walk and stare" and becomes CSI: read drips, prints, and disturbed
  props. Evidence is symmetric (seekers leave prints too) and fake-able (Poltergeists), which keeps
  it a mind game instead of an auto-win.
- **Poltergeist Protocol is the retention lever** — dead players become an unreliable-evidence
  faction instead of an alt-tab. It also retroactively balances every evidence system by injecting
  doubt ("was that drip real?").
- **Sabotage is dosed, not default** — three tiers (always-on structure / rolled spice / opt-in
  mayhem). Most rounds a suspicion is WRONG; that's what keeps suspicion fun. Staked lobbies run a
  stricter ruleset (see end).
- **The red-team killed the pretty ideas that touch the pot** — Sheriff's Brush (teammate delete
  button), pot-slice Errands, staked Landlord, and no-consent Fire Drill all violated the invariant
  as proposed and are cut or redesigned below. The wager layer stays sacred.

---

## A — Sabotage verbs (map-level, Among Us DNA)

- **Blackout Coat** [5/5/4/4/4] — Any hider can pull the fuse box: 25s blackout (seekers drop to a
  flashlight cone), but every hider's whistle interval is HALVED for 90s and the puller whistles
  first and loudest.
  - *How:* One fuse box per match, visible on load-in, one trigger per match, server-enforced.
    Disabled in the first 90s and **final 90s (red-team guard: kills the clock-kill stall)** and in
    the Safe Zone room. Gated out of newbie queues. Trade is selfish-vs-team: a personal escape
    window billed to everyone's noise budget.
  - *The clip:* lights slam off, six whistles chirp double-time in the dark, and the flashlight
    sweeps past a wall that just blinked.

- **Wet Seal** [4/4/4/5/4] — Spray a paint membrane over a doorway; seekers must scrub 3s to pass,
  hiders slip through (leaving a smear tell).
  - *How:* 2 charges, drawn from the SAME pigment pool as camouflage (sealing = uglier camo).
    **Red-team guards: per-hider active-seal cap, per-doorway re-seal cooldown** — no chain-sealing
    a wing to run the timer. Can't seal Safe Zone entrances; every active seal shows on Gallery
    Cams, so sealing a room advertises it. Server validates placement (no geometry clipping).
  - *The clip:* seeker scrubs frantically through the membrane while the hider walks out the back.

- **Static Bloom** [4/4/4/5/5] — Pop a pigment cloud that makes Pulse Ping return false positives
  on furniture for 20s.
  - *How:* One per hider; the bloom shimmer is visible (a noticing seeker knows a resource was
    spent nearby = bluff object). Using it advances your whistle timer 25%. **Red-team guard:
    shared team cooldown — blooms never stack/chain**, so permanent ping-blindness stalls are
    impossible.
  - *The clip:* Pulse Ping lights up four "hiders" and every single one is a lamp.

- **Drip Ducts** [5/5/5/3/4] — The vent: paint-drainage pipes between rooms — but you drip.
  - *How:* 3-4 duct pairs per map, 2s squeeze animation, 45s per-player cooldown, soft gurgle
    audible in both rooms. Each use leaves a directional drying drip trail at BOTH mouths (~30s).
    Entering with a seeker in line-of-sight auto-fails (no untaggable escapes); all transit
    server-resolved. Nerve keeps charging inside — not a stress-free waiting room.
  - *The clip:* seeker kneels at a dripping pipe mouth, looks up at the camera, and sprints.

- **Fire Drill** [5/5/4/4/3 · REDESIGNED per red-team] — The emergency meeting: one alarm pull
  freezes seekers 5s — then reveals the PULLER plus any hiders who OPT IN to the mass-whistle.
  - *How:* Original all-hiders forced whistle was a no-consent team-stake nuke (one colluder burns
    the whole team). Redesign: pulling freezes seekers and opens a 3s prompt; each hider chooses to
    join the group whistle (joiners earn a Nerve bonus; the puller always whistles, loudest).
    Disabled first 90s / last 60s; puller identity printed on the answer-check screen (social
    cost). Opt-in mayhem tier only.
  - *The clip:* five of seven hiders volunteer, the room detonates in whistles, and the seekers
    split like a SWAT breach.

## B — Social deduction & roles

- **Phantom Strokes** [4/4/4/5/4] — Fake-task bluffing: mime a Touch-Up with zero effect.
  - *How:* Hold at any station for the full animation — indistinguishable at range; within 3m a
    seeker sees no paint mist. Cover for traitor roles, bait for honest hiders. No side-pool credit
    for faking (trolls gain nothing). **Guard: the fake animation is server-broadcast identically
    to the real one** so memory-scrapers can't distinguish. The lie detonates on the answer-check
    screen.
  - *The clip:* results reveal the "hardest-working hider" faked all five touch-ups.

- **The Peacock** [5/5/3/4/3 · CASUAL-ONLY per red-team] — Jester: wins a side-pool bonus if FIRST
  tagged while camo integrity is above 70%.
  - *How:* Server-scored camo quality is the anti-troll gate (a naked blob in a doorway pays zero).
    Their stake still resolves as a loss; payout is rake-funded. **Red-team verdict: #4 wager
    threat — a 2-account farm (alt seeker insta-tags alt Peacock). OFF in staked lobbies, disabled
    in private/small lobbies, side-pool capped at that match's rake.** Never rolled twice in a row
    for the same player.
  - *The clip:* answer-check flips to "THE PEACOCK — tagged 0:47, camo 91%" over a smug trophy card.

- **Pigment Tether** [4/3/5/4/4] — Shared-fate trust item: merge paint pools (+40% budget), inherit
  each other's doom.
  - *How:* Two hiders bump avatars in the first 30s and BOTH CONFIRM via a plain-language "you die
    together" prompt (**red-team guard: explicit two-party consent + a sever option on cooldown**).
    If either is tagged, the survivor shimmers 12s and their whistle timer resets to imminent.
    Tether pairs print on the answer-check screen — betrayal is reputation-priced. No tethering
    within a premade above a 2-stack (collusion cap).
  - *The clip:* one blob gets tagged and across the map its hyperventilating partner gives away the
    whole bookshelf.

- **Splat Report** [4/4/5/4/4] — Body report: touch a dead teammate's splat to see the killer's
  route.
  - *How:* Tagged hiders burst into a persistent floor splat. First LIVING hider to touch it gets a
    6s ghost-trail of the tagging seeker's route; all seekers eat 8s of vision desaturation
    ("mourning fog"). One report per splat, rate-limited (no team-stacked desaturation). Reporting
    a splat you caused yields nothing and silently raises your collusion score. Bonus is
    rake-funded.
  - *The clip:* a hider tiptoes to their friend's wet splat, taps it, and the ghost trail leads to
    the closet beside them.

- **~~Sheriff's Brush~~ — CUT (red-team).** Intra-team elimination is a direct pot-invariant
  violation: player A deletes player B outside win/loss; two colluders splat the pot favorite with
  a throwaway account, and the "refund" creates mid-match stake mutation. Nobody stakes SOL where a
  teammate has a delete button. The Confessional Vote already provides the accusation beat safely.

## C — Objectives & tasks (reasons to move)

- **Touch-Up Orders** [4/3/5/4/4 · KEYSTONE] — Camo slowly dries chalky (~2min); rotating Touch-Up
  Stations restore it via a 4s exposed animation.
  - *How:* Three stations, server-random rotation, never inside the Safe Zone. Hiders are
    periodically FORCED off their perfect spot; seekers learn station timing. This is the Among Us
    task loop as paint, the structural anti-camp, and the anti-stall backbone the wager clock needs.
    Onboard it hard — it's a newbie-comprehension risk, not an exploit risk.
  - *The clip:* one chalky shoulder is the only wrong pixel in the room, and the seeker sees it two
    seconds before the hider breaks for the station.

- **Errand Board** [5/5/5/4/4 · REDESIGNED per red-team] — Among Us-style chores (wind the clock,
  water the fern, post a letter) that pay — from the SIDE-POOL, never the pot.
  - *How:* Original "bank locked 5% pot slices" violated the invariant (pot money for non-win
    events; risk-free alt-lobby extraction). Redesign: each completed errand pays a rake-funded
    side-pool bonus AND grants in-match utility (a paint refill or a cooldown refresh). 3 errands
    per hider, 3-5s exposed animations at fixed stations; completed stations visibly change state
    (clock hands move, letter flag up) so seekers get honest map information and can stake out
    open errands.
  - *The clip:* a hider banks the letter with a flashlight sweeping the doorway, then melts back
    into the wallpaper one second before the beam lands.

## D — Interactive map systems & evidence

- **Breaker Grid** [5/4/4/5/4] — The map's lights run on 3-4 labeled circuits; both sides can flip
  them.
  - *How:* Each room cluster has a breaker panel somewhere inconvenient. Dark crushes color
    contrast — camo painted for lit conditions reads wrong in the dark and vice versa, so lighting
    is itself a mind game. Flipping plays a map-wide CLUNK and pins the flipper's location 2s on
    hider HUDs. Max 2 dark circuits, 20s re-flip cooldown per panel. Three.js: bake lit/dark
    lightmaps per room, crossfade — nearly free.
  - *The clip:* seeker flips the breaker and the "wall stain" they passed twice is suddenly neon
    against the repaint.

- **Rinse Station** [4/4/4/4/4] — Sinks/hoses are the ONLY undo — at a terrible price.
  - *How:* The no-undo rule stands for the can; 2-3 water sources allow ONE full strip-to-white
    redo per round: 6 uninterrupted seconds of running-water audio, then a fading puddle trail for
    30s. Seekers can weaponize hoses: a spray cone that washes environmental paint and force-rinses
    any hider caught in it (partial paint loss, no tag). Stations groan on activation, so sink-
    camping is a bet, not a guarantee. Server-enforced once-per-round.
  - *The clip:* hider mid-rinse hears footsteps at second 5 of 6 and sprints away as a dripping,
    half-bright disaster.

- **Fresh Coat Drips** [4/4/4/5/4] — Wet overspray drips onto the floor below you for 20s after
  spraying — a confession written in your own palette.
  - *How:* 3-5 small drip decals in your actual colors; dry/fade after 45s — a perishable trail
    giving direction AND palette. Holding the trigger past a threshold pools a bigger splat
    (punishes panic-painting). Drip spawning is server-authoritative; only real movement writes
    trails. Three.js: pooled instanced decals, hundreds cost nothing.
  - *The clip:* seeker touches two red drips, looks up slowly at the "red vase" on the shelf.

- **Dust Ledger** [5/5/4/3/4] — Dusty zones record footprints; ceiling fans erase the tape — and
  silhouette anyone in the airflow.
  - *How:* Attic/basement/warehouse floors record hider AND seeker prints (90s fade) — seekers
    track, hiders read where seekers already swept. Fan switches blow a dust burst that erases the
    room's prints and briefly outlines any hider standing in the airflow as dust settles on them —
    the erase button is itself a gamble. 45s per-room fan cooldown; prints server-side (clients
    can't suppress their own). Rugs/tile record nothing — clean routes are learnable skill.
  - *The clip:* the fan bursts and a hider-shaped ghost of falling dust appears standing on the
    bookshelf.

- **Skylight Cycle** [4/4/3/4/5] — A compressed day: sun bands crawl across the floor; dusk
  regrades the last 90s.
  - *How:* Sunlight sweeps as a moving hot band on a FIXED, published path per map (learnable =
    fair, strategy not RNG). A hider painted for shade gets progressively lit on a slow readable
    timer; dusk warms every material so early-round paint drifts slightly "off" late. Three.js:
    projected light texture on a spline + a global LUT lerp — no realtime shadows.
  - *The clip:* the sun band slides inch by inch toward a motionless hider who finally breaks and
    runs.

- **Topple Trail** [4/4/4/4/4] — Props remember being bumped; a crooked broom is testimony.
  - *How:* Light props knock subtly askew when squeezed past and never reset — the round
    accumulates readable history. Seekers who memorize the opening layout track disturbance like
    rangers; hiders counter by toppling FALSE trails toward abandoned zones. Seekers disturb props
    identically (evidence proves passage, not identity). Three.js: props settle to one of 3
    pre-baked "disturbed" poses after 2s of cheap impulse physics — deterministic, ~12 live props
    per room max.
  - *The clip:* seeker stops mid-sweep, stares at one fallen broom, and turns 180° toward the
    unchecked closet.

## E — Co-op & team economy

- **Totem Stack** [5/5/4/3/3 · REDESIGNED per red-team] — 2-3 hiders stack and paint up as one tall
  object (coat rack, lamp, cactus).
  - *How:* Original shared-tag (one tag kills the whole stack) let one colluder recruit a stack and
    tip off a seeker alt — a multi-stake grief. Redesign: **a tag splats only the touched member;
    the rest force-scatter with a brief 2s reveal** — still a disaster, no longer a bulk execution.
    Stacking is explicit opt-in, sways procedurally (never pixel-still), takes 1.5s to
    mount/dismount with audio, and can't move while mounted. Any member's whistle fires for the
    whole totem. Unlocks high shelves for errands.
  - *The clip:* seeker tags the "floor lamp" and three screaming blobs avalanche out of it.

- **Pigment Transfusion** [4/3/4/5/4] — Press against a teammate 3s and pump paint into their tank.
  - *How:* Transfer up to 30% of tank at 70% efficiency (30% evaporates — no laundering infinite
    paint); receive at most once per 60s. Both hiders emit a soft glugging tell within 8m — charity
    in a hot zone is dangerous. Enables a "tanker" logistics role near Rinse Stations. Server
    validates all tank math.
  - *The clip:* two "throw pillows" on a couch quietly glugging while the seeker checks under the
    coffee table.

## F — Seeker economy & tools

- **Gallery Cams** [4/4/5/5/5] — Security booth: a seated seeker watches a paint-freshness heatmap
  — information for tempo.
  - *How:* One booth per map; shows cycling feeds + per-room paint-activity deltas (freshness, wet
    seals, station visits — NEVER positions). A boothed seeker isn't hunting; hiders see a red REC
    light in the observed room — a live mind game about when to move. 45s continuous cap (no AFK/
    bribed booth-hiding; booth time shows in the Confessional Vote stats). **Guard: heatmap is
    computed server-side and shipped as per-room aggregates only** — nothing scrapeable. 5s delay
    defeats stream-sniping.
  - *The clip:* REC light dies, three hiders bolt simultaneously — and the seeker was watching the
    doorway in person.

- **The Snitch Machine** [5/4/5/4/4] — Vending-machine seeker economy: tags earn scrip, scrip buys
  gadgets — and every purchase is broadcast.
  - *How:* Scrip from tags (big), correct Pulse reads (small), stale-errand reports. Buys: UV lamp
    (drips/puddles glow), scent visor (10s heat-haze behind sprinting hiders), doorway tripwire
    chime. Purchases broadcast by name ("A SEEKER BOUGHT: UV LAMP") — buying reveals your plan.
    **Guard: scrip is match-scoped, zero carryover, never convertible off-match** (the instant it
    persists, alt-farming begins). Stock capped 2 of each; 5s loud purchase animation. Unspent
    scrip converts to a tiny rake-funded round-end bonus — spend vs bank.
  - *The clip:* "A SEEKER BOUGHT: SCENT VISOR" flashes and the hider voice chat goes silent.

## G — Round structure & retention

- **Poltergeist Protocol** [5/5/5/4/3] — Dead hiders return as poltergeists who haunt one
  interactable at a time — flooding the map with FALSE evidence.
  - *How:* Every 30s a ghost may trigger one world object: flip a breaker, spin a fan, run a faucet
    2s, topple a prop. Seekers must epistemically discount clues ("was that dust print real?") —
    which keeps the evidence grammar from becoming an auto-win late round. Guards: GLOBAL team
    cooldown (5 dead ≠ 5× chaos), each triggered object emits a 1s blue shimmer sharp seekers can
    spot to certify fakes, **red-team guard: minimum trigger distance from living teammates** (no
    beacon-snitching on your own team), and ghosts earn no pot share — they play for the team's
    payout. Nobody alt-tabs after dying.
  - *The clip:* seeker triumphantly follows a fresh drip trail into a dead-end bathroom while the
    dead hiders cackle in spectator chat.

- **The Landlord** [4/5/4/3/3 · UNSTAKED-ONLY per red-team] — 1vAll boss mode: one overpowered
  seeker owns the building, and the building fights with them.
  - *How:* Solo Landlord vs 7-9 hiders: free breaker flips, no-cooldown fans, one room-lock per
    minute (15s door seal, never on the room with the most hiders — server-checked), permanent
    scent visor, powers disclosed pre-round. Hiders win by finishing a shared 12-task Errand Board
    or surviving; each tag makes the Landlord slower and louder (comeback curve). **Red-team
    verdict: #3 wager threat — asymmetric solo-stake-vs-pool is a match-dumping machine in private
    lobbies and unpriceable without a rating system. Ships as an UNSTAKED streamer format only**
    ("can the lobby beat MY house"); revisit staking only with open matchmaking + random Landlord
    assignment + a solved rating.
  - *The clip:* the library door seals with two hiders inside and the lobby watches the timer tick
    down like a horror movie.

---

## Red-team verdict summary

| Verdict | Features |
|---|---|
| KEEP as-is | Drip Ducts, Touch-Up Orders, Phantom Strokes, Splat Report, Breaker Grid, Rinse Station, Fresh Coat Drips, Dust Ledger, Skylight Cycle, Pigment Transfusion, Topple Trail |
| KEEP with named guard | Blackout Coat (endgame lockout), Wet Seal (seal cap + doorway cooldown), Static Bloom (team cooldown, no stacking), Gallery Cams (server aggregates only), Pigment Tether (two-party consent + sever), Snitch Machine (match-scoped scrip), Poltergeist (min distance from living teammates) |
| REDESIGNED | Fire Drill (opt-in whistle, not forced), Errand Board (side-pool pay, never pot slices), Totem Stack (tag splats touched member only) |
| CASUAL/UNSTAKED ONLY | The Peacock, The Landlord |
| CUT | Sheriff's Brush (teammate delete button = pot-invariant violation) |

**Top 5 threats to the wager layer (as originally proposed):** pot-slice Errand Board, Sheriff's
Brush, staked Landlord, The Peacock, no-consent Fire Drill (+Totem shared-death as co-conspirator).
All are cut, redesigned, or fenced out of staked lobbies above.

## Dosing — how sabotage ships without poisoning the core game

Three tiers, mirroring how Among Us stays fun (most rounds a suspicion must be WRONG):

1. **Always-on structure** (every lobby, including staked): Touch-Up Orders, Drip Ducts, Gallery
   Cams, Splat Report, Breaker Grid, Rinse Station, Fresh Coat Drips, Dust Ledger, Skylight Cycle,
   Topple Trail, Poltergeist. These are map systems, not events — players build habits around them.
2. **Rolled spice** (controlled rates, badged in lobby): Blackout fuse box ~60% of matches; Wet
   Seal + Static Bloom as loadout picks capped at 2 sabotage consumables per hider; roles
   (Peacock, Tether traitor-pairings, Mimic per the main report) at a combined ~35% lobby roll.
3. **Opt-in mayhem** ("Sabotage Night" playlist + private lobbies only): Fire Drill, stacked-role
   combos, The Landlord. Clearly badged BEFORE wagers lock — nobody stakes SOL on rules they
   didn't agree to.

Newbie queues (first ~10 matches): tier 1 only.

## Staked-lobby blanket rules (regardless of features)

- Private staked lobbies: equal stakes, winners paid only from that lobby's own pot (kills most
  collusion EV — colluders just shuffle their own money minus rake).
- All side-pools rake-funded and capped at that match's rake.
- Server-side validation of every ability charge and cooldown; the browser client is never trusted.
- Disconnect/AFK past a grace window = splat; the stake stays in the pot.
- Hard match timer, with Touch-Up Orders as the anti-stall backbone.
- Every future feature passes the litmus test in the header before it ships staked.
