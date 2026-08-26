// Faksi v2 (W4) — org-chart hidup: trust live + riwayat peristiwa per cabang
// + kirim hadiah (20g, trust +3, sekali per hari per cabang).
import { getState, mutate } from "../state.js";
import { FAC_KEYS, FAC_LABEL, facValue, statusWord } from "../systems/factions.js";
import { toast } from "../ui/toast.js";
import { openSheet } from "../ui/kit/sheet.js";
import { clamp } from "./shared.js";

const BRANCH_KINDS = {
  hq: ["chapter", "merger", "payroll_ok"],
  serikat: ["strike", "fired", "payroll_late"],
  hero: ["raid_leak"],
  grem: []
};
const EMO = { hq: "🏢", serikat: "🪧", hero: "🗡️", grem: "👁️" };

function eventsFor(st, key) {
  const kinds = BRANCH_KINDS[key] || [];
  return (st.socialFeed || []).filter(p => kinds.includes(p.kind)).slice(0, 3);
}

function branchHtml(st, key) {
  const v = Math.round(facValue(st, key));
  const w = statusWord(v);
  const evs = eventsFor(st, key);
  const gifted = st.flags["gift_" + key] === st.sim?.day;
  return `
  <div class="fx-branch">
    <div class="fx-head"><span class="fx-emo">${EMO[key]}</span><b>${FAC_LABEL[key]}</b>
      <span class="${w.cls}">${w.txt}</span></div>
    <div class="hq-bar fax"><i class="${w.cls}" style="width:${clamp(v, 0, 100)}%"></i></div>
    <div class="fx-evs">${evs.length ? evs.map(ev => `• ${ev.text}`).join("<br>") : "<i>Belum ada peristiwa tercatat.</i>"}</div>
    <button class="hq-btn" data-gift="${key}" ${gifted ? "disabled" : ""}>${gifted ? "Hadiah terkirim hari ini" : "🎁 Kirim hadiah (20g, +3)"}</button>
  </div>`;
}

function body(s) {
  return `
  <div id="fx-root" class="fx-wrap">
    <p class="app-lead">Struktur kekuasaan dungeon. Kamu di tengah — semua panah menunjuk ke arah dompet.</p>
    <div class="fx-top glass">🏢 HQ BAWANG SUCI<div class="fx-arrow">▼</div><div class="fx-you">👑 KAMU (Bos)</div></div>
    <div class="fx-grid">${FAC_KEYS.map(k => branchHtml(s, k)).join("")}</div>
  </div>`;
}

export const faxOrg = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#fx-root");
    if (!root) return;
    root.addEventListener("click", (e) => {
      const g = e.target.closest("[data-gift]");
      if (!g || g.disabled) return;
      const key = g.dataset.gift;
      openSheet({
        title: `Kirim hadiah ke ${FAC_LABEL[key]}?`,
        html: `<p>Keranjang buah pinggul premium: <b>20g</b>. Trust +3.</p>
               <p class="modal-satir">Suap? Bukan. Ini 'anggaran diplomasi'. Ada posnya kok di laporan.</p>`,
        actions: [
          { label: "Kirim", cls: "primary", run: () => {
              let ok = false;
              mutate(st => {
                if (st.stats.gold < 20) return;
                st.stats.gold -= 20;
                st.factions[key] = clamp((st.factions[key] || 50) + 3, 0, 100);
                st.flags["gift_" + key] = st.sim.day;
                ok = true;
              });
              toast(ok ? `Hadiah sampai. ${FAC_LABEL[key]} tersenyum profesional.` : "Kas kurang untuk diplomasi.", { ico: "coin", cls: ok ? "toast-ok" : "toast-bad" });
              handlers.rerender();
            }},
          { label: "Nanti setelah gajian", run: () => {} }
        ]
      });
    });
  }
});
