// Top-level game surface: the 3D scene with the DOM HUD layered on top.
"use client";
import { Scene } from "./Scene";
import { HUD } from "./HUD";

export function Game() {
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
