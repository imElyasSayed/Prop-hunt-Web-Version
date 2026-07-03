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

// mutator icon art (asset-pack Vol.3)
const RIFT_ICON: Record<string, string> = {
  lowgrav: "/art/rift-lowgrav.svg",
  mirror: "/art/rift-mirror.svg",
  silent: "/art/rift-silent.svg",
  doublegaze: "/art/rift-doublegaze.svg",
  speedseekers: "/art/rift-speedseekers.svg",
};

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/rift-wheel.svg"
          alt=""
          style={{
            ...styles.wheelImg,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${RIFT_SPIN_MS}ms cubic-bezier(0.17,0.67,0.2,1)`
              : "none",
          }}
        />
      </div>
      <div style={styles.banner}>
        {spinning ? (
          <span style={{ opacity: 0.75, fontWeight: 800 }}>rolling the Rift…</span>
        ) : rift ? (
          <>
            <div style={styles.bannerHead}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={RIFT_ICON[rift.id]} alt="" width={22} height={22} style={{ display: "block" }} />
              <b style={{ color: rift.color === "#b4f531" || rift.color === "#ffd023" ? "#191225" : rift.color }}>
                {rift.label}
              </b>
            </div>
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
  pointer: { fontSize: 16, color: "#191225", lineHeight: "8px", zIndex: 2, filter: "drop-shadow(0 1px 1px #fff)" },
  // clip the box to the wheel's disc so the SVG's own top pointer is hidden
  wheelBox: { position: "relative", width: 84, height: 84, overflow: "hidden" },
  wheelImg: {
    position: "absolute",
    width: 84,
    left: 0,
    top: -7, // shift up so the disc (not the SVG pointer) centres in the box
    transformOrigin: "50% 53.4%", // the wheel circle's centre within the art
    filter: "drop-shadow(0 4px 10px #0003)",
  },
  banner: {
    marginTop: 5,
    width: 160,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  bannerHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 800,
    width: 160,
    height: 44,
    backgroundImage: "url(/art/rift-locked-banner.svg)",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  blurb: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#191225",
    background: "#fffd",
    borderRadius: 8,
    padding: "3px 8px",
    lineHeight: 1.25,
    boxShadow: "0 2px 8px #0002",
  },
};
