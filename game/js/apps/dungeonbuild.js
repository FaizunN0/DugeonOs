// BangunRuang — susun lorong & uji pertahanan (Fase 2).
import { getState } from "../state.js";
import { icon } from "../ui/icons.js";
import { choiceModal } from "../ui/kit/modal.js";
import { COLS, ROWS, PATH, START_CELL, VAULT_CELL, isPath, trapAt, buyAndPlace, removeTrap } from "../systems/dungeon.js";
import { TRAPS } from "../content/traps.js";
import { startRaid, cancelRaid, raidRunning } from "../systems/raids.js";
import { on } from "../core/eventBus.js";

let selected = "bawang";
let activeRoot = null;
let bound = false;

const keyOf = (x, y) => `${x},${y}`;

function gridHtml(s) {
  const traps = s.dungeonBuild.traps || {};
  let html = "";
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const path = isPath(x, y);
      const cell = traps[keyOf(x, y)];
      const isStart = START_CELL[0] === x && START_CELL[1] === y;
      const isVault = VAULT_CELL[0] === x && VAULT_CELL[1] === y;
      const emo = cell ? (TRAPS[cell.id] || {}).emo : "";
      const label = isStart ? '<span class="db-tag">MASUK</span>' : isVault ? '<span class="db-tag vault">BRANKAS</span>' : "";
      html += `
      <button class="db-tile ${path ? "path" : ""} ${cell ? "trapped" : ""} ${!path ? "block" : ""}"
              data-x="${x}" data-y="${y}" ${path ? "" : "disabled"}>
        ${label}${emo ? `<span class="db-emo">${emo}</span>` : ""}
      </button>`;
    }
  }
  return html;
}

function paletteHtml() {
  return Object.values(TRAPS).map(t => `
    <button class="db-pal ${selected === t.id ? "on" : ""}" data-trap="${t.id}" title="${t.desc}">
      <span class="db-pal-emo">${t.emo}</span>
      <span class="db-pal-name">${t.name}</span>
      <span class="db-pal-price">${t.price}g</span>
    </button>`).join("");
}

function body(s) {
  const count = Object.keys(s.dungeonBuild.traps || {}).length;
  return `
  <div id="db-root" class="db-wrap">
    <p class="app-lead">BangunRuang — tanam trap di jalur lorong, lalu uji dengan hero sukarela (mereka tidak tahu itu uji).</p>
    <div class="db-toolbar">
      <div class="db-palette">${paletteHtml()}</div>
      <button class="action-btn db-raid" id="db-raid">🗡️ MULAI RAID UJI</button>
    </div>
    <div class="db-board">
      <div class="db-grid" id="db-grid">${gridHtml(s)}</div>
      <div class="db-field" id="db-field"></div>
    </div>
    <div class="db-comment" id="db-comment">${count ? "Klik petak bertanda untuk mencabut trap (refund 50%). Pilih trap di atas untuk menanam." : "Pilih trap di atas, klik petak lorong untuk menanam. Lorong putih = jalur hero."}</div>
    <div class="db-out" id="db-out"></div>
  </div>`;
}

function refreshGrid(root) {
  const g = root.querySelector("#db-grid");
  if (!g) return;
  g.innerHTML = gridHtml(getState());
}

function reportModal({ kills, leaks, total }, handlers) {
  const net = kills > leaks ? "LULUS" : leaks > 0 && kills === 0 ? "MERAH TOTAL" : "CUKUPAN";
  const satir = leaks === 0
    ? "Nol kebocoran. HQ terkesan, tapi menolak menaikkan budget."
    : leaks >= total / 2
      ? "Setengah hero sampai brankas. Serikat menjual kaos 'Selamat Tinggal Gaji'."
      : "Beberapa hero lolos. Mereka meninggalkan review 3 bintang: 'trapnya nyata, brankasnya juga'.";
  choiceModal(`Laporan Raid Uji — ${net}`,
    `    <p>Tertangkap: <b>${kills}/${total}</b></p><p>Lolos ke brankas: <b>${leaks}</b></p><p class="modal-satir">${satir}</p>`,
    [{ label: "Siap, perbaiki", run: () => {} }],
    () => handlers.rerender());
}

function wire(root, handlers) {
  activeRoot = root;

  root.addEventListener("click", (e) => {
    if (!document.contains(activeRoot)) return;
    const pal = e.target.closest(".db-pal");
    if (pal) {
      selected = pal.dataset.trap;
      root.querySelectorAll(".db-pal").forEach(b => b.classList.toggle("on", b.dataset.trap === selected));
      return;
    }
    const tile = e.target.closest(".db-tile");
    if (tile && !tile.disabled) {
      const x = +tile.dataset.x, y = +tile.dataset.y;
      const existing = trapAt(x, y);
      if (existing) {
        const t = TRAPS[existing.id];
        choiceModal("Cabut Trap?", `<p>${t.name} akan dicabut. Refund <b>${Math.floor(t.price * 0.5)}g</b>.</p><p class="modal-satir">Garansi hangus sejak dibeli.</p>`,
          [{ label: "Cabut", run: () => { removeTrap(x, y); } }, { label: "Batal", run: () => {} }]);
        return;
      }
      buyAndPlace(x, y, selected);
    }
    if (e.target.closest("#db-raid")) {
      const field = root.querySelector("#db-field");
      const comment = root.querySelector("#db-comment");
      const btn = e.target.closest("#db-raid");
      if (raidRunning()) return;
      btn.disabled = true;
      comment.textContent = "Raid dimulai. Hero masuk dalam hitungan detik...";
      startRaid({
        field,
        commentary: comment,
        onDone: (res) => {
          btn.disabled = false;
          refreshGrid(root);
          reportModal(res, handlers);
        }
      });
    }
  });

  on("dungeon:changed", () => { if (activeRoot && document.contains(activeRoot)) refreshGrid(activeRoot); });
}

export const dungeonbuild = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#db-root");
    if (!root) return;
    wire(root, handlers);
  },
  onLeave() { cancelRaid(); }
});
