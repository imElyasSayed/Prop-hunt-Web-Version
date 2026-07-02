// The "Answer-Check": builds a plain-language explanation of how a round ended
// — the tell that got you found (or the blend that carried you) — from the same
// data the game already tracked. This is the readout on the Trophy Card.
import type { Tell } from "./types";
import { hexToRgb, colorMatch } from "./color";

/** Friendly name for a hex color, for readouts like "your cyan blob". */
export function colorName(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const sat = max === 0 ? 0 : (max - min) / max;
  if (lum > 0.9 && sat < 0.12) return "paper-white";
  if (lum < 0.14) return "ink-black";
  if (sat < 0.16) return lum > 0.6 ? "pale grey" : "muddy grey";
  // hue in degrees
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const mx = Math.max(rn, gn, bn);
  const mn = Math.min(rn, gn, bn);
  const d = mx - mn;
  let h = 0;
  if (d !== 0) {
    if (mx === rn) h = ((gn - bn) / d) % 6;
    else if (mx === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  if (h < 18) return "red";
  if (h < 42) return "orange";
  if (h < 66) return "yellow";
  if (h < 95) return "lime";
  if (h < 160) return "green";
  if (h < 200) return "teal";
  if (h < 250) return "blue";
  if (h < 292) return "violet";
  if (h < 330) return "magenta";
  return "pink";
}

export interface TellInput {
  outcome: "survived" | "splatted";
  camo: number; // 0..1
  coverage: number; // 0..1
  paintColor: string;
  surfaceColor: string;
  taunting: boolean;
}

export function buildTell(i: TellInput): Tell {
  const camoPct = Math.round(i.camo * 100);
  const paint = colorName(i.paintColor);
  const surf = colorName(i.surfaceColor);
  const mismatch = Math.round((1 - colorMatch(i.paintColor, i.surfaceColor)) * 100);

  if (i.outcome === "survived") {
    return {
      outcome: "survived",
      headline: "Clean blend — nobody clocked you",
      detail:
        i.coverage < 0.12
          ? `You skated by barely painted (${camoPct}% camo). Bold. Next time bank a real coat before the sweep.`
          : `Your ${paint} coat held against the ${surf} surface (${camoPct}% camo). The Hunter walked right past.`,
      camoPct,
      paintColor: i.paintColor,
      surfaceColor: i.surfaceColor,
    };
  }

  // splatted — figure out the tell
  let headline: string;
  let detail: string;
  if (i.taunting) {
    headline = "Your taunt gave you away";
    detail = `You lit yourself up with a taunt — the Hunter beelined to the noise while your ${paint} blob was exposed.`;
  } else if (i.coverage < 0.12) {
    headline = "You barely painted";
    detail = `An almost-bare blob has nothing to hide behind — you read as OFF (${camoPct}% camo) the second the cone crossed you.`;
  } else {
    headline = `Your ${paint} didn't match the ${surf}`;
    detail = `Your ${paint} blob read ${mismatch}% off the ${surf} you leaned on — only ${camoPct}% camo, under the safe line. The Hunter clocked the color that didn't belong.`;
  }
  return {
    outcome: "splatted",
    headline,
    detail,
    camoPct,
    paintColor: i.paintColor,
    surfaceColor: i.surfaceColor,
  };
}
