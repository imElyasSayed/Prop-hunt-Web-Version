// The Rift Modifier Wheel — a spinning HUD wheel that rolls and locks a public
// mutator during the hunt. Drives the roll timing itself in single-player; the
// wheel UI (placeholder CSS/emoji segments) is the centrepiece and the piece
// that wants real 2D art. Effects are read as flags by Player/Hunter/sound.
"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "./store";
import * as sfx from "./sound";
import { RIFTS, RIFT_SPIN_MS, RIFT_INTERVAL, rollRiftIndex } from "./rift";

const SEG = 360 / RIFTS.length;

// conic-gradient background from the mutator colors
const CONIC = `conic-gradient(${RIFTS.map(
  (r, i) => `${r.color} ${i * SEG}deg ${(i + 1) * SEG}deg`,
).join(",")})`;

export function RiftWheel() {
  const phase = useGame((s) => s.phase);
  const activeRift = useGame((s) => s.activeRift);
  const spinning = useGame((s) => s.riftSpinning);
  const setRift = useGame((s) => s.setRift);
  const setRiftSpinning = useGame((s) => s.setRiftSpinning);

  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // apply the Silent Round mutator to the audio module
  useEffect(() => {
    sfx.setSilent(activeRift === "silent");
    return () => sfx.setSilent(false);
  }, [activeRift]);

  useEffect(() => {
    if (phase !== "hunt") return;

    const spin = () => {
      const idx = rollRiftIndex();
      setRiftSpinning(true);
      sfx.riftSpin();
      // land segment idx under the pointer at top, after a few full turns
      const current = rotationRef.current;
      const currentMod = ((current % 360) + 360) % 360;
      const targetMod = (360 - idx * SEG - SEG / 2 + 360) % 360;
      let delta = targetMod - currentMod;
      if (delta < 0) delta += 360;
      const next = current + 360 * 5 + delta;
      rotationRef.current = next;
      setRotation(next);
      lockTimer.current = setTimeout(() => {
        setRift(RIFTS[idx].id);
        setRiftSpinning(false);
        sfx.riftLock();
      }, RIFT_SPIN_MS);
    };

    // roll at the start of the hunt, then on the interval
    spin();
    const iv = setInterval(spin, RIFT_INTERVAL * 1000);
    return () => {
      clearInterval(iv);
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [phase, setRift, setRiftSpinning]);

  if (phase !== "hunt") return null;
  const rift = activeRift ? RIFTS.find((r) => r.id === activeRift) : null;

  return (
    <div style={styles.wrap}>
      <div style={styles.pointer}>▼</div>
      <div style={styles.wheelBox}>
        <div
          style={{
            ...styles.wheel,
            background: CONIC,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${RIFT_SPIN_MS}ms cubic-bezier(0.17,0.67,0.2,1)` : "none",
          }}
        >
          {RIFTS.map((r, i) => (
            <span
              key={r.id}
              style={{
                ...styles.emoji,
                transform: `rotate(${i * SEG + SEG / 2}deg) translateY(-30px)`,
              }}
            >
              <span style={{ display: "inline-block", transform: `rotate(${-(i * SEG + SEG / 2)}deg)` }}>
                {r.emoji}
              </span>
            </span>
          ))}
        </div>
        <div style={styles.hub}>RIFT</div>
      </div>
      <div style={styles.banner}>
        {spinning ? (
          <span style={{ opacity: 0.7 }}>rolling the Rift…</span>
        ) : rift ? (
          <>
            <b style={{ color: rift.color === "#b4f531" || rift.color === "#ffd023" ? "#191225" : rift.color }}>
              {rift.emoji} {rift.label}
            </b>
            <span style={styles.blurb}>{rift.blurb}</span>
          </>
        ) : (
          <span style={{ opacity: 0.6 }}>Rift pending…</span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    top: 66,
    right: 18,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    pointerEvents: "none",
  },
  pointer: { fontSize: 16, color: "#191225", lineHeight: "10px", filter: "drop-shadow(0 1px 1px #fff)" },
  wheelBox: { position: "relative", width: 92, height: 92 },
  wheel: {
    width: 92,
    height: 92,
    borderRadius: "50%",
    position: "relative",
    boxShadow: "0 4px 16px #0003, inset 0 0 0 3px #191225",
  },
  emoji: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -9,
    marginTop: -9,
    width: 18,
    height: 18,
    fontSize: 15,
    textAlign: "center",
    transformOrigin: "center center",
  },
  hub: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#fff",
    border: "2px solid #191225",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 800,
    color: "#191225",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  banner: {
    marginTop: 4,
    background: "#fffe",
    borderRadius: 10,
    padding: "5px 10px",
    width: 150,
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    boxShadow: "0 3px 12px #0002",
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  blurb: { fontSize: 10, fontWeight: 600, opacity: 0.7, lineHeight: 1.2 },
};
