// Ramalan v2 (W4) — tiga kartu tarot yang membaca DATA LEDGER beneran.
import { getState } from "../state.js";
import { forecast } from "../systems/forecast.js";

function body(s) {
  const f = forecast(s);
  const kasCard = {
    emo: f.direction === "NAIK" ? "📈" : f.direction === "TURUN" ? "📉" : "➖",
    title: "Kartu Kas",
    txt: `Net rata-rata ±${Math.abs(f.avgNet)}g. Tren ${f.direction}.${f.daysToMinus != null ? ` Perkiraan minus dalam ~${f.daysToMinus} hari operasional.` : ""}`
  };
  const serikatCard = {
    emo: f.strikeRisk > 0 ? "🪧" : "🕊️",
    title: "Kartu Serikat",
    txt: f.strikeRisk > 0
      ? `${f.strikeRisk} jiwa di ambang spanduk. Angin membawa aroma lem poster.`
      : "Udara bersih. Tidak ada yang menulis memo hari ini. Nikmati."
  };
  const langitCard = {
    emo: f.nextSeason.hpMul > 1 ? "🌕" : "📅",
    title: "Kartu Langit-Lorong",
    txt: `Besok: ${f.nextSeason.name}. ${f.nextSeason.line}`
  };
  const card = c => `
    <div class="rm-card glass">
      <span class="rm-emo">${c.emo}</span>
      <b>${c.title}</b>
      <p>${c.txt}</p>
    </div>`;
  return `
  <div id="rm-root" class="rm-wrap">
    <p class="app-lead">Ramalan — bukan mistis. Kami hanya membaca pembukuanmu dengan nada misterius.</p>
    <div class="rm-grid">${card(kasCard)}${card(serikatCard)}${card(langitCard)}</div>
    <div class="db-comment">Akurasi ramalan: tinggi. Karena sumbernya... kamu sendiri. Menyeramkan? Setuju.</div>
  </div>`;
}

export const ramalan = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {}
});
