import { Lib, Sound } from "../lib.js";

// Mode Hemat: sync body class so global CSS can kill heavy effects.
export function syncPerf(on) {
  if (typeof document === "undefined") return;
  document.body.classList.toggle("perf", !!on);
}

// Whole-screen entrance (called on every screen transition).
// The final visible state must NEVER depend on a JS animation completing —
// on slow/mobile devices a throttled rAF can leave the screen at opacity:0
// (the "only background shows" bug). We always clear inline styles and add a
// safety net that forces visibility even if the lib misbehaves.
export function enterScreen(screen) {
  const el = screen;
  if (!el) return;
  const reveal = () => { el.style.opacity = "1"; el.style.transform = "none"; };
  const anime = Lib.anime, gsap = Lib.gsap;
  if (anime) {
    anime.remove(el);
    try {
      anime({
        targets: el, opacity: [0, 1], translateY: [18, 0], scale: [0.985, 1],
        duration: 480, easing: "cubicBezier(0.22,1,0.36,1)",
        complete: reveal
      });
    } catch (e) { reveal(); }
  } else if (gsap) {
    try {
      gsap.fromTo(el, { opacity: 0, y: 18, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out", onComplete: reveal });
    } catch (e) { reveal(); }
  } else {
    el.classList.remove("screen-anim");
    // force reflow so the animation restarts cleanly
    void el.offsetWidth;
    el.classList.add("screen-anim");
  }
  setTimeout(reveal, 700);
}

// Staggered entrance for a NodeList / array of elements.
export function staggerIn(els, opts = {}) {
  const list = !els ? [] : (typeof els.length === "number" ? Array.from(els) : [els]);
  if (!list.length) return;
  const base = opts.base || 0.05;
  const step = opts.step || 0.06;
  const from = opts.from || 10;
  const anime = Lib.anime;
  if (anime) {
    anime.remove(list);
    try {
      anime({
        targets: list, opacity: [0, 1], translateY: [from, 0], scale: [0.92, 1],
        delay: anime.stagger(step, { start: base }),
        duration: 520, easing: "cubicBezier(0.22,1,0.36,1)"
      });
    } catch (e) { /* reveal below */ }
  } else {
    list.forEach((el, i) => {
      const d = (base + i * step).toFixed(2) + "s";
      el.style.opacity = "0";
      el.style.transform = `translateY(${from}px)`;
      el.style.transition = `opacity .5s ${d}, transform .5s ${d}`;
      requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "none"; });
    });
  }
  // safety net: never leave items invisible
  setTimeout(() => {
    list.forEach(el => { if (el && el.isConnected) { el.style.opacity = "1"; el.style.transform = "none"; } });
  }, 900);
}

// Confetti via canvas-confetti.
export function confettiBurst(kind = "good") {
  const c = Lib.confetti;
  if (!c) return;
  const colors = kind === "small"
    ? ["#A855F7", "#C77DFF"]
    : kind === "good"
      ? ["#A855F7", "#FF4FD8", "#34E7E4", "#FFD86B"]
      : ["#FF5E7A", "#FF4FD8"];
  c({ particleCount: kind === "small" ? 70 : 150, spread: 78, startVelocity: 42, origin: { y: 0.62 }, colors, scalar: 0.9 });
}

// Top-layer overlay so bursts render above the phone's stacking context.
let _burstLayer = null;
function burstLayer() {
  if (_burstLayer) return _burstLayer;
  _burstLayer = document.createElement("div");
  _burstLayer.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden";
  document.body.appendChild(_burstLayer);
  return _burstLayer;
}

// Magic burst at a point (mo.js). Falls back silently.
export function moBurst(x, y, color) {
  const mojs = Lib.mojs;
  if (!mojs || !mojs.Burst) return;
  try {
    const b = new mojs.Burst({
      parent: burstLayer(),
      left: 0, top: 0, count: 12, radius: { 0: 64 },
      children: { shape: "circle", fill: color || ["#A855F7", "#FF4FD8", "#34E7E4"], radius: 9, duration: 900, easing: "cubic.out" }
    });
    b.tune({ x, y }).replay();
  } catch (e) { /* noop */ }
}

// Action feedback: small burst at an element's center + sound.
export function burstAt(el, color) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  moBurst(r.left + r.width / 2, r.top + r.height / 2, color);
  Sound.blip();
}

// Ending title flourish.
export function finale(el, mode = "burst") {
  if (!el) return;
  if (mode === "glitch") { el.classList.add("finale-glitch"); return; }
  const anime = Lib.anime;
  if (anime) {
    anime.remove(el);
    anime({ targets: el, scale: [0.6, 1], opacity: [0, 1], rotate: [-4, 0], duration: 720, easing: "cubicBezier(0.34,1.56,0.64,1)" });
  } else {
    el.classList.add("finale-burst");
  }
}
