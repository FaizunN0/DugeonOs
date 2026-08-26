// Operasional HQ — dashboard simulasi harian (Fase 1). Menggantikan layar tutup sementara.
import { getState, mutate } from "../state.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { clamp } from "./shared.js";
import { choiceModal } from "../ui/kit/modal.js";
import { status as simStatus, togglePause, cycleSpeed } from "../core/time.js";
import { on } from "../core/eventBus.js";
import { JOBS, JOB_ORDER } from "../content/jobs.js";
import { TRAITS, INTERVIEW_Q } from "../content/minions.js";
import { hire, fire, cycleJob, toggleRest, traitLabel } from "../systems/minions.js";
import { FAC_KEYS, FAC_LABEL, facValue, statusWord, modifiers } from "../systems/factions.js";
import { activeSeason } from "../content/seasons.js";

const PHASE_ICON = { pagi: "🌅", siang: "☀️", sore: "🌇", malam: "🌙" };
let lastHandlers = null;
let activeRoot = null;
let busBound = false;
let lastKas = null;

function onBus() {
  if (busBound) return;
  busBound = true;
  const alive = () => activeRoot && document.contains(activeRoot);
  const touch = () => { if (!alive()) return; updateHud(); renderDynamic(activeRoot); };
  on("sim:phase", touch);
  on("minions:changed", touch);
  on("econ:report", touch);
}

function bar(v) {
  const val = clamp(Math.round(v), 0, 100);
  return `<div class="hq-bar"><i style="width:${val}%" class="${val < 25 ? "crit" : ""}"></i></div>`;
}

function minionCard(m) {
  const t = TRAITS[m.trait] || {};
  const st = m.mogok ? "MOGOK" : m.resting ? "ISTIRAHAT" : m.job === "nganggur" ? "SENANG" : "KERJA";
  return `
  <div class="hq-minion ${m.mogok ? "strike" : ""}">
    <div class="hq-mrow"><b>${m.name}</b><span class="hq-trait">${traitLabel(m.trait)}</span><span class="hq-status ${m.mogok ? "bad" : ""}">${st}</span></div>
    <div class="hq-mrow small"><span>Stamina</span>${bar(m.stamina)}<span>Morale</span>${bar(m.morale)}</div>
    <div class="hq-mrow">
      <button class="hq-btn job" data-hqact="job:${m.id}">📋 ${(JOBS[m.job] || {}).label || "Nganggur"}</button>
      <button class="hq-btn" data-hqact="rest:${m.id}">${m.resting ? "▶ Kerja" : "😴 Istirahat"}</button>
      <button class="hq-btn danger" data-hqact="fire:${m.id}">PHK</button>
    </div>
    <div class="hq-salary">Gaji ${m.salary}g/hari</div>
  </div>`;
}

function candCard(c) {
  const t = TRAITS[c.trait] || {};
  return `
  <div class="hq-cand">
    <b>${c.name}</b> <span class="hq-trait">${t.label || c.trait}</span>
    <p class="hq-cv">"${(t.cv || "").replace(/"/g, "")}"</p>
    <button class="hq-btn primary" data-hqact="talk:${c.id}">Wawancara</button>
  </div>`;
}

function factionPanel(s) {
  const mod = modifiers(s);
  const rows = FAC_KEYS.map(k => {
    const v = Math.round(facValue(s, k));
    const w = statusWord(v);
    return `<div class="hq-fax-row"><span class="hq-fax-name">${FAC_LABEL[k]}</span><div class="hq-bar fax"><i class="${w.cls}" style="width:${clamp(v, 0, 100)}%"></i></div><b class="${w.cls}">${w.txt}</b></div>`;
  }).join("");
  const note = `Payroll x${mod.payrollMul.toFixed(2)} · Zirah hero x${mod.heroRageMul.toFixed(2)} · Kelonggaran audit ${Math.round(mod.hqLeniency * 100)}%`;
  return { rows, note };
}

function factionHtml(s) {
  const f = factionPanel(s);
  return `
  <h3 class="hq-title">Relasi Faksi</h3>
  <div class="hq-fax glass">
    <div id="hq-fax-rows">${f.rows}</div>
    <div class="hq-fax-note" id="hq-fax-note">${f.note}</div>
  </div>`;
}

function body(s) {
  const sim = simStatus();
  const mc = s.minionsCorp;
  const season = activeSeason(sim.day);
  const payroll = mc.hired.reduce((a, m) => a + (m.salary || 0), 0);
  const strikes = mc.hired.filter(m => m.mogok).length;
  const reports = [...(s.economy.reports || [])].reverse().slice(0, 3);
  return `
  <div id="hq-root" class="hq-wrap">
    <div class="hq-clock glass">
      <div class="hq-phase">${PHASE_ICON[sim.phase] || "🕒"} <b id="hq-phase-txt">${sim.phase.toUpperCase()}</b></div>
      <div class="hq-opday">Hari Operasional <b id="hq-opday">#${sim.day}</b></div>
      <div class="hq-controls">
        <button class="hq-btn ${sim.paused ? "" : "primary"}" id="hq-pause">${sim.paused ? "▶ Lanjut" : "⏸ Jeda"}</button>
        <button class="hq-btn" id="hq-speed">${sim.speed}x</button>
      </div>
    </div>

    ${season.id !== "biasa" ? `<div class="hq-season">📅 ${season.name} — ${season.line}</div>` : ""}
    ${strikes ? `<div class="hq-strikebar">🪧 ${strikes} minion mogok. Penuhi morale mereka sebelum spanduk membesar.</div>` : ""}

    <div class="hq-ledger glass">
      <div><span>Kas (dompet global)</span><b id="hq-kas">${s.stats.gold}g</b></div>
      <div><span>Masuk hari ini (semua sumber)</span><b id="hq-inc" class="good">+${s.economy.incomeToday}g</b></div>
      <div><span>Keluar hari ini (semua sumber)</span><b id="hq-exp" class="bad">-${s.economy.expenseToday}g</b></div>
      <div><span>Payroll per gajian</span><b>${payroll}g</b></div>
    </div>

    <h3 class="hq-title">Roster (${mc.hired.length})</h3>
    <div class="hq-roster" id="hq-roster">${mc.hired.map(minionCard).join("") || '<p class="empty">Belum ada pegawai. Berani jadi majikan tanpa karyawan?</p>'}</div>

    ${factionHtml(s)}

    <h3 class="hq-title">Kandidat HRD</h3>
    <div class="hq-cands" id="hq-cands">${mc.candidates.map(candCard).join("") || '<p class="empty">Pool pelamar kosong. Dunia sempit, dungeon luas.</p>'}</div>

    <h3 class="hq-title">Laporan Keuangan</h3>
    <div class="hq-reports" id="hq-reports">
      ${reports.map(r => `<div class="hq-report ${r.net >= 0 ? "" : "neg"}">Op#${r.opDay} · masuk +${r.income}g · gaji -${r.payroll}g · <b>net ${r.net >= 0 ? "+" : ""}${r.net}g</b>${r.paid ? "" : ' · <span class="bad">GAJI TELAT</span>'}</div>`).join("") || '<p class="empty">Laporan pertama keluar besok pagi. Siapkan hati.</p>'}
    </div>
  </div>`;
}

function ask(i, answers, cid, done) {
  if (i >= INTERVIEW_Q.length) { done(answers); return; }
  const q = INTERVIEW_Q[i];
  choiceModal(`Wawancara (${i + 1}/${INTERVIEW_Q.length}) — ${q.q}`,
    `<p class="modal-satir">Jawab jujur. HRD mencatat, tapi tidak pernah membaca.</p>`,
    q.opts.map(label => ({ label })),
    (pickIdx) => {
      answers.push(pickIdx);
      ask(i + 1, answers, cid, done);
    });
}

function wire(root, handlers) {
  lastHandlers = handlers;
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-hqact], #hq-pause, #hq-speed");
    if (!btn) return;
    const act = btn.dataset.hqact;
    if (btn.id === "hq-pause") { togglePause(); updateHud(); return; }
    if (btn.id === "hq-speed") { cycleSpeed(); updateHud(); return; }
    if (!act) return;
    const [kind, id] = act.split(":");
    if (kind === "job") cycleJob(id);
    else if (kind === "rest") toggleRest(id);
    else if (kind === "fire") {
      const m = getState().minionsCorp.hired.find(x => x.id === id);
      if (!m) return;
      choiceModal("Surat PHK", `<p>PHK <b>${m.name}</b>? Serikat akan mengingat ini lebih lama daripada kamu mengingat alasanmu.</p>`,
        [{ label: "PHK", run: () => fire(id) }, { label: "Batal", run: () => {} }]);
    } else if (kind === "talk") {
      ask(0, [], id, (answers) => {
        let score = 0;
        answers.forEach(a => { if (a === 1) score++; }); // jawaban tengah = pragmatis, disukai HQ
        hire(id, clamp(score - 1, 0, 2));
      });
    }
  });

  // Live patch angka tanpa rebuild penuh (listener tunggal, modul-level).
  activeRoot = root;
  onBus();
}

function updateHud() {
  const s = getState();
  const sim = simStatus();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };
  set("hq-phase-txt", (sim.paused ? "⏸ JEDA · " : (PHASE_ICON[sim.phase] || "🕒") + " ") + sim.phase.toUpperCase());
  set("hq-opday", `#${sim.day}`);
  const kEl = document.getElementById("hq-kas");
  if (kEl) {
    const txt = `${s.stats.gold}g`;
    // Juice kecil: angka kas memantul saat berubah (mati di Mode Hemat).
    if (lastKas !== null && lastKas !== txt && !document.body.classList.contains("perf")) {
      kEl.classList.remove("bump"); void kEl.offsetWidth; kEl.classList.add("bump");
    }
    lastKas = txt;
    kEl.textContent = txt;
  }
  set("hq-inc", `+${s.economy.incomeToday}g`);
  set("hq-exp", `-${s.economy.expenseToday}g`);
  const p = document.getElementById("hq-pause");
  if (p) p.textContent = sim.paused ? "▶ Lanjut" : "⏸ Jeda";
  const sp = document.getElementById("hq-speed");
  if (sp) sp.textContent = `${sim.speed}x`;
}

function renderDynamic(root) {
  const s = getState();
  const r = root.querySelector("#hq-roster");
  const c = root.querySelector("#hq-cands");
  const rep = root.querySelector("#hq-reports");
  if (r) r.innerHTML = s.minionsCorp.hired.map(minionCard).join("") || '<p class="empty">Belum ada pegawai.</p>';
  if (c) c.innerHTML = s.minionsCorp.candidates.map(candCard).join("") || '<p class="empty">Pool pelamar kosong.</p>';
  const faxRows = root.querySelector("#hq-fax-rows");
  const faxNote = root.querySelector("#hq-fax-note");
  if (faxRows && faxNote) {
    const f = factionPanel(s);
    faxRows.innerHTML = f.rows;
    faxNote.textContent = f.note;
  }
  if (rep) {
    const reports = [...(s.economy.reports || [])].reverse().slice(0, 3);
    rep.innerHTML = reports.map(x => `<div class="hq-report ${x.net >= 0 ? "" : "neg"}">Op#${x.opDay} · masuk +${x.income}g · gaji -${x.payroll}g · <b>net ${x.net >= 0 ? "+" : ""}${x.net}g</b>${x.paid ? "" : ' · <span class="bad">GAJI TELAT</span>'}</div>`).join("") || rep.innerHTML;
  }
}

export const hqOps = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#hq-root");
    if (!root) return;
    wire(root, handlers);
  }
});
