// Monopoli — APP RENEWAL v1.1. BUKAN game: ini gimmick sarkas premium.
// Kota Dungeon dijual duluan sebelum dibangun. Countdown rilis selalu reset.
import { getState } from "../state.js";
import { mgSession } from "../ui/kit/mg.js";
import { openSheet } from "../ui/kit/sheet.js";
import { toast } from "../ui/toast.js";

const PLOTS = [
  { emo: "🏠", name: "Perumahan Slime Asri",     tag: "SOLD OUT*", note: "Huniannya lengket tapi terjangkau." },
  { emo: "🏭", name: "Kawasan Industri Bawang",  tag: "SOLD OUT*", note: "Bau khas, nilai jual tinggi." },
  { emo: "🏬", name: "Lorong Komersial Mogok Raya", tag: "SIAP BANGUN*", note: "Potensi cuan tiap ada unjuk rasa." },
  { emo: "🏰", name: "Kastil HQ Cabang Ke-404",  tag: "SOLD OUT*", note: "Dibeli investor misterius. Tunai." },
  { emo: "🕳️", name: "Tanah Kehampaan Blok C",   tag: "PRE-LAUNCH*", note: "Isinya tidak ada. Harga tetap naik." },
  { emo: "👑🐭", name: "Petak ???",               tag: "DICARI", note: "Pemiliknya sudah lama tidak bayar pajak." }
];

const EXCUSES = [
  "Server pre-order ikut mogok bersama serikat. Solidaritas.",
  "Mentri King Mouse memegang satu-satunya kunci gudang unit.",
  "Unit terakhir baru saja dibeli tunai oleh 'investor berjubah'.",
  "Sistem kami sedang diaudit. Oleh siapa? Belum jelas.",
  "Stok habis. Untungnya stok kami memang belum pernah ada.",
  "Sedang menunggu izin IMB dari HQ. Estimasi: generasi depan."
];

const TESTI = [
  { who: "M. King Mouse", txt: "Saya sudah pre-order. Dari dalam." },
  { who: "Grem",          txt: "Properti terbaik adalah yang tidak jelas keberadaannya. Lima bintang." },
  { who: "Bowo (rajin)",  txt: "Saya beli rumah di sini dengan cicilan 400 tahun. HRD bilang wajar." }
];

let cdTimer = null;   // countdown tunggal modul-level
let attempts = 0;

function body(s) {
  return `
  <div id="mono-root" class="mono-wrap">
    <p class="app-lead">MONOPOLI: KOTA DUNGEON EDITION — properti masa depan untuk bos yang optimis berlebihan.</p>

    <div class="mono-whisper">
      <span class="wh-emo">🤫</span>
      <span>"Konon kabarnya ada orang yang bermain sampai <b>20 putaran</b> gak kelar-kelar."</span>
    </div>

    <div class="mono-city">
      ${PLOTS.map(p => `
        <div class="mono-plot ${p.tag === "DICARI" ? "wanted" : ""}">
          <span class="mp-emo">${p.emo}</span>
          <b>${p.name}</b>
          <span class="mp-tag">${p.tag}</span>
          <span class="mp-note">${p.note}</span>
        </div>`).join("")}
    </div>

    <div class="mono-billboard glass">
      <div class="mono-bill-title">🚧 GRAND LAUNCH DALAM:</div>
      <div class="mono-cd" id="mono-cd">99:59:59</div>
      <div class="mono-note" id="mono-note">Angka ini past, present & future sekaligus.</div>
    </div>

    <button class="action-btn mono-pre" id="mono-pre">🏷️ PRE-ORDER SEKARANG (DP 0%)</button>
    <div class="db-comment">Percobaan gagal: <b id="mono-attempt">${attempts}</b> — angka ini satu-satunya yang tumbuh konsisten.</div>

    <h3 class="hq-title">Testimoni Pembeli Terpercaya</h3>
    <div class="mono-testi">
      ${TESTI.map(t => `<div class="mono-quote">"${t.txt}"<span>— ${t.who}</span></div>`).join("")}
    </div>

    <div class="mono-foot">*dalam pengembangan sejak 2019. Estimasi rampung: tepat saat gaji minion cair tanpa drama. Syarat & ketentuan ditulis font 2px.</div>
  </div>`;
}

function startCountdown(root) {
  if (cdTimer) return;
  const el = root.querySelector("#mono-cd");
  const note = root.querySelector("#mono-note");
  let left = 99 * 3600 + 59 * 60 + 59;
  const sess = mgSession(root);
  cdTimer = sess.interval(() => {
    if (!document.contains(el)) { sess.end(); cdTimer = null; return; }
    left--;
    if (left <= 0) {
      left = 99 * 3600 + 59 * 60 + 59;
      note.textContent = "Rilis mundur. Lagi. Tradisi.";
      root.querySelector("#mono-root")?.classList.remove("flash");
    }
    const h = String(Math.floor(left / 3600)).padStart(2, "0");
    const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
    const sec = String(left % 60).padStart(2, "0");
    el.textContent = `${h}:${m}:${sec}`;
  }, 1000);
}

export const monopoliApp = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#mono-root");
    if (!root) return;
    startCountdown(root);
    root.addEventListener("click", (e) => {
      if (!e.target.closest("#mono-pre")) return;
      attempts++;
      const attEl = root.querySelector("#mono-attempt");
      if (attEl) attEl.textContent = attempts;
      openSheet({
        title: "Pre-order Gagal 😔",
        html: `<p>${EXCUSES[Math.floor(Math.random() * EXCUSES.length)]}</p>
               <p class="modal-satir">DP kamu aman karena memang tidak pernah kami terima.</p>`,
        actions: [
          { label: "Coba lagi (pasti sama)", run: () => {} },
          { label: "Lapor Mentri King Mouse", run: () => toast("Laporan diteruskan ke... laci kosong.", { ico: "coin", cls: "" }) }
        ]
      });
    });
  }
});
