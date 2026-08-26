// Toko Oren v2 — APP RENEWAL W2. "Murah meriah": harga coret dramatis,
// garansi 3 detik, risiko rusak ditampilkan JUJUR. CCTV service tetap di sini.
import { getState, mutate, addNotification } from "../state.js";
import { icon } from "../ui/icons.js";
import { Sound } from "../lib.js";
import { toast } from "../ui/toast.js";
import { liveGoldHtml } from "../ui/kit/live.js";
import { priceTag, emptyState } from "../ui/kit/elements.js";
import { openSheet } from "../ui/kit/sheet.js";
import { inv, addInv } from "./shared.js";

const TOKO_PRODUCTS = [
  { id: "trap_basic", name: "Trap Bawang", icon: "trapmart", price: 30, oldPrice: null, cheap: false, desc: "Jebakan klasik. Selalu jalan." },
  { id: "trap_spike", name: "Trap Duri", icon: "trapmart", price: 55, oldPrice: null, cheap: false, desc: "Nyiksa hero pelan-pelan, efek moral." },
  { id: "trap_illusion", name: "Trap Ilusi", icon: "trapmart", price: 80, oldPrice: null, cheap: false, desc: "Hero lupa tujuan hidup. Stabil naik." },
  { id: "potion_hp", name: "Potion HP", icon: "flask", price: 25, oldPrice: null, cheap: false, desc: "Pulihkan morale minion." },
  { id: "crystal", name: "Crystal Mana", icon: "magic", price: 40, oldPrice: 49, cheap: false, desc: "Bahan sihir murni." },
  { id: "murah1", name: "Trap 'Murah Banget'", icon: "cart", price: 8, oldPrice: 29, cheap: true, risk: 50, desc: "Murah? 50% rusak / tidak sesuai." },
  { id: "murah2", name: "Potion 'Promo 1+1'", icon: "cart", price: 12, oldPrice: 39, cheap: true, risk: 50, desc: "Kadang isinya air keran." },
  { id: "murah3", name: "Crystal 'Kw Super'", icon: "cart", price: 15, oldPrice: 49, cheap: true, risk: 60, desc: "Bersinar, tapi kosong." }
];

function body(s) {
  const t = s.tokooren || { bought: 0, broken: 0 };
  const honesty = t.bought ? Math.round(((t.bought - t.broken) / t.bought) * 100) : 100;
  return `
  <div id="to-root" class="to-wrap">
    <p class="app-lead">Toko Oren — tempatnya diskon GILA-GILAAN*. *Ketentuan berlaku sesuai mood pemilik toko.</p>
    <div class="to-banner">🔥 LELANG HABIS-PUKUL SETIAP HARI 🔥 — garansi 3 detik sejak struk keluar!</div>
    <div class="tm-topline">Kas: ${liveGoldHtml()} · Reputasi jujur toko: <b>${honesty}%</b> (${t.bought || 0} terjual / ${t.broken || 0} rusak)</div>

    <div class="to-grid">${TOKO_PRODUCTS.map(p => `
      <div class="to-card ${p.cheap ? "cheap" : ""}">
        ${p.oldPrice ? `<span class="to-deal">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : ""}
        <div class="tok-emoji">${icon(p.icon)}</div>
        <div class="tok-name">${p.name}</div>
        <div class="tok-desc">${p.desc}</div>
        ${p.risk != null ? `<div class="to-risk">⚠️ Risiko rusak ${p.risk}% — kami jujur karena tidak punya pilihan</div>` : `<div class="to-risk ok">✅ Kualitas oke (menurut kami yang menjual)</div>`}
        <div class="tok-foot">
          ${priceTag(p.price, p.oldPrice)}
          ${inv(s, p.id) ? `<span class="tok-owned">×${inv(s, p.id)}</span>` : ""}
          <button class="hq-btn primary" data-buy="${p.id}">Beli</button>
        </div>
      </div>`).join("")}</div>

    <div class="tok-svc">
      <div class="tok-svc-ico">${icon("cctv")}</div>
      <div class="tok-svc-info"><div class="tok-svc-name">CCTV Pro</div><div class="tok-svc-desc">Pantau hero &amp; pekerja. Wajib sebelum dipakai.</div></div>
      ${s.apps.cctv ? `<span class="tok-owned">OWNED</span>` : `<button class="hq-btn primary" data-buy="cctv">150g</button>`}
    </div>
    ${emptyState("🍊", "Belum puas? Keluhan dapat disampaikan ke kotak saran berupa lubang tanpa dasar.")}
  </div>`;
}

function buyFlow(handlers, id) {
  if (id === "cctv") {
    mutate(st => {
      if (st.apps.cctv) return;
      if (st.stats.gold < 150) { toast("Gold tidak cukup untuk CCTV (butuh 150g).", { ico: "coin", cls: "toast-bad" }); return; }
      st.stats.gold -= 150; st.apps.cctv = true;
      addNotification("cctv", "CCTV Terpasang", "Kamu kini bisa memantau dungeon. Buka app CCTV.");
    });
    handlers.rerender();
    return;
  }
  const p = TOKO_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  openSheet({
    title: `Beli ${p.name}?`,
    html: `${p.risk != null
      ? `<p>Harga spesial <b>${p.price}g</b>${p.oldPrice ? ` <s>${p.oldPrice}g</s>` : ""}</p>
         <p>Risiko rusak/tidak sesuai: <b>${p.risk}%</b>. Kalau kena, gold hangus tanpa ampun.</p>`
      : `<p>Harga <b>${p.price}g</b>.</p><p>Kualitas standar toko kami: layak pakai.</p>`}
      <p class="modal-satir">Garansi berakhir 3 detik setelah tombol ini ditekan. Terima kasih.</p>`,
    actions: [
      { label: `BAYAR ${p.price}g`, cls: p.cheap ? "primary" : "primary", run: () => {
          mutate(st => {
            if (st.stats.gold < p.price) { toast("Gold tidak cukup untuk " + p.name, { ico: "coin", cls: "toast-bad" }); return; }
            st.stats.gold -= p.price; st.tokooren.bought++;
            if (p.cheap && Math.random() < 0.5) {
              st.tokooren.broken++;
              toast(`${p.name} rusak/tidak sesuai! Gold hangus dengan elegan.`, { ico: "cart", cls: "toast-bad" });
            } else {
              addInv(st, p.id, 1);
              toast(`${p.name} masuk inventori. Pilihan yang... sebuah pilihan.`, { ico: "cart", cls: "toast-ok" });
            }
          });
          handlers.rerender();
        }},
      { label: "Pikir-pikir dulu", run: () => {} }
    ]
  });
}

export const tokooren = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#to-root");
    if (!root) return;
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-buy]");
      if (!b) return;
      Sound.tap();
      buyFlow(handlers, b.dataset.buy);
    });
  }
});
