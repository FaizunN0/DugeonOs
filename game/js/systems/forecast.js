// Mesin prediksi (W4): Ramalan & Orakel membaca DATA BENERAN, bukan teks acak.
import { getState, mutate } from "../state.js";
import { activeSeason } from "../content/seasons.js";

export function payrollOf(st) {
  const mul = st.flags.payrollMul || 1;
  return Math.round(((st.minionsCorp?.hired) || []).reduce((a, m) => a + (m.salary || 0), 0) * mul);
}

export function forecast(st) {
  const reps = (st.economy.reports || []).slice(-3);
  const avgNet = reps.length ? Math.round(reps.reduce((a, r) => a + r.net, 0) / reps.length) : 0;
  const lastIncome = reps.length ? reps[reps.length - 1].income : 0;
  const payroll = payrollOf(st);
  const hired = st.minionsCorp?.hired || [];
  const strikeRisk = hired.filter(m => m.mogok || (m.morale ?? 50) < 25).length;
  const nextSeason = activeSeason(((st.sim?.day) || 1) + 1);
  const direction = avgNet > 0 ? "NAIK" : avgNet < 0 ? "TURUN" : "DATAR";
  // Estimasi hari sampai kas minus (jika tren negatif & tak ada cadangan)
  let daysToMinus = null;
  if (avgNet < 0 && st.stats.gold > 0) daysToMinus = Math.max(1, Math.floor(st.stats.gold / -avgNet));
  return { reps, avgNet, lastIncome, payroll, strikeRisk, nextSeason, direction, daysToMinus };
}

export function orakelLine(st) {
  const f = forecast(st);
  if ((st.economy.unpaidStreak || 0) >= 2)
    return { emo: "🚨", txt: `Aku melihat dua surat: satu dari HQ, satu dari serikat. Keduanya bertanya soal gaji ${st.economy.unpaidStreak} hari terakhir.`, hint: "Bayar atau negosiasi. Jangan pura-pura sibuk." };
  if (f.strikeRisk > 0)
    return { emo: "🪧", txt: `${f.strikeRisk} jiwa di roster-mu berdiri di ambang spanduk. Aku mendengar perekat sedang dipesan.`, hint: "Naikkan morale (istirahatkan / Rune Semangat) sebelum malam." };
  if (f.direction === "TURUN" && f.daysToMinus != null)
    return { emo: "📉", txt: `Kas-mu menurun konsisten. Dengan ritme ini, lorong gelap menyapa kas di hari operasional ke-${(st.sim?.day || 1) + f.daysToMinus}.`, hint: "Potong Nganggur, genjot Dapur/Ojek, atau merger yang gemuk." };
  if (f.nextSeason.hpMul > 1)
    return { emo: "🌕", txt: `Besok langit bernama ${f.nextSeason.name}. Zirah hero menebal. Aku mencium bau napalm murah.`, hint: "Restock Trap Naga sebelum matahari terbit." };
  return { emo: "🔮", txt: `Awan-awan datar. Kas cenderung ${f.direction.toLowerCase()} dengan net ±${Math.abs(f.avgNet)}g. Membosankan — syukurilah.`, hint: "Hari biasa adalah hari termahal untuk lengah." };
}
