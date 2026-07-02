// Authoritative, replicated match state (@colyseus/schema). Every field here is
// synced to all clients automatically; late joiners receive the full snapshot,
// so the paint stamp list replays for free.
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

/** One paint stamp — mirrors the client's Stamp (deterministic stroke list). */
export class PaintStamp extends Schema {
  @type("number") u = 0;
  @type("number") v = 0;
  @type("string") color = "#ffffff";
  @type("number") size = 0.06;
  @type("number") seq = 0;
}

export class Player extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  /** "chameleon" (hider) or "hunter" (seeker). */
  @type("string") role = "chameleon";
  @type("number") x = 0;
  @type("number") z = 6;
  /** Facing angle (radians) for rendering remote blobs. */
  @type("number") rot = 0;
  /** Scale Roulette body-size key for this round. */
  @type("string") scaleKey = "normal";
  @type("boolean") alive = true;
  /** Silhouette Fold state (hidden as a prop) — replicated for remote render. */
  @type("boolean") folded = false;
  @type("number") score = 0;
  @type("boolean") ready = false;
  /** The player's paint, as an ordered, replayable stamp list. */
  @type([PaintStamp]) stamps = new ArraySchema<PaintStamp>();
}

export class MatchState extends Schema {
  /** "lobby" | "prep" | "hunt" | "result" */
  @type("string") phase = "lobby";
  /** Seconds remaining in the current timed phase. */
  @type("number") timer = 0;
  /** Short join code for this match. */
  @type("string") roomCode = "";
  @type({ map: Player }) players = new MapSchema<Player>();
}
