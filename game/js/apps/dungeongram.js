// DungeonGram v2 — APP RENEWAL W3. Feed sosial yang lahir dari event sim.
// Like pertama menggeser trust faksi sesuai jenis postingan.
import { getState, mutate } from "../state.js";
import { toast } from "../ui/toast.js";
import { emptyState } from "../ui/kit/elements.js";
import { openSheet } from "../ui/kit/sheet.js";
import { KIND_META, likePost, commentPost } from "../systems/social.js";

const COMMENTS = [
  { t: "Pertamax. Semoga cepat selesai ya.", fac: ["serikat", 1] },
  { t: "Di perusahaan saya juga gitu. Tapi yang ini lebih lucu.", fac: ["hero", -1] },
  { t: "Kadarnya: kasihan tapi ngakak.", fac: ["grem", 1] }
];

function relTime(ts) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  return `${h} jam lalu`;
}

function postCard(p) {
  const meta = KIND_META[p.kind] || { emo: "📰", label: "Kabar" };
  return `
  <div class="dg-post">
    <div class="dg-head"><span class="dg-ava">${meta.emo}</span>
      <div><b>DungeonOS Inc.</b><div class="dg-sub">${meta.label} · ${relTime(p.ts)}</div></div></div>
    <p class="dg-text">${p.text}</p>
    <div class="dg-actions">
      <button class="dg-btn ${p.liked ? "on" : ""}" data-like="${p.id}" ${p.liked ? "disabled" : ""}>❤️ ${p.likes}</button>
      <button class="dg-btn" data-com="${p.id}">💬 ${p.comments.length}</button>
    </div>
    ${p.comments.length ? `<div class="dg-comments">${p.comments.map(c => `<div>💬 ${c}</div>`).join("")}</div>` : ""}
  </div>`;
}

function body(s) {
  const feed = (s.socialFeed || []).filter(p => p.kind !== "cctv");
  return `
  <div id="dg-root" class="dg-wrap">
    <div class="dg-logo">📸 Dungeon<span>Gram</span></div>
    <div class="dg-stories">
      ${["🐭", "🧅", "🐉", "🪧", "💼", "🔥"].map((e, i) => `<span class="dg-story ${i === 0 ? "live" : ""}">${e}</span>`).join("")}
    </div>
    ${feed.length ? `<div class="dg-feed">${feed.map(postCard).join("")}</div>`
                  : emptyState("📵", "Feed kosong. Jalankan shift, raid, atau PHK seseorang — dunia akan membicarakanmu.")}
  </div>`;
}

export const dungeongram = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#dg-root");
    if (!root) return;
    root.addEventListener("click", (e) => {
      const like = e.target.closest("[data-like]");
      if (like) {
        const shift = likePost(like.dataset.like);
        if (shift) toast(`Like tercatat. Trust ${shift[0] === "serikat" ? "Serikat" : shift[0] === "hq" ? "HQ" : "Guild Hero"} ${shift[1] > 0 ? "+" : ""}${shift[1]}.`, { ico: "dungeongram", cls: "" });
        handlers.rerender();
        return;
      }
      const com = e.target.closest("[data-com]");
      if (com) {
        const id = com.dataset.com;
        openSheet({
          title: "Tulis Komentar",
          html: `<p class="modal-satir">Pilihan komentar disediakan HRD. Bebas... dari daftar.</p>`,
          actions: COMMENTS.map(c => ({
            label: c.t,
            run: () => {
              commentPost(id, c.t);
              mutate(st => {
                if (!st.factions) return;
                st.factions[c.fac[0]] = Math.max(0, Math.min(100, (st.factions[c.fac[0]] || 50) + c.fac[1]));
              });
              handlers.rerender();
            }
          })).concat([{ label: "Nggak jadi", run: () => {} }])
        });
      }
    });
  }
});
