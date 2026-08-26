// Sistem MinionCorp — roster operasional (Fase 1).
import { getState, mutate, addNotification } from "../state.js";
import { toast } from "../ui/toast.js";
import { on } from "../core/eventBus.js";
import { TRAITS, MINION_POOL } from "../content/minions.js";
import { JOBS, JOB_ORDER } from "../content/jobs.js";
import { activeBuffs } from "../content/runes.js";
import { emit } from "../core/eventBus.js";

export function salaryOf(trait) { return (TRAITS[trait] || { salary: 15 }).salary; }
export function traitLabel(trait) { return (TRAITS[trait] || { label: trait }).label; }

function hiredList(s) { return (s.minionsCorp && s.minionsCorp.hired) || []; }

export function refreshCandidates() {
  mutate(st => {
    const mc = st.minionsCorp;
    const taken = new Set(mc.hired.map(m => m.id));
    const pool = MINION_POOL.filter(p => !taken.has(p.id));
    const picks = [];
    while (picks.length < 3 && pool.length) {
      picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    // Kandidat rahasia: sosok berjubah muncul setelah Op#6 (sekali per save, kecuali mode pemburuan).
    const opDay = (st.sim && st.sim.day) || 1;
    if (!taken.has("p_mkm") && !st.flags.mkmOffered && !st.flags.mkmHired && opDay >= 6) {
      const chance = st.flags.mkmBoost ? 0.5 : 0.15;
      if (Math.random() < chance) {
        picks.push({ id: "p_mkm", name: "M. King Mouse", trait: "legendaris" });
        st.flags.mkmOffered = true;
      }
    }
    mc.candidates = picks.map(p => ({ ...p }));
  });
}

// Jawaban wawancara -> skor kesesuaian (0..2). Tidak ada jawaban salah, cuma lucu.
export function scoreInterview(answers) {
  let sc = 1;
  if (answers.includes(1)) sc++;           // "nggak banyak tanya" = disukai HQ
  if (answers.includes("mogok_rutin")) sc--;
  return Math.max(0, Math.min(2, sc));
}

export function hire(candidateId, bonusMorale) {
  let name = null;
  mutate(st => {
    const mc = st.minionsCorp;
    const idx = mc.candidates.findIndex(c => c.id === candidateId);
    if (idx < 0) return;
    const c = mc.candidates.splice(idx, 1)[0];
    const t = TRAITS[c.trait] || {};
    mc.hired.push({
      id: "w" + (++mc.seq),
      name: c.name, trait: c.trait,
      salary: t.salary || 15,
      stamina: 100, morale: Math.max(20, 60 + bonusMorale * 10),
      job: "nganggur", resting: false, mogok: false,
      joined: (st.sim && st.sim.day) || 1
    });
    if (c.id === "p_mkm") { st.flags.mkmHired = true; emit("social", { kind: "hire", text: "Sosok berjubah diterima kerja. HRD menandatangani dengan tangan gemetar." }); }
    else emit("social", { kind: "hire", text: `${c.name} bergabung (${traitLabel(c.trait)}). CV-nya langsung di-frame.` });
    name = c.name;
  });
  if (name) toast(`${name} resmi jadi aset perusahaan. Selamat bergabung dalam utang.`, { ico: "minion", cls: "toast-ok" });
}

export function fire(minionId) {
  let info = null;
  mutate(st => {
    const mc = st.minionsCorp;
    const idx = mc.hired.findIndex(m => m.id === minionId);
    if (idx < 0) return;
    const [m] = mc.hired.splice(idx, 1);
    info = m;
    if (st.factions) st.factions.serikat = Math.max(0, (st.factions.serikat || 50) - 8);
    mc.hired.forEach(o => { o.morale = Math.max(0, o.morale - 4); });
  });
  if (info) {
    emit("social", { kind: "fired", text: `${info.name} di-PHK. Serikat mencatat namamu dua kali.` });
    toast(`PHK ${info.name}. Serikat mencatat namamu di spanduk.`, { ico: "minion", cls: "toast-bad" });
    emit("minions:changed", {});
  }
}

export function cycleJob(minionId) {
  mutate(st => {
    const m = hiredList(st).find(x => x.id === minionId);
    if (!m) return;
    const i = JOB_ORDER.indexOf(m.job);
    m.job = JOB_ORDER[(i + 1) % JOB_ORDER.length];
    if (m.job !== "nganggur") { m.resting = false; m.mogok = false; }
  });
  emit("minions:changed", {});
}

export function toggleRest(minionId) {
  mutate(st => {
    const m = hiredList(st).find(x => x.id === minionId);
    if (!m) return;
    m.resting = !m.resting;
    if (m.resting) m.job = "nganggur";
  });
  emit("minions:changed", {});
}

// Per-fase: kerja menghasilkan lelah; mogok menular kalau morale hancur.
function phaseTick() {
  mutate(st => {
    const mc = st.minionsCorp;
    let anyStrike = false;
    for (const m of mc.hired) {
      const working = m.job !== "nganggur" && !m.resting && !m.mogok && m.stamina > 0;
      if (working) {
        m.stamina = Math.max(0, m.stamina - 6);
        if (m.stamina < 25) m.morale = Math.max(0, m.morale - 2);
      } else if (m.resting || m.job === "nganggur") {
        m.stamina = Math.min(100, m.stamina + 3);
        m.morale = Math.min(100, m.morale + 1);
      }
      if (!m.mogok && m.morale < 15) {
        m.mogok = true;
        if (st.factions) st.factions.serikat = Math.min(100, (st.factions.serikat || 50) + 5);
        emit("social", { kind: "strike", text: `${m.name} resmi mogok. Alasan resmi: 'kamu tahu deh'.` });
        toast(`${m.name} mogok! Spanduk sudah dicetak sebelum keputusan diambil.`, { ico: "union", cls: "toast-bad" });
      }
      if (m.mogok && m.morale >= 35) { m.mogok = false; toast(`${m.name} kembali bekerja. Syaratnya: jangan dibahas lagi.`, { ico: "minion", cls: "toast-ok" }); }
      if (m.mogok) anyStrike = true;
    }
    if (anyStrike && st.stats) st.stats.morale = Math.max(0, (st.stats.morale || 50));
    // Artefak Rune Semangat: morale pasif per-fase.
    const mb = activeBuffs(st).moralePerPhase;
    if (mb > 0) for (const m of mc.hired) m.morale = Math.min(100, m.morale + mb);
  });
}

// Harian: gajian, pemulihan, laporan.
function daySettle({ day }) {
  mutate(st => {
    const eco = st.economy, mc = st.minionsCorp;
    const payrollMul = st.flags.payrollMul || 1;
    const payroll = Math.round(mc.hired.reduce((a, m) => a + (m.salary || 0), 0) * payrollMul);
    const paid = st.stats.gold >= payroll;
    // Gold dipotong di sini; pencatatan ledger dilakukan ekonomi via rekonsiliasi delta.
    st.stats.gold = Math.max(0, st.stats.gold - payroll);
    eco.lastPayroll = payroll;
    eco.lastPaid = paid;
    eco.unpaidStreak = paid ? 0 : (eco.unpaidStreak || 0) + 1;
    for (const m of mc.hired) {
      m.stamina = Math.min(100, m.stamina + (paid ? 30 : 10));
      m.morale = Math.min(100, m.morale + (paid ? 12 : -18));
      if (!paid && m.morale < 15) m.mogok = true;
    }
    // Laporan & reset bucket dikerjakan economy.closeBook (setelah listener ini).
    if (!paid) {
      addNotifLate(day);
      toast(`GAGAL GAJIAN hari operasional ${day}! Kas kurang ${payroll}g. Morale anjlok, serikat senyum senyum.`, { ico: "coin", cls: "toast-bad" });
    }
  });
  refreshCandidates();
  emit("econ:report", { day, paid, payroll });
}

function addNotifLate(day) {
  addNotification("dungeonhub", `Gaji Telat #${day}`, "HQ bilang 'sedang diproses'. Minion bilang 'kami juga sedang memproses mogok'.");
}

let bound = false;
export function initMinionSystems() {
  if (bound) return;
  bound = true;
  on("sim:phase", phaseTick);
  on("sim:newDay", daySettle);
  if ((getState().minionsCorp?.candidates || []).length === 0) refreshCandidates();
}
