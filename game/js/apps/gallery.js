// BawangPedia v2 — APP RENEWAL W5. Layout majalah: cover story, kolom editorial
// berkategori, & kotak meme pembaca. Data tetap dari content/memes.js.
import { MEMES } from "../content/memes.js";
import { subnav, bindSubnav, currentSubnav } from "../ui/kit/elements.js";

const COLUMNS = [
  { cat: "Ekonomi",  kicker: "OPINI", head: "Gold Naik, Daya Beli Minion Turun: Studi Kasus Satu Lorong", body: "HQ menyebut inflasi 'normal'. Minion menyebut makan malam 'kenangan'." },
  { cat: "Politik",  kicker: "Investigasi", head: "Di Mana Mentri King Mouse? Teori Terbaru: Dia WF", body: "Sejak 2019 tidak ada yang melihatnya di ruangan. Absennya selalu lengkap dengan surat dokter bermaterai." },
  { cat: "Kuliner",  kicker: "RESERVASI DAPUR", head: "5 Menu Neraka yang Bikin Hero Balik Lagi (Sekedar untuk Komplain)", body: "Nomor 3 mengejutkan semua ahli gizi: itu air." },
  { cat: "Absurd",   kicker: "LENSA LORONG", head: "Goblin Terekam Kamera Menari Gemoy; HQ Klaim Itu Latihan Militer", body: "'Koreografinya rapi,' kata analis. 'Terlalu rapi,' jawab publik." },
  { cat: "Teknologi", kicker: "REVIEW", head: "CCTV Pro: Bisa Melihat Semua, Kecuali Masalah Utamamu", body: "Fitur zoom 8x. Fitur lupa: tidak ada." },
  { cat: "Ekonomi",  kicker: "DATA", head: "Riset: 9 dari 10 Minion Lebih Percaya Spanduk daripada Laporan Keuangan", body: "Satu sisanya tidak bisa membaca. Ia percaya spanduk juga." }
];
const CATS = ["Semua", "Ekonomi", "Politik", "Kuliner", "Absurd", "Teknologi"];

function body(s) {
  const cat = currentSubnav("bawangpedia", "Semua");
  const cols = COLUMNS.filter(c => cat === "Semua" || c.cat === cat);
  const reader = MEMES.slice(0, 8);
  return `
  <div id="bp-root" class="bp-wrap">
    <div class="bp-cover glass">
      <div class="bp-mast">🧅 BAWANGPEDIA</div>
      <h1 class="bp-head">${MEMES[0]}</h1>
      <div class="bp-cover-meta">Edisi khusus · Laporan utama redaksi lorong · Gratis (karena pembacanya tidak pernah bayar pajak)</div>
    </div>
    ${subnav("bawangpedia", cat, CATS.map(k => ({ k, label: k })))}
    <div class="bp-grid">
      ${cols.map(c => `
      <article class="bp-article">
        <span class="bp-kicker">${c.kicker} · ${c.cat}</span>
        <h2>${c.head}</h2>
        <p>${c.body}</p>
      </article>`).join("")}
    </div>
    <h3 class="hq-title">📬 Kotak Meme Pembaca</h3>
    <div class="bp-reader">
      ${reader.map(m => `<div class="bp-meme">${m}</div>`).join("")}
    </div>
    <div class="mono-foot">BawangPedia berdiri sejak era v0.3.0. Redaksi tidak bertanggung jawab atas fakta yang terasa terlalu nyata.</div>
  </div>`;
}

export const bawangpedia = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#bp-root");
    if (!root) return;
    bindSubnav(root, handlers);
  }
});
