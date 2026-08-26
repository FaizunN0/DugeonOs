// TrapMart v2 — APP RENEWAL W2. E-commerce pertahanan: katalog + keranjang +
// checkout + review bintang palsu. Stok masuk gudang & dipakai BangunRuang.
// Tab "Rak & Layanan" mempertahankan mekanik lama (upgrade/auto/slot).
import { getState, mutate } from "../state.js";
import { icon } from "../ui/icons.js";
import { Sound } from "../lib.js";
import { toast } from "../ui/toast.js";
import { liveGoldHtml } from "../ui/kit/live.js";
import { priceTag, emptyState } from "../ui/kit/elements.js";
import { subnav, bindSubnav, currentSubnav } from "../ui/kit/elements.js";
import { openSheet } from "../ui/kit/sheet.js";
import { inv, addInv, takeInv } from "./shared.js";
import { TRAPS, SHOP_REVIEWS } from "../content/traps.js";

const TABS = [
  { k: "katalog", label: "🛒 Katalog" },
  { k: "rak",     label: "🔧 Rak & Layanan" }
];
let cart = []; // [{id, qty}] — hidup selama sesi kunjungan app

const TRAP_NAMES_LEGACY = { trap_basic: "Trap Bawang", trap_spike: "Trap Duri", trap_illusion: "Trap Ilusi" };
const findTrap = id => Object.values(TRAPS).find(t => t.id === id);

/* ---------- KATALOG ---------- */
function catalogHtml(s) {
  const cards = Object.values(TRAPS).map(t => {
    const stock = inv(s, t.invKey) || 0;
    const inCart = cart.find(c => c.id === t.id)?.qty || 0;
    const revs = (SHOP_REVIEWS[t.id] || []).map(r => `<div class="tm-rev">⭐⭐⭐⭐⭐ "${r.t}"<span>— ${r.w}</span></div>`).join("");
    return `
    <div class="tm-card">
      <div class="tm-head"><span class="tm-emo">${t.emo}</span>
        <div><b>${t.name}</b><p>${t.desc}</p>
        <div class="tm-meta">${priceTag(t.price)} · DMG ${t.dmg} · CD ${(t.cd / 1000).toFixed(1)}s${t.slow ? " · SLOW" : ""}</div></div>
      </div>
      <div class="tm-foot">
        <span class="tm-stock">Gudang: <b>${stock}</b></span>
        <button class="hq-btn primary" data-add="${t.id}">${inCart ? `Di keranjang (${inCart}) +` : "+ Keranjang"}</button>
      </div>
      <div class="tm-revs">${revs}</div>
    </div>`;
  }).join("");
  return `<div class="tm-grid">${cards}</div>`;
}

function cartBarHtml() {
  if (!cart.length) return "";
  const total = cart.reduce((a, c) => a + findTrap(c.id).price * c.qty, 0);
  const chips = cart.map(c => {
    const t = findTrap(c.id);
    return `<span class="tm-chip">${t.emo} ×${c.qty}<button data-rm="${c.id}">✕</button></span>`;
  }).join("");
  return `
  <div class="tm-cartbar">
    <div class="tm-chips">${chips}</div>
    <div class="tm-cart-right"><b>${total}g</b><button class="hq-btn primary" id="tm-checkout">Checkout</button></div>
  </div>`;
}

function checkout() {
  if (!cart.length) return;
  const total = cart.reduce((a, c) => a + findTrap(c.id).price * c.qty, 0);
  const lines = cart.map(c => { const t = findTrap(c.id); return `${t.emo} ${t.name} ×${c.qty} — ${t.price * c.qty}g`; }).join("<br>");
  openSheet({
    title: "Checkout TrapMart",
    html: `<p>${lines}</p><p>Total: <b>${total}g</b> — kas kamu ${liveGoldHtml()}</p>
           <p class="modal-satir">Semua unit langsung masuk gudang. Garansi hidup sampai hero menyentuhnya.</p>`,
    actions: [
      { label: `Bayar ${total}g`, cls: "primary", run: () => {
          let ok = false;
          mutate(st => {
            if (st.stats.gold < total) return;
            st.stats.gold -= total;
            for (const c of cart) addInv(st, findTrap(c.id).invKey, c.qty);
            ok = true;
          });
          if (ok) { toast(`Pembelian sukses! ${cart.length} jenis trap masuk gudang. Kurirnya naga, tidak perlu tip.`, { ico: "cart", cls: "toast-ok" }); cart = []; }
          else toast("Kas kurang untuk checkout. Jual dulu satu-dua martabat.", { ico: "coin", cls: "toast-bad" });
          handlersRef?.rerender();
        } },
      { label: "Lihat-lihat lagi", run: () => {} }
    ]
  });
}

/* ---------- RAK & LAYANAN (mekanik lama) ---------- */
function rackHtml(s) {
  const lvl = s.trapmart.level || 1;
  const auto = s.trapmart.auto;
  const owned = Object.keys(s.inventory).filter(k => k.startsWith("trap_") && inv(s, k) > 0);
  const slots = [0, 1, 2].map(i => {
    const id = s.trapmart.slots[i];
    if (id) return `<div class="trap-slot filled"><div class="trap-slot-name">${TRAP_NAMES_LEGACY[id] || id}</div><button class="trap-unset" data-unset="${i}">Lepas</button></div>`;
    const opts = owned.length ? owned.map(k => `<button class="trap-set" data-slot="${i}" data-trap="${k}">${TRAP_NAMES_LEGACY[k] || k} (${inv(s, k)})</button>`).join("") : `<span class="muted">Belanja trap di tab Katalog.</span>`;
    return `<div class="trap-slot"><div class="trap-slot-name">Slot ${i + 1} kosong</div><div class="trap-slot-opts">${opts}</div></div>`;
  }).join("");
  return `
  <div class="trap-upgrade"><div class="trap-up-info">Trap Lv <b>${lvl}</b> — efek +${(lvl - 1) * 12}% stabil/loot</div>
    <button class="trap-up-btn" data-up="1">${icon("upgrade")} Upgrade (${40 + lvl * 20}g)</button></div>
  <div class="trap-auto ${auto ? "on" : ""}">
    <div><b>Auto-Defense</b><br><span class="muted">Pasif +loot tiap hari</span></div>
    <button class="trap-auto-btn" data-auto="1">${auto ? "ON" : "OFF"}</button>
  </div>
  <div class="trap-slots">${slots}</div>
  <div class="trap-cctv-row"><button class="trap-cctv" data-cctv="1">${icon("cctv")} Buka CCTV</button></div>`;
}

/* ---------- VIEW ---------- */
let handlersRef = null;

function body(s) {
  const tab = currentSubnav("trapmart", "katalog");
  return `
  <div id="tm-root" class="tm-wrap">
    <p class="app-lead">TrapMart — gerbang pertahanan resmi. Semua unit masuk gudang; pasang lewat BangunRuang.</p>
    <div class="tm-topline">Kas: ${liveGoldHtml()} ${cart.length ? `· Keranjang ${cart.reduce((a, c) => a + c.qty, 0)} item` : ""}</div>
    ${subnav("trapmart", tab, TABS)}
    ${tab === "katalog" ? catalogHtml(s) + cartBarHtml() : rackHtml(s)}
    ${tab === "katalog" && !Object.keys(TRAPS).length ? emptyState("📦", "Katalog kosong. Pemasok kabur membawa katalognya juga.") : ""}
  </div>`;
}

function wire(root, handlers) {
  handlersRef = handlers;
  bindSubnav(root, handlers);

  root.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      const id = add.dataset.add;
      const line = cart.find(c => c.id === id);
      if (line) line.qty++; else cart.push({ id, qty: 1 });
      Sound.tap();
      handlers.rerender();
      return;
    }
    const rm = e.target.closest("[data-rm]");
    if (rm) { cart = cart.filter(c => c.id !== rm.dataset.rm); handlers.rerender(); return; }
    if (e.target.closest("#tm-checkout")) { checkout(); return; }

    // --- mekanik rak lama ---
    const setB = e.target.closest(".trap-set");
    if (setB) {
      Sound.tap();
      const i = Number(setB.dataset.slot), id = setB.dataset.trap;
      mutate(st => {
        if (!takeInv(st, id, 1)) { toast("Trap habis.", { ico: "trapmart", cls: "toast-bad" }); return; }
        st.trapmart.slots[i] = id;
        const l = st.trapmart.level || 1;
        st.stats.stability = Math.min(100, st.stats.stability + 6 + (l - 1) * 2); st.stats.loot += 8;
        toast((TRAP_NAMES_LEGACY[id] || id) + " dipasang di rak! +stabilitas, +loot.", { ico: "trapmart", cls: "toast-ok" });
      });
      handlers.rerender();
      return;
    }
    const unset = e.target.closest(".trap-unset");
    if (unset) {
      Sound.tap();
      mutate(st => { const i = Number(unset.dataset.unset); const id = st.trapmart.slots[i]; if (id) { addInv(st, id, 1); st.trapmart.slots[i] = null; } });
      handlers.rerender();
      return;
    }
    if (e.target.closest(".trap-up-btn")) {
      Sound.tap();
      mutate(st => {
        const cost = 40 + (st.trapmart.level || 1) * 20;
        if (st.stats.gold < cost) { toast("Gold kurang untuk upgrade (" + cost + "g).", { ico: "coin", cls: "toast-bad" }); return; }
        st.stats.gold -= cost; st.trapmart.level = (st.trapmart.level || 1) + 1;
        toast("Trap naik ke Lv " + st.trapmart.level + "!", { ico: "upgrade", cls: "toast-ok" });
      });
      handlers.rerender();
      return;
    }
    if (e.target.closest(".trap-auto-btn")) {
      Sound.tap();
      mutate(st => { st.trapmart.auto = !st.trapmart.auto; toast(st.trapmart.auto ? "Auto-Defense ON." : "Auto-Defense OFF.", { ico: "trapmart" }); });
      handlers.rerender();
      return;
    }
    if (e.target.closest(".trap-cctv")) { Sound.tap(); handlers.openApp("cctv"); }
  });
}

export const trapmart = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#tm-root");
    if (!root) return;
    wire(root, handlers);
  }
});
