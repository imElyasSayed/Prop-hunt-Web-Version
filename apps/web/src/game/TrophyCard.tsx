// Trophy Card — on the result screen, composites a shareable card from the
// round's real data (painted blob, map, time, camo %) plus the Answer-Check
// "tell" readout. Rendered straight to a <canvas> so it can be downloaded or
// copied to the clipboard as a PNG. No external libraries, no server.
"use client";
import { useEffect, useRef, useState } from "react";
import type { Stamp, Tell } from "./types";
import { BRUSHES, DEFAULT_BRUSH, drawBrush } from "./brushes";
import { MAP_NAME } from "./constants";

const W = 620;
const H = 860;
const DPR = 2;

export interface TrophyData {
  outcome: "survived" | "splatted";
  survivedFor: number;
  camoPct: number;
  stamps: Stamp[];
  surfaceColor: string;
  tell: Tell | null;
}

function fmt(t: number) {
  const s = Math.max(0, Math.round(t));
  return `0:${s.toString().padStart(2, "0")}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lineH;
}

/** Paint-splat "O" glyph, drawn as a cluster (mirrors the logo mark). */
function splatDots(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.fillStyle = color;
  const dots: [number, number, number][] = [
    [0, 0, 1], [-0.5, -0.32, 0.5], [0.52, -0.34, 0.46],
    [0.56, 0.36, 0.46], [0.06, 0.6, 0.5], [-0.56, 0.36, 0.43],
  ];
  for (const [dx, dy, r] of dots) {
    ctx.beginPath();
    ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

type Art = Partial<Record<
  "paper" | "wordmark" | "ring" | "footer" | "survived" | "splatted",
  HTMLImageElement
>>;

export function drawTrophyCard(
  canvas: HTMLCanvasElement,
  d: TrophyData,
  art: Art = {},
) {
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);
  const survived = d.outcome === "survived";
  const accent = survived ? "#2fce6a" : "#ff2e4f";

  // --- background ---
  ctx.fillStyle = "#fbf7f0";
  ctx.fillRect(0, 0, W, H);
  // seamless paper-grain tile from the asset pack, else plain paper
  if (art.paper) {
    const pat = ctx.createPattern(art.paper, "repeat");
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);
    }
  }
  // brand corner splats (very subtle)
  splatDots(ctx, 40, 40, 26, "#ff2e9a12");
  splatDots(ctx, W - 44, H - 60, 34, "#0fd4e610");

  // --- header (SPL[splat-O]TCH) ---
  ctx.textAlign = "left";
  ctx.fillStyle = "#191225";
  ctx.font = "800 40px system-ui, sans-serif";
  ctx.fillText("SPL", 34, 66);
  const splW = ctx.measureText("SPL").width;
  const oX = 34 + splW + 3;
  if (art.wordmark) {
    ctx.drawImage(art.wordmark, oX, 26, 38, 38); // the real Splat-O lockup
  } else {
    splatDots(ctx, oX + 15, 54, 15, "#ff2e9a");
  }
  ctx.fillStyle = "#191225";
  ctx.fillText("TCH", oX + 40, 66);
  ctx.textAlign = "right";
  ctx.fillStyle = "#8a4cff";
  ctx.font = "800 16px system-ui, sans-serif";
  ctx.fillText("TROPHY · " + MAP_NAME, W - 34, 60);

  // --- result banner (sticker badge from the asset pack) ---
  ctx.textAlign = "center";
  const badge = survived ? art.survived : art.splatted;
  if (badge) {
    const bw = 300;
    const bh = (badge.naturalHeight / badge.naturalWidth) * bw || 150;
    ctx.drawImage(badge, (W - bw) / 2, 88, bw, bh);
  } else {
    roundRect(ctx, 34, 92, W - 68, 74, 18);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "800 46px system-ui, sans-serif";
    ctx.fillText(survived ? "SURVIVED" : "SPLATTED", W / 2, 143);
  }

  // --- painted blob thumbnail ---
  const cx = W / 2;
  const cy = 340;
  const R = 130;
  ctx.save();
  // soft shadow
  ctx.beginPath();
  ctx.arc(cx, cy + 8, R, 0, Math.PI * 2);
  ctx.fillStyle = "#0000001a";
  ctx.fill();
  // clip to blob disc, base coat, then replay the stamps
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#fbf7f0";
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  const brush = BRUSHES[DEFAULT_BRUSH];
  const span = R * 2;
  for (const s of d.stamps) {
    const x = cx - R + s.u * span;
    const y = cy - R + s.v * span;
    const rad = Math.max(3, s.size * span);
    drawBrush(ctx, brush, x, y, rad, s.color);
  }
  ctx.restore();
  // splattery display ring from the asset pack, else a plain outline
  if (art.ring) {
    const rs = R * 2 + 40;
    ctx.drawImage(art.ring, cx - rs / 2, cy - rs / 2, rs, rs);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#19122522";
    ctx.stroke();
  }

  // "hid against" surface chip
  ctx.textAlign = "center";
  ctx.fillStyle = "#191225aa";
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.fillText("hid against", cx + R + 6, cy - 14);
  roundRect(ctx, cx + R - 20, cy, 54, 40, 10);
  ctx.fillStyle = d.surfaceColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#19122533";
  ctx.stroke();

  // --- stat row ---
  const stats: [string, string][] = [
    [fmt(d.survivedFor), "SURVIVED"],
    [d.camoPct + "%", "FINAL CAMO"],
    [MAP_NAME, "CANVAS"],
  ];
  const rowY = 500;
  const colW = (W - 68) / 3;
  stats.forEach((st, i) => {
    const x = 34 + colW * i + colW / 2;
    ctx.fillStyle = "#191225";
    ctx.font = "800 30px system-ui, sans-serif";
    ctx.fillText(st[0], x, rowY);
    ctx.fillStyle = "#19122599";
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.fillText(st[1], x, rowY + 24);
  });

  // --- Answer-Check "tell" box ---
  const boxY = 556;
  const boxH = 210;
  roundRect(ctx, 34, boxY, W - 68, boxH, 18);
  ctx.fillStyle = survived ? "#effbf3" : "#fff0f2";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = survived ? "#b6ecc8" : "#ffd0d6";
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "800 16px system-ui, sans-serif";
  ctx.fillText(survived ? "✓ THE BLEND" : "🔍 THE TELL", 58, boxY + 34);
  ctx.fillStyle = "#191225";
  ctx.font = "800 22px system-ui, sans-serif";
  let ty = wrapText(ctx, d.tell?.headline ?? "", 58, boxY + 66, W - 68 - 48, 28);
  ctx.fillStyle = "#33333a";
  ctx.font = "500 17px system-ui, sans-serif";
  wrapText(ctx, d.tell?.detail ?? "", 58, ty + 6, W - 68 - 48, 24);

  // --- footer flourish ---
  if (art.footer) {
    const fw = 300;
    const fh = (art.footer.naturalHeight / art.footer.naturalWidth) * fw || 24;
    ctx.drawImage(art.footer, (W - fw) / 2, H - 34 - fh / 2, fw, fh);
  } else {
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a4cff";
    ctx.font = "800 20px system-ui, sans-serif";
    ctx.fillText("Blend in. Cash out.", W / 2, H - 34);
  }
}

const ART_SRC: Record<string, string> = {
  paper: "/art/trophy-paper.svg",
  wordmark: "/art/trophy-wordmark.svg",
  ring: "/art/trophy-blob-ring.svg",
  footer: "/art/trophy-footer.svg",
  survived: "/art/trophy-badge-survived.svg",
  splatted: "/art/trophy-badge-splatted.svg",
};

export function TrophyCard({ data }: { data: TrophyData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artRef = useRef<Record<string, HTMLImageElement>>({});
  const reqRef = useRef<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const draw = () => {
      if (canvasRef.current) drawTrophyCard(canvasRef.current, data, artRef.current);
    };
    draw(); // immediate (procedural fallbacks until the art loads)
    // load the branded art once; redraw as each piece arrives
    for (const [key, src] of Object.entries(ART_SRC)) {
      if (reqRef.current.has(key)) continue;
      reqRef.current.add(key);
      const img = new Image();
      img.onload = () => {
        artRef.current[key] = img;
        draw();
      };
      img.src = src;
    }
  }, [data]);

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.download = `splotch-${data.outcome}-${fmt(data.survivedFor).replace(":", "m")}s.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };

  const copy = async () => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      await new Promise<void>((resolve, reject) => {
        c.toBlob(async (blob) => {
          if (!blob) return reject(new Error("no blob"));
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, "image/png");
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard image write not supported — fall back to download
      download();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: 300,
          height: "auto",
          borderRadius: 18,
          boxShadow: "0 12px 40px #0003",
          border: "3px solid #191225",
        }}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={download} style={btn("#0fd4e6", "#0a9fb0")}>
          ⬇ Download
        </button>
        <button onClick={copy} style={btn("#8a4cff", "#6a34cf")}>
          {copied ? "Copied! ✓" : "📋 Copy"}
        </button>
      </div>
    </div>
  );
}

function btn(bg: string, shadow: string): React.CSSProperties {
  return {
    padding: "10px 20px",
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    background: bg,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: `0 4px 0 ${shadow}`,
    fontFamily: "var(--font-baloo), system-ui, sans-serif",
  };
}
