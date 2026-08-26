// SimClock — jam dunia real-time untuk lapisan simulasi (Fase 1).
// Hari operasional = pagi -> siang -> sore -> malam (~6 menit di 1x).
// Independen dari hari cerita (story.day) sampai merger Fase 3.
import { emit } from "./eventBus.js";

export const SIM_PHASES = ["pagi", "siang", "sore", "malam"];
const TICK_MS = 500;          // detak interval nyata
const MS_PER_PHASE = 90000;   // 1.5 menit nyata per fase di kecepatan 1x

let simDay = 1;
let phaseIdx = 0;
let elapsed = 0;              // ms simulasi terakumulasi dalam fase saat ini
let speed = 1;                // 1 | 2 | 4
let paused = true;
let timer = null;

function tick() {
  if (paused) return;
  elapsed += TICK_MS * speed;
  while (elapsed >= MS_PER_PHASE) {
    elapsed -= MS_PER_PHASE;
    phaseIdx++;
    if (phaseIdx >= SIM_PHASES.length) {
      phaseIdx = 0;
      simDay++;
      emit("sim:newDay", { day: simDay });
    }
    emit("sim:phase", { phase: SIM_PHASES[phaseIdx], day: simDay });
  }
}

export function startSimClock() {
  if (timer) return status();
  paused = false;
  timer = setInterval(tick, TICK_MS);
  document.addEventListener("visibilitychange", () => {
    // Hemat baterai/performa: diamkan saat tab tak terlihat.
    if (document.hidden) paused = true;
    else paused = false;
  });
  return status();
}

export function togglePause() {
  paused = !paused;
  emit("sim:pause", { paused });
  return status();
}

export function cycleSpeed() {
  speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
  return status();
}

export function setPhase(idx) {
  if (SIM_PHASES[idx]) { phaseIdx = idx; elapsed = 0; }
  return status();
}

export function status() {
  return { day: simDay, phase: SIM_PHASES[phaseIdx], phaseIdx, speed, paused };
}

// DevTools / DevConsole hook
if (typeof window !== "undefined") window.__DUNGEON_SIM__ = { status, togglePause, cycleSpeed };
