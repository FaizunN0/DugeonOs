// ============================================================
//  lib.js — safe access to the 12 CDN libraries + helpers.
//  Every consumer must assume a lib MIGHT be missing (offline /
//  CDN blocked). All helpers degrade gracefully.
// ============================================================

const W = () => (typeof window !== "undefined" ? window : {});

export const Lib = {
  get gsap() { return W().gsap || null; },
  get anime() { return W().anime || null; },
  get confetti() { return W().confetti || null; },
  get tsParticles() { return W().tsParticles || null; },
  get mojs() { return W().mojs || null; },
  get html2canvas() { return W().html2canvas || null; },
  get VanillaTilt() { return W().VanillaTilt || null; },
  get rough() { return W().rough || null; },
  get PIXI() { return W().PIXI || null; },
  get Matter() { return W().Matter || null; },
  get KUTE() { return W().KUTE || null; },
  get Howler() { return W().Howler || null; },
  get Howl() { return W().Howl || null; }
};

export const has = (k) => !!Lib[k];

// ---- tiny WAV data-URI synth (so Howler has real sources) ----
function wavURI(freq = 440, dur = 0.12, type = "sine") {
  try {
    const sr = 44100, n = Math.floor(sr * dur);
    const buf = new ArrayBuffer(44 + n * 2);
    const dv = new DataView(buf);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, "RIFF"); dv.setUint32(4, 36 + n * 2, true); ws(8, "WAVE");
    ws(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
    dv.setUint16(22, 1, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true);
    dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    ws(36, "data"); dv.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      let v = 0;
      if (type === "sine") v = Math.sin(2 * Math.PI * freq * t);
      else if (type === "square") v = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.6 : -0.6;
      else v = (Math.random() * 2 - 1) * (1 - i / n); // noise blip
      dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0.5 * 32767, true);
    }
    let bin = ""; const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return "data:audio/wav;base64," + btoa(bin);
  } catch { return null; }
}

// ---- Sound: Howler when present, WebAudio fallback ----
let _enabled = true;
const _cache = {};
function howlFor(key, freq, dur, type) {
  const Howl = Lib.Howl;
  if (!Howl) return null;
  if (!_cache[key]) {
    const src = wavURI(freq, dur, type);
    if (!src) return null;
    _cache[key] = new Howl({ src: [src], volume: 0.35 });
  }
  return _cache[key];
}

let _ctx = null;
function ctx() {
  if (_ctx) return _ctx;
  try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _ctx = null; }
  return _ctx;
}

export const Sound = {
  get enabled() { return _enabled; },
  set enabled(v) { _enabled = !!v; },
  toggle() { _enabled = !_enabled; return _enabled; },
  play(key, freq = 520, dur = 0.12, type = "sine") {
    if (!_enabled) return;
    const h = howlFor(key, freq, dur, type);
    if (h) { try { h.play(); } catch {} return; }
    // fallback: WebAudio blip
    const c = ctx(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type === "noise" ? "sawtooth" : type;
      o.frequency.value = freq;
      g.gain.value = 0.18;
      o.connect(g); g.connect(c.destination);
      const t0 = c.currentTime;
      g.gain.setValueAtTime(0.18, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0); o.stop(t0 + dur);
    } catch {}
  },
  blip() { this.play("blip", 560, 0.08, "sine"); },
  tap() { this.play("tap", 420, 0.06, "square"); },
  good() { this.play("good", 660, 0.16, "sine"); },
  bad() { this.play("bad", 180, 0.2, "square"); },
  magic() { this.play("magic", 880, 0.22, "sine"); },
  fanfare() { this.play("fan", 720, 0.5, "sine"); },
  glitch() { this.play("glitch", 130, 0.2, "sawtooth"); },

  // ---- BGM: 8 lagu procedural tanpa copyright (WebAudio) ----
  _bgm: { playing: false, track: -1, iv: null, step: 0 },
  bgmTracks() { return BGM_TRACKS; },
  bgmStart(track) {
    if (!_enabled) return;
    const c = ctx(); if (!c) return;
    this.bgmStop();
    const t = BGM_TRACKS[track % BGM_TRACKS.length];
    this._bgm.playing = true; this._bgm.track = track; this._bgm.step = 0;
    const stepMs = t.step || 260;
    this._bgm.iv = setInterval(() => {
      const c2 = ctx(); if (!c2) { this.bgmStop(); return; }
      const note = t.notes[this._bgm.step % t.notes.length];
      this._bgm.step++;
      if (note && note !== "-" && note !== "x") {
        const f = noteFreq(note); if (!f) return;
        try {
          const o = c2.createOscillator(), g = c2.createGain();
          o.type = t.type || "triangle"; o.frequency.value = f;
          const dur = (stepMs / 1000) * 0.9;
          g.gain.setValueAtTime(0.0001, c2.currentTime);
          g.gain.exponentialRampToValueAtTime(0.12, c2.currentTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, c2.currentTime + dur);
          o.connect(g); g.connect(c2.destination);
          o.start(c2.currentTime); o.stop(c2.currentTime + dur);
        } catch {}
      }
      // bass note tiap 4 step
      if (this._bgm.step % 4 === 0 && t.bass) {
        const bf = noteFreq(t.bass); if (bf) { try {
          const o = c2.createOscillator(), g = c2.createGain();
          o.type = "sine"; o.frequency.value = bf / 2;
          g.gain.setValueAtTime(0.0001, c2.currentTime);
          g.gain.exponentialRampToValueAtTime(0.10, c2.currentTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, c2.currentTime + (stepMs / 1000) * 1.6);
          o.connect(g); g.connect(c2.destination);
          o.start(c2.currentTime); o.stop(c2.currentTime + (stepMs / 1000) * 1.8);
        } catch {} }
      }
    }, stepMs);
  },
  bgmStop() { this._bgm.playing = false; if (this._bgm.iv) { clearInterval(this._bgm.iv); this._bgm.iv = null; } this._bgm.step = 0; },
  bgmIsPlaying() { return this._bgm.playing; },
  bgmTrack() { return this._bgm.track; }
};

function noteFreq(n) {
  const map = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  const m = String(n).match(/^([A-G]#?)(\d)$/);
  if (!m) return 0;
  const semi = map[m[1]] + (parseInt(m[2], 10) - 4) * 12;
  return 440 * Math.pow(2, semi / 12);
}

// 8 lagu loop pendek (nama nada). "-" = rest, "x" = rest pendek.
export const BGM_TRACKS = [
  { name: "Dungeon Bounce", type: "triangle", step: 240, bass: "C3",
    notes: ["C4", "E4", "G4", "C5", "A4", "G4", "E4", "G4", "C4", "E4", "G4", "C5", "D5", "C5", "A4", "G4"] },
  { name: "Minion Lullaby", type: "sine", step: 360, bass: "A2",
    notes: ["A3", "C4", "E4", "D4", "C4", "A3", "-", "C4", "E4", "D4", "C4", "A3", "-", "E4", "D4", "C4"] },
  { name: "Hero Chase", type: "square", step: 170, bass: "E3",
    notes: ["E4", "E4", "E4", "G4", "E4", "D4", "C4", "D4", "E4", "G4", "A4", "G4", "E4", "D4", "C4", "B3"] },
  { name: "Bawang Disco", type: "triangle", step: 220, bass: "G2",
    notes: ["G4", "x", "B4", "x", "D5", "x", "B4", "x", "G4", "x", "A4", "x", "D5", "x", "B4", "x"] },
  { name: "Grem Rap", type: "sawtooth", step: 200, bass: "D3",
    notes: ["D4", "F4", "A4", "G4", "F4", "D4", "A4", "C5", "D4", "F4", "A4", "G4", "E4", "C4", "D4", "-"] },
  { name: "HQ Jazz", type: "sine", step: 320, bass: "F2",
    notes: ["F4", "A4", "C5", "A4", "G4", "E4", "C4", "E4", "F4", "A4", "B4", "A4", "G4", "E4", "C4", "-"] },
  { name: "Trap Techno", type: "square", step: 180, bass: "A2",
    notes: ["A4", "A4", "x", "A4", "A4", "x", "A4", "A4", "C5", "A4", "x", "A4", "E5", "A4", "x", "A4"] },
  { name: "Ending Calm", type: "sine", step: 420, bass: "C3",
    notes: ["C4", "E4", "G4", "C5", "-", "G4", "E4", "C4", "D4", "F4", "A4", "F4", "-", "C4", "G4", "-"] }
];


// run a callback once the window is loaded (libs present).
export function onReady(cb) {
  if (typeof document !== "undefined" && document.readyState === "complete") cb();
  else window.addEventListener("load", cb, { once: true });
}

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export const rand = (a, b) => a + Math.random() * (b - a);
