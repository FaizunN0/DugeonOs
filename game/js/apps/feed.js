// Modul aplikasi mandiri — Fase 0 modularisasi v1.0.
import { getState, mutate, addNotification, setEnding } from "../state.js";
import { HUB_ENDING, HUB_REVOLT_ENDING } from "../content/endings.js";
import { icon, avatar } from "../ui/icons.js";
import { Lib, Sound, rand } from "../lib.js";
import { toast } from "../ui/toast.js";
import { staggerIn } from "../ui/anim.js";
import { PHASE_LABELS } from "../config.js";
import { getCurrentNode, resolveText, chooseOption, advance } from "../engine.js";
import { shiftFac, inv, addInv, takeInv, randomMeme, clamp } from "./shared.js";
import { choiceModal } from "../ui/kit/modal.js";

function renderFeedNew(screen, state, accent, handlers) {
  const nodeData = getCurrentNode();
  if (!nodeData) {
    screen.innerHTML = `
      <div class="app-screen">
        <div class="topbar"><button class="ghost-btn" data-back>${icon("back")} Beranda</button></div>
        <div class="placeholder">Cerita sudah selesai. Lihat ending-mu di layar berikutnya.</div>
      </div>`;
    const back = screen.querySelector("[data-back]");
    if (back) back.addEventListener("click", () => handlers.back());
    return;
  }
  const speaker = resolveText(nodeData.speaker, state) || "DungeonOS";
  const kind = avatarKindOf(speaker);
  const value = resolveText(nodeData.body, state);
  const arr = Array.isArray(value) ? value : [value];
  const bubbles = arr.map((t, i) => `<div class="bubble ${kind}" style="animation-delay:${i * 0.18}s">${t}</div>`).join("");
  const hasChoices = Array.isArray(nodeData.choices) && nodeData.choices.length > 0;
  const quick = hasChoices
    ? nodeData.choices.map((c, i) => `<button class="quick" data-choice="${i}"><span class="quick-i">${i + 1}</span><span class="quick-body"><span class="quick-t">${c.text}</span>${c.hint ? `<span class="quick-sub">- ${c.hint}</span>` : ""}</span></button>`).join("")
    : `<button class="quick primary" id="advance">${icon("bolt")} <span>Lanjut</span></button>`;

  const showHint = !state.apps.devconsole && Math.random() < 0.5;
  const sideCard = showHint
    ? `<div class="side-h">⚠ CELAH TERDETEKSI</div><div class="side-meme">Layar ini retak tipis. Di <b>Settings</b>, ketuk 5x untuk membuka sesuatu yang tak seharusnya ada.</div>`
    : `<div class="side-h">Gimmick Hari Ini</div><div class="side-meme">${randomMeme()}</div>`;

  screen.innerHTML = `
    <div class="app-screen feed-screen feed-wide">
      <div class="topbar">
        <button class="ghost-btn" data-back>${icon("back")} Beranda</button>
        <div class="app-title" style="color:${accent}">${icon("feed")} DungeonFeed</div>
      </div>
      <div class="feed-layout">
        <div class="chat">
          <div class="chat-head">
            <div class="chat-ava ${kind}">${avatar(kind)}</div>
            <div class="chat-id"><div class="chat-name">${speaker}</div>
              <div class="chat-status"><span class="dot"></span> online - Hari ${nodeData.day} - ${PHASE_LABELS[nodeData.phase] || nodeData.phase}</div></div>
            <div class="chat-pill">STORY</div>
          </div>
          <div class="chat-body">${bubbles}<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div></div>
          <div class="chat-quick">${quick}</div>
        </div>
        <aside class="feed-side">
          <div class="side-card">${sideCard}</div>
          <div class="side-card tap-game" id="tap-game">
            <div class="side-h">Tumbuk Bawang (tap!)</div>
            <div class="tap-bawang" id="tap-bawang">${icon("onion")}</div>
            <div class="tap-score">Skor: <b id="tap-score">0</b> - Gold: <b id="tap-gold">0</b></div>
          </div>
        </aside>
      </div>
    </div>`;

  const back = screen.querySelector("[data-back]");
  if (back) back.addEventListener("click", () => handlers.back());
  if (hasChoices) {
    screen.querySelectorAll(".chat-quick .quick").forEach(b =>
      b.addEventListener("click", () => { chooseOption(Number(b.dataset.choice)); handlers.rerender(); }));
  } else {
    const adv = screen.querySelector("#advance");
    if (adv) adv.addEventListener("click", () => { advance(); handlers.rerender(); });
  }

  const typingEl = screen.querySelector(".typing");
  setTimeout(() => { if (typingEl && typingEl.isConnected) typingEl.style.visibility = "hidden"; }, 600 + arr.length * 180);

  const tg = screen.querySelector("#tap-game");
  const tb = screen.querySelector("#tap-bawang");
  const scoreEl = screen.querySelector("#tap-score");
  const goldEl = screen.querySelector("#tap-gold");
  let score = 0, gold = 0;
  if (tb && tg) {
    const place = () => {
      if (!tb.isConnected) return;
      const r = tg.getBoundingClientRect();
      const pad = 8, size = 42;
      const x = pad + Math.random() * Math.max(1, (r.width - size - pad * 2));
      const y = 26 + Math.random() * Math.max(1, (r.height - size - 26 - 8));
      tb.style.left = x + "px"; tb.style.top = y + "px";
    };
    tb.addEventListener("click", () => {
      score++; if (scoreEl) scoreEl.textContent = score;
      if (score % 8 === 0) { gold += 2; if (goldEl) goldEl.textContent = gold; Sound.blip(); mutate(st => { st.stats.gold += 2; }); }
      place();
    });
    place();
  }
}

function avatarKindOf(sp) {
  const s = String(sp || "").toLowerCase();
  if (s.includes("grem")) return "grem";
  if (s.includes("hero")) return "hero";
  if (s.includes("devconsole")) return "devconsole";
  return "os";
}


export { renderFeedNew };
