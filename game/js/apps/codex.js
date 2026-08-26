// Codex/Grimoire v2 — APP RENEWAL W4. Lore statis pilihan + ENTRI DINAMIS:
// rekap monster raid yang tumbang & halaman rahasia M. King Mouse.
import { getState } from "../state.js";
import { subnav, bindSubnav, currentSubnav, emptyState } from "../ui/kit/elements.js";
import { HERO_TYPES } from "../content/heroes.js";

const TABS = [
  { k: "hero",    label: "🗡️ Hero" },
  { k: "rahasia", label: "🐭 Rahasia" }
];

const BASE_LORE = {
  slime: { emo: "🟦", name: "Slm-9 'Si Lembap'", tag: "Operator trap veteran", desc: "Makhluk lumpur biru penjaga rangkaian trap. Bicaranya cuma 'klik-klik'. Setia sampai akhir — terutama karena tidak bisa kabur." },
  grem:  { emo: "👁️", name: "Grem", tag: "Bos tersembunyi", desc: "Hadir di rapat tanpa diundang, membawa snack sendiri. Tidak pernah kehilangan argumen. Tidak pernah kehilangan apa-apa." },
  bawang:{ emo: "🧅", name: "Bawang Suci", tag: "Artefak negara", desc: "Dipuja dalam himne, dicuri tiga kali, dikembalikan dua kali (satu kali karena tidak ada yang mau simpan)." }
};

function heroHtml(s) {
  const kills = s.codexKills || {};
  const rows = Object.values(HERO_TYPES).map(h => `
    <div class="cx-row">
      <span class="cx-emo">${h.emo}</span>
      <div><b>${h.name}</b><p>"${h.taunt}"</p></div>
      <span class="cx-count">Ditumbangkan<br><b>${kills[h.id] || 0}</b>x</b></span>
    </div>`).join("");
  const lore = Object.values(BASE_LORE).map(l => `
    <div class="cx-row"><span class="cx-emo">${l.emo}</span>
      <div><b>${l.name}</b><span class="cx-tag">${l.tag}</span><p>${l.desc}</p></div></div>`).join("");
  return `<div class="cx-list">${rows}<hr class="cx-sep"/>${lore}</div>`;
}

function rahasiaHtml(s) {
  const found = !!(s.flags.mkmHired || s.currentEnding?.id === "v1_mkm_karyawan");
  return found ? `
    <div class="cx-mkm found">
      <span class="cx-emo">👑🐭</span>
      <b>M. King Mouse</b>
      <span class="cx-tag">Legenda · Karyawan #${(s.minionsCorp?.hired || []).find(m => m.trait === "legendaris") ? "AKTIF" : "ARSIP"}</span>
      <p>Buronan dana publik nomor satu. Uangnya ternyata selalu di rak belakang brankasmu, di balik arsip 2019. Sekarang resmi di payroll — gaji 999g, produktivitas +300%, senyum selalu.</p>
    </div>`
    : emptyState("❓❓❓", "Halaman ini menolak dibaca. Konon sosok berjubah kadang mampir ke pool HRD setelah hari operasional ke-6...");
}

function body(s) {
  const tab = currentSubnav("codex", "hero");
  return `
  <div id="cx-root" class="cx-wrap">
    <p class="app-lead">Codex DungeonOS — catatan makhluk, rekap pertempuran, dan satu halaman yang menolak dibaca.</p>
    ${subnav("codex", tab, TABS)}
    ${tab === "hero" ? heroHtml(s) : rahasiaHtml(s)}
  </div>`;
}

export const codex = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#cx-root");
    if (!root) return;
    bindSubnav(root, handlers);
  }
});
