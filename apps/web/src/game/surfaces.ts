// Procedural, seamless surface textures (from the asset pack's pattern specs).
// Generated in-code so they tile perfectly with RepeatWrapping.
import * as THREE from "three";

/** Paper-grain: warm base with faint dark speckle (16px seamless tile). */
export function makePaperGrain(base = "#efe9dd"): THREE.Texture {
  const S = 32;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  // deterministic speckle so both the texture and its wrap seams stay stable
  const dots: [number, number, number, number][] = [
    [6, 8, 2, 0.07],
    [22, 20, 2, 0.06],
    [16, 4, 1.6, 0.05],
    [28, 28, 1.8, 0.06],
    [3, 26, 1.4, 0.05],
    [12, 14, 1.2, 0.05],
    [25, 10, 1.4, 0.05],
    [9, 22, 1.6, 0.05],
  ];
  ctx.fillStyle = "#191225";
  for (const [x, y, r, a] of dots) {
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
