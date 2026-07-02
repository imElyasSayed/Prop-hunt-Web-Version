// Practice Range — a persistent, no-stakes sandbox. Paint freely (any phase),
// toggle the scout on to test your blend, reset and try again. The scout is
// non-lethal here, and there's no round timer. This is where new size/fold
// toys plug in once their branches are merged.
"use client";
import { useGame } from "./store";
import { resetShared } from "./shared";
import * as sfx from "./sound";

export function PracticeOverlay() {
  const phase = useGame((s) => s.phase);
  const beginHunt = useGame((s) => s.beginHunt);
  const backToPrep = useGame((s) => s.backToPrep);
  const resetPaint = useGame((s) => s.resetPaint);
  const reset = useGame((s) => s.reset);

  const testing = phase === "hunt";

  return (
    <div style={styles.bar}>
      <span style={styles.label}>PRACTICE RANGE</span>
      {testing ? (
        <button
          style={styles.btn}
          onClick={() => {
            sfx.click();
            backToPrep();
          }}
        >
          🎨 Back to painting
        </button>
      ) : (
        <button
          style={styles.btn}
          onClick={() => {
            sfx.click();
            beginHunt();
          }}
        >
          🎯 Test the scout
        </button>
      )}
      <button
        style={styles.btn}
        onClick={() => {
          sfx.click();
          resetPaint();
        }}
      >
        ♻ Reset paint
      </button>
      <button
        style={{ ...styles.btn, background: "#eee", color: "#333" }}
        onClick={() => {
          sfx.click();
          resetShared();
          reset();
        }}
      >
        ← Exit
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: "absolute",
    top: 70,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fffe",
    borderRadius: 999,
    padding: "6px 10px",
    boxShadow: "0 4px 18px #0002",
  },
  label: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    color: "#8a4cff",
    padding: "0 6px",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  btn: {
    border: "none",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    background: "#8a4cff",
    color: "#fff",
    boxShadow: "0 3px 0 #6a34cf",
  },
};
