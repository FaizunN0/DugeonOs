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

const SLOTS_SYM = [
  { e: "⚔️", name: "Pedang",  mult: 3 },
  { e: "💎", name: "Berlian", mult: 12 },
  { e: "🐉", name: "Naga",    mult: 8 },
  { e: "🧅", name: "Bawang",  mult: 3 },
  { e: "💰", name: "Dompet",  mult: 5 },
  { e: "🔥", name: "Api",     mult: 10 },
];
const _randSym = () => Math.floor(Math.random() * SLOTS_SYM.length);
const _pickHigh = () => [1, 2, 5][Math.floor(Math.random() * 3)]; // berlian / naga / api (gacor)
const _pickLow = () => [0, 3, 4][Math.floor(Math.random() * 3)];  // pedang / bawang / dompet (ciut)
function _distinct3() {
  const a = _randSym(); let b = _randSym(); while (b === a) b = _randSym();
  let c = _randSym(); while (c === a || c === b) c = _randSym();
  return [a, b, c];
}
// taruhan dalam chip: mode angka = x10, "all" = ALL-IN (saldo penuh)
const _betCost = (mode, balance) => mode === "all" ? balance : (Number(mode) || 1) * 10;
const KOPLAK_ENDING = {
  tone: "koplak",
  title: "ENDING KOPLAK: LU MAIN JUDI PAKE GOLD DUNGEON?",
  tag: "Class Koplak - rating 0/10, tapi bikin ketawa",
  body: [
    "Wah, gila. Bos dungeon nyata-nyata main slot pakai gold yang sebenernya milik minion.",
    "Sekarang dompet kosong, brankas kosong, dan minion lagi ngejar lu bawa sapu.",
    "LU PANTAS DIGEBURIN. Otak udang, nasib udang, akhirnya jadi bahan meme bawah tanah.",
    "Tapi tenang, setidaknya lu hibur kita semua. Makasih ya, badut dungeon."
  ]
};
const judi = (s) => {
  const bal = s.slots.balance || 0;
  const betMode = s.slots.bet || 1;
  const cost = _betCost(betMode, bal);
  const costLabel = betMode === "all" ? "ALL-IN" : (cost + "c");
  const topAll = s.stats.gold * 2;
  return {
    body: `
      <p class="app-lead">DungeonSlots - mesin slot bawah tanah. 3 simbol SAMA = jackpot! (DevConsole: /slotgacor)</p>
      <div class="slot-bal">Saldo: <b>${bal}</b> chip · Gold: <b>${s.stats.gold}</b>g · Best: <b>${s.slots.best || 0}</b></div>
      <div class="slot-machine">
        <div class="slot-reel" id="slot-r0">${SLOTS_SYM[0].e}</div>
        <div class="slot-reel" id="slot-r1">${SLOTS_SYM[1].e}</div>
        <div class="slot-reel" id="slot-r2">${SLOTS_SYM[2].e}</div>
      </div>
      <div class="slot-msg" id="slot-msg">Pilih taruhan, lalu Spin.</div>
      <div class="slot-bet">
        <span class="slot-bet-label">Taruhan:</span>
        ${[1, 2, 5, 10].map(m => `<button class="bet-btn ${betMode === m ? "on" : ""}" data-bet="${m}">${m}x</button>`).join("")}
        <button class="bet-btn ${betMode === "all" ? "on" : ""}" data-bet="all">ALL-IN</button>
      </div>
      <div class="slot-actions">
        <button class="action-btn" id="slot-topup">${icon("coin")}<span>Top Up 50g = 100c</span></button>
        <button class="action-btn" id="slot-topup-all">${icon("coin")}<span>Top Up ALL (${s.stats.gold}g→${topAll}c)</span></button>
        <button class="action-btn slot-spin" id="slot-spin">${icon("bolt")}<span>Spin (${costLabel})</span></button>
      </div>`,
    mount(screen, state, handlers) {
      const r0 = screen.querySelector("#slot-r0"), r1 = screen.querySelector("#slot-r1"), r2 = screen.querySelector("#slot-r2");
      const msg = screen.querySelector("#slot-msg");
      screen.querySelectorAll(".bet-btn").forEach(b => b.addEventListener("click", () => {
        Sound.tap();
        mutate(st => { st.slots.bet = b.dataset.bet === "all" ? "all" : Number(b.dataset.bet); });
        handlers.rerender();
      }));
      screen.querySelector("#slot-topup").addEventListener("click", () => {
        Sound.tap();
        mutate(st => {
          if (st.stats.gold < 50) { toast("Gold kurang untuk top up (50g).", { ico: "coin", cls: "toast-bad" }); return; }
          st.stats.gold -= 50; st.slots.balance = (st.slots.balance || 0) + 100;
        });
        handlers.rerender();
      });
      screen.querySelector("#slot-topup-all").addEventListener("click", () => {
        Sound.tap();
        mutate(st => {
          if (st.stats.gold <= 0) { toast("Gold kosong.", { ico: "coin", cls: "toast-bad" }); return; }
          st.slots.balance = (st.slots.balance || 0) + st.stats.gold * 2; st.stats.gold = 0;
        });
        handlers.rerender();
      });
      screen.querySelector("#slot-spin").addEventListener("click", () => {
        Sound.tap();
        const st0 = getState();
        const bal0 = st0.slots.balance || 0;
        const cost0 = _betCost(st0.slots.bet || 1, bal0);
        if (bal0 < (st0.slots.bet === "all" ? 1 : cost0)) { toast("Saldo habis. Top up dulu.", { ico: "coin", cls: "toast-bad" }); return; }
        let last = null;
        mutate(st => {
          const mode = st.slots.bet || 1;
          const cost2 = _betCost(mode, st.slots.balance || 0);
          if ((st.slots.balance || 0) < cost2) { toast("Saldo habis. Top up dulu.", { ico: "coin", cls: "toast-bad" }); return; }
          st.slots.balance -= cost2;
          let win, sym;
          if (st.flags.slotGacor) { win = true; sym = 1; }
          else {
            const r = st.slots.rig || 0; st.slots.rig = r + 1;
            if (r <= 3) { win = true; sym = _pickHigh(); }            // awal gacor banget
            else if (r <= 7) { win = Math.random() < 0.55; sym = win ? _randSym() : -1; }
            else if (r <= 10) { win = false; }                       // mulai rangkak
            else if (r <= 12) { win = Math.random() < 0.35; sym = win ? _pickLow() : -1; }
            else { win = false; }                                    // Rungkat total
          }
          let syms;
          if (win) syms = [sym, sym, sym];   // 3 SAMA = menang, icon jelas
          else syms = _distinct3();          // beda semua = kalah, konsisten dg pesan
          st.slots._cost = cost2; st.slots._sym = win ? sym : -1; st.slots._win = win; st.slots._last = syms;
          last = syms;
        });
        if (!last) return;
        let n = 0; const spin = setInterval(() => {
          r0.textContent = SLOTS_SYM[_randSym()].e; r1.textContent = SLOTS_SYM[_randSym()].e; r2.textContent = SLOTS_SYM[_randSym()].e;
          if (++n > 12) {
            clearInterval(spin);
            r0.textContent = SLOTS_SYM[last[0]].e; r1.textContent = SLOTS_SYM[last[1]].e; r2.textContent = SLOTS_SYM[last[2]].e;
            resolveSpin(screen, handlers);
          }
        }, 60);
      });
    }
  };
};
function resolveSpin(screen, handlers) {
  const st = getState();
  const win = st.slots._win, sym = st.slots._sym, cost = st.slots._cost || 0;
  const pay = win ? cost * SLOTS_SYM[sym].mult : 0;
  const msg = screen.querySelector("#slot-msg");
  mutate(s => {
    if (win) { s.slots.balance += pay; s.stats.gold += Math.floor(pay / 4); if (pay > (s.slots.best || 0)) s.slots.best = pay; }
  });
  if (win) {
    Sound.good();
    msg.textContent = "JACKPOT " + SLOTS_SYM[sym].e + " " + SLOTS_SYM[sym].name + " x" + SLOTS_SYM[sym].mult + "! +" + pay + " chip";
    msg.className = "slot-msg good";
  } else {
    Sound.bad(); msg.textContent = "Boncos. Coba lagi, bos."; msg.className = "slot-msg bad";
  }
  if ((st.slots.balance || 0) <= 0 && st.stats.gold < 50) {
    msg.textContent = "DOMPET & SALDO KOSONG. Ini akhirnya...";
    setTimeout(() => { setEnding(KOPLAK_ENDING); handlers.rerender(); }, 900);
    return;
  }
  setTimeout(() => handlers.rerender(), 850);
}

// ===================== DUNGEONFEED (rewrite, story sama) =====================

export { judi };
