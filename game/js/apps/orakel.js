// Orakel v2 (W4) — keluar-layar tetap, tapi jawabannya dari DATA nyata + hint aksi.
import { getState } from "../state.js";
import { orakelLine } from "../systems/forecast.js";
import { openSheet } from "../ui/kit/sheet.js";
import { mgSession } from "../ui/kit/mg.js";
import { toast } from "../ui/toast.js";

function body(s) {
  return `
  <div id="or-root" class="or-wrap">
    <p class="app-lead">Orakel — suara dari balik layar. Katanya melihat segalanya. Ternyata dia cuma membaca spreadsheet-mu.</p>
    <div class="or-portal"><span>🔮</span></div>
    <button class="action-btn or-ask" id="or-ask">🔮 TANYAKAN NASIB PERUSAHAAN</button>
    <div class="db-comment">Gratis, sekali tiap fase. Lebih seru daripada koin di air keramat — dan lebih jujur.</div>
  </div>`;
}

export const orakelApp = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#or-root");
    if (!root) return;
    const sess = mgSession(root);
    root.addEventListener("click", (e) => {
      if (!e.target.closest("#or-ask")) return;
      const st = getState();
      const key = "or_" + (st.sim?.phase || "x");
      if (st.flags[key]) { toast("Orakel butuh rehat antar fase. Baca ulang jawaban sebelumnya di ingatanmu.", { ico: "magic", cls: "" }); return; }
      st.flags[key] = true;
      const line = orakelLine(st);
      openSheet({
        title: `${line.emo} Orakel Berbicara`,
        html: `<p class="ia-card-txt">${line.txt}</p><p class="modal-satir">Saran Orakel: ${line.hint}</p>`,
        actions: [{ label: "Aku mengerti, wahai pembaca spreadsheet", run: () => {} }]
      });
    });
  }
});
