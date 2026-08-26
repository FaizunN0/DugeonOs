// Bazzaar v2 — APP RENEWAL W5. Etalase premium kosong yang meyakinkan:
// belut hitam, font emas, satu produk legendaris: KOSONG SIGNATURE™.
import { getState } from "../state.js";
import { toast } from "../ui/toast.js";
import { openSheet } from "../ui/kit/sheet.js";
import { mgSession } from "../ui/kit/mg.js";

const CONCIERGE = [
  "Selamat datang di Bazzaar. Kami menjual ruang, bukan barang.",
  "Produk kami limited karena memang tidak diproduksi.",
  "Harga kami dalam satuan pengalaman. Sayangnya kas Anda gold."
];

let sess = null;

function body(s) {
  const wl = s.flags.bzWaitlist || 0;
  return `
  <div id="bz-root" class="bz-wrap">
    <p class="app-lead">BAZZAAR — butik premium DungeonOS Inc. Harga wajar, manfaat opsional.</p>

    <div class="bz-hero">
      <div class="bz-brand">BAZZAAR</div>
      <div class="bz-tagline">Luxury of the Underground</div>
      <div class="bz-tier">Status keanggotaan Anda: <b>RAKYAT</b></div>
    </div>

    <div class="bz-product">
      <div class="bz-p-badge">EDISI TERBATAS SELAMANYA</div>
      <div class="bz-p-name">KOSONG SIGNATURE™</div>
      <p class="bz-p-desc">Ruang benar-benar kosong, dirawat tiap hari oleh kurator kami. Dilengkapi ketiadaan aroma, ketiadaan suara, dan jaminan tidak ada hero yang tertarik mendekat. Investasi jiwa.</p>
      <div class="bz-price">Harga: <s>dunia</s> ??? gold</div>
      <button class="action-btn bz-wait" id="bz-wait">⏳ GABUNG WAITLIST PRESTIGE (${wl} orang)</button>
      <div class="bz-note">Waitlist dibuka sejak 2019. Belum ada yang keluar. Ada yang masuk dua kali.</div>
    </div>

    <div class="bz-soldout">
      <div class="bz-so-card"><span>👑 Paket Halu Royal</span><small>SOLD OUT</small></div>
      <div class="bz-so-card"><span>🐉 Tiket Naga Ekonomi</span><small>SOLD OUT</small></div>
      <div class="bz-so-card"><span>🧅 Warisan Bawang Suci</span><small>SOLD OUT</small></div>
    </div>

    <div class="bz-chat glass" id="bz-chat">🫖 Concierge: ${CONCIERGE[0]}</div>
    <div class="mono-foot">Bazzaar tidak menerima retur, komplain, atau harapan. Terima kasih telah berkapitalisme di bawah tanah.</div>
  </div>`;
}

export const bazzaarApp = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#bz-root");
    if (!root) return;
    let ci = 0;
    sess?.end();
    sess = mgSession(root);
    sess.interval(() => {
      const el = document.contains(root) ? root.querySelector("#bz-chat") : null;
      if (!el) return;
      ci = (ci + 1) % CONCIERGE.length;
      el.textContent = `🫖 Concierge: ${CONCIERGE[ci]}`;
    }, 5000);

    root.addEventListener("click", (e) => {
      if (!e.target.closest("#bz-wait")) return;
      mutate(st => { st.flags.bzWaitlist = (st.flags.bzWaitlist || 0) + 1; });
      toast(`Anda resmi nomor ${(getState().flags.bzWaitlist)}. Undangan akan dikirim via burung. Burungnya sedang mogok.`, { ico: "gift", cls: "" });
      handlers.rerender();
    });
  }
});
