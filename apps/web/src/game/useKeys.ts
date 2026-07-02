// Tracks which movement keys are currently held. Mounted once by the scene.
"use client";
import { useEffect, useRef } from "react";

export interface Keys {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  spinL: boolean;
  spinR: boolean;
}

const MAP: Record<string, keyof Keys> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyQ: "spinL",
  KeyE: "spinR",
};

export function useKeys() {
  const keys = useRef<Keys>({
    forward: false,
    back: false,
    left: false,
    right: false,
    spinL: false,
    spinR: false,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = MAP[e.code];
      if (k) {
        keys.current[k] = true;
        if (e.code.startsWith("Arrow")) e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = MAP[e.code];
      if (k) keys.current[k] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keys;
}
