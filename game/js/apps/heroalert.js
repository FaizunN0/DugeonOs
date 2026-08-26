// HeroAlert v2 — APP RENEWAL W3. Radar ancaman nyata + Interogasi Kartu Bukti
// (input diskrit & bisa dipelajari: mood di kartu -> pendekatan yang tepat).
import { getState, mutate } from "../state.js";
import { toast } from "../ui/toast.js";
import { emptyState } from "../ui/kit/elements.js";
import { openSheet } from "../ui/kit/sheet.js";
import { modifiers } from "../systems/factions.js";
import { activeSeason } from "../content/seasons.js";
import { MOODS, APPROACH, CARDS, ROUNDS, REWARD_PER_CORRECT, SUSPECT_NAMES } from "../content/interrogate.js";
import { emit } from "../core/eventBus.js";

let pool = null;   // 3 tersangka hari ini
let game = null;   // sesi interogasi aktif

function threatHtml(s) {
  const m = modifiers(s);
  const season = activeSeason((s.sim && s.sim.day) || 1);
  const rage = m.heroRageMul * (season.hpMul || 1);
  const w = rage >= 1.3 ? { t: "KRITIS", cls: "bad" } : rage >= 1.15 ? { t: "WASPADA", cls: "warn" } : { t: "TENANG", cls: "good" };
  const estWave = Math.max(3, 3 + Math.round((rage - 1) * 6));
  const note = w.t === "TENANG" ? "Hero lagi sibuk bikin konten. Manfaatkan untuk restock trap."
    : w.t === "KRITIS" ? "Mereka menyiapkan sesuatu. Tambah trap. Cepat."
    : "Radar berdenyut pelan. Jangan tidur terlalu nyenyak.";
  return `
  <div class="ia-radar glass">
    <div class="ia-radar-row"><span>Ancaman Guild Hero</span><b class="${w.cls}">${w.t} · zirah x${rage.toFixed(2)}</b></div>
    <div class="ia-radar-row"><span>Musim</span><b>${season.name}</b></div>
    <div class="ia-radar-row"><span>Estimasi gelombang</span><b>~${estWave} hero</b></div>
    <div class="ia-radar-note">${note}</div>
  </div>`;
}

function statsLine(s) {
  const h = s.heroalert || {};
  const lvl = 1 + Math.floor((h.wins || 0) / 3);
  return `Detektif Lv ${lvl} · Kasus ditangani ${h.cases || 0} · Sempurna ${h.wins || 0}`;
}

function pickSuspects() {
  const names = [...SUSPECT_NAMES].sort(() => Math.random() - .5).slice(0, 3);
  const moods = Object.keys(MOODS);
  return names.map(name => ({ name, mood: moods[Math.floor(Math.random() * moods.length)] }));
}

function body(s) {
  if (!pool) pool = pickSuspects();
  if (game) return interrogateBody();
  return `
  <div id="ia-root" class="ia-wrap">
    <p class="app-lead">HeroAlert — bukan refleks lagi. Baca mood tersangka, pilih pendekatan yang tepat.</p>
    ${threatHtml(s)}
    <h3 class="hq-title">Pilih tersangka untuk diinterogasi</h3>
    <div class="ia-suspects">
      ${pool.map((p, i) => `
        <button class="ia-suspect" data-pick="${i}">
          <span class="ia-mood-emo">${MOODS[p.mood].emo}</span>
          <b>${p.name}</b>
          <span class="ia-mood">Mood: ${MOODS[p.mood].label}</span>
          <span class="ia-tell">${MOODS[p.mood].tell}</span>
        </button>`).join("")}
    </div>
    <div class="db-comment">Petunjuk resmi HRD: 😡 Marah → Teh Hangat · 😅 Gugup → Tekan · 😏 Licik → Pamer Bukti. Salah pendekatan = informasi hangus.</div>
    <div class="rf-stats">${statsLine(s)}</div>
    ${emptyState("🕵️", "Belum ada kasus berjalan. Pilih tersangka di atas untuk mulai.")}
  </div>`;
}

function interrogateBody() {
  const g = game;
  const card = g.cards[g.round];
  return `
  <div id="ia-root" class="ia-wrap">
    <div class="ia-top glass">
      <span>Tersangka <b>${g.name}</b> ${MOODS[card.mood].emo}</span>
      <span>Ronde <b>${g.round + 1}/${ROUNDS}</b> · Benar <b>${g.score}</b></span>
    </div>
    <div class="ia-card glass">
      <div class="ia-card-tag">KARTU BUKTI #${g.round + 1}</div>
      <p class="ia-card-txt">${card.txt}</p>
      <div class="ia-tell-box">Tell: ${MOODS[card.mood].tell}</div>
    </div>
    <div class="ia-approaches">
      ${Object.entries(APPROACH).map(([k, a]) => `
        <button class="ia-appr" data-appr="${k}">
          <span class="ia-appr-emo">${a.emo}</span><b>${a.label}</b><small>${a.desc}</small>
        </button>`).join("")}
    </div>
    <div class="ia-feedback" id="ia-feedback"></div>
  </div>`;
}

function startGame(i) {
  const p = pool[i];
  game = {
    name: p.name,
    cards: [...CARDS].sort(() => Math.random() - .5).slice(0, ROUNDS),
    round: 0, score: 0
  };
  pool = null; // susunan kasus terkunci sampai selesai
}

function finish(handlers) {
  const g = game;
  const score = g.score;
  const rewardG = score * REWARD_PER_CORRECT.g;
  const rewardLoot = score * REWARD_PER_CORRECT.loot;
  mutate(st => {
    st.stats.gold += rewardG;
    st.stats.loot += rewardLoot;
    st.heroalert.cases = (st.heroalert.cases || 0) + 1;
    if (score >= 4) st.heroalert.wins = (st.heroalert.wins || 0) + 1;
    if (st.factions) st.factions.hero = Math.max(0, (st.factions.hero || 50) - 1);
    if (score >= 4 && st.factions) st.factions.hq = Math.min(100, (st.factions.hq || 50) + 2);
  });
  emit("social", { kind: "chapter", text: `Interogasi ${g.name} selesai: ${score}/${ROUNDS} pendekatan tepat.` });
  game = null;
  openSheet({
    title: `Hasil Interogasi — ${score}/${ROUNDS}`,
    html: `<p>Informasi dicairkan: <b>+${rewardG}g</b> · <b>+${rewardLoot} loot</b></p>
           <p>${score >= 4 ? "Kasus ditutup sempurna. HQ memberi apresiasi (dan ongkos teh)." : "Setengah benar. Tersangka pulang dengan senyum menyebalkan."}</p>
           <p class="modal-satir">Guild Hero menurunkan trust-mu -1. Standar. Mereka juga menurunkan trust ke musuhmu.</p>`,
    actions: [{ label: "Kembali ke radar", run: () => handlers.rerender() }]
  });
}

function answer(root, handlers, key) {
  const g = game;
  if (!g) return;
  const card = g.cards[g.round];
  const fb = root.querySelector("#ia-feedback");
  const correct = MOODS[card.mood].best === key;
  if (correct) { g.score++; toast("Pendekatan tepat! Dia bicara.", { ico: "heroalert", cls: "toast-ok" }); }
  else toast("Salah sasaran. Dia malah minta pengacara lain.", { ico: "heroalert", cls: "toast-bad" });
  if (fb) {
    fb.textContent = correct ? "✅ Buka mulut. Data masuk." : "❌ Informasi hangus untuk ronde ini.";
    fb.className = "ia-feedback " + (correct ? "ok" : "bad");
  }
  g.round++;
  if (g.round >= ROUNDS) finish(handlers);
  else handlers.rerender();
}

export const heroalert = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#ia-root");
    if (!root) return;
    root.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-pick]");
      if (pick) { startGame(Number(pick.dataset.pick)); handlers.rerender(); return; }
      const appr = e.target.closest("[data-appr]");
      if (appr) answer(root, handlers, appr.dataset.appr);
    });
  }
});
