// DOM overlay: menu, prep controls, hunt HUD, and the result card.
"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "./store";
import { shared } from "./shared";
import { resetShared } from "./shared";
import {
  clip,
  resetClip,
  recordEvent,
  finalizeClip,
  toggleStar,
  exportClipText,
} from "./clips";
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

function TauntButton() {
  const [cooling, setCooling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taunt = () => {
    if (cooling) return;
    sfx.whistle();
    recordEvent(useGame.getState().survivedFor, "📣 Taunt", "#ffd023");
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

// Ghost Director spectate panel: free-cam over the frozen scene + the round
// clip timeline. Star ("ping") beats, then one-tap export.
function SpectatePanel({ onExit }: { onExit: () => void }) {
  const [, force] = useState(0);
  const [copied, setCopied] = useState(false);
  const star = (i: number) => {
    toggleStar(i);
    sfx.click();
    force((n) => n + 1);
  };
  const doExport = () => {
    const text = exportClipText();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        },
        () => {},
      );
    }
    sfx.click();
  };
  return (
    <div style={styles.spectatePanel}>
      <div style={styles.spectateHead}>
        <b style={{ fontSize: 16, fontFamily: "var(--font-baloo), system-ui", display: "flex", alignItems: "center", gap: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/clapperboard.svg" alt="" style={{ width: 24, height: 24 }} />
          Ghost Director
        </b>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/freecam-hint.svg" alt="drag to look, scroll to zoom" title="drag to look · scroll to zoom" style={{ width: 30, height: 30, opacity: 0.8 }} />
      </div>
      <div style={styles.clipList}>
        {clip.events.map((e, i) => (
          <button key={i} onClick={() => star(i)} style={styles.clipRow} title="Ping this beat into your clip">
            <span style={{ ...styles.clipDot, background: e.tone }} />
            <span style={{ width: 34, fontVariantNumeric: "tabular-nums", opacity: 0.7 }}>{fmt(e.t)}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{e.label}</span>
            <span style={{ opacity: e.starred ? 1 : 0.25 }}>{e.starred ? "⭐" : "☆"}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button style={styles.exportBtn} onClick={doExport}>
          {copied ? "✓ COPIED" : "⬇ EXPORT CLIP"}
        </button>
        <button style={{ ...styles.startHunt, background: "#8a4cff", boxShadow: "0 4px 0 #6a34cc" }} onClick={onExit}>
          PLAY AGAIN ▶
        </button>
      </div>
      <div style={{ fontSize: 10.5, opacity: 0.5, marginTop: 6 }}>
        Video/GIF export is a media-pipeline deliverable — this copies the clip beats.
      </div>
    </div>
  );
}

export function HUD() {
  const phase = useGame((s) => s.phase);
  const timeLeft = useGame((s) => s.timeLeft);
  const survivedFor = useGame((s) => s.survivedFor);
  const outcome = useGame((s) => s.outcome);
  const beingWatched = useGame((s) => s.beingWatched);
  const spectating = useGame((s) => s.spectating);
  const setSpectating = useGame((s) => s.setSpectating);
  const startPrep = useGame((s) => s.startPrep);
  const beginHunt = useGame((s) => s.beginHunt);
  const prevWatched = useRef(false);

  const start = () => {
    sfx.initAudio(); // unlock audio on this user gesture
    sfx.click();
    resetShared();
    resetClip();
    startPrep();
  };

  const hunt = () => {
    sfx.click();
    resetClip();
    recordEvent(0, "🏁 Hunt begins", "#8a4cff");
    beginHunt();
  };

  // result stings + finalize the round clip
  useEffect(() => {
    if (phase !== "result") return;
    if (outcome === "splatted") {
      sfx.splat();
      recordEvent(useGame.getState().survivedFor, "💥 Splatted", "#ff2e4f");
      finalizeClip("splatted", useGame.getState().survivedFor);
    } else if (outcome === "survived") {
      sfx.win();
      recordEvent(useGame.getState().survivedFor, "🎉 Survived", "#2fce6a");
      finalizeClip("survived", useGame.getState().survivedFor);
    }
  }, [phase, outcome]);

  // alert blip + clip beat the moment the Hunter first spots you
  useEffect(() => {
    if (phase === "hunt" && beingWatched && !prevWatched.current) {
      sfx.spotted();
      recordEvent(useGame.getState().survivedFor, "👁 Spotted", "#ff7a17");
    }
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
          <button style={styles.play} onClick={start}>PLAY ▶</button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    // Ghost Director: while spectating, hide the card so the free-cam shows
    // through, and float the clip panel in the corner.
    if (spectating) return <SpectatePanel onExit={start} />;
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
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
            <button style={styles.spectate} onClick={() => { sfx.click(); setSpectating(true); }}>
              🎬 SPECTATE / CLIP
            </button>
            <button style={styles.play} onClick={start}>PLAY AGAIN ▶</button>
          </div>
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
          <TauntButton />
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
  spectate: {
    padding: "14px 22px",
    fontSize: 16,
    fontWeight: 800,
    color: "#191225",
    background: "#0fd4e6",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    boxShadow: "0 5px 0 #0aa6b5",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  spectatePanel: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 280,
    background: "#fffef8ee",
    borderRadius: 16,
    padding: "12px 14px",
    boxShadow: "0 12px 40px #0003",
    border: "2px solid #0fd4e688",
  },
  spectateHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  clipList: { display: "flex", flexDirection: "column", gap: 4, maxHeight: 260, overflowY: "auto" },
  clipRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#222",
    background: "#f4f1ea",
    border: "none",
    borderRadius: 8,
    padding: "6px 8px",
    cursor: "pointer",
  },
  clipDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  exportBtn: {
    flex: 1,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    background: "#1a9c4c",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: "0 4px 0 #147a3a",
  },
  statRow: { display: "flex", gap: 24, justifyContent: "center", margin: "16px 0" },
  stat: { textAlign: "center" },
  statNum: { fontSize: 32, fontWeight: 800, color: "#191225", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-baloo), system-ui, sans-serif" },
  statLbl: { fontSize: 12, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 },
};
