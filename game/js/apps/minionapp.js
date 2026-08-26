// MinionApp v2 "Personalia HR" — APP RENEWAL W4. Sisi manusiawi roster:
// CV asli trait, kontrak, bar hidup, sparkline perusahaan & surat pribadi.
import { getState } from "../state.js";
import { toast } from "../ui/toast.js";
import { openSheet } from "../ui/kit/sheet.js";
import { emptyState, priceTag } from "../ui/kit/elements.js";
import { LETTERS, TRAITS } from "../content/minions.js";
import { traitLabel } from "../systems/minions.js";
import { clamp } from "./shared.js";

const bar = (v) => `<div class="hq-bar"><i style="width:${clamp(Math.round(v), 0, 100)}%" class="${v < 25 ? "crit" : ""}"></i></div>`;

function sparkline(s) {
  const nets = (s.economy.reports || []).slice(-7).map(r => r.net);
  if (!nets.length) return `<div class="mp-spark empty">Belum ada data laporan. Sparkline menunggu gajian pertama.</div>`;
  const max = Math.max(1, ...nets.map(n => Math.abs(n)));
  return `<div class="mp-spark">${nets.map(n => {
    const h = clamp(Math.round((Math.abs(n) / max) * 100), 8, 100);
    return `<i class="${n >= 0 ? "up" : "down"}" style="height:${h}%"></i>`;
  }).join("")}</div><div class="mp-spark-cap">Net keuangan 7 hari terakhir (hijau untung / merah rugi)</div>`;
}

function profileSheet(m, handlers) {
  const t = TRAITS[m.trait] || {};
  const days = Math.max(1, ((getState().sim?.day) || 1) - (m.joined || 1) + 1);
  openSheet({
    title: `${m.name} — ${traitLabel(m.trait)} ${t.label ? "" : ""}`.trim(),
    html: `
      <p class="mp-cv">"${t.cv || "-"}"</p>
      <div class="mp-grid">
        <span>Gaji</span><b>${m.salary}g/hari</b>
        <span>Masa kerja</span><b>${days} hari operasional</b>
        <span>Tugas</span><b>${m.job === "nganggur" ? "Nganggur produktif" : m.job}</b>
        <span>Status</span><b>${m.mogok ? "MOGOK" : m.resting ? "Istirahat" : "Bertugas"}</b>
      </div>
      <div class="mp-bars"><span>Morale</span>${bar(m.morale)}<span>Stamina</span>${bar(m.stamina)}</div>
      <button class="sheet-btn" id="mp-letter">✉️ Baca Surat Pribadi untuk Bos</button>`,
    actions: [{ label: "Tutup profil", run: () => {} }]
  });
  document.getElementById("mp-letter")?.addEventListener("click", () =>
    toast(`\u2709\ufe0f "${LETTERS[m.trait] || "Terima kasih sudah membaca surat yang tidak kutulis."}" \u2014 ${m.name}`, { ico: "minion", cls: "" }));
}

function body(s) {
  const hired = s.minionsCorp?.hired || [];
  const avgMorale = hired.length ? Math.round(hired.reduce((a, m) => a + (m.morale || 0), 0) / hired.length) : 0;
  return `
  <div id="mn-root" class="mn-wrap">
    <p class="app-lead">MinionApp — Personalia HR. Operasi di HQ; di sini kita membahas manusia (kurang lebih).</p>
    <div class="hq-ledger glass">
      <div><span>Pegawai</span><b>${hired.length}</b></div>
      <div><span>Rata-rata morale</span><b>${avgMorale}</b></div>
      <div><span>Payroll/gaji harian</span><b>${hired.reduce((a, m) => a + (m.salary || 0), 0)}g</b></div>
      <div><span>Sedang mogok</span><b class="${hired.some(m => m.mogok) ? "bad" : ""}">${hired.filter(m => m.mogok).length}</b></div>
    </div>
    ${sparkline(s)}
    <h3 class="hq-title">Profil Karyawan</h3>
    <div class="mn-list">
      ${hired.map(m => `
      <button class="mn-card ${m.mogok ? "strike" : ""}" data-prof="${m.id}">
        <span class="mn-ava">${TRAITS[m.trait]?.label?.[0] || "?"}</span>
        <div class="mn-info"><b>${m.name}</b><span>${traitLabel(m.trait)} · ${m.salary}g/hr · ${m.job === "nganggur" ? "nganggur" : m.job}</span>
          <div class="mn-mini">${bar(m.morale)}</div>
        </div>
        <span class="mn-arrow">›</span>
      </button>`).join("") || emptyState("🗂️", "Belum ada pegawai. HRD menyalakan lampu ruangan demi satu meja kosong.")}
    </div>
  </div>`;
}

export const minionApp = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#mn-root");
    if (!root) return;
    root.addEventListener("click", (e) => {
      const card = e.target.closest("[data-prof]");
      if (!card) return;
      const m = getState().minionsCorp.hired.find(x => x.id === card.dataset.prof);
      if (m) profileSheet(m, handlers);
    });
  }
});
