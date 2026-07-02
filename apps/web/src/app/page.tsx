"use client";
import dynamic from "next/dynamic";

// The game uses WebGL/Three.js, which cannot render on the server.
// ssr:false is valid here because this file is a Client Component.
const Game = dynamic(() => import("@/game/Game").then((m) => m.Game), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fbf7f0",
        fontFamily: "var(--font-baloo), system-ui, sans-serif",
        fontWeight: 800,
        fontSize: 44,
        letterSpacing: -2,
        color: "#191225",
      }}
    >
      SPL<span style={{ color: "#ff2e9a" }}>O</span>TCH…
    </div>
  ),
});

export default function Page() {
  return <Game />;
}
