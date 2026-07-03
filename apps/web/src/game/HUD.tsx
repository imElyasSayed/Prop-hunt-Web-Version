// DOM overlay: menu, prep controls, hunt HUD, and the result card.
"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "./store";
import { shared } from "./shared";
import { resetShared } from "./shared";
import { seeker, resetSeeker } from "./seeker";
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

// Escalation Clock meter — polls the seeker runtime; shows the rising heat and
// the hard-reveal warning in the final seconds.
function EscalationMeter() {
  const [s, setS] = useState({ esc: 0, hard: false });
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const esc = Math.round(seeker.escalation * 100) / 100;
      const hard = seeker.hardReveal;
      setS((p) => (p.esc === esc && p.hard === hard ? p : { esc, hard }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (s.esc <= 0 && !s.hard) return null;
  const pct = Math.round(s.esc * 100);
  return (
    <div style={styles.escWrap}>
      <div style={styles.escLabel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/seeker-heat.svg" alt="" style={{ width: 16, height: 16, verticalAlign: "-3px", marginRight: 4 }} />
        SEEKER HEAT <b style={{ color: s.hard ? "#ff2e4f" : "#ff7a17" }}>{s.hard ? "REVEAL!" : `${pct}%`}</b>
      </div>
      <div style={styles.escTrack}>
        <div style={{ ...styles.escFill, width: `${s.hard ? 100 : pct}%`, background: s.hard ? "#ff2e4f" : "linear-gradient(90deg,#ffd023,#ff7a17)" }} />
      </div>
    </div>
  );
}

// Second Look + Visual Whistle overlay: an on-screen ripple + caption for every
// involuntary tell (accessibility — not just audio) and the inspect feedback.
// Inject the whistle keyframes once (inline styles can't declare @keyframes).
function ensureWhistleKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById("splotch-whistle-kf")) return;
  const el = document.createElement("style");
  el.id = "splotch-whistle-kf";
  el.textContent = `
    @keyframes splotchRipple { 0%{transform:scale(0.4);opacity:0.9} 100%{transform:scale(1.6);opacity:0} }
    @keyframes splotchFade { 0%{opacity:1} 70%{opacity:1} 100%{opacity:0} }
    @keyframes splotchReticle { 0%{transform:scale(1.4) rotate(-8deg);opacity:0} 30%{opacity:1} 100%{transform:scale(1) rotate(0);opacity:0.9} }
  `;
  document.head.appendChild(el);
}

function VisualWhistle() {
  const beingWatched = useGame((s) => s.beingWatched);
  const [caption, setCaption] = useState<{ text: string; tone: string; key: number } | null>(null);
  useEffect(ensureWhistleKeyframes, []);
  const keyRef = useRef(0);
  const prevWatch = useRef(false);
  const prevInspect = useRef(false);
  const prevResolveAt = useRef(-999);

  const fire = (text: string, tone: string) => {
    keyRef.current += 1;
    setCaption({ text, tone, key: keyRef.current });
  };

  // spotted tell (store-driven)
  useEffect(() => {
    if (beingWatched && !prevWatch.current) fire("👁 TELL — you were spotted", "#ff2e4f");
    prevWatch.current = beingWatched;
  }, [beingWatched]);

  // inspect + taunt tells (module-ref driven) via rAF
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (seeker.inspecting && !prevInspect.current) fire("🔍 SECOND LOOK — hold still & blend!", "#8a4cff");
      prevInspect.current = seeker.inspecting;
      if (seeker.lastInspectAt !== prevResolveAt.current) {
        prevResolveAt.current = seeker.lastInspectAt;
        if (seeker.lastInspect === "wrong") fire("😮‍💨 Wrong read — the Hunter backs off", "#1a9c4c");
        else if (seeker.lastInspect === "correct") fire("🎯 Read confirmed — caught!", "#ff2e4f");
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!caption) return null;
  return (
    <div key={caption.key} style={styles.whistleWrap} aria-live="polite">
      <span style={{ ...styles.whistleRipple, borderColor: caption.tone }} />
      <span style={{ ...styles.whistleCaption, background: caption.tone }}>{caption.text}</span>
    </div>
  );
}

// Second Look inspect reticle (Design Vol.4) — appears over the scene while the
// Hunter commits to a close inspect; hold still & blend to survive it.
function InspectReticle() {
  const [on, setOn] = useState(false);
  useEffect(ensureWhistleKeyframes, []);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setOn((p) => (p === seeker.inspecting ? p : seeker.inspecting));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!on) return null;
  return (
    <div style={styles.reticleWrap} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/seeker-reticle.svg" alt="" style={styles.reticleImg} />
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
  const startPrep = useGame((s) => s.startPrep);
  const beginHunt = useGame((s) => s.beginHunt);
  const prevWatched = useRef(false);

  const start = () => {
    sfx.initAudio(); // unlock audio on this user gesture
    sfx.click();
    resetShared();
    resetSeeker();
    startPrep();
  };

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
          <button style={styles.play} onClick={start}>PLAY ▶</button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
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
          <button style={styles.play} onClick={start}>PLAY AGAIN ▶</button>
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

      {!isPrep && <InspectReticle />}
      {!isPrep && <VisualWhistle />}

      <div style={styles.bottomLeft}>
        <CamoMeter />
        {isPrep && <PaintMeter />}
        {!isPrep && <EscalationMeter />}
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
  reticleWrap: { position: "absolute", top: "42%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" },
  reticleImg: { width: 180, height: 180, animation: "splotchReticle 1.1s ease-out" },
  escWrap: { background: "#fffe", borderRadius: 12, padding: "8px 12px", width: 260, boxShadow: "0 4px 16px #0002" },
  escLabel: { fontSize: 12, fontWeight: 700, marginBottom: 5, color: "#222" },
  escTrack: { height: 10, background: "#e6e6ea", borderRadius: 999, overflow: "hidden" },
  escFill: { height: "100%", borderRadius: 999, transition: "width 0.2s" },
  whistleWrap: {
    position: "absolute",
    top: "34%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    pointerEvents: "none",
    animation: "splotchFade 1.6s ease-out forwards",
  },
  whistleRipple: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    border: "5px solid #ff2e4f",
    animation: "splotchRipple 1.4s ease-out forwards",
  },
  whistleCaption: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    padding: "6px 14px",
    borderRadius: 999,
    boxShadow: "0 4px 16px #0004",
    whiteSpace: "nowrap",
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
  statRow: { display: "flex", gap: 24, justifyContent: "center", margin: "16px 0" },
  stat: { textAlign: "center" },
  statNum: { fontSize: 32, fontWeight: 800, color: "#191225", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-baloo), system-ui, sans-serif" },
  statLbl: { fontSize: 12, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 },
};
