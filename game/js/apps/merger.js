// Merger & Akuisisi — prestige v1.0 (Fase 4).
import { getState } from "../state.js";
import { choiceModal } from "../ui/kit/modal.js";
import { PERKS, perkCost, valuation, sahamGain, doMerger, buyPerk } from "../systems/prestige.js";

function perkRow(key) {
  const def = PERKS[key];
  const st = getState();
  const lvl = (st.meta && st.meta.perks && st.meta.perks[key]) || 0;
  const maxed = lvl >= def.max;
  const cost = perkCost(lvl);
  return `
  <div class="mr-perk">
    <div class="mr-perk-head"><b>${def.name}</b><span class="mr-lvl">Lv ${lvl}/${def.max}</span></div>
    <p class="mr-desc">${def.desc}</p>
    <button class="hq-btn ${maxed ? "" : "primary"}" data-buy="${key}" ${maxed ? "disabled" : ""}>
      ${maxed ? "MAKSIMAL" : `Beli (${cost} Saham)`}
    </button>
  </div>`;
}

function body(s) {
  const v = valuation(s);
  const gain = sahamGain(v);
  const meta = s.meta || { mergers: 0, saham: 0, perks: {} };
  const keys = Object.keys(PERKS);
  return `
  <div id="mr-root" class="mr-wrap">
    <p class="app-lead">Merger & Akuisisi — jual dungeon ini ke konsorsium misterius, mulai dari nol dengan kantong lebih tebal. Mentri King Mouse tidak dijual ikut.</p>

    <div class="hq-ledger glass">
      <div><span>Nilai perusahaan</span><b>${v}g</b></div>
      <div><span>Saham jika merger sekarang</span><b class="good">+${gain}</b></div>
      <div><span>Total Saham dimiliki</span><b>${meta.saham || 0}</b></div>
      <div><span>Jumlah merger</span><b>${meta.mergers || 0}</b></div>
    </div>
    <div class="db-comment">Nilai dihitung dari kas, jumlah pegawai, trap terpasang, reputasi, hari operasional & rata-rata relasi faksi. Jual saat paling gemuk, bukan saat paling sedih.</div>

    <h3 class="hq-title">Perk Permanen (ikut semua run berikutnya)</h3>
    <div class="mr-grid">${keys.map(perkRow).join("")}</div>

    <button class="action-btn db-raid" id="mr-go">🤝 TANDA TANGANI MERGER</button>
    <div class="db-comment">Yang dibawa: Saham, perk, Museum, Mode Hemat. Yang ditinggal: kas, roster, trap, progres cerita, martabat sementara.</div>
    <div class="db-out" id="mr-out"></div>
  </div>`;
}

function wire(root, handlers) {
  root.addEventListener("click", (e) => {
    const buy = e.target.closest("[data-buy]");
    if (buy) { buyPerk(buy.dataset.buy); handlers.rerender(); return; }
    if (e.target.closest("#mr-go")) {
      const s = getState();
      const v = valuation(s);
      const gain = sahamGain(v);
      choiceModal("Tanda Tangan Merger?",
        `<p>Perusahaan dinilai <b>${v}g</b> → kamu menerima <b>${gain} Saham</b>.</p>
         <p>Kas, roster, trap & progres harian akan direset. Perk & Museum tetap.</p>
         <p class="modal-satir">Kontrak ditulis font kecil. Font kecil itu sah secara hukum dungeon.</p>`,
        [{ label: "Tanda tangan (reset)", run: () => { doMerger(); handlers.rerender(); } },
         { label: "Baca dulu font kecilnya", run: () => {} }],
        null);
    }
  });
}

export const merger = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#mr-root");
    if (!root) return;
    wire(root, handlers);
  }
});
