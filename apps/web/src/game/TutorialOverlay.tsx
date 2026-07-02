// First Blob — a guided first match. Diegetic prompts advance only when the
// player actually performs each action (teach-by-doing). The scout Hunter is
// non-lethal in tutorial mode (see Hunter.tsx / store mode), so a new player
// can't lose while learning the loop.
"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "./store";
import { shared } from "./shared";
import { resetShared } from "./shared";
import * as sfx from "./sound";
import { CAMO_SAFE_THRESHOLD, FLOOR_COLOR } from "./constants";

interface Step {
  title: string;
  prompt: string;
  check: () => boolean;
}

const SPAWN = { x: 0, z: 6 };

const STEPS: Step[] = [
  {
    title: "Waddle",
    prompt: "Use WASD / arrows to move. Waddle over toward a prop.",
    check: () =>
      Math.hypot(shared.playerPos.x - SPAWN.x, shared.playerPos.z - SPAWN.z) > 2.5,
  },
  {
    title: "Sample",
    prompt:
      "Stand against a prop so the 🎯 swatch lights up its color — then tap 🎯 to sample it.",
    check: () => {
      const g = useGame.getState();
      return g.surfaceColor !== FLOOR_COLOR && g.selectedColor === g.surfaceColor;
    },
  },
  {
    title: "Paint",
    prompt: "Click + drag on your blob to spray that color. Cover a good patch!",
    check: () => useGame.getState().stamps.length >= 18,
  },
  {
    title: "Blend",
    prompt: "Keep painting until your CAMO meter crosses the line into ✓ blended.",
    check: () => useGame.getState().camoScore >= CAMO_SAFE_THRESHOLD,
  },
  {
    title: "Hunt",
    prompt: "You're camouflaged! Press START HUNT to wake the scout.",
    check: () => useGame.getState().phase === "hunt",
  },
  {
    title: "Hold still",
    prompt: "The scout is sweeping. Hold still and stay blended — let it walk past.",
    check: () => useGame.getState().survivedFor >= 12,
  },
];

export function TutorialOverlay() {
  const [step, setStep] = useState(0);
  const startPrep = useGame((s) => s.startPrep);
  const startPractice = useGame((s) => s.startPractice);
  const setMode = useGame((s) => s.setMode);
  const reset = useGame((s) => s.reset);
  const done = step >= STEPS.length;
  const startedRef = useRef(false);

  useEffect(() => {
    if (done) return;
    const iv = setInterval(() => {
      if (STEPS[step].check()) {
        sfx.click();
        setStep((s) => s + 1);
      }
    }, 200);
    return () => clearInterval(iv);
  }, [step, done]);

  if (done) {
    return (
      <div style={styles.completeWrap}>
        <div style={styles.completeCard}>
          <div style={{ fontSize: 40 }}>🎉</div>
          <h2 style={styles.h2}>First Blob complete!</h2>
          <p style={styles.p}>
            You can move, sample, paint, blend, and sweat the Hunter. That&apos;s the
            whole loop. Go win a real Splotch.
          </p>
          <button
            style={styles.primary}
            onClick={() => {
              sfx.click();
              setMode("normal");
              resetShared();
              startPrep();
            }}
          >
            PLAY A REAL ROUND ▶
          </button>
          <button
            style={styles.secondary}
            onClick={() => {
              sfx.click();
              resetShared();
              startPractice();
            }}
          >
            PRACTICE RANGE 🎯
          </button>
          <button style={styles.back} onClick={reset}>
            ← menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.stepRow}>
          <span style={styles.badge}>
            {step + 1}/{STEPS.length}
          </span>
          <span style={styles.title}>FIRST BLOB · {STEPS[step].title}</span>
        </div>
        <div style={styles.prompt}>{STEPS[step].prompt}</div>
        <div style={styles.dots}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                background: i < step ? "#2fce6a" : i === step ? "#ff2e9a" : "#0002",
              }}
            />
          ))}
        </div>
      </div>
      <button
        style={styles.skip}
        onClick={() => {
          sfx.click();
          reset();
        }}
      >
        skip tutorial
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    top: 78,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
  },
  card: {
    background: "#191225ee",
    color: "#fff",
    borderRadius: 16,
    padding: "12px 20px",
    maxWidth: 440,
    textAlign: "center",
    boxShadow: "0 8px 30px #0004",
  },
  stepRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 },
  badge: { background: "#ff2e9a", color: "#fff", borderRadius: 999, padding: "1px 8px", fontSize: 12, fontWeight: 800 },
  title: { fontSize: 12, fontWeight: 800, letterSpacing: 1, opacity: 0.85, fontFamily: "var(--font-baloo), system-ui, sans-serif" },
  prompt: { fontSize: 16, fontWeight: 700, lineHeight: 1.35 },
  dots: { display: "flex", gap: 6, justifyContent: "center", marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 999, display: "inline-block" },
  skip: { pointerEvents: "auto", background: "#fff9", border: "none", borderRadius: 999, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#555" },
  completeWrap: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0005",
    backdropFilter: "blur(2px)",
  },
  completeCard: {
    background: "#fff",
    borderRadius: 24,
    padding: "26px 32px",
    width: 360,
    textAlign: "center",
    boxShadow: "0 20px 60px #0004",
    fontFamily: "var(--font-nunito), system-ui, sans-serif",
  },
  h2: { fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#191225", fontFamily: "var(--font-baloo), system-ui, sans-serif" },
  p: { fontSize: 14, color: "#444", lineHeight: 1.5, marginBottom: 14 },
  primary: {
    width: "100%",
    padding: "12px",
    fontSize: 16,
    fontWeight: 800,
    color: "#fff",
    background: "#ff2e9a",
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 5px 0 #c4176f",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
    marginBottom: 8,
  },
  secondary: {
    width: "100%",
    padding: "11px",
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    background: "#8a4cff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: "0 4px 0 #6a34cf",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  back: { marginTop: 12, padding: "6px 14px", fontSize: 13, background: "transparent", border: "none", color: "#888", cursor: "pointer" },
};
