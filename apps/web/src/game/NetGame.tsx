// Top-level networked-mode surface: the lobby until a round is live, then the
// networked scene + HUD. Reuses the single-player map, models, and audio.
"use client";
import { useNet } from "../net/netStore";
import { Lobby } from "./Lobby";
import { NetScene } from "./NetScene";
import { NetHUD } from "./NetHUD";

export function NetGame({ onExit }: { onExit: () => void }) {
  const active = useNet((s) => s.active);
  const phase = useNet((s) => s.phase);
  const inMatch = active && phase !== "lobby";

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
      {inMatch && (
        <>
          <NetScene />
          <NetHUD />
        </>
      )}
      {!inMatch && <Lobby onBack={onExit} />}
    </main>
  );
}
