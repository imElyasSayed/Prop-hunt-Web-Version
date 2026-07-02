// The authoritative match room. Owns positions (speed-clamped client input),
// role assignment, the round lifecycle, and — critically — tag validation:
// a hunter's tag is only honoured after the server re-checks range, round
// state, and target liveness. The client is never trusted.
import { Room, Client } from "@colyseus/core";
import { MatchState, Player, PaintStamp } from "../schema/MatchState.js";
import {
  TICK_MS,
  PLAYER_SPEED,
  HUNTER_SPEED,
  PLAYER_RADIUS,
  HUNTER_RADIUS,
  TAG_RANGE,
  PREP_SECONDS,
  HUNT_SECONDS,
  RESULT_SECONDS,
  SCALE_TIERS,
  SCALE_KEYS,
  collide,
  makeRoomCode,
} from "../gameConfig.js";

interface Input {
  dx: number;
  dz: number;
}

interface JoinOptions {
  roomCode?: string;
  name?: string;
  prepSeconds?: number;
  huntSeconds?: number;
  resultSeconds?: number;
}

export class MatchRoom extends Room<MatchState> {
  maxClients = 8;

  private inputs = new Map<string, Input>();
  private prepSeconds = PREP_SECONDS;
  private huntSeconds = HUNT_SECONDS;
  private resultSeconds = RESULT_SECONDS;

  onCreate(options: JoinOptions) {
    const state = new MatchState();
    state.roomCode = (options.roomCode || makeRoomCode()).toUpperCase();
    this.setState(state);
    this.setMetadata({ roomCode: state.roomCode });

    if (options.prepSeconds != null) this.prepSeconds = options.prepSeconds;
    if (options.huntSeconds != null) this.huntSeconds = options.huntSeconds;
    if (options.resultSeconds != null) this.resultSeconds = options.resultSeconds;

    this.onMessage("input", (client, msg: Input) => {
      this.inputs.set(client.sessionId, {
        dx: Number(msg?.dx) || 0,
        dz: Number(msg?.dz) || 0,
      });
    });

    this.onMessage("paint", (client, msg: PaintStamp) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !p.alive || p.role !== "chameleon") return;
      if (this.state.phase !== "prep" && this.state.phase !== "hunt") return;
      if (p.stamps.length >= 800) return; // anti-flood cap
      const s = new PaintStamp();
      s.u = clamp01(Number(msg?.u));
      s.v = clamp01(Number(msg?.v));
      s.color = sanitizeColor(msg?.color);
      s.size = clamp(Number(msg?.size), 0.02, 0.2);
      s.seq = p.stamps.length;
      p.stamps.push(s);
    });

    this.onMessage("fold", (client, msg: { folded?: boolean }) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      p.folded = !!msg?.folded;
    });

    // Hunter declares intent to tag a target; the SERVER decides if it lands.
    this.onMessage("tag", (client, msg: { targetId?: string }) => {
      this.tryTag(client.sessionId, msg?.targetId);
    });

    this.onMessage("start", () => {
      if (this.state.phase === "lobby" || this.state.phase === "result") {
        this.startRound();
      }
    });

    this.setSimulationInterval((dt) => this.update(dt / 1000), TICK_MS);
  }

  onJoin(client: Client, options: JoinOptions) {
    const p = new Player();
    p.id = client.sessionId;
    p.name = (options?.name || "Blob").slice(0, 16);
    // Role assignment: the first player in becomes the Hunter, the rest hide.
    const hasHunter = [...this.state.players.values()].some(
      (pl) => pl.role === "hunter",
    );
    p.role = hasHunter ? "chameleon" : "hunter";
    this.spawn(p);
    this.state.players.set(client.sessionId, p);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    // If the Hunter left mid-match, promote the earliest chameleon.
    const stillHasHunter = [...this.state.players.values()].some(
      (pl) => pl.role === "hunter",
    );
    if (!stillHasHunter) {
      const next = [...this.state.players.values()][0];
      if (next) next.role = "hunter";
    }
  }

  // ---- round lifecycle ----

  private startRound() {
    this.state.phase = "prep";
    this.state.timer = this.prepSeconds;
    for (const p of this.state.players.values()) {
      p.alive = true;
      p.folded = false;
      p.stamps.clear();
      p.scaleKey =
        p.role === "chameleon"
          ? SCALE_KEYS[Math.floor(Math.random() * SCALE_KEYS.length)]
          : "normal";
      this.spawn(p);
    }
  }

  private endRound() {
    this.state.phase = "result";
    this.state.timer = this.resultSeconds;
    // Surviving chameleons bank points for the round.
    for (const p of this.state.players.values()) {
      if (p.role === "chameleon" && p.alive) p.score += 200;
    }
  }

  private update(dt: number) {
    const s = this.state;
    if (s.phase === "prep") {
      this.moveAll(dt);
      s.timer -= dt;
      if (s.timer <= 0) {
        s.phase = "hunt";
        s.timer = this.huntSeconds;
      }
    } else if (s.phase === "hunt") {
      this.moveAll(dt);
      s.timer -= dt;
      if (s.timer <= 0 || this.aliveChameleons() === 0) {
        this.endRound();
      }
    } else if (s.phase === "result") {
      s.timer -= dt;
      if (s.timer <= 0) {
        s.phase = "lobby";
        s.timer = 0;
      }
    }
  }

  private moveAll(dt: number) {
    for (const p of this.state.players.values()) this.moveStep(p, dt);
  }

  private moveStep(p: Player, dt: number) {
    if (!p.alive) return;
    const isHunter = p.role === "hunter";
    // Hunters are frozen during the paint phase (mirrors single-player).
    if (this.state.phase === "prep" && isHunter) return;
    // A folded chameleon is movement-locked.
    if (p.folded) return;
    const inp = this.inputs.get(p.id);
    if (!inp) return;
    let { dx, dz } = inp;
    const len = Math.hypot(dx, dz);
    if (len > 1) {
      dx /= len;
      dz /= len;
    }
    if (len < 0.01) return;
    const tier = SCALE_TIERS[p.scaleKey] ?? SCALE_TIERS.normal;
    const base = isHunter ? HUNTER_SPEED : PLAYER_SPEED;
    const speed = base * tier.speedMult;
    const radius = (isHunter ? HUNTER_RADIUS : PLAYER_RADIUS) * tier.scale;
    const [cx, cz] = collide(p.x + dx * speed * dt, p.z + dz * speed * dt, radius);
    p.x = cx;
    p.z = cz;
    p.rot = Math.atan2(dx, dz);
  }

  private tryTag(hunterId: string, targetId?: string) {
    const hunter = this.state.players.get(hunterId);
    if (!hunter || hunter.role !== "hunter") return; // only hunters tag
    if (this.state.phase !== "hunt") return; // only during the hunt
    if (!targetId) return;
    const target = this.state.players.get(targetId);
    if (!target || !target.alive || target.role !== "chameleon") return;
    const d = Math.hypot(hunter.x - target.x, hunter.z - target.z);
    const tier = SCALE_TIERS[hunter.scaleKey] ?? SCALE_TIERS.normal;
    const range = TAG_RANGE * tier.scale;
    if (d > range) return; // out of reach — the tag is rejected
    target.alive = false;
    hunter.score += 100;
    if (this.aliveChameleons() === 0) this.endRound();
  }

  private aliveChameleons(): number {
    let n = 0;
    for (const p of this.state.players.values())
      if (p.role === "chameleon" && p.alive) n++;
    return n;
  }

  private spawn(p: Player) {
    if (p.role === "hunter") {
      p.x = 0;
      p.z = -9;
      p.rot = 0;
    } else {
      // spread chameleons along the +z spawn area
      const i = [...this.state.players.keys()].indexOf(p.id);
      p.x = ((i % 4) - 1.5) * 2.2;
      p.z = 6 + Math.floor(i / 4) * 1.6;
      p.rot = Math.PI;
    }
  }
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
function clamp01(n: number): number {
  return clamp(n, 0, 1);
}
function sanitizeColor(c: unknown): string {
  return typeof c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : "#ffffff";
}
