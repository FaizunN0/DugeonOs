// LiveGold — angka dompet global yang selalu update real-time di SEMUA layar.
// Pemakaian: HTML  -> ${liveGoldHtml()}
//           mount -> bindLiveGold(screen)   (dipanggil otomatis oleh appScreen & homeScreen)
import { on } from "../../core/eventBus.js";
import { getState } from "../../state.js";

const reg = new Set();
let ready = false;
let lastShown = null;

const fmt = g => `${g}g`;

function paint(el, g, bump) {
  el.textContent = fmt(g);
  if (bump && !document.body.classList.contains("perf")) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
}

function ensure() {
  if (ready) return;
  ready = true;
  on("gold:changed", ({ gold }) => {
    lastShown = gold;
    for (const el of [...reg]) {
      if (!document.contains(el)) { reg.delete(el); continue; }
      paint(el, gold, true);
    }
  });
}

export function currentGold() {
  const st = getState();
  return st && st.stats ? st.stats.gold : 0;
}

export function liveGoldHtml() {
  ensure();
  lastShown = currentGold();
  return `<span class="live-gold" data-live-gold>${fmt(lastShown)}</span>`;
}

export function bindLiveGold(root) {
  if (!root) return;
  ensure();
  root.querySelectorAll("[data-live-gold]").forEach(el => reg.add(el));
}
