import { initGame, getState, setScreen, setActiveApp, startNewGame } from "./state.js";
import { renderStatusBar } from "./ui/statusBar.js";
import { renderBoot } from "./ui/boot.js";
import { renderHome } from "./ui/homeScreen.js";
import { renderApp } from "./ui/appScreen.js";
import { renderEnding } from "./ui/endingScreen.js";
import { ensureStarted } from "./engine.js";
import { startSim } from "./systems/sim.js";
import { enterScreen } from "./ui/anim.js";
import { Lib, Sound } from "./lib.js";

window.__DUNGEON_BOOTED__ = true;

const statusBar = document.getElementById("status-bar");
const screen = document.getElementById("screen");

function initAmbient() {
  const ambient = document.querySelector(".ambient");
  if (!ambient) return;
  const COUNT = 16;
  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    const size = 2 + Math.random() * 4;
    dot.style.width = size + "px";
    dot.style.height = size + "px";
    dot.style.left = Math.random() * 100 + "%";
    dot.style.top = 100 + Math.random() * 20 + "%";
    dot.style.animationDuration = 9 + Math.random() * 12 + "s";
    dot.style.animationDelay = -Math.random() * 12 + "s";
    dot.style.opacity = 0.25 + Math.random() * 0.4;
    ambient.appendChild(dot);
  }
}

// Falling sakura petals (pure CSS animation, perf-friendly).
function initSakura() {
  const layer = document.querySelector(".sakura");
  if (!layer) return;
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  const N = 8;
  for (let i = 0; i < N; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    p.style.left = Math.random() * 100 + "%";
    const dur = 9 + Math.random() * 7;
    p.style.animationDuration = dur + "s";
    p.style.animationDelay = -Math.random() * dur + "s";
    const sz = 8 + Math.random() * 8;
    p.style.width = sz + "px";
    p.style.height = sz + "px";
    p.style.opacity = (0.45 + Math.random() * 0.4).toFixed(2);
    layer.appendChild(p);
  }
}

// Live neon particle field behind the phone (online canvas).
function initBackground() {
  const canvas = document.getElementById("fx");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, dpr, motes;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    const count = Math.round((innerWidth * innerHeight) / 26000);
    const n = Math.max(30, Math.min(72, count));
    const hues = ["168,85,247", "255,79,216", "34,231,228"];
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22 * dpr, vy: (Math.random() - 0.5) * 0.22 * dpr,
      r: (Math.random() * 1.8 + 0.8) * dpr, hue: hues[Math.floor(Math.random() * hues.length)]
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy;
      if (m.x < 0 || m.x > w) m.vx *= -1;
      if (m.y < 0 || m.y > h) m.vy *= -1;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + m.hue + ",0.55)"; ctx.fill();
    }
    for (let i = 0; i < motes.length; i++) {
      for (let j = i + 1; j < motes.length; j++) {
        const a = motes[i], b = motes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const max = 130 * dpr;
        if (dist < max) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(168,85,247," + (0.12 * (1 - dist / max)).toFixed(3) + ")";
          ctx.lineWidth = dpr * 0.6; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  if (reduced) {
    for (const m of motes) { ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(168,85,247,0.4)"; ctx.fill(); }
  } else {
    requestAnimationFrame(frame);
  }
}

// tsParticles magical dust (canvas) — guarded.
function initTsParticles() {
  const el = document.getElementById("tsparticles");
  const tp = Lib.tsParticles;
  if (!el || !tp || !tp.load) return;
  try {
    const promise = tp.load({
      id: "tsparticles",
      options: {
        fpsLimit: 60,
        detectRetina: true,
        background: { color: "transparent" },
        particles: {
          number: { value: 40, density: { enable: true } },
          color: { value: ["#A855F7", "#FF4FD8", "#34E7E4"] },
          shape: { type: "circle" },
          opacity: { value: { min: 0.2, max: 0.7 } },
          size: { value: { min: 1, max: 3 } },
          move: { enable: true, speed: 0.5, direction: "top", outModes: { default: "out" } },
          links: { enable: true, distance: 120, color: "#A855F7", opacity: 0.12 }
        },
        interactivity: { events: { onHover: { enable: true, mode: "bubble" } }, modes: { bubble: { distance: 120, size: 4 } } }
      }
    });
    if (promise && typeof promise.catch === "function") promise.catch(() => {});
  } catch (e) { /* noop */ }
}

function initPixiSigil() {
  const host = document.getElementById("pixi-layer");
  const PIXI = Lib.PIXI;
  if (!host || !PIXI) return;
  try {
    const app = new PIXI.Application({
      resizeTo: host, backgroundAlpha: 0, antialias: true, autoStart: true
    });
    host.appendChild(app.view);
    const g = new PIXI.Graphics();
    const draw = (rot) => {
      g.clear();
      g.lineStyle(2, 0xA855F7, 0.25);
      for (let i = 0; i < 6; i++) {
        const a = rot + i * Math.PI / 3;
        g.drawCircle(Math.cos(a) * 60, Math.sin(a) * 60, 58);
      }
      g.lineStyle(1.5, 0xFF4FD8, 0.18);
      g.drawCircle(0, 0, 90);
    };
    app.stage.addChild(g);
    let t = 0;
    app.ticker.add(() => { t += 0.004; draw(t); g.rotation = t * 0.4; });
    g.x = host.clientWidth / 2; g.y = host.clientHeight / 2;
  } catch (e) { /* noop */ }
}

// Unlock audio on first user gesture (browser policy).
function initAudioGesture() {
  const unlock = () => {
    try { Sound.play("unlock", 440, 0.01, "sine"); } catch {}
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

let lastScreen = null;
let watchdogTimer = null;
let watchdogTries = 0;

function watchdog() {
  clearTimeout(watchdogTimer);
  watchdogTimer = setTimeout(() => {
    if (!getState()) return;
    const html = screen.innerHTML ? screen.innerHTML.trim() : "";
    if (html === "" && watchdogTries < 6) { watchdogTries++; render(); }
  }, 500);
}

function renderSafe() {
  const state = getState();
  if (!state) return;

  renderStatusBar(statusBar, state);

  if (state.screen === "boot") {
    renderBoot(screen, () => { setScreen("home"); render(); });
    return;
  }

  if (state.screen === "ending") {
    renderEnding(screen, state, {
      rerender: render,
      restart: () => { startNewGame(); ensureStarted(); setScreen("home"); render(); }
    });
    return;
  }

  if (state.screen === "app") {
    renderApp(screen, state, { back, openApp, rerender: render });
    return;
  }

  ensureStarted();
  renderHome(screen, state, { openApp, rerender: render });
}

function render() {
  try { renderSafe(); }
  catch (err) {
    console.error("DungeonOS render error:", err);
    try {
      const st = getState();
      if (st) { st.screen = "home"; renderHome(screen, st, { openApp, rerender: render }); }
    } catch (e2) { /* last resort */ }
  }

  const cur = getState() ? getState().screen : null;
  if (cur !== lastScreen) { lastScreen = cur; enterScreen(screen); }
  watchdog();
}

function openApp(appId) { setActiveApp(appId); setScreen("app"); render(); }
function back() { setActiveApp(null); setScreen("home"); render(); }

initAmbient();
initSakura();
initBackground();
initTsParticles();
initPixiSigil();
initAudioGesture();
initGame();
ensureStarted();
startSim();
render();
window.__DUNGEON_READY__ = true;
