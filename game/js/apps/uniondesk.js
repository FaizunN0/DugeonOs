// UnionDesk v2 — APP RENEWAL W3. Papan buletin serikat: memo resmi dari feed
// peristiwa (mogok/PHK/gaji telat/kabar bab) + ajuan komplain (1x/hari operasional).
import { getState, mutate } from "../state.js";
import { toast } from "../ui/toast.js";
import { emptyState } from "../ui/kit/elements.js";
import { openSheet } from "../ui/kit/sheet.js";
import { post } from "../systems/social.js";

const MEMO_KINDS = ["strike", "fired", "payroll_late", "chapter"];

function body(s) {
  const memos = (s.socialFeed || []).filter(p => MEMO_KINDS.includes(p.kind)).slice(0, 10);
  const canComplain = s.flags.lastComplaintOpDay !== (s.sim && s.sim.day);
  return `
  <div id="un-root" class="un-wrap">
    <div class="un-letterhead">
      <div class="un-seal">🪧</div>
      <div><b>SERIKAT MINION SELURUH LORONG</b><div class="un-sub">Buletin resmi. Ditempel pakai lem, dibaca pakai hati.</div></div>
    </div>
    ${memos.length ? `<div class="un-memos">${memos.map((p, i) => `
      <div class="un-memo">
        <div class="un-memo-no">MEMO #${String(memos.length - i).padStart(3, "0")}</div>
        <p>${p.text}</p>
        <span class="un-ts">${new Date(p.ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
      </div>`).join("")}</div>`
    : emptyState("📌", "Papan sepi. Serikat sedang rapat soal kenapa papannya sepi.")}
    <button class="action-btn un-complain" id="un-complain" ${canComplain ? "" : "disabled"}>
      📝 Ajukan Komplain Resmi ${canComplain ? "" : "(sudah diajukan hari ini)"}
    </button>
    <div class="db-comment">Komplain tidak mengubah apa pun, tapi serikat naik trust karena merasa didengar. Birokrasi bekerja dengan cara misterius.</div>
  </div>`;
}

export const unionDesk = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#un-root");
    if (!root) return;
    root.addEventListener("click", (e) => {
      if (!e.target.closest("#un-complain")) return;
      const st0 = getState();
      if (st0.flags.lastComplaintOpDay === (st0.sim && st0.sim.day)) return;
      openSheet({
        title: "Formulir Komplain Resmi",
        html: `<p>Pilih kategori keluhan (semuanya bermuara ke tempat yang sama):</p>`,
        actions: [
          { label: "Gaji & tunjangan", run: () => file(handlers, "soal gaji & tunjangan") },
          { label: "Fasilitas lorong", run: () => file(handlers, "soal fasilitas lorong") },
          { label: "Nada bicara atasan", run: () => file(handlers, "soal nada bicara atasan") },
          { label: "Batal", run: () => {} }
        ]
      });
    });
  }
});

function file(handlers, topic) {
  mutate(st => {
    st.flags.lastComplaintOpDay = st.sim.day;
    st.factions.serikat = Math.min(100, (st.factions.serikat || 50) + 2);
    post("strike", `Komplain resmi masuk (${topic}). Diteruskan ke arsip yang tepat: atas.`);
  });
  toast("Komplain tercatat. Trust serikat +2. Arsipnya? Rahasia negara.", { ico: "union", cls: "toast-ok" });
  handlers.rerender();
}
