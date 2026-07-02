// Procedural sound — all synthesized with the Web Audio API, no asset files.
// The AudioContext is created lazily and resumed on the first user gesture
// (the PLAY button) to satisfy browser autoplay rules.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** Call from a user gesture (PLAY click) to unlock audio. */
export function initAudio() {
  const c = ac();
  if (c && c.state === "suspended") c.resume();
}

export function toggleMute(): boolean {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

function env(
  node: AudioNode,
  gain: number,
  attack: number,
  decay: number,
): GainNode | null {
  const c = ac();
  if (!c || !master) return null;
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + attack + decay);
  node.connect(g);
  g.connect(master);
  return g;
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Short airy spray tick while painting. */
export function spray() {
  const c = ac();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.12);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3200 + Math.random() * 1200;
  bp.Q.value = 0.8;
  src.connect(bp);
  env(bp, 0.18, 0.005, 0.1);
  src.start();
  src.stop(c.currentTime + 0.13);
}

/** Whistle taunt — a rising then falling tone. */
export function whistle() {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(900, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(1700, c.currentTime + 0.18);
  o.frequency.exponentialRampToValueAtTime(1100, c.currentTime + 0.42);
  env(o, 0.28, 0.02, 0.45);
  o.start();
  o.stop(c.currentTime + 0.5);
}

/** Wet splat when caught. */
export function splat() {
  const c = ac();
  if (!c) return;
  // noise burst
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.25);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1800, c.currentTime);
  lp.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.22);
  src.connect(lp);
  env(lp, 0.5, 0.005, 0.28);
  src.start();
  src.stop(c.currentTime + 0.26);
  // low thud
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(160, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.2);
  env(o, 0.4, 0.005, 0.24);
  o.start();
  o.stop(c.currentTime + 0.26);
}

/** Alert blip when the Hunter first spots you. */
export function spotted() {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(660, c.currentTime);
  o.frequency.setValueAtTime(880, c.currentTime + 0.08);
  env(o, 0.12, 0.005, 0.14);
  o.start();
  o.stop(c.currentTime + 0.2);
}

/** Rising 3-note win sting. */
export function win() {
  const c = ac();
  if (!c) return;
  [523, 659, 784].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = env(o, 0.25, 0.01, 0.3);
    if (g) {
      o.start(c.currentTime + i * 0.12);
      o.stop(c.currentTime + i * 0.12 + 0.35);
    }
  });
}

/** A single heartbeat "lub-dub" — pitch/thump rises with the Nerve level. */
export function heartbeat(nerve = 1) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime;
  const base = 46 + (nerve - 1) * 10; // tenser = higher, tighter thump
  const gain = 0.28 + (nerve - 1) * 0.12;
  const thump = (at: number, g: number) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(base * 1.9, at);
    o.frequency.exponentialRampToValueAtTime(base, at + 0.09);
    const gg = c.createGain();
    gg.gain.setValueAtTime(0, at);
    gg.gain.linearRampToValueAtTime(g, at + 0.008);
    gg.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    o.connect(gg);
    gg.connect(master!);
    o.start(at);
    o.stop(at + 0.18);
  };
  thump(t, gain); // lub
  thump(t + 0.16, gain * 0.7); // dub
}

/** Sharp inhale/flinch when Nerve stability cracks. */
export function nerveCrack() {
  const c = ac();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.3);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(600, c.currentTime);
  bp.frequency.exponentialRampToValueAtTime(2600, c.currentTime + 0.25);
  bp.Q.value = 1.5;
  src.connect(bp);
  env(bp, 0.22, 0.02, 0.26);
  src.start();
  src.stop(c.currentTime + 0.31);
}

/** Soft UI click. */
export function click() {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = 440;
  env(o, 0.14, 0.002, 0.07);
  o.start();
  o.stop(c.currentTime + 0.08);
}
