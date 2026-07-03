// DOM overlay: menu, prep controls, hunt HUD, and the result card.
"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "./store";
import { shared } from "./shared";
import { resetShared } from "./shared";
import {
  mimic,
  startMimicRound,
  exitMimicMode,
  logSabotage,
  buildEvidence,
  resolveVote,
  SUSPECTS,
} from "./mimic";
import * as sfx from "./sound";
import {
  PALETTE,
  PAINT_BUDGET,
  HUNT_SECONDS,
  CAMO_SAFE_THRESHOLD,
} from "./constants";

function fmt(t: number) {
  const s = Math.max(0, Math.ceil(t));
  return `0:${s.toString().padStart(2, "0")}`;
}

// The magenta paint-splat "O" with Splotchy's eyes (the logo mark).
function SplotchO({ size = "1em" }: { size?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: size, height: size, display: "inline-block", verticalAlign: "-0.16em", margin: "0 -0.04em" }}
      aria-label="o"
    >
      <g fill="#ff2e9a">
        <circle cx="50" cy="50" r="30" />
        <circle cx="26" cy="36" r="15" />
        <circle cx="74" cy="34" r="14" />
        <circle cx="78" cy="66" r="14" />
        <circle cx="52" cy="80" r="15" />
        <circle cx="24" cy="66" r="13" />
        <circle cx="88" cy="48" r="6" />
      </g>
      {/* eyes */}
      <g>
        <circle cx="41" cy="50" r="10" fill="#fff" />
        <circle cx="61" cy="48" r="10" fill="#fff" />
        <circle cx="43" cy="52" r="4.5" fill="#191225" />
        <circle cx="63" cy="50" r="4.5" fill="#191225" />
      </g>
    </svg>
  );
}

function PalettePicker() {
  const selected = useGame((s) => s.selectedColor);
  const setColor = useGame((s) => s.setColor);
  const brush = useGame((s) => s.brushSize);
  const setBrush = useGame((s) => s.setBrushSize);
  const surfaceColor = useGame((s) => s.surfaceColor);
  return (
    <div style={styles.palette}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#333" }}>
        Match the surface you&apos;re hiding against:
      </div>
      <div style={styles.swatchRow}>
        {/* Eyedropper: sample the exact color of the prop you're standing by */}
        <button
          onClick={() => setColor(surfaceColor)}
          title="Sample the surface you're next to"
          style={{
            ...styles.swatch,
            width: 40,
            background: surfaceColor,
            outline: selected === surfaceColor ? "3px solid #111" : "2px dashed #191225aa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
          aria-label="sample surface color"
        >
          🎯
        </button>
        <div style={{ width: 1, background: "#0002", margin: "0 2px" }} />
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              ...styles.swatch,
              background: c,
              outline: selected === c ? "3px solid #111" : "2px solid #0002",
              transform: selected === c ? "scale(1.15)" : "scale(1)",
            }}
            aria-label={`color ${c}`}
          />
        ))}
      </div>
      <div style={styles.brushRow}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Brush</span>
        <input
          type="range"
          min={0.03}
          max={0.14}
          step={0.005}
          value={brush}
          onChange={(e) => setBrush(parseFloat(e.target.value))}
          style={{ width: 120 }}
        />
      </div>
    </div>
  );
}

function CamoMeter() {
  const camo = useGame((s) => s.camoScore);
  const pct = Math.round(camo * 100);
  const good = camo >= CAMO_SAFE_THRESHOLD;
  return (
    <div style={styles.camoWrap}>
      <div style={styles.camoLabel}>
        CAMO <b style={{ color: good ? "#1a9c4c" : "#d23" }}>{pct}%</b>
        {good ? " ✓ blended" : " — you read as OFF"}
      </div>
      <div style={styles.camoTrack}>
        <div
          style={{
            ...styles.camoFill,
            width: `${pct}%`,
            background: good ? "#2fce6a" : "#ff5b5b",
          }}
        />
        <div style={{ ...styles.camoThreshold, left: `${CAMO_SAFE_THRESHOLD * 100}%` }} />
      </div>
    </div>
  );
}

function PaintMeter() {
  const paint = useGame((s) => s.paintLeft);
  const pct = Math.round((paint / PAINT_BUDGET) * 100);
  return (
    <div style={styles.paintWrap}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 3 }}>
        PAINT LEFT (no undo!)
      </div>
      <div style={styles.paintTrack}>
        <div style={{ ...styles.paintFill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Secret role reveal (only the local player sees their own role).
function MimicRoleChip() {
  const you = mimic.youAreMimic;
  return (
    <div style={{ ...styles.roleChip, background: you ? "#191225" : "#0fd4e6", color: you ? "#ff2e9a" : "#191225" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {you && <img src="/art/mimic-mask.svg" alt="" style={{ width: 18, height: 18, verticalAlign: "-4px", marginRight: 5 }} />}
      {you ? "YOU ARE THE MIMIC — get a teammate tagged" : "🫧 HONEST HIDER — just survive"}
    </div>
  );
}

// Mimic sabotage: plant a gaze-bait beacon on a suspected ally (measurable).
function SabotageControl() {
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(0);
  const bait = (idx: number) => {
    logSabotage(idx, "gaze-bait", useGame.getState().survivedFor);
    sfx.whistle();
    setUsed((n) => n + 1);
    setOpen(false);
  };
  return (
    <div style={{ position: "relative" }}>
      <button style={styles.sabotage} onClick={() => setOpen((o) => !o)}>
        🎯 GAZE-BAIT {used > 0 ? `(${used})` : ""}
      </button>
      {open && (
        <div style={styles.sabotageMenu}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>Aim at a teammate:</div>
          {SUSPECTS.filter((s) => s.idx !== 0).map((s) => (
            <button key={s.idx} style={styles.sabotageItem} onClick={() => bait(s.idx)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.art} alt="" style={{ width: 20, height: 20 }} /> {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Post-round Confessional Vote card: anonymized evidence feed + roster vote.
function ConfessionalVote({ survived, onAgain }: { survived: boolean; onAgain: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const evidence = buildEvidence();
  const res = picked !== null ? resolveVote(picked, survived) : null;
  return (
    <div style={styles.center}>
      <div style={{ ...styles.card, maxWidth: 520, borderColor: "#8a4cff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/conf-header.svg" alt="Confessional" style={{ width: "100%", maxWidth: 380, height: "auto", margin: "0 auto 4px", display: "block" }} />
        <p style={styles.tag}>Who was the Mimic?</p>

        <div style={styles.evidence}>
          {evidence.map((line, i) => (
            <div key={i} style={styles.evidenceLine}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  line.kind === "sabotage"
                    ? "/art/evidence-sabotage.svg"
                    : line.kind === "empty"
                      ? "/art/evidence-empty.svg"
                      : "/art/evidence-redacted.svg"
                }
                alt=""
                style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }}
              />
              {line.t && <b style={{ fontVariantNumeric: "tabular-nums", opacity: 0.7 }}>{line.t}</b>}
              <span>{line.text}</span>
            </div>
          ))}
        </div>

        {res === null ? (
          <>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#555", margin: "10px 0 6px" }}>
              Cast your vote:
            </div>
            <div style={styles.voteRow}>
              {SUSPECTS.map((s) => (
                <button key={s.idx} style={styles.voteBtn} onClick={() => { sfx.click(); setPicked(s.idx); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.art} alt="" style={{ width: 26, height: 26 }} />
                  {s.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={styles.verdict}>
            <div style={{ fontSize: 18, fontWeight: 800, color: res.detective ? "#1a9c4c" : "#d23", fontFamily: "var(--font-baloo), system-ui" }}>
              {res.detective ? "🕵️ Correct! Detective bonus" : "🫥 Wrong — the Mimic slips away"}
            </div>
            <div style={{ fontSize: 13, margin: "6px 0", color: "#333", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              The Mimic was
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SUSPECTS[res.mimicIdx].art} alt="" style={{ width: 26, height: 26 }} />
              <b>{SUSPECTS[res.mimicIdx].name}</b>
              {res.youWereMimic ? " — that was YOU." : "."}
            </div>
            <div style={styles.verdictStats}>
              {res.detectiveBonus > 0 && <span style={styles.bonusPill}>Detective +{res.detectiveBonus}</span>}
              {res.getawayBonus > 0 && <span style={{ ...styles.bonusPill, background: "#191225", color: "#ff2e9a" }}>Getaway +{res.getawayBonus}</span>}
              {res.youWereMimic && (
                <span style={{ ...styles.bonusPill, background: res.mimicScore > 0 ? "#8a4cff" : "#999" }}>
                  Sabotage score {res.mimicScore}{res.mimicScore === 0 ? " (no measurable sabotage = 0)" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        <button style={{ ...styles.play, marginTop: 14 }} onClick={onAgain}>PLAY AGAIN ▶</button>
      </div>
    </div>
  );
}

function TauntButton() {
  const [cooling, setCooling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taunt = () => {
    if (cooling) return;
    sfx.whistle();
    shared.taunting = true;
    setCooling(true);
    setTimeout(() => (shared.taunting = false), 2200);
    timer.current = setTimeout(() => setCooling(false), 5000);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <button onClick={taunt} disabled={cooling} style={{ ...styles.taunt, opacity: cooling ? 0.5 : 1 }}>
      {cooling ? "…" : "TAUNT 📣"}
    </button>
  );
}

export function HUD() {
  const phase = useGame((s) => s.phase);
  const timeLeft = useGame((s) => s.timeLeft);
  const survivedFor = useGame((s) => s.survivedFor);
  const outcome = useGame((s) => s.outcome);
  const beingWatched = useGame((s) => s.beingWatched);
  const mimicMode = useGame((s) => s.mimicMode);
  const setMimicMode = useGame((s) => s.setMimicMode);
  const startPrep = useGame((s) => s.startPrep);
  const beginHunt = useGame((s) => s.beginHunt);
  const prevWatched = useRef(false);

  const startRound = () => {
    sfx.initAudio(); // unlock audio on this user gesture
    sfx.click();
    resetShared();
    startPrep();
  };
  // Normal 1v1.
  const start = () => {
    setMimicMode(false);
    exitMimicMode();
    startRound();
  };
  // Mimic + Confessional Vote round (gated out of newbie/party queues).
  const startMimic = () => {
    setMimicMode(true);
    startMimicRound();
    startRound();
  };
  const again = () => (mimicMode ? startMimic() : start());

  const hunt = () => {
    sfx.click();
    beginHunt();
  };

  // result stings
  useEffect(() => {
    if (phase !== "result") return;
    if (outcome === "splatted") sfx.splat();
    else if (outcome === "survived") sfx.win();
  }, [phase, outcome]);

  // alert blip the moment the Hunter first spots you
  useEffect(() => {
    if (phase === "hunt" && beingWatched && !prevWatched.current) sfx.spotted();
    prevWatched.current = beingWatched;
  }, [beingWatched, phase]);

  if (phase === "menu") {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.logo}>
            SPL<SplotchO />TCH
          </h1>
          <p style={styles.tag}>Blend in. Cash out.</p>
          <p style={styles.body}>
            You&apos;re a <b>Chameleon</b>. Paint your blob to match a surface,
            hide in plain sight, and survive the <b>Hunter</b> for {HUNT_SECONDS}s.
          </p>
          <ul style={styles.help}>
            <li><b>WASD / arrows</b> — move</li>
            <li><b>🎯 sample</b> a prop&apos;s exact color, then paint to match it</li>
            <li><b>Q / E</b> — spin your blob while painting</li>
            <li><b>Click + drag on your blob</b> — spray paint (no undo!)</li>
          </ul>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={styles.play} onClick={start}>PLAY ▶</button>
            <button style={{ ...styles.mimicBtn, display: "inline-flex", alignItems: "center", gap: 8 }} onClick={startMimic}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/mimic-mask.svg" alt="" style={{ width: 22, height: 22 }} /> THE MIMIC
            </button>
          </div>
          <p style={styles.partyHint}>
            The Mimic — one hider is secretly scored only by getting a teammate tagged.
            Sabotage, survive the round, then vote in the Confessional. (Beta scaffold.)
          </p>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    // Mimic round → resolve with the Confessional Vote card instead.
    if (mimicMode) return <ConfessionalVote survived={outcome === "survived"} onAgain={again} />;
    const survived = outcome === "survived";
    return (
      <div style={styles.center}>
        <div style={{ ...styles.card, borderColor: survived ? "#2fce6a" : "#ff5b5b" }}>
          <h1 style={{ ...styles.logo, fontSize: 40 }}>
            {survived ? "SURVIVED 🎉" : "SPLATTED"}
          </h1>
          <p style={styles.tag}>
            {survived
              ? "You blended perfectly. You win the Splotch Pot."
              : `The Hunter found you at ${fmt(survivedFor)}.`}
          </p>
          <div style={styles.statRow}>
            <div style={styles.stat}>
              <div style={styles.statNum}>{fmt(survivedFor)}</div>
              <div style={styles.statLbl}>survived</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>{Math.round(useGame.getState().camoScore * 100)}%</div>
              <div style={styles.statLbl}>final camo</div>
            </div>
          </div>
          <button style={styles.play} onClick={again}>PLAY AGAIN ▶</button>
        </div>
      </div>
    );
  }

  // prep or hunt
  const isPrep = phase === "prep";
  const time = isPrep ? timeLeft : HUNT_SECONDS - survivedFor;
  return (
    <>
      <div style={styles.topBar}>
        <div style={{ ...styles.roleBanner, background: isPrep ? "#8a4cff" : "#ff2e4f" }}>
          {isPrep ? "PAINT PHASE — hide yourself!" : "HUNT PHASE — don't move much!"}
        </div>
        <div style={styles.timer}>{fmt(time)}</div>
        <div style={{ width: 220, textAlign: "right" }}>
          {!isPrep && beingWatched && (
            <span style={styles.watch}>👁 SPOTTED — HOLD STILL</span>
          )}
        </div>
      </div>

      {mimicMode && <MimicRoleChip />}

      <div style={styles.bottomLeft}>
        <CamoMeter />
        {isPrep && <PaintMeter />}
      </div>

      {isPrep && (
        <div style={styles.bottomCenter}>
          <PalettePicker />
          <button style={styles.startHunt} onClick={hunt}>
            I&apos;m hidden — START HUNT ▶
          </button>
        </div>
      )}

      {!isPrep && (
        <div style={styles.bottomCenter}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <TauntButton />
            {mimicMode && mimic.youAreMimic && <SabotageControl />}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            Taunt to bait the Hunter — risky!
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0004",
    backdropFilter: "blur(2px)",
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    padding: "32px 36px",
    maxWidth: 460,
    textAlign: "center",
    boxShadow: "0 20px 60px #0003",
    border: "3px solid #eee",
  },
  logo: { fontSize: 58, fontWeight: 800, margin: 0, letterSpacing: -1, color: "#191225", fontFamily: "var(--font-baloo), system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" },
  tag: { fontSize: 18, fontWeight: 800, color: "#8a4cff", margin: "4px 0 14px", fontFamily: "var(--font-baloo), system-ui, sans-serif" },
  body: { fontSize: 15, color: "#333", lineHeight: 1.5 },
  help: { textAlign: "left", fontSize: 13, color: "#444", lineHeight: 1.9, margin: "12px auto", maxWidth: 320 },
  play: {
    marginTop: 16,
    padding: "14px 36px",
    fontSize: 20,
    fontWeight: 800,
    color: "#fff",
    background: "#ff2e9a",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    boxShadow: "0 6px 0 #c4176f",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
    letterSpacing: 0.5,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    gap: 12,
    pointerEvents: "none",
  },
  roleBanner: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    padding: "8px 16px",
    borderRadius: 999,
    width: 220,
  },
  timer: {
    fontSize: 44,
    fontWeight: 800,
    color: "#191225",
    fontVariantNumeric: "tabular-nums",
    textShadow: "0 2px 8px #fff",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  watch: { color: "#fff", background: "#ff2e4f", padding: "6px 12px", borderRadius: 999, fontWeight: 800, fontSize: 13 },
  bottomLeft: { position: "absolute", left: 20, bottom: 20, display: "flex", flexDirection: "column", gap: 12 },
  bottomCenter: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  camoWrap: { background: "#fffe", borderRadius: 12, padding: "8px 12px", width: 260, boxShadow: "0 4px 16px #0002" },
  camoLabel: { fontSize: 12, fontWeight: 700, marginBottom: 5, color: "#222" },
  camoTrack: { position: "relative", height: 12, background: "#e6e6ea", borderRadius: 999, overflow: "hidden" },
  camoFill: { height: "100%", borderRadius: 999, transition: "width 0.15s, background 0.2s" },
  camoThreshold: { position: "absolute", top: -2, width: 2, height: 16, background: "#111", opacity: 0.5 },
  paintWrap: { background: "#fffe", borderRadius: 12, padding: "8px 12px", width: 260, boxShadow: "0 4px 16px #0002" },
  paintTrack: { height: 10, background: "#e6e6ea", borderRadius: 999, overflow: "hidden" },
  paintFill: { height: "100%", background: "linear-gradient(90deg,#0fd4e6,#8a4cff)", borderRadius: 999, transition: "width 0.1s" },
  palette: { background: "#fffe", borderRadius: 14, padding: "10px 14px", boxShadow: "0 4px 16px #0002" },
  swatchRow: { display: "flex", gap: 8, justifyContent: "center" },
  swatch: { width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", transition: "transform 0.1s" },
  brushRow: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 8 },
  startHunt: {
    padding: "10px 22px",
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    background: "#1a9c4c",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: "0 4px 0 #147a3a",
  },
  taunt: {
    padding: "16px 30px",
    fontSize: 20,
    fontWeight: 800,
    color: "#191225",
    background: "#ffd023",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    boxShadow: "0 5px 0 #d4a800",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  mimicBtn: {
    marginTop: 16,
    padding: "14px 26px",
    fontSize: 17,
    fontWeight: 800,
    color: "#ff2e9a",
    background: "#191225",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    boxShadow: "0 6px 0 #000",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  partyHint: { fontSize: 12, color: "#666", marginTop: 10, lineHeight: 1.4 },
  presetSwatch: { width: 14, height: 14, borderRadius: "50%", display: "inline-block", boxShadow: "inset 0 0 0 1px #0002" },
  roleChip: {
    position: "absolute",
    top: 72,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "7px 18px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 13.5,
    boxShadow: "0 4px 16px #0003",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  },
  sabotage: {
    padding: "16px 22px",
    fontSize: 16,
    fontWeight: 800,
    color: "#fff",
    background: "#191225",
    border: "2px solid #ff2e9a",
    borderRadius: 16,
    cursor: "pointer",
    boxShadow: "0 5px 0 #000",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  sabotageMenu: {
    position: "absolute",
    bottom: "110%",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#fff",
    borderRadius: 12,
    padding: 8,
    boxShadow: "0 8px 30px #0004",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 130,
  },
  sabotageItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#191225", background: "#f4f1ea", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer" },
  evidence: { textAlign: "left", background: "#faf7f2", borderRadius: 12, padding: "10px 12px", maxHeight: 180, overflowY: "auto", margin: "8px 0" },
  evidenceLine: { fontSize: 12.5, color: "#333", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6, padding: "3px 0" },
  voteRow: { display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" },
  voteBtn: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "#191225", background: "#eee9fb", border: "2px solid #0002", borderRadius: 10, padding: "8px 12px", cursor: "pointer" },
  verdict: { margin: "10px 0" },
  verdictStats: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 8 },
  bonusPill: { fontSize: 12, fontWeight: 800, color: "#fff", background: "#1a9c4c", padding: "5px 10px", borderRadius: 999 },
  statRow: { display: "flex", gap: 24, justifyContent: "center", margin: "16px 0" },
  stat: { textAlign: "center" },
  statNum: { fontSize: 32, fontWeight: 800, color: "#191225", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-baloo), system-ui, sans-serif" },
  statLbl: { fontSize: 12, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 },
};
