// Plays the equipped Reveal Emote's sprite-sheet animation (asset-pack Vol.3,
// 8 frames × 256px) as a centred 2D flourish over the blob when you break cover.
// Complements the 3D EmoteFX particle burst. Re-mounts on each fire via `key`.
"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "./store";
import { EMOTE_DURATION } from "./emote";

const SHEET: Record<string, string> = {
  peel: "/art/emote-peel.png",
  melt: "/art/emote-melt.png",
  confetti: "/art/emote-confetti.png",
};
const FRAMES = 8;
const SIZE = 240; // on-screen size (px)

export function EmoteOverlay() {
  const nonce = useGame((s) => s.emotePlayNonce);
  const id = useGame((s) => s.emotePlayId);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!nonce || !id) return;
    setShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), EMOTE_DURATION * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [nonce, id]);

  if (!show || !id) return null;

  return (
    <div style={styles.wrap} aria-hidden>
      <div
        key={nonce}
        style={{
          ...styles.sprite,
          backgroundImage: `url(${SHEET[id]})`,
          animation: `emotePlay ${EMOTE_DURATION}s steps(${FRAMES}) forwards`,
        }}
      />
      <style>{`@keyframes emotePlay{from{background-position:0 0}to{background-position:-${SIZE * FRAMES}px 0}}`}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    left: "50%",
    top: "52%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 5,
  },
  sprite: {
    width: SIZE,
    height: SIZE,
    backgroundSize: `${SIZE * FRAMES}px ${SIZE}px`,
    backgroundRepeat: "no-repeat",
    filter: "drop-shadow(0 6px 18px #0004)",
  },
};
