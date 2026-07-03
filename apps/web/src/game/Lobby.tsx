// Lobby overlay: create or join a match by short room code, see the player
// roster, and (as host) start the round. Shown while phase === "lobby".
"use client";
import { useState } from "react";
import { useNet } from "../net/netStore";
import * as sfx from "./sound";

export function Lobby({ onBack }: { onBack: () => void }) {
  const active = useNet((s) => s.active);
  const connecting = useNet((s) => s.connecting);
  const error = useNet((s) => s.error);
  const roomCode = useNet((s) => s.roomCode);
  const roster = useNet((s) => s.roster);
  const myId = useNet((s) => s.myId);
  const create = useNet((s) => s.create);
  const join = useNet((s) => s.join);
  const start = useNet((s) => s.start);
  const leave = useNet((s) => s.leave);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // Not connected yet — show create / join.
  if (!active) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.logo}>MULTIPLAYER</h1>
          <p style={styles.tag}>Blend in. Cash out — together.</p>
          <input
            style={styles.input}
            placeholder="Your blob name"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            style={styles.primary}
            disabled={connecting}
            onClick={() => {
              sfx.initAudio();
              sfx.click();
              create(name);
            }}
          >
            {connecting ? "…" : "CREATE MATCH ▶"}
          </button>
          <div style={styles.or}>— or join by code —</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...styles.input, textTransform: "uppercase", margin: 0 }}
              placeholder="CODE"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button
              style={styles.secondary}
              disabled={connecting || code.length < 3}
              onClick={() => {
                sfx.initAudio();
                sfx.click();
                join(name, code);
              }}
            >
              JOIN
            </button>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.back} onClick={onBack}>
            ← back
          </button>
        </div>
      </div>
    );
  }

  // Connected & waiting in the lobby.
  const me = roster.find((r) => r.id === myId);
  return (
    <div style={styles.center}>
      <div style={styles.card}>
        <div style={styles.codePlate}>
          <span style={styles.codeText}>{roomCode}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Share this code — friends join from the same screen.
        </div>
        <div style={styles.roster}>
          {roster.map((r) => (
            <div key={r.id} style={styles.rosterRow}>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.role === "hunter" ? "/art/role-hunter.svg" : "/art/role-chameleon.svg"}
                  alt=""
                  width={22}
                  height={22}
                  style={{ display: "block" }}
                />
                {r.name}
                {r.id === myId && " (you)"}
              </span>
              <span style={{ opacity: 0.6, fontSize: 12 }}>{r.role}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, opacity: 0.65, margin: "6px 0 12px" }}>
          {me?.role === "hunter"
            ? "You're the HUNTER — everyone else hides."
            : "You're a CHAMELEON — paint up and blend in."}
        </div>
        <button
          style={styles.primary}
          onClick={() => {
            sfx.click();
            start();
          }}
        >
          START ROUND ▶
        </button>
        <button style={styles.back} onClick={leave}>
          ← leave
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0006",
    backdropFilter: "blur(3px)",
    zIndex: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    padding: "28px 32px",
    width: 360,
    textAlign: "center",
    boxShadow: "0 20px 60px #0004",
    border: "3px solid #eee",
    fontFamily: "var(--font-nunito), system-ui, sans-serif",
  },
  logo: {
    fontSize: 38,
    fontWeight: 800,
    margin: 0,
    color: "#191225",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  },
  tag: { fontSize: 15, fontWeight: 800, color: "#8a4cff", margin: "2px 0 16px" },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 16,
    borderRadius: 12,
    border: "2px solid #e6e0f5",
    outline: "none",
    margin: "0 0 10px",
    boxSizing: "border-box",
    fontWeight: 700,
  },
  primary: {
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
    marginTop: 4,
  },
  secondary: {
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    background: "#8a4cff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: "0 4px 0 #6a34cf",
  },
  or: { fontSize: 12, opacity: 0.5, margin: "14px 0 8px", textTransform: "uppercase", letterSpacing: 1 },
  error: { color: "#d23", fontSize: 13, marginTop: 10, fontWeight: 700 },
  back: {
    marginTop: 14,
    padding: "6px 14px",
    fontSize: 13,
    background: "transparent",
    border: "none",
    color: "#888",
    cursor: "pointer",
  },
  codeLabel: { fontSize: 12, opacity: 0.6, letterSpacing: 2, fontWeight: 800 },
  codePlate: {
    width: 260,
    height: 97,
    margin: "0 auto 6px",
    backgroundImage: "url(/art/roomcode-plate.svg)",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  codeText: {
    fontSize: 46,
    fontWeight: 800,
    letterSpacing: 8,
    color: "#191225",
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
    paddingTop: 18,
  },
  roster: {
    background: "#faf8ff",
    border: "1px solid #ece5fb",
    borderRadius: 12,
    padding: "8px 12px",
    margin: "8px 0",
    maxHeight: 180,
    overflowY: "auto",
  },
  rosterRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 0",
    fontSize: 15,
    fontWeight: 700,
    borderBottom: "1px solid #0000000d",
  },
};
