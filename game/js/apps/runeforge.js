// Bengkel Rune — APP RENEWAL v1.1. Crafting diskrit: bahan dari drop raid ->
// resep data-driven -> artefak buff nyata (slot aktif terbatas). Gagal = meledak.
import { getState, mutate } from "../state.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { openSheet } from "../ui/kit/sheet.js";
import { mgSession } from "../ui/kit/mg.js";
import { on } from "../core/eventBus.js";
import { RUNE_MATS, MAT_KEYS, RECIPES, MAX_SLOTS, FAIL_BASE, matInvKey } from "../content/runes.js";
import { inv, takeInv, addInv } from "./shared.js";

const FAIL_LINES = [
  "MELEDAK! Aroma bawang terasa sampai lorong 9. Bahan lenyap demi ilmu.",
  "Ledakan kecil. HRD mencatat sebagai 'insiden kreativitas'.",
  "Rune meledak pelan. Filosofis, tapi rugi.",
  "BOOM. Serikat mengirim surat kebisingan."
];
const SUCCESS_LINES = [
  "Tempa sempurna! Kilatnya rapi, auditnya lolos.",
  "Artefak jadi. Kualitas ekspor, harga lokal.",
  "Legendaris? Belum. Tapi cukup buat bikin hero mikir."
];

function haveMat(st, k) { return inv(st, matInvKey(k)); }

// Butuh bahan bisa berjumlah >1 untuk jenis sama -> hitung agregat.
function needCounts(rec) {
  const m = {};
  for (const k of rec.need) m[k] = (m[k] || 0) + 1;
  return m;
}
function canForge(st, rec) {
  return Object.entries(needCounts(rec)).every(([k, n]) => haveMat(st, k) >= n);
}
function missingFor(s, rec) {
  return Object.entries(needCounts(rec))
    .filter(([k, n]) => haveMat(s, k) < n)
    .map(([k]) => RUNE_MATS[k].emo);
}

function activeHtml(s) {
  const act = s.runeForge.active || [];
  const slot = (a, i) => a ? `
    <div class="rf-slot filled">
      <span class="rf-emo">${RECIPES.find(r => r.id === a.id)?.emo || "✨"}</span>
      <div><b>${RECIPES.find(r => r.id === a.id)?.name || a.id}</b>
      <div class="rf-days">sisa ${a.daysLeft} hari</div></div>
      <button class="hq-btn danger" data-rf="off:${i}">Lepas</button>
    </div>` : `<div class="rf-slot"><span class="rf-emo dim">◇</span><div><b>Slot kosong</b><div class="rf-days">tempa sesuatu</div></div></div>`;
  return `
    <h3 class="hq-title">Slot Artefak Aktif (${act.length}/${MAX_SLOTS})</h3>
    <div class="rf-slots">${[0, 1].map(i => slot(act[i], i)).join("")}</div>`;
}

function matsHtml(s) {
  return `<h3 class="hq-title">Bahan (drop dari bounty raid)</h3>
  <div class="rf-mats">${MAT_KEYS.map(k => {
    const n = haveMat(s, k);
    return `<span class="rf-mat ${n > 0 ? "have" : ""}" title="${RUNE_MATS[k].flavor}">${RUNE_MATS[k].emo}<b>${n}</b></span>`;
  }).join("")}</div>`;
}

function recipesHtml(s) {
  return RECIPES.map(rec => {
    const missing = missingFor(s, rec);
    const can = canForge(s, rec);
    const need = Object.entries(needCounts(rec)).map(([k, n]) =>
      `<span class="rf-need ${haveMat(s, k) >= n ? "ok" : "miss"}">${RUNE_MATS[k].emo}${n > 1 ? "×" + n : ""}</span>`).join("");
    return `
    <div class="rf-recipe">
      <div class="rf-rhead"><span class="rf-emo">${rec.emo}</span>
        <div><b>${rec.name}</b><p>${rec.desc}</p><div class="rf-meta">${need} · ${rec.durDays} hari</div></div>
        <button class="hq-btn primary" data-rf="forge:${rec.id}" ${can ? "" : "disabled"}>Tempa</button>
      </div>
      ${can ? "" : `<div class="rf-warn">Kurang: ${missing.join(" ")}</div>`}
    </div>`;
  }).join("");
}

function body(s) {
  return `
  <div id="rf-root" class="rf-wrap">
    <p class="app-lead">Bengkel Rune — bahan datang dari hero yang tumbang di BangunRuang. Tempa dengan bijak, atau tempa asal dan lihat akibatnya.</p>
    ${activeHtml(s)}
    ${matsHtml(s)}
    <h3 class="hq-title">Grimoire Resep</h3>
    <div class="rf-recipes" id="rf-recipes">${recipesHtml(s)}</div>
    <div class="db-comment">Tingkat keberhasilan ${Math.round((1 - FAIL_BASE) * 100)}%. Kegagalan tetap memakan seluruh bahan — begitulah ilmu pengetahuan bekerja di dungeon.</div>
    <div class="rf-stats">Berhasil ${s.runeForge.forged || 0} · Meledak ${s.runeForge.failed || 0}</div>
  </div>`;
}

function forge(root, handlers, recId) {
  const rec = RECIPES.find(r => r.id === recId);
  if (!rec) return;
  openSheet({
    title: `Tempa ${rec.name}?`,
    html: `<p>Bahan dikorbankan: ${rec.need.map(k => RUNE_MATS[k].emo).join(" ")}</p>
           <p>Hasil: ${rec.desc} (${rec.durDays} hari)</p>
           <p class="modal-satir">Peluang gagal ${Math.round(FAIL_BASE * 100)}%. Ledakan tidak menimpa siapa pun, hanya perasaanmu.</p>`,
    actions: [
      { label: "TEMPA!", cls: "primary", run: () => {
        let outcome = null;
        mutate(st => {
          if (!canForge(st, rec)) { outcome = "none"; return; }   // race-safe
          for (const [k, n] of Object.entries(needCounts(rec))) takeInv(st, matInvKey(k), n);
          if (Math.random() < FAIL_BASE) {
            st.runeForge.failed = (st.runeForge.failed || 0) + 1;
            // Penghiburan: satu bahan acak tersisa dari puing.
            addInv(st, matInvKey(MAT_KEYS[Math.floor(Math.random() * MAT_KEYS.length)]), 1);
            outcome = "fail";
          } else {
            st.runeForge.forged = (st.runeForge.forged || 0) + 1;
            const slots = st.runeForge.active;
            if (slots.length >= MAX_SLOTS) {
              // Slot penuh: artefak baru menggantikan slot pertama (FIFO) — disebut juga rotasi alami.
              slots.shift();
              outcome = "replaced";
            } else outcome = "ok";
            slots.push({ id: rec.id, daysLeft: rec.durDays });
          }
        });
        const lines = SUCCESS_LINES[Math.floor(Math.random() * SUCCESS_LINES.length)];
        toast(outcome === "fail" ? FAIL_LINES[Math.floor(Math.random() * FAIL_LINES.length)]
             : `${lines}${outcome === "replaced" ? " (slot tertua diganti)" : ""}`,
             { ico: "physics", cls: outcome === "fail" ? "toast-bad" : "toast-ok" });
        handlers.rerender();
      }},
      { label: "Nanti dulu", run: () => {} }
    ]
  });
}

function detach(root, handlers, idx) {
  mutate(st => {
    st.runeForge.active.splice(idx, 1);
  });
  toast("Artefak dilepas. Sisanya jadi hiasan rak.", { ico: "physics", cls: "" });
  handlers.rerender();
}

let busBound = false;
export const runeForge = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#rf-root");
    if (!root) return;

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-rf]");
      if (!btn) return;
      const [kind, arg] = btn.dataset.rf.split(":");
      if (kind === "forge") forge(root, handlers, arg);
      else if (kind === "off") {
        const i = Number(arg);
        const a = getState().runeForge.active[i];
        if (!a) return;
        const def = RECIPES.find(r => r.id === a.id);
        openSheet({
          title: `Lepas ${def?.name || "artefak"}?`,
          html: `<p>Sisa ${a.daysLeft} hari akan hangus. Tidak ada refund di dunia sihir.</p>`,
          actions: [
            { label: "Lepas", cls: "danger", run: () => detach(root, handlers, i) },
            { label: "Biarkan menyala", run: () => {} }
          ]
        });
      }
    });

    // Kadaluarsa artefak tiap hari operasional (listener tunggal, modul-level).
    if (!busBound) {
      busBound = true;
      on("sim:newDay", () => {
        mutate(st => {
          const arr = st.runeForge.active;
          for (let i = arr.length - 1; i >= 0; i--) {
            arr[i].daysLeft--;
            if (arr[i].daysLeft <= 0) {
              const def = RECIPES.find(r => r.id === arr[i].id);
              toast(`${def?.emo || "✨"} ${def?.name || "Artefak"} dayanya habis. Rak kembali sepi.`, { ico: "physics", cls: "" });
              arr.splice(i, 1);
            }
          }
        });
      });
    }
    // Session dummy agar standar terpenuhi & future timers aman.
    mgSession(root);
  }
});
