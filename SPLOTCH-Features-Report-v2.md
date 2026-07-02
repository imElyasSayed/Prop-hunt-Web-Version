# SPLOTCH — Features Report v2

Updated edition of `MORPH-Features-Report.pdf`. Sections 1–8 carry over the original report
(propose → debate → consensus → community-grounded enrichment). **Section 9 is new in v2:** 24
additional features (Among Us-style sabotage, interactive map systems, objectives, evidence
systems, co-op, seeker economy, round structure), each hardened by an adversarial anti-exploit
pass against the wager layer.

Scores = fun / streamability / retention / feasibility / exploit-resistance (out of 5 unless noted).

---

## 1 — The signature moves (our differentiators)

- The real data flips the whole thesis: the game doesn't have a novelty deficit, it has a
  **TABLE-STAKES deficit**. Meccha Chameleon sold ~10M copies at a flat $5.99 with ZERO MTX and 89%
  positive — the loudest complaints are all plumbing, not missing mechanics. Front-load the plumbing.
- **Friend/party join is the single most-cited real pain** ('nearly impossible', 'spent more time
  joining than playing'). It is P0-existential. Nothing ships before this.
- **'Art defeated by tech':** lighting/reflections make hiders 'look nothing like the surroundings'
  and the eyedropper 'pulls a different shade than what's on screen.' Morph is NOT yet the dominant
  skill — the renderer is. Core-loop fairness must ship before any novelty stacks on top.
- **SILHOUETTE FOLD is the ONE v1 bet that survives scrutiny across all lenses** — the credible
  reason to leave a 10M-copy incumbent. Over-invest in it and make it lighting-robust. It is also
  the biggest solo-dev technical risk, so fund it by cutting roulette/traitor/emote-as-flagship.
- **TELL SKINS is the strongest economy idea and should govern the ENTIRE catalog**: every cosmetic
  must be provably non-P2W, auditable in a single streamer screenshot.
- **The $MORPH coin is a solution to a demand nobody has proven.** UNVERIFIED appetite + 98.6%
  pump.fun rug rate + a documented crypto-averse clip audience = net liability at launch. Defer it;
  validate with honest USD cosmetics first.
- **NERVE ENGINE's 'stare = payout' is a bot-farmable faucet** (two accounts stare-farm in a private
  lobby) and inverts the core loop (rewards being spotted). Keep the tension, kill the payout —
  decouple money from gameplay signals forever.
- **The expanded post-round 'answer check' / results screen is beloved AND is the clip-factory GTM
  engine** — treat it as a flagship retention system, not UI polish.

## 2 — Flagship must-builds

- **Silhouette Fold (Shape Morph)** [5/5/5/2/4 · GAP] — Spend a limited charge to collapse your
  blob's SILHOUETTE into a nearby prop's outline, not just its texture — become the furniture.
  - Aim at a small/medium prop within 4m, hold 1.2s to fold: your outer mesh approximates that
    prop's outline and snaps texture to match. While folded you are near-undetectable but
    movement-LOCKED, hold up to 20s, 2 charges/round (regen 1 per 3min, cap 2). Fold quality
    degrades with volume mismatch (a huge prop = loose fold, a tell). Fold snaps to a validated
    surface anchor BESIDE geometry (never inside — kills no-clip). Unfold takes 1s with an audible
    pop that auto-flags the highlight system. Morph stability (Heat Bloom) still drains while
    folded, forcing eventual unfold. Returns NO Pulse ping for a few seconds. The FUNCTIONAL
    ability is a free universal progression unlock; the shape LIBRARY (vase vs box vs gargoyle,
    identical hitboxes, context-gated) is the paid seasonal cosmetic layer.

- **Nerve Engine (Held Breath + Heat Bloom unified)** [5/5/5/3/4 · GAP] — A seeker's stare
  simultaneously ramps your score multiplier AND drains your morph stability — the stare that pays
  you is the stare that melts your disguise.
  - While a seeker's active moving cone holds a >75%-matched morphed hider: a private multiplier
    ramps x1→x2→x3→x5 at 3/6/10/15s AND morph stability drains at DOUBLE rate. Points bank per
    second; any movement >0.3-0.5m or texture change resets the multiplier to x1 (banked points are
    safe) and starts a 2s exhale. At low stability (~20%) a hider-only shimmer warning fires: hold
    and pray, or risk the 1.2s vulnerable re-lock. Multiplier freezes 4s of grace when the cone
    leaves. Rendered AS the nameplate turning into a rising NERVE bar with a heartbeat SFX; piped
    to spectator/stream overlay, never to the seeker. 'HELD/Stared Down' banner auto-clips.
    Anti-farm: seeker must be non-party + actively hunting, per-round Nerve cap, texture-match gate.

- **Whistle Roulette (choose your tell)** [5/5/4/4/4 · GAP] — The forced ~45s whistle becomes a
  bluff economy: emit True for a nerve bonus or Throw a decoy — but you can never go fully silent.
  - Holding still fills a Silence-credit meter that gates spends. 5s before each forced whistle a
    radial prompt offers: TRUE (emits from real position, +honest-nerve points scaled by
    nearest-seeker proximity) or THROW (decoy sound from an LOS-validated point up to 10-20m away,
    costs the full meter, traceable 3s wind-up hiss audible within 8m, ~2/round). MUTE is CUT —
    silent camping stays impossible; ignoring the prompt defaults to TRUE. Serial whistlers get
    pinned by a seeker audio-triangulation passive. Whistle SOUND and throw VFX are cosmetic SKUs —
    timing/volume fixed, never P2W. *(See §6: redesign to Seeker Escalation Clock for the RNG
    fairness complaint.)*

- **Pulse Ping (readable seeker scan)** [4/4/4/4/5 · GAP] — A telegraphed sonar pulse that flags
  morph MISMATCH — well-blended hiders are invisible to it and spam self-punishes.
  - 12m LOS-gated ring over ~1.5s with loud charge-up SFX + visible shockwave (hiders get ~1s to
    freeze/reblend). Hiders below ~70% texture-match get a 2s highlight; perfectly-blended and
    Folded hiders return nothing. Cooldown 45s; each empty pulse adds +15s (anti-spam).
    Freshly-splattered or mid-re-lock hiders ping BRIGHTER — hard-wiring the Fold/Pulse/Warning-Shot
    counterplay triangle. Never sees through walls.

- **The Mimic (Traitor Hider)** [5/5/4/3/3 · GAP] — One of the two hiders is secretly the Mimic,
  scored ONLY by causing their partner's tag.
  - Spawn rate ~12-15% so paranoia is earned by rarity. The Mimic sees the partner's faint position
    pulse; wins only if the OTHER hider is tagged before the timer AND they survive. Sabotage
    reuses existing systems: the Whistle THROW aimed AT the ally, plus a gaze-bait beacon. HARD
    RULE: no measurable sabotage action = ZERO score (kills passive-troll value). Gated out of
    new-player and Prop Party queues. Resolved via the Confessional Vote. Earned reward: vaulted
    'Two-Faced' split-texture skin. *(See §6: deprioritized to post-safety opt-in casual mode.)*

- **Scale Roulette (Official Size Modes)** [5/5/4/5/5 · GAP] — Rotating official player-size modes —
  Teeny 0.4x, Normal, Chonk 1.4x, GIGA 2.2x — each rebalancing the hide/seek loop.
  - Server-authoritative scale, per-scale scoring rebalance so no size is strictly best. 'Mixed
    Handicap' (hiders Teeny, seekers GIGA) is the flagship David-and-Goliath stream playlist.
    Ranked = Normal only. Win-rate-based auto-assignment CUT. *(See §6: quarantined to casual
    playlist post-anti-cheat.)*

- **Tell Skins / Cosmetic Tells (Stealth Rating spine)** [4/4/4/4/5 · GAP] — Every flashy cosmetic
  carries a published 'Stealth Rating' — the flashiest skins are HARDER to hide in, structurally
  preventing pay-to-hide.
  - Plain/earned skins ~100% fidelity; premium 'Molten' leaves a 1px heat-haze, 'Prism' refracts at
    grazing angles, 'Golden' chimes faintly on the whistle cycle. Spending money makes you EASIER
    to catch — the flex is winning DESPITE the tell. The rating feeds the Nerve Engine as an
    inverse-fidelity score multiplier (up to 3x). One number = pricing axis, anti-P2W guarantee,
    score multiplier. VETO: no cosmetic may reduce splatter-tell duration or any timing/detection
    stat.

- **Reveal Emotes (Peekaboo economy)** [4/5/4/4/5 · GAP] — Cosmetic emotes that only play when you
  CHOOSE to break cover — the taunt IS the reveal, the clip is the product.
  - One-tap: camouflage drops in a stylized flourish (Sticker-Peel, Melt-and-Reform,
    Confetti-Burst), 2s animation + sting, re-morph. Zero mechanical advantage; 1-per-life cap.
    Signature tiers CANNOT be bought — only earned. Auto-composites into the Freeze-Frame trophy
    card. *(See §6: deprioritized to low-cost flavor; clip value rolls into the Clip Card.)*

- **Freeze-Frame Photobomb (Trophy Card)** [4/5/4/4/5 · GAP] — Every tag snaps a shareable trophy
  card compositing both players' cosmetics — losers become content.
  - ~1.5s cinematic freeze orbits seeker + caught hider; one-click-shareable card (map, score,
    names). Hiders equip a photo-only Reveal-Morph (rubber duck, screaming banana); seekers equip a
    Signature Tag pose. Rarity watermark advertises cosmetics on every shared card. Also the fast
    Mimic reveal ('MIMIC CONFIRMED'). Curated catalog only — brand-safe.

- **First Blob (Onboarding + Practice Range)** [3/2/5/5/5] — A 90-second zero-reading guided first
  match vs friendly bots, then a free starter cosmetic.
  - Auto-route new accounts to a solo map with 3 dumb seeker bots and diegetic prompts (walk → SCAN
    → MORPH → LOCK POSE → earn gaze points). Grants the non-tradeable 'Rookie Ripple' texture and
    unlocks matchmaking. Permanent Practice Range with bots + paint/scale sandbox.

- **Rotating Safe Zone** [4/3/4/5/5] — A telegraphed 12m no-scoring/no-tagging sphere shifts every
  3 minutes — the anti-camp anchor and rhythmic heartbeat of the map.

- **Pressure System (Tell Debt + Redline Zones + Purge Ring)** [4/4/4/3/4 · GAP] — Three-layer
  anti-camp: personal silhouette-leak, cell sealing, and a high-value flush event.
  - (1) TELL DEBT: staying within a 2m radius ~90s ghosts your true silhouette through the morph
    (5→30% opacity), visible only in a seeker's cone; moving to a new grid cell drains it + 4s
    clean-morph grace. (2) REDLINE ZONES: 40s+ cumulative dwell cells seal (block morph-LOCK, not
    passage) after a 10s warning; reopen in 60s. (3) PURGE RING: every 3min a 10m ring spawns on
    the hottest cell — survive 12s inside under genuine gaze for 3x points, else nameplate
    force-flickers. Banned/telegraph-locked in ranked.

- **Shape-of-the-Season Silhouette Library** [4/5/4/3/4 · GAP] — Themed body-SHAPE cosmetics
  (mushroom, crate, gargoyle) as mint-limited vaulted seasonal sets hanging off the FREE Fold
  ability. Context-gated (a traffic cone only helps near real cones), identical hitboxes, never P2W.

## 3 — Full idea catalog by category

Tiers: T1 must-build · T2 strong · T3 experimental · GAP = fills a gap the original lacks.

### A — Challenges & Milestones
- **Morph Mastery Trees** [T2 · 3/3/5/4/4 · GAP] — Parallel Hider and Seeker challenge trees
  (daily/weekly/seasonal) gated on the deep systems ('survive 3 Folds without a tag', 'win a
  Pulse-read chase') so progression teaches mechanics. Dual tracks fix the hider/seeker engagement
  asymmetry. Morph Points soft currency; $MORPH can skip a tier — convenience only, never power.

### B — Cosmetics · Skins · Emotes
- **Tell Skins / Cosmetic Tells** [T1] — see §2.
- **Reveal Emotes** [T1] — see §2.
- **Freeze-Frame Photobomb** [T1] — see §2.
- **Shape-of-the-Season Silhouette Library** [T1] — see §2.
- **Memory Materials & Palette Vault** [T2 · 3/3/4/4/4] — Save/load morph presets (top community
  request; slots beyond the first few cost $MORPH) + permanently unlock rare surface materials by
  surviving rounds morphed onto them — a travel diary of clutch wins. Ultra-rares on limited event
  maps, mint-limited and tradeable. Never power. Anti-bot: survival must include earned
  gaze/seeker-proximity.
- **Copycat Emote Duels** [T3 · 3/4/3/5/4] — Safe-zone social toy: mirrored emotes, conga lines.
  VETO ENFORCED: currency payout CUT (trivially bottable). Pure expression, zero reward.

### C — Sabotage & Social-Deduction
- **The Mimic** [T1] — see §2 (and §6 deprioritization).
- **Confessional Vote (Post-Round Reveal Card)** [T2 · 4/4/4/4/4 · GAP] — A FAST post-round
  accusation card (25s meeting phase was vetoed as pacing-poison): anonymized evidence feed
  (whistle-throw logs, beacon flashes, flare locations) → vote who the traitor was. Correct
  majority splits a Detective bonus; a surviving traitor earns a Getaway bonus; correctly voting
  'nobody' rewards skeptics. Never kicks real players. Prime viewer-participation real estate.
- **The Mole (bribed seeker, hardened)** [T3 · 4/4/3/3/3 · GAP] — One seeker is secretly bribed but
  scores ONLY on measurable subtle-sabotage with a hard per-round cap; a mid-round Interrogate vote
  can slash their reward in real time. Matchmaking flags repeat Mole-favored-survivor pairs.
  EXPERIMENTAL: guarded/limited-playlist first.
- **Splatter Frame Job (Mimic-lobby only)** [T3 · 3/4/3/4/3 · GAP] — Deliberately eat a splatter,
  relocate, leave a teammate glowing. Glow scales with the victim's camo quality (framer sacrifices
  their own cover), 1s wet-paint cue on the framer, 'wipe' cleans it, capped once per event.
  Confessional Vote provides accountability.
- **Alliance Pact (Shared Fate) — Mimic-gated** [T3 · 3/4/2/3/2 · GAP] — Trust pact a Mimic can
  propose purely as bait, then defect while the partner is under gaze. Visible temptation meter for
  spectators. NOT available outside Mimic lobbies (removes the premade collusion floor).

### D — Dynamic Map / Round Events
- **Rotating Safe Zone** [T1] — see §2.
- **Pressure System** [T1] — see §2.
- **Rift Modifier Wheel** [T2 · 4/4/5/4/4 · GAP] — Every 3 minutes a public HUD wheel locks a
  mutator: Low Gravity, Mirror Morph, Silent Round, Double Gaze, Speed Seekers. Server-rolled +
  public = no info asymmetry. The SEASONAL delivery vehicle (new themed mutators each season).
  Harshest mutators disabled in ranked.
- **Wet Paint Sweep / Paint Tide** [T2 · 4/4/4/3/4] — A telegraphed paint tide sweeps ~1/4 of the
  map every ~90s, re-tinting surfaces ~25s AND force-recoloring hiders caught in it. Sprint INTO
  the tide to get color-matched a split-second before a seeker rounds the corner; seekers learn to
  walk behind the tide where fresh mismatches glow. ~6s wet-match window; server-randomized color.
- **Last Light (End-Game Chaos Phase)** [T2 · 4/5/4/4/5] — At T-45s the safe zone collapses to a
  contested 2m sphere worth a huge bonus, survivors emit a rising pulse glow, seekers gain +30%
  speed, and a paint front sweeps to color-break memorized spots. One guaranteed climactic finish
  per round. Glow is forced/equal; 'Clutch' progression for surviving it.

### E — Scoring Innovations
- **Nerve Engine** [T1] — see §2 (and §6: payout CUT, tension kept).
- **Nameplate Bounty (go loud)** [T2 · 4/4/3/4/4 · GAP] — Toggling your nameplate ON doubles your
  Nerve ceiling and posts a +750 seeker bounty on your head; visible within 20m. Lazy color choice
  flares the plate brighter. 10s toggle lockout. Anti-collusion: capped bounty payouts per pair,
  genuine-LOS tag required.
- **Distress Morph (Dead Man's Tell)** [T2 · 4/4/4/5/5 · GAP] — On tag, the eliminated hider
  flashes a distress texture + audio pulse (~4s) audible to living hiders, leaving a 20s
  paint-stain 'grave'. Survivors get reposition info; a 'Sole Survivor' bonus rewards outlasting a
  partner's flare by 20s. A Mimic can die deliberately to plant a funneling flare (feeds the
  Confessional Vote). One flare per genuine tag.
- **Bounty Hider + Chat's Bounty (position-safe)** [T2 · 4/5/3/3/3 · GAP] — Mid-round one hider is
  marked for triple points (server-rolled, or chat-voted with streamer integration). VETO: no
  through-wall marker — seekers get only a vague directional shimmer refreshed ~20s, and only AFTER
  an honest first sighting. Anti-repeat selection. 'Most Wanted' prestige line.
- **Gaze Bank / Nerve Currency** [T2 · 3/4/4/4/4] — Nerve points convert to a non-purchasable soft
  currency that ONLY buys cosmetics. Multiplied by Stealth-Rating inverse fidelity (flashy = up to
  3x) — the bravest play requires the hardest-to-hide cosmetics. Anti-farm: non-party actively
  hunting seeker, per-round cap, >75% match required.
- **Warmth Meter (proximity close-call)** [T3 · 4/4/3/3/2 · GAP] — Private meter fills while a
  seeker searches near you without finding you; at 100, if they leave empty-handed, cash a 'Close
  Call' bonus + 2s adrenaline dash. Ships ONLY with Held-Breath-grade anti-farm guards (non-party
  seeker, genuine LOS, per-round caps, no fill while parked) or not at all.

### F — Modes
- **Scale Roulette** [T1] — see §2 (and §6 quarantine).
- **First Blob** [T1] — see §2.
- **Prop Party (Chaos Casual Mode)** [T2 · 4/4/4/4/4 · GAP] — Prop-dense 6-hider/4-seeker party
  playlist where repeated textures mean sloppy newbie morphs still blend. 5-min rounds, whistles
  every ~25s, a silly modifier every round. No ranking. The Mimic and harsh systems gated OUT.
  Hosts the Costume Contest runway.
- **Mirror Morph (mutator, standalone-worthy)** [T2 · 4/4/3/4/4] — Your morph auto-copies the last
  surface you touched — movement paints you. Rewards clever routing, punishes careless contact. The
  Rift Wheel's marquee entry and a natural onboarding 'wow'.

### G — Social · Streamer · Viewer
- **Costume Contest Intermission** [T2 · 4/4/3/4/4 · GAP] — 20-second pre-round runway; lobby (or
  Twitch chat via keyword) votes a winner for a small Morph Points tip; winner spotlighted on the
  next loading screen. Can't self-vote; cosmetic moderation before display.
- **Whistle Skins (audio-swap only)** [T2 · 3/4/3/5/5] — Kazoo, opera, air-horn, streamer voice
  packs; timing/volume fixed. VETO ENFORCED: the 'Silence Auction' viewer mute/amplify lever is CUT
  (pay-to-win-by-proxy + griefing vector).

### H — Progression & Meta
- **Season of Surfaces (8-week themed seasons)** [T2 · 3/3/5/4/5 · GAP] — Re-themed map palette
  (reuses geometry: Jungle, Neon City, Stone Ruins) + ONE always-on modifier that shifts the meta +
  soft-reset rank (Bronze→Morph Master). The container for all cosmetic sinks. Vaulted seasonal
  items = FOMO without loot-box randomness.
- **Prestige Ledger** [T2 · 3/3/4/4/5] — ALL scattered earned auras (Mutator Medals, Purge
  Survivor, Sole Survivor, etc.) consolidate into ONE mint-limited, unbuyable prestige collection —
  the anti-P2W status ladder. Soft-resets each season.

### I — Hider / Seeker Abilities
- **Silhouette Fold** [T1] — see §2.
- **Whistle Roulette** [T1] — see §2 (and §6 redesign).
- **Pulse Ping** [T1] — see §2.
- **Marked / Splatter Chain (collateral only)** [T2 · 4/4/3/4/4] — Any shot splatters paint ~8m;
  caught hiders get a glowing wet stain (~6s) they must scrub off. 'Clutch reblend' within 2s
  clears it for a bonus. AMMO ECONOMY governs spray-spam: misses burn extra ammo, honest splatters
  refund partial. Teammate smear-framing CUT outside Mimic lobbies.
- **Warning Shot Economy** [T2 · 4/4/3/4/4 · GAP] — Half-ammo non-lethal shot (~5m): real hiders
  micro-flinch (0.3s wobble) unless they spend a 'steel nerve' hold (+unflinching points); decoys,
  Folded silhouettes, and true props do NOT flinch. Zero-flinch shots refund partial ammo — correct
  probes are neutral, wrong ones costly.
- **Decoy Shed (bait gadget)** [T2 · 4/5/3/4/4 · GAP] — 1 charge/round: drop a frozen morph-clone
  of your current pose/texture (non-solid, 25s, whistles on its own timer). Pops into splatter if
  shot, wasting seeker ammo (+baited points, CAPPED per round vs colluding feeders). Tells: decoys
  never breathe/micro-idle and ping faintly under Pulse. A wasted LAST shot triggers a GOTCHA
  trophy card.
- **Second-Chance Ghost / Do-Over Dome (casual-only)** [T3 · 3/3/4/3/3] — Tagged hiders become
  non-scoring ghosts who can reach a telegraphed Do-Over Dome for ONE respawn as an un-morphed blob
  at an exposed edge. Casual/party queues ONLY; ghost 'Boo' fake-whistle CUT.

## 4 — Community-grounded additions (from real player sentiment)

Scores /10.

- **Lighting-Aware Fold** [T1-must-build · 9/8/9/4/8] — On fold, the morphed mesh samples the
  mimicked prop's light probes / reflection profile (specular, albedo, AO) server-deterministically.
  Directly answers the #1 verbatim complaint ('reflect light for some odd reason').
- **Disguise Read Meter (pre-commit)** [T1-must-build · 8/6/9/7/7] — Private 0-100% camo score from
  color-match, silhouette-edge break, and lighting exposure; updates live; never shown to seekers.
  Turns 'the lighting betrayed me' into learnable information.
- **Server-Authoritative LOS Streaming ('Fog of Data')** [T1-must-build · 6/5/9/3/10] — A hider only
  exists in a seeker's payload once server-confirmed in LOS+range — devtools/ESP have nothing to
  read. On a Three.js stack the only real defense is not sending the data.
- **Answer-Check Replay + One-Tap Clip Card** [T1-must-build · 8/10/8/6/8] — Auto-generated 6-10s
  watermarked vertical highlight (best morph or funniest bust) at round end; one tap to
  TikTok/Shorts. Every player becomes a distribution node.
- **Rematch-With-Party button** [T1-must-build · 7/6/10/8/9] — One tap keeps the whole party
  together in the next lobby. Party friction is the #1 churn driver.
- **Skill-Gated Morph Lock (anti auto-paint)** [T2 · 7/5/7/6/9] — Surface-matching resolves
  server-side over a short focus window; inhuman timing flagged. Kills eyedropper bots.
- **Seeker 'Second Look' read tool** [T2 · 8/7/7/7/8] — Cooldown-gated close-inspect: correct hider
  read = catch + small bonus; wrong accusation = cooldown penalty.
- **Seeker Escalation Clock** [T2 · 7/7/8/7/8] — Telegraphed rising pressure (scan radius/frequency
  and last-hider heat increase as the timer drains; hard end-of-round reveal). Replaces
  forced-random whistle RNG.
- **Deaf-Safe Visual Whistle** [T2 · 6/6/7/7/8] — Every involuntary tell also emits a server-driven
  screen-edge ripple/caption/haptic. Serves deaf/HoH + muted-tab players AND removes a spoofable
  client audio cue.
- **Tell Legend on death** [T2 · 8/7/8/7/8] — Results screen replays the EXACT tell that got you
  found. Death becomes learnable, not mysterious.
- **Camo Preset Loadouts** [T2 · 7/5/8/8/9] — Save/name/share/hot-swap texture+silhouette combos; a
  few slots free, more for flat USD. The cleanest non-P2W first purchase.
- **Radically Honest Shop** [T2 · 5/6/7/8/9] — USD prices, 100% guaranteed (no gacha), spend
  counter, optional limit, refund window. Auditable by a skeptical streamer in one screenshot.
- **Daily/Weekly Contract system + Featured Modifier rotation** [T2 · 7/6/9/8/7] — Rotating morph
  challenges + weekly rule twists. Cheapest anti-repetitiveness lever for a solo dev.
- **Earned Battle-Pass + Ranked ladder** [T2 · 7/6/9/5/8] — Free + premium seasonal track; MMR
  ranked queue with seasonal soft-reset. Cosmetics earned via mastery of the core loop.
- **Spectate-to-Clip / Ghost Director** [T2 · 7/8/8/6/8] — Eliminated players spectate live, ping
  clip timestamps, export. Dead-time becomes highlight crowdsourcing.
- **Bot-backfill for thin lobbies** [T2 · 6/5/8/6/7] — Capped morph bots below a player threshold,
  replaced by humans on join. An empty lobby is instant churn.
- **Stream-Snipe Honeypot + Streamer Mode** [T2 · 8/9/6/6/7] — Masked join code/seat, entry delay,
  plus a planted decoy morph that makes snipers commit to the wrong prop — the threat becomes a clip.
- **Collusion Dampener** [T3 · 4/4/6/6/9] — Per-lobby reward ceiling + repeat-pairing detection;
  matches suspicious pairs apart. The guardrail if any earn faucet survives.
- **Community Palette / Silhouette Packs (creator rev-share)** [T3 · 6/6/7/4/6] — Curated UGC packs
  at honest USD prices, creators paid in USDC/SOL. The economy as artist support, not speculation.
- **Lobby Best-Disguise viewer vote** [T3 · 7/8/6/7/7] — 10-second post-round poll for the funniest
  hide; winner gets an earned (never bought) badge; clip flagged for the highlight reel.

## 5 — What real players validated vs contradicted

- **SILHOUETTE FOLD — VALIDATED**: unanimous; the ONE justified differentiator. Gated on lighting
  fairness and no-clip honesty.
- **TELL SKINS — VALIDATED**: the strongest anti-P2W idea; should govern the entire catalog.
- **ROTATING SAFE ZONE + PRESSURE SYSTEM — VALIDATED**: anti-camp is table-stakes pacing.
- **PULSE PING — VALIDATED (conditional)**: only if server-authoritative; a client-trusted ping is
  itself the wallhack.
- **Post-round REVEAL / answer check — VALIDATED**: 'the fastest feedback loop in the game.'
  Elevate to flagship retention + clip factory.
- **NERVE ENGINE — CONTRADICTED as specified**: tension half validated, payout half is a
  bot-farmable faucet. Keep the pressure, kill the money.
- **THE MIMIC — CONTRADICTED**: no demand evidence; griefing/collusion surface. Post-safety opt-in
  casual mode at most.
- **WHISTLE ROULETTE — CONTRADICTED**: death-causing RNG compounds the fairness grievance and is
  audio-gated. Redesign as Seeker Escalation Clock + Visual Whistle.
- **SCALE ROULETTE — NEUTRAL**: real viral surface but fragments matchmaking and amplifies hitbox
  exploits; casual/rotating playlist only.
- **REVEAL EMOTES — NEUTRAL**: beloved flavor, orthogonal to the core pain; fold clip value into
  the Clip Card.
- **$MORPH coin — CONTRADICTED**: zero verified demand; the reference game proved the loop sells
  with NO economy.

## 6 — Cut / redesigned (don't build these as-is)

- **$MORPH coin as a launch pillar — CUT from v1.** Reversible experiment only, post-PMF.
- **NERVE ENGINE payout — CUT the economic coupling.** Money and gameplay signals must never touch.
- **THE MIMIC — DEPRIORITIZE** to post-safety opt-in casual mode.
- **WHISTLE ROULETTE — REDESIGN** into the telegraphed Seeker Escalation Clock + Visual Whistle.
- **SCALE ROULETTE — DEPRIORITIZE** to casual playlist post-anti-cheat; never ranked, never marquee.
- **REVEAL EMOTES as a headline system — DEPRIORITIZE** to low-cost flavor.
- **'Deep sink-anchored cosmetics economy' as a flagship — DEPRIORITIZE.** Retention comes from
  map/rules cadence + progression, not sinks.
- **Fixed single 9-min round shape — DEPRIORITIZE.** Split casual (long/chaotic) vs ranked (tight).

## 7 — Must-fix table-stakes (before novelty matters)

- **[P0-existential] Frictionless friend/party join** — one-click invite URL/short code,
  join-in-progress, party persistence across rounds, reconnect-after-drop, browser-native
  no-download/no-wallet gate.
- **[P0-existential] Server-authoritative visibility + anti-cheat** — 'fog of data' LOS streaming,
  server-validated collision/movement/speed (no-clip), auto-paint timing detection, honeypot props
  for ESP.
- **[P0-existential] Lighting/reflection fairness pass** — deterministic hider-fair shading +
  client preview of how the disguise reads under current lighting.
- **[P0-existential] Moderation + child-safety layer** — report/mute/block/vote-kick, chat filter,
  voice off by default, no open DMs to minors, AFK auto-remove, lightweight ban pipeline.
- **[P1-critical] Paint/morph tool QoL** — accurate eyedropper, averaging sample, hex/RGB input,
  HSV sliders, palettes, fill bucket, undo/redo (tool-level), snap-to-prop, pre-round practice.
- **[P1-critical] Seeker-side balance kit + anti-stall + seeker progression** — Pulse Ping,
  escalation heat, last-hider pity heat, hard round-end reveal, seeker XP, telemetry balancing.
- **[P1-critical] Accessibility suite** — colorblind palettes + safe outlines, visual/haptic
  equivalents for every audio tell, full remap, one-hand/controller, reduced motion.
- **[P1-critical] Expanded answer-check results screen + clip export** — per-hider reveal, gaze
  heatmap, disguise-quality score, tell replay, MVP/best-hide/funniest-fail, rematch button,
  one-tap vertical clip export.
- **[P2-important] Reliable netcode + thin-lobby matchmaking** — sub-150ms WS sync, mid-round
  backfill/bot-fill, region matching, host-migration, lobby-timeout recovery.
- **[P2-important] Onboarding** — 60-second first round, practice sandbox, casual/ranked split with
  basic MMR.

## 8 — Build order

1. **PHASE 0 — EXISTENTIAL FLOOR**: friend/party join + invite links + rematch-with-party; fog of
   data + no-clip/anti-cheat + skill-gated morph lock; lighting/reflection fairness; moderation +
   child-safety. Nothing else matters if these are broken.
2. **PHASE 1 — CORE-LOOP INTEGRITY + THE ONE FLAGSHIP**: Lighting-Aware Silhouette Fold
   (over-invested), Disguise Read Meter, paint QoL + Camo Presets, expanded answer-check + Tell
   Legend + one-tap Clip Card.
3. **PHASE 1 (parallel) — SEEKER FAIRNESS + ACCESS**: Pulse Ping + Escalation Clock + Second Look +
   seeker progression; Safe Zone/Pressure; accessibility suite; netcode + bot-backfill;
   casual/ranked split + onboarding.
4. **PHASE 2 — RETENTION SCAFFOLD**: Battle-Pass + Ranked, Contracts + Featured Modifiers,
   Spectate-to-Clip, Streamer Mode + Honeypot, map/UGC pipeline.
5. **PHASE 3 — HONEST MONETIZATION TEST**: Radically Honest USD Shop (convenience + TELL-penalized
   cosmetics), Community Palette Packs with creator rev-share.
6. **PHASE 4 — REVERSIBLE EXPERIMENTS** (post-PMF, ring-fenced, kill-switched): coin as
   cosmetics-only sink guarded by the Collusion Dampener; Mimic and Scale Roulette as opt-in casual
   modes; viewer Best-Disguise vote.
7. **SEQUENCING RULE**: table-stakes RETAIN, novelty DIFFERENTIATES. Every decision judged against:
   *'can two 11-year-old friends get into one lobby, understand it in a minute, feel safe, play
   fair, and want a rematch?'*

---

# 9 — NEW IN v2: Sabotage, Map Systems & Objectives (24 features)

Generated by the same propose → debate → harden method: a social-deduction lens (Among Us / Project
Winter DNA), a systems/level-design lens, and an adversarial anti-exploit pass. Every feature was
red-teamed against the wager invariant:

> **THE POT INVARIANT:** no mechanic may move stake from player A to player B outside standard
> win/loss resolution. All bonuses pay from the rake-funded side-pool, capped at that match's rake.
> Litmus test: *"Can two accounts in a private lobby end a match with more combined SOL than they
> entered with, or can one player reduce a non-consenting teammate's win probability?"* If either
> is yes, it does not ship in staked lobbies.

### v2 signature moves

- **Touch-Up Orders is the keystone** — the Among Us task loop translated into paint: camo dries,
  forcing perfect hiders to move. Kills statue-camping, gives seekers a learnable rhythm, gives
  bluffers something to fake, and doubles as the anti-stall backbone protecting the wager clock.
- **Drip Ducts + Fresh Coat Drips + Dust Ledger + Topple Trail form an EVIDENCE GRAMMAR** — seeking
  becomes CSI (read drips, prints, disturbed props) instead of walk-and-stare. Evidence is
  symmetric and fake-able, keeping it a mind game, not an auto-win.
- **Poltergeist Protocol is the retention lever** — dead players become an unreliable-evidence
  faction instead of an alt-tab, and retroactively balance every evidence system by injecting doubt.
- **Sabotage is dosed, not default** — three tiers (always-on structure / rolled spice / opt-in
  mayhem); most rounds a suspicion is WRONG, which is what keeps suspicion fun.
- **The red-team killed the pretty ideas that touch the pot** — Sheriff's Brush, pot-slice Errands,
  staked Landlord, no-consent Fire Drill. The wager layer stays sacred.

### 9A — Sabotage verbs (map-level, Among Us DNA)

- **Blackout Coat** [5/5/4/4/4] — Any hider can pull the fuse box: 25s blackout (seekers drop to a
  flashlight cone), but every hider's whistle interval is HALVED for 90s and the puller whistles
  first and loudest.
  - *How:* One fuse box per match, visible on load-in, one trigger per match, server-enforced.
    Disabled in the first 90s and **final 90s (red-team guard: kills the clock-kill stall)** and in
    the Safe Zone room. Gated out of newbie queues. Selfish-vs-team: a personal escape window
    billed to everyone's noise budget.
  - *The clip:* lights slam off, six whistles chirp double-time in the dark, and the flashlight
    sweeps past a wall that just blinked.

- **Wet Seal** [4/4/4/5/4] — Spray a paint membrane over a doorway; seekers must scrub 3s to pass,
  hiders slip through (leaving a smear tell).
  - *How:* 2 charges drawn from the SAME pigment pool as camouflage (sealing = uglier camo).
    **Red-team guards: per-hider active-seal cap + per-doorway re-seal cooldown** — no chain-sealing
    a wing to run the timer. Can't seal Safe Zone entrances; active seals show on Gallery Cams
    (sealing a room advertises it). Server validates placement.
  - *The clip:* seeker scrubs frantically through the membrane while the hider walks out the back.

- **Static Bloom** [4/4/4/5/5] — Pop a pigment cloud that makes Pulse Ping return false positives
  on furniture for 20s.
  - *How:* One per hider; the shimmer is visible (a noticing seeker knows a resource was spent
    nearby = bluff object). Using it advances your whistle timer 25%. **Red-team guard: shared team
    cooldown — blooms never stack/chain**, so permanent ping-blindness stalls are impossible.
  - *The clip:* Pulse Ping lights up four "hiders" and every single one is a lamp.

- **Drip Ducts** [5/5/5/3/4] — The vent: paint-drainage pipes between rooms — but you drip.
  - *How:* 3-4 duct pairs per map, 2s squeeze animation, 45s per-player cooldown, soft gurgle
    audible in both rooms. Each use leaves a directional drying drip trail at BOTH mouths (~30s).
    Entering with a seeker in line-of-sight auto-fails (no untaggable escapes); server-resolved.
    Nerve keeps charging inside — not a stress-free waiting room.
  - *The clip:* seeker kneels at a dripping pipe mouth, looks up at the camera, and sprints.

- **Fire Drill** [5/5/4/4/3 · REDESIGNED] — The emergency meeting: one alarm pull freezes seekers
  5s — then reveals the PULLER plus any hiders who OPT IN to the mass-whistle.
  - *How:* The original all-hiders forced whistle was a no-consent team-stake nuke (one colluder
    burns the whole team). Redesign: pulling freezes seekers and opens a 3s prompt; each hider
    chooses to join the group whistle (joiners earn a Nerve bonus; the puller always whistles,
    loudest). Disabled first 90s / last 60s; puller identity printed on the answer-check screen.
    Opt-in mayhem tier only.
  - *The clip:* five of seven hiders volunteer, the room detonates in whistles, and the seekers
    split like a SWAT breach.

### 9B — Social deduction & roles

- **Phantom Strokes** [4/4/4/5/4] — Fake-task bluffing: mime a Touch-Up with zero effect.
  - *How:* Hold at any station for the full animation — indistinguishable at range; within 3m a
    seeker sees no paint mist. Cover for traitor roles, bait for honest hiders. No side-pool credit
    for faking (trolls gain nothing). **Guard: the fake animation is server-broadcast identically
    to the real one** so memory-scrapers can't distinguish. The lie detonates on the answer-check
    screen.
  - *The clip:* results reveal the "hardest-working hider" faked all five touch-ups.

- **The Peacock** [5/5/3/4/3 · CASUAL-ONLY] — Jester: wins a side-pool bonus if FIRST tagged while
  camo integrity is above 70%.
  - *How:* Server-scored camo quality is the anti-troll gate (a naked blob in a doorway pays zero).
    Their stake still resolves as a loss; payout is rake-funded. **Red-team: a top wager threat —
    2-account farmable (alt seeker insta-tags alt Peacock). OFF in staked lobbies, disabled in
    private/small lobbies, side-pool capped at the match's rake.** Never rolled twice in a row for
    the same player.
  - *The clip:* answer-check flips to "THE PEACOCK — tagged 0:47, camo 91%" over a smug trophy card.

- **Pigment Tether** [4/3/5/4/4] — Shared-fate trust item: merge paint pools (+40% budget), inherit
  each other's doom.
  - *How:* Two hiders bump avatars in the first 30s and BOTH CONFIRM via a plain-language "you die
    together" prompt (**red-team guard: explicit two-party consent + a sever option on cooldown**).
    If either is tagged, the survivor shimmers 12s and their whistle timer resets to imminent.
    Tether pairs print on the answer-check screen — betrayal is reputation-priced. No tethering
    within a premade above a 2-stack.
  - *The clip:* one blob gets tagged and across the map its hyperventilating partner gives away the
    whole bookshelf.

- **Splat Report** [4/4/5/4/4] — Body report: touch a dead teammate's splat to see the killer's
  route.
  - *How:* Tagged hiders burst into a persistent floor splat. The first LIVING hider to touch it
    gets a 6s ghost-trail of the tagging seeker's route; all seekers eat 8s of vision desaturation
    ("mourning fog"). One report per splat, rate-limited. Reporting a splat you caused yields
    nothing and silently raises your collusion score. Bonus rake-funded.
  - *The clip:* a hider tiptoes to their friend's wet splat, taps it, and the ghost trail leads to
    the closet beside them.

- **~~Sheriff's Brush~~ — CUT (red-team).** One hider gets a 1-use splat against a suspected
  traitor. Intra-team elimination is a direct pot-invariant violation: player A deletes player B
  outside win/loss; two colluders splat the pot favorite with a throwaway account, and the "refund"
  creates mid-match stake mutation. Nobody stakes SOL where a teammate has a delete button. The
  Confessional Vote already provides the accusation beat safely.

### 9C — Objectives & tasks (reasons to move)

- **Touch-Up Orders** [4/3/5/4/4 · KEYSTONE] — Camo slowly dries chalky (~2min); rotating Touch-Up
  Stations restore it via a 4s exposed animation.
  - *How:* Three stations, server-random rotation, never inside the Safe Zone. Hiders are
    periodically FORCED off their perfect spot; seekers learn station timing. The Among Us task
    loop as paint, the structural anti-camp, and the anti-stall backbone the wager clock needs.
    Onboard it hard — a newbie-comprehension risk, not an exploit risk.
  - *The clip:* one chalky shoulder is the only wrong pixel in the room, and the seeker sees it two
    seconds before the hider breaks for the station.

- **Errand Board** [5/5/5/4/4 · REDESIGNED] — Among Us-style chores (wind the clock, water the
  fern, post a letter) that pay — from the SIDE-POOL, never the pot.
  - *How:* Original "bank locked 5% pot slices" violated the invariant (pot money for non-win
    events; risk-free alt-lobby extraction). Redesign: each completed errand pays a rake-funded
    side-pool bonus AND grants in-match utility (a paint refill or cooldown refresh). 3 errands per
    hider, 3-5s exposed animations at fixed stations; completed stations visibly change state
    (clock hands move, letter flag up) so seekers get honest map information and can stake out open
    errands.
  - *The clip:* a hider banks the letter with a flashlight sweeping the doorway, then melts back
    into the wallpaper one second before the beam lands.

### 9D — Interactive map systems & evidence

- **Breaker Grid** [5/4/4/5/4] — The map's lights run on 3-4 labeled circuits; both sides can flip
  them.
  - *How:* Each room cluster has a breaker panel somewhere inconvenient. Dark crushes color
    contrast — camo painted for lit conditions reads wrong in the dark and vice versa; lighting is
    itself a mind game. Flipping plays a map-wide CLUNK and pins the flipper's location 2s on hider
    HUDs. Max 2 dark circuits, 20s re-flip cooldown. Three.js: bake lit/dark lightmaps per room and
    crossfade — nearly free.
  - *The clip:* seeker flips the breaker and the "wall stain" they passed twice is suddenly neon
    against the repaint.

- **Rinse Station** [4/4/4/4/4] — Sinks/hoses are the ONLY undo — at a terrible price.
  - *How:* The no-undo rule stands for the can; 2-3 water sources allow ONE full strip-to-white
    redo per round: 6 uninterrupted seconds of running-water audio, then a fading puddle trail for
    30s. Seekers can weaponize hoses: a spray cone that washes environmental paint and force-rinses
    any hider caught in it (partial paint loss, no tag). Stations groan on activation — sink-camping
    is a bet, not a guarantee. Server-enforced once-per-round.
  - *The clip:* hider mid-rinse hears footsteps at second 5 of 6 and sprints away as a dripping,
    half-bright disaster.

- **Fresh Coat Drips** [4/4/4/5/4] — Wet overspray drips onto the floor below you for 20s after
  spraying — a confession written in your own palette.
  - *How:* 3-5 small drip decals in your actual colors; dry/fade after 45s — a perishable trail
    giving direction AND palette. Holding the trigger past a threshold pools a bigger splat
    (punishes panic-painting). Drip spawning is server-authoritative; only real movement writes
    trails. Three.js: pooled instanced decals — hundreds cost nothing.
  - *The clip:* seeker touches two red drips, looks up slowly at the "red vase" on the shelf.

- **Dust Ledger** [5/5/4/3/4] — Dusty zones record footprints; ceiling fans erase the tape — and
  silhouette anyone in the airflow.
  - *How:* Attic/basement/warehouse floors record hider AND seeker prints (90s fade) — seekers
    track, hiders read where seekers already swept. Fan switches blow a dust burst that erases the
    room's prints and briefly outlines any hider standing in the airflow as dust settles — the
    erase button is itself a gamble. 45s per-room fan cooldown; prints server-side. Rugs/tile
    record nothing — clean routes are learnable skill.
  - *The clip:* the fan bursts and a hider-shaped ghost of falling dust appears standing on the
    bookshelf.

- **Skylight Cycle** [4/4/3/4/5] — A compressed day: sun bands crawl across the floor; dusk
  regrades the last 90s.
  - *How:* Sunlight sweeps as a moving hot band on a FIXED, published path per map (learnable =
    fair; strategy, not RNG). A hider painted for shade gets progressively lit on a slow readable
    timer; dusk warms every material so early paint drifts "off" late. Three.js: projected light
    texture on a spline + a global LUT lerp — no realtime shadows.
  - *The clip:* the sun band slides inch by inch toward a motionless hider who finally breaks and
    runs.

- **Topple Trail** [4/4/4/4/4] — Props remember being bumped; a crooked broom is testimony.
  - *How:* Light props knock subtly askew when squeezed past and never reset — the round
    accumulates readable history. Seekers who memorize the opening layout track disturbance like
    rangers; hiders counter by toppling FALSE trails toward abandoned zones. Seekers disturb props
    identically (evidence proves passage, not identity). Three.js: props settle to one of 3
    pre-baked "disturbed" poses after 2s of cheap impulse physics — deterministic; ~12 live props
    per room max.
  - *The clip:* seeker stops mid-sweep, stares at one fallen broom, and turns 180° toward the
    unchecked closet.

### 9E — Co-op & team economy

- **Totem Stack** [5/5/4/3/3 · REDESIGNED] — 2-3 hiders stack and paint up as one tall object (coat
  rack, lamp, cactus).
  - *How:* Original shared-tag (one tag kills the whole stack) let one colluder recruit a stack and
    tip off a seeker alt — a multi-stake grief. Redesign: **a tag splats only the touched member;
    the rest force-scatter with a brief 2s reveal** — still a disaster, no longer a bulk execution.
    Explicit opt-in, procedural sway (never pixel-still), 1.5s mount/dismount with audio, can't
    move while mounted. Any member's whistle fires for the whole totem. Unlocks high shelves for
    errands.
  - *The clip:* seeker tags the "floor lamp" and three screaming blobs avalanche out of it.

- **Pigment Transfusion** [4/3/4/5/4] — Press against a teammate 3s and pump paint into their tank.
  - *How:* Transfer up to 30% of tank at 70% efficiency (30% evaporates — no laundering infinite
    paint); receive at most once per 60s. Both hiders emit a soft glugging tell within 8m — charity
    in a hot zone is dangerous. Enables a "tanker" logistics role near Rinse Stations. Server
    validates all tank math.
  - *The clip:* two "throw pillows" on a couch quietly glugging while the seeker checks under the
    coffee table.

### 9F — Seeker economy & tools

- **Gallery Cams** [4/4/5/5/5] — Security booth: a seated seeker watches a paint-freshness heatmap
  — information for tempo.
  - *How:* One booth per map; cycling feeds + per-room paint-activity deltas (freshness, wet seals,
    station visits — NEVER positions). A boothed seeker isn't hunting; hiders see a red REC light
    in the observed room — a live mind game about when to move. 45s continuous cap (booth time
    shows in Confessional Vote stats). **Guard: heatmap computed server-side, shipped as per-room
    aggregates only** — nothing scrapeable. 5s delay defeats stream-sniping.
  - *The clip:* REC light dies, three hiders bolt simultaneously — and the seeker was watching the
    doorway in person.

- **The Snitch Machine** [5/4/5/4/4] — Vending-machine seeker economy: tags earn scrip, scrip buys
  gadgets — and every purchase is broadcast.
  - *How:* Scrip from tags (big), correct Pulse reads (small), stale-errand reports. Buys: UV lamp
    (drips/puddles glow), scent visor (10s heat-haze behind sprinting hiders), doorway tripwire
    chime. Purchases broadcast by name ("A SEEKER BOUGHT: UV LAMP") — buying reveals your plan.
    **Guard: scrip is match-scoped, zero carryover, never convertible off-match** (persistent scrip
    = alt-farming). Stock capped 2 of each; 5s loud purchase animation. Unspent scrip converts to a
    tiny rake-funded round-end bonus — spend vs bank.
  - *The clip:* "A SEEKER BOUGHT: SCENT VISOR" flashes and the hider voice chat goes silent.

### 9G — Round structure & retention

- **Poltergeist Protocol** [5/5/5/4/3] — Dead hiders return as poltergeists who haunt one
  interactable at a time — flooding the map with FALSE evidence.
  - *How:* Every 30s a ghost may trigger one world object: flip a breaker, spin a fan, run a faucet
    2s, topple a prop. Seekers must epistemically discount clues ("was that dust print real?") —
    which keeps the evidence grammar from becoming an auto-win late round. Guards: GLOBAL team
    cooldown (5 dead ≠ 5× chaos), a 1s blue shimmer on triggered objects that sharp seekers can
    spot to certify fakes, **red-team guard: minimum trigger distance from living teammates** (no
    beacon-snitching), and ghosts earn no pot share — they play for the team's payout. Nobody
    alt-tabs after dying.
  - *The clip:* seeker triumphantly follows a fresh drip trail into a dead-end bathroom while the
    dead hiders cackle in spectator chat.

- **The Landlord** [4/5/4/3/3 · UNSTAKED-ONLY] — 1vAll boss mode: one overpowered seeker owns the
  building, and the building fights with them.
  - *How:* Solo Landlord vs 7-9 hiders: free breaker flips, no-cooldown fans, one room-lock per
    minute (15s door seal, never on the room with the most hiders — server-checked), permanent
    scent visor, powers disclosed pre-round. Hiders win by finishing a shared 12-task Errand Board
    or surviving; each tag makes the Landlord slower and louder (comeback curve). **Red-team:
    asymmetric solo-stake-vs-pool is a match-dumping machine in private lobbies and unpriceable
    without a rating system. Ships as an UNSTAKED streamer format only** ("can the lobby beat MY
    house"); revisit staking only with open matchmaking + random Landlord assignment + a solved
    rating.
  - *The clip:* the library door seals with two hiders inside and the lobby watches the timer tick
    down like a horror movie.

### 9H — Red-team verdict summary

| Verdict | Features |
|---|---|
| KEEP as-is | Drip Ducts, Touch-Up Orders, Phantom Strokes, Splat Report, Breaker Grid, Rinse Station, Fresh Coat Drips, Dust Ledger, Skylight Cycle, Pigment Transfusion, Topple Trail |
| KEEP with named guard | Blackout Coat (endgame lockout), Wet Seal (seal cap + doorway cooldown), Static Bloom (team cooldown, no stacking), Gallery Cams (server aggregates only), Pigment Tether (two-party consent + sever), Snitch Machine (match-scoped scrip), Poltergeist (min distance from living teammates) |
| REDESIGNED | Fire Drill (opt-in whistle, not forced), Errand Board (side-pool pay, never pot slices), Totem Stack (tag splats touched member only) |
| CASUAL/UNSTAKED ONLY | The Peacock, The Landlord |
| CUT | Sheriff's Brush (teammate delete button = pot-invariant violation) |

**Top 5 threats to the wager layer (as originally proposed):** pot-slice Errand Board, Sheriff's
Brush, staked Landlord, The Peacock, no-consent Fire Drill (+ Totem shared-death as
co-conspirator). All cut, redesigned, or fenced out of staked lobbies.

### 9I — Dosing: how sabotage ships without poisoning the core game

Three tiers, mirroring how Among Us stays fun (most rounds a suspicion must be WRONG):

1. **Always-on structure** (every lobby, including staked): Touch-Up Orders, Drip Ducts, Gallery
   Cams, Splat Report, Breaker Grid, Rinse Station, Fresh Coat Drips, Dust Ledger, Skylight Cycle,
   Topple Trail, Poltergeist. Map systems, not events — players build habits around them.
2. **Rolled spice** (controlled rates, badged in lobby): Blackout fuse box ~60% of matches; Wet
   Seal + Static Bloom as loadout picks capped at 2 sabotage consumables per hider; roles (Peacock,
   Tether traitor-pairings, the Mimic per §2) at a combined ~35% lobby roll.
3. **Opt-in mayhem** ("Sabotage Night" playlist + private lobbies only): Fire Drill, stacked-role
   combos, The Landlord. Clearly badged BEFORE wagers lock — nobody stakes SOL on rules they didn't
   agree to.

Newbie queues (first ~10 matches): tier 1 only.

### 9J — Staked-lobby blanket rules (regardless of features)

- Private staked lobbies: equal stakes; winners paid only from that lobby's own pot (kills most
  collusion EV — colluders just shuffle their own money minus rake).
- All side-pools rake-funded and capped at that match's rake.
- Server-side validation of every ability charge and cooldown; the browser client is never trusted.
- Disconnect/AFK past a grace window = splat; the stake stays in the pot.
- Hard match timer, with Touch-Up Orders as the anti-stall backbone.
- Every future feature passes the pot-invariant litmus test before it ships staked.

### 9K — v2 build-order note

The v2 features slot into the §8 build order without reshuffling it: tier-1 "always-on structure"
systems (Touch-Up Orders, evidence grammar, Breaker Grid, Rinse Station) belong in **Phase 2
(retention scaffold)** after the §8 Phase 0/1 table-stakes and core-loop integrity ship; Poltergeist
Protocol joins Spectate-to-Clip as the dead-time answer; roles and opt-in mayhem (Peacock, Fire
Drill, Landlord) are **Phase 4 reversible experiments** alongside the Mimic. Nothing in Section 9
jumps the queue ahead of friend-join, fog-of-data anti-cheat, lighting fairness, or the fun gate.
