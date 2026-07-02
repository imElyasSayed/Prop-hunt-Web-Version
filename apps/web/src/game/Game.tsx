// Top-level game surface. Single-player by default (3D scene + DOM HUD); the
// menu can switch into networked multiplayer (lobby + networked scene).
"use client";
import { Scene } from "./Scene";
import { HUD } from "./HUD";
import { NetGame } from "./NetGame";
import { useGame } from "./store";

export function Game() {
  const multiplayer = useGame((s) => s.multiplayer);
  const setMultiplayer = useGame((s) => s.setMultiplayer);

  if (multiplayer) {
    return <NetGame onExit={() => setMultiplayer(false)} />;
  }

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
        fontFamily: "var(--font-nunito), system-ui, sans-serif",
        background: "#fbf7f0",
      }}
    >
      <Scene />
      <HUD />
    </main>
  );
}
