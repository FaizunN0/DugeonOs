// Elemen UI kecil yang dipakai lintas app (Fase APP RENEWAL).
import { getState } from "../../state.js";

// Label harga dengan opsi harga coret (untuk toko "murah meriah").
export function priceTag(price, old) {
  const strike = old ? `<s class="price-old">${old}g</s> ` : "";
  return `<span class="price-tag">${strike}<b>${price}g</b></span>`;
}

// Empty state standar: satu ikon + satu kalimat satir.
export function emptyState(emo, text) {
  return `<div class="empty-state"><span class="es-emo">${emo}</span><p>${text}</p></div>`;
}

// Sub-navigasi tab dalam app. State tab disimpan di flags["tab_"+ns]
// (pola sama dengan codexTab — tidak perlu persist khusus).
export function subnav(ns, current, tabs) {
  return `<div class="app-subnav">${tabs.map(t =>
    `<button class="subnav-btn ${t.k === current ? "on" : ""}" data-subnav="${t.k}" data-ns="${ns}">${t.label}</button>`).join("")}</div>`;
}

export function bindSubnav(root, handlers) {
  root.querySelectorAll("[data-subnav]").forEach(b => b.addEventListener("click", () => {
    const st = getState();
    if (!st.flags) st.flags = {};
    st.flags["tab_" + b.dataset.ns] = b.dataset.subnav;
    handlers.rerender();
  }));
}

export function currentSubnav(ns, fallback = "") {
  const st = getState();
  const v = st.flags ? st.flags["tab_" + ns] : undefined;
  return v === undefined ? fallback : v;
}
