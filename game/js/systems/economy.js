// Sistem ekonomi operasional (Fase 1+, direbalance Fase 3.5).
// Prinsip: stats.gold adalah SATU-satunya dompet. Ledger harian dilacak lewat
// selisih saldo antar-fase sehingga SEMUA sumber (raid, app lain, cerita, trap)
// terhitung otomatis tanpa harus dicatat manual di tiap tempat.
import { getState, mutate } from "../state.js";
import { on } from "../core/eventBus.js";
import { TRAITS } from "../content/minions.js";
import { JOBS } from "../content/jobs.js";
import { activeSeason } from "../content/seasons.js";
import { activeBuffs } from "../content/runes.js";

const UPETI_PER_FASE = 2;   // upeti lorong: trickle agar ekonomi tidak mati total

// Gaji kerja per-fase dari minion yang benar-benar bekerja (x musim).
function phasePayrollWork() {
  mutate(st => {
    const season = activeSeason((st.sim && st.sim.day) || 1);
    let inc = UPETI_PER_FASE;
    const mc = st.minionsCorp;
    if (mc) {
      for (const m of mc.hired) {
        const working = m.job !== "nganggur" && !m.resting && !m.mogok && m.stamina > 0;
        if (!working) continue;
        const rate = (JOBS[m.job] || { rate: 0 }).rate;
        const mul = (TRAITS[m.trait] || { workMul: 1 }).workMul;
        const mor = 0.5 + (m.morale || 50) / 200;   // 0.5 .. 1.0
        inc += Math.max(1, Math.round((rate * mul * mor) / 4));
      }
    }
    st.stats.gold += Math.max(0, Math.round(inc * (season.incomeMul || 1) * (1 + activeBuffs(st).incomePct)));
  });
}

// Rekonsiliasi: masukkan SELURUH delta gold sejak fase lalu ke bucket hari ini.
function reconcile() {
  mutate(st => {
    const eco = st.economy;
    const g = st.stats.gold;
    if (eco._lastGold == null) { eco._lastGold = g; return; }
    const d = g - eco._lastGold;
    eco._lastGold = g;
    if (d > 0) eco.incomeToday += d;
    else if (d < 0) eco.expenseToday += (-d);
  });
}

function onPhase() { phasePayrollWork(); reconcile(); }

// Tutup buku: jalankan SETELAH gajian harian (urutan init diatur di sim.js).
function closeBook({ day }) {
  mutate(st => {
    const eco = st.economy;
    reconcileIn(st);
    eco.reports.push({
      opDay: day,
      income: eco.incomeToday,
      expense: eco.expenseToday,
      payroll: eco.lastPayroll || 0,
      paid: eco.lastPaid !== false,
      net: eco.incomeToday - eco.expenseToday
    });
    if (eco.reports.length > 7) eco.reports.shift();
    eco.incomeToday = 0;
    eco.expenseToday = 0;
    eco._lastGold = st.stats.gold;
  });
}

// versi dalam-mutate untuk dipakai closeBook
function reconcileIn(st) {
  const eco = st.economy;
  const g = st.stats.gold;
  if (eco._lastGold == null) { eco._lastGold = g; return; }
  const d = g - eco._lastGold;
  eco._lastGold = g;
  if (d > 0) eco.incomeToday += d;
  else if (d < 0) eco.expenseToday += (-d);
}

let bound = false;
export function initEconomy() {
  if (bound) return;
  bound = true;
  on("sim:phase", onPhase);
  on("sim:newDay", closeBook);
}
