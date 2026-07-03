// DOM overlay for networked matches: top bar (code/phase/timer), live
// scoreboard, a paint palette during prep, a TAG button for the Hunter, and a
// result panel. Tag targeting is client-side convenience only — the server
// re-validates every tag before it lands.
"use client";
import { useGame } from "./store";
import { useNet } from "../net/netStore";
import { netShared } from "../net/netShared";
import { PALETTE } from "./constants";
import * as sfx from "./sound";

function fmt(t: number) {
  const s = Math.max(0, Math.ceil(t));
  return `0:${s.toString().padStart(2, "0")}`;
}

function Palette() {
  const selected = useGame((s) => s.selectedColor);
  const setColor = useGame((s) => s.setColor);
  const brush = useGame((s) => s.brushSize);
  const setBrush = useGame((s) => s.setBrushSize);
  return (
    <div style={styles.palette}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#333" }}>
        Paint your blob to match a surface:
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              ...styles.swatch,
              background: c,
              outline: selected === c ? "3px solid #111" : "2px solid #0002",
              transform: selected === c ? "scale(1.15)" : "scale(1)",
            }}
            aria-label={`color ${c}`}
          />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 8 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Brush</span>
        <input
          type="range"
          min={0.03}
          max={0.14}
          step={0.005}
          value={brush}
          onChange={(e) => setBrush(parseFloat(e.target.value))}
          style={{ width: 120 }}
        />
      </div>
    </div>
  );
}

export function NetHUD() {
  const room = useNet((s) => s.room);
  const phase = useNet((s) => s.phase);
  const timer = useNet((s) => s.timer);
  const roomCode = useNet((s) => s.roomCode);
  const roster = useNet((s) => s.roster);
  const myId = useNet((s) => s.myId);
  const leave = useNet((s) => s.leave);
  const start = useNet((s) => s.start);

  const me = roster.find((r) => r.id === myId);
  const isHunter = me?.role === "hunter";

  const tagNearest = () => {
    if (!room) return;
    let best: string | null = null;
    let bestD = Infinity;
    room.state.players.forEach((p) => {
      if (p.role !== "chameleon" || !p.alive) return;
      const d = Math.hypot(p.x - netShared.localPos.x, p.z - netShared.localPos.z);
      if (d < bestD) {
        bestD = d;
        best = p.id;
      }
    });
    if (best) {
      room.send("tag", { targetId: best });
      sfx.whistle();
    }
  };

  return (
    <>
      {/* top bar */}
      <div style={styles.topBar}>
        <div style={styles.codeChip}>ROOM {roomCode}</div>
        <div style={styles.timer}>
          {phase.toUpperCase()} {phase === "prep" || phase === "hunt" ? fmt(timer) : ""}
        </div>
        <button style={styles.leave} onClick={leave}>
          leave
        </button>
      </div>

      {/* scoreboard */}
      <div style={styles.board}>
        {roster.map((r) => (
          <div
            key={r.id}
            style={{
              ...styles.boardRow,
              opacity: r.alive ? 1 : 0.4,
              fontWeight: r.id === myId ? 800 : 600,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.role === "hunter" ? "/art/role-hunter.svg" : "/art/role-chameleon.svg"}
                alt=""
                width={18}
                height={18}
                style={{ display: "block", opacity: r.alive ? 1 : 0.5 }}
              />
              {r.name}
              {!r.alive && " 💥"}
            </span>
            <span>{r.score}</span>
          </div>
        ))}
      </div>

      {/* prep palette (chameleons) */}
      {phase === "prep" && !isHunter && (
        <div style={styles.bottomCenter}>
          <Palette />
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
            Click + drag your blob to paint · WASD to move
          </div>
        </div>
      )}

      {/* hunt controls */}
      {phase === "hunt" && (
        <div style={styles.bottomCenter}>
          {isHunter ? (
            <button style={styles.tag} onClick={tagNearest}>
              TAG 🎯
            </button>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.7, background: "#fffd", borderRadius: 10, padding: "6px 12px" }}>
              Hold <b>F</b> near a prop to fold · stay still to blend
            </div>
          )}
        </div>
      )}

      {/* lobby-in-scene (host can start again after result) */}
      {(phase === "lobby" || phase === "result") && (
        <div style={styles.center}>
          <div style={styles.card}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/vs-splat.svg" alt="" width={72} height={48} style={{ display: "block", margin: "0 auto 4px" }} />
            <h1 style={styles.big}>
              {phase === "result" ? "ROUND OVER" : "WAITING…"}
            </h1>
            <div style={styles.board2}>
              {roster.map((r) => (
                <div key={r.id} style={styles.boardRow}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.role === "hunter" ? "/art/role-hunter.svg" : "/art/role-chameleon.svg"}
                      alt=""
                      width={18}
                      height={18}
                      style={{ display: "block" }}
                    />
                    {r.name}
                  </span>
                  <span>{r.score}</span>
                </div>
              ))}
            </div>
            <button
              style={styles.play}
              onClick={() => {
                sfx.click();
                start();
              }}
            >
              {phase === "result" ? "PLAY AGAIN ▶" : "START ROUND ▶"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 18px",
    gap: 12,
  },
  codeChip: {
    background: "#191225",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    padding: "8px 14px",
    borderRadius: 999,
    letterSpacing: 1,
  },
  timer: {
    fontSize: 26,
    fontWeight: 800,
    color: "#191225",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
    textShadow: "0 2px 8px #fff",
  },
  leave: {
    background: "#fff",
    border: "2px solid #eee",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 700,
  },
  board: {
    position: "absolute",
    top: 62,
    right: 18,
    background: "#fffe",
    borderRadius: 12,
    padding: "8px 12px",
    minWidth: 150,
    boxShadow: "0 4px 16px #0002",
  },
  boardRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    fontSize: 14,
    padding: "3px 0",
  },
  bottomCenter: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  palette: { background: "#fffe", borderRadius: 14, padding: "10px 14px", boxShadow: "0 4px 16px #0002" },
  swatch: { width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", transition: "transform 0.1s" },
  tag: {
    padding: "16px 40px",
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    background: "#ff2e4f",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    boxShadow: "0 5px 0 #c01430",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  center: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0005",
    backdropFilter: "blur(2px)",
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    padding: "26px 32px",
    width: 340,
    textAlign: "center",
    boxShadow: "0 20px 60px #0004",
    border: "3px solid #eee",
    fontFamily: "var(--font-nunito), system-ui, sans-serif",
  },
  big: { fontSize: 32, fontWeight: 800, margin: "0 0 12px", color: "#191225", fontFamily: "var(--font-baloo), system-ui, sans-serif" },
  board2: { background: "#faf8ff", border: "1px solid #ece5fb", borderRadius: 12, padding: "8px 12px", margin: "0 0 14px" },
  play: {
    width: "100%",
    padding: "13px",
    fontSize: 17,
    fontWeight: 800,
    color: "#fff",
    background: "#ff2e9a",
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 5px 0 #c4176f",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
};
