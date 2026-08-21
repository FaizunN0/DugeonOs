import { Sound } from "../lib.js";

const ANOMALIES = [
  "ANOMALI: lapisan ke-4 bocor. Jangan lihat ke belakang layar.",
  "PERINGATAN: developer lupa menutup void. Lagi.",
  "ERROR 0x4D: realitas sedang di-maintenance. Maaf.",
  "BUKAN BUG: ini fitur dari dimensi lain.",
  "LUBANG KE-4: kamu membaca pesan yang tak boleh ada.",
  "NOTIF: seseorang di luar kode sedang mengamati save file-mu."
];

let overlayEl = null;

function clearOverlay() {
  if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
  overlayEl = null;
}

// Pecah layar ala fourth-wall: getar #app + kartu anomali.
export function triggerGlitch(opts = {}) {
  const app = document.getElementById("app");
  if (app) {
    app.classList.add("glitching");
    setTimeout(() => app.classList.remove("glitching"), 1100);
  }
  if (Sound && Sound.glitch) Sound.glitch();

  clearOverlay();
  const msg = opts.message || ANOMALIES[Math.floor(Math.random() * ANOMALIES.length)];
  const el = document.createElement("div");
  el.className = "anomali-overlay";
  el.innerHTML = `
    <div class="anomali-card">
      <div class="anomali-tag">// LUBANG KE-4</div>
      <div class="anomali-msg">${msg}</div>
      <button class="anomali-close">Tutup (atau jangan)</button>
    </div>`;
  (document.getElementById("app") || document.body).appendChild(el);
  overlayEl = el;
  const close = () => clearOverlay();
  el.querySelector(".anomali-close").addEventListener("click", close);
  setTimeout(close, 4200);
}
