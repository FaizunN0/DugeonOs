import { icon } from "./icons.js";
import { finale, staggerIn, confettiBurst } from "./anim.js";
import { Lib, Sound } from "../lib.js";

const TONE = {
  "biasa": { label: "Ending Biasa", ico: "star" },
  "unik": { label: "Ending Unik", ico: "sparkle" },
  "anomali": { label: "Anomali", ico: "skull" },
  "plot-twist": { label: "Plot Twist", ico: "skull" },
  "nested-twist": { label: "Plot Twist Berlapis", ico: "skull" },
  "kreatif": { label: "Ending Kreatif", ico: "sparkle" },
  "koplak": { label: "Ending Koplak", ico: "skull" }
};

function verdictOf(st) {
  const pwr = st.unionPower, mor = st.morale, sta = st.stability, rep = st.reputation, gold = st.gold;
  let label, desc;
  if (pwr >= 75) { label = "Pemimpin Legendaris"; desc = "Minion menyanyikan namamu di lorong."; }
  else if (mor >= 65) { label = "Idola Minion"; desc = "Mereka rela mati demi jadwal kerja."; }
  else if (sta >= 65) { label = "Bos yang Teratur"; desc = "Dungeon jalan, hero bingung."; }
  else if (gold >= 350) { label = "Kaya tapi Dibenci"; desc = "Brankas penuh, hati kosong."; }
  else if (rep <= 30) { label = "Bos Tirani"; desc = "Sindikat mencatatmu sebagai contoh buruk."; }
  else { label = "Bos Biasa yang Lolos"; desc = "Hari ini selamat, besok entah."; }
  return `<div class="verdict-k">Verdict</div><div class="verdict-label">${label}</div><div class="verdict-desc">${desc}</div>`;
}

export function renderEnding(screen, state, handlers) {
  const ending = state.currentEnding;

  if (!ending) {
    screen.innerHTML = `<div class="ending"><p>Ending tidak ditemukan.</p></div>`;
    return;
  }

  const tone = TONE[ending.tone] || TONE["biasa"];

  const paragraphs = (ending.body || [])
    .map((text, i) => `<p style="animation-delay:${0.15 + i * 0.1}s">${text}</p>`)
    .join("");

  const history = (state.choiceHistory || [])
    .slice(-6)
    .map(c => `<li>Hari ${c.day} (${c.phase}): ${c.choice}</li>`)
    .join("");

  const st = state.stats;
  const bar = (k, v, max) => `<div class="recap-row"><span class="recap-k">${k}</span><div class="recap-bar"><span style="width:${Math.max(4, Math.min(100, (v / max) * 100))}%"></span></div><b>${Math.round(v)}</b></div>`;
  const recap = `
    <div class="ending-recap">
      <div class="recap-chip">${icon("coin")} ${st.gold}g</div>
      <div class="recap-chip">${icon("scroll")} ${st.loot} loot</div>
      ${bar("Morale", st.morale, 100)}
      ${bar("Stability", st.stability, 100)}
      ${bar("Reputation", st.reputation, 100)}
      ${bar("Union Power", st.unionPower, 100)}
    </div>`;

  const verdict = verdictOf(st);

  screen.innerHTML = `
    <div class="ending ${ending.tone === "nested-twist" ? "glitch" : ""}">
      <div class="ending-hero badge-${ending.tone}">
        <div class="ending-emblem">${icon(tone.ico)}</div>
        <div class="ending-badge">${tone.label}</div>
      </div>
      <h1 class="ending-title">${ending.title}</h1>
      <div class="ending-tag">${ending.tag}</div>

      <div class="ending-verdict">${verdict}</div>

      <div class="ending-body">${paragraphs}</div>

      ${recap}

      ${
        history
          ? `<details class="ending-history"><summary>Jejak pilihanmu</summary><ul>${history}</ul></details>`
          : ""
      }

      <button id="share-end" class="ghost-btn share">${icon("gallery")} Bagikan sebagai gambar</button>
      <button id="restart" class="primary-btn">${icon("restart")} Mulai Ulang Dungeon</button>
      <footer class="home-footer">DUNGEONOS v0.3.0 — EVIL MANAGEMENT SUITE</footer>
    </div>
  `;

  screen.querySelector("#restart").addEventListener("click", () => handlers.restart());
  const share = screen.querySelector("#share-end");
  if (share) share.addEventListener("click", async () => {
    const h2c = Lib.html2canvas;
    const target = screen.querySelector(".ending");
    if (!h2c || !target) { share.textContent = "Fitur share butuh koneksi online."; return; }
    try {
      share.textContent = "Memproses...";
      const canvas = await h2c(target, { backgroundColor: "#0d0720", scale: 2, logging: false });
      const a = document.createElement("a");
      a.download = "dungeonos-ending.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
      share.textContent = "Tersimpan! 🖼️";
    } catch (e) { share.textContent = "Gagal memproses gambar."; }
  });

  staggerIn(screen.querySelectorAll(".recap-item"), { base: 0.3, step: 0.06 });
  finale(screen.querySelector(".ending-title"), ending.tone === "nested-twist" ? "glitch" : "burst");

  if (ending.tone === "koplak") {
    Sound.bad();
    confettiBurst("small");
  } else if (ending.tone === "nested-twist" || ending.tone === "anomali") {
    /* keep the eerie vibe — no confetti */
  } else if (ending.tone === "biasa") {
    confettiBurst("small");
  } else {
    confettiBurst("good");
  }
  if (ending.tone !== "nested-twist" && ending.tone !== "koplak") Sound.fanfare();
}
