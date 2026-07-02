// A floating "nameplate" Nerve bar that hovers above the blob during the hunt.
// Shows the private Nerve multiplier climbing and the camo-stability draining —
// pure tension feedback (never tied to any payout). Reused for remote players
// in multiplayer, where each blob carries its own plate.
"use client";
import { Html } from "@react-three/drei";
import { useGame } from "./store";
import { NERVE_MAX } from "./constants";

export function NervePlate() {
  const nerve = useGame((s) => s.nerve);
  const stability = useGame((s) => s.stability);
  const phase = useGame((s) => s.phase);

  // Only surfaces once tension is actually building, to avoid HUD clutter.
  if (phase !== "hunt" || nerve <= 1.03) return null;

  const nf = Math.min(1, (nerve - 1) / (NERVE_MAX - 1)); // 0..1
  const stab = Math.max(0, Math.min(1, stability));
  const cracking = stab < 0.25;
  // warm-up magenta -> danger tangerine as nerve climbs
  const nerveColor = `hsl(${330 - nf * 300}, 90%, 55%)`;

  return (
    <Html
      position={[0, 1.85, 0]}
      center
      distanceFactor={9}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div style={wrap}>
        <div style={{ ...label, color: nerveColor }}>
          NERVE ×{nerve.toFixed(2)}
        </div>
        <div style={track}>
          <div
            style={{
              ...fill,
              width: `${nf * 100}%`,
              background: nerveColor,
            }}
          />
        </div>
        <div style={{ ...stabTrack, opacity: cracking ? 1 : 0.85 }}>
          <div
            style={{
              ...stabFill,
              width: `${stab * 100}%`,
              background: cracking ? "#ff2e4f" : "#0fd4e6",
              animation: cracking ? "nerveFlash 0.4s steps(2) infinite" : "none",
            }}
          />
        </div>
      </div>
      <style>{`@keyframes nerveFlash{0%{opacity:1}50%{opacity:0.3}100%{opacity:1}}`}</style>
    </Html>
  );
}

const wrap: React.CSSProperties = {
  width: 78,
  padding: "3px 5px 4px",
  borderRadius: 8,
  background: "rgba(25,18,37,0.82)",
  boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
  textAlign: "center",
  fontFamily: "var(--font-baloo), system-ui, sans-serif",
};
const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.3,
  marginBottom: 2,
  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
};
const track: React.CSSProperties = {
  height: 5,
  background: "rgba(255,255,255,0.16)",
  borderRadius: 999,
  overflow: "hidden",
  marginBottom: 2,
};
const fill: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  transition: "width 0.12s, background 0.2s",
};
const stabTrack: React.CSSProperties = {
  height: 3,
  background: "rgba(255,255,255,0.16)",
  borderRadius: 999,
  overflow: "hidden",
};
const stabFill: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  transition: "width 0.12s, background 0.2s",
};
