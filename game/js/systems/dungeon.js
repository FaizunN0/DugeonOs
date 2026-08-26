// Sistem dungeon builder: grid lorong, jalur hero, pasang/lepas trap (Fase 2).
import { getState, mutate } from "../state.js";
import { toast } from "../ui/toast.js";
import { emit } from "../core/eventBus.js";
import { TRAPS, REFUND_RATE } from "../content/traps.js";

export const COLS = 5;
export const ROWS = 4;
// Lorong berbentuk S: masuk kiri-atas, brankas kanan-bawah.
export const PATH = [
  [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1],
  [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3]
];
export const START_CELL = PATH[0];
export const VAULT_CELL = PATH[PATH.length - 1];

const keyOf = (x, y) => `${x},${y}`;
export function isPath(x, y) { return PATH.some(([px, py]) => px === x && py === y); }
export function trapAt(x, y) {
  const s = getState();
  return ((s.dungeonBuild || {}).traps || {})[keyOf(x, y)] || null;
}

export function buyAndPlace(x, y, trapId) {
  const t = TRAPS[trapId];
  if (!t) return false;
  if (!isPath(x, y)) { toast("Trap hanya boleh di jalur. Peraturan Tata Lorong No. 7.", { ico: "trapmart", cls: "toast-bad" }); return false; }
  let ok = false, fromStock = false, paidPrice = 0;
  mutate(st => {
    const db = st.dungeonBuild;
    const k = keyOf(x, y);
    if (db.traps[k]) return;                       // sudah ada trap
    // Utamakan stok gudang (belanjaan TrapMart/Toko Oren); kalau kosong, beli darurat.
    const have = st.inventory[t.invKey] || 0;
    if (have > 0) {
      st.inventory[t.invKey] = have - 1;
      fromStock = true;
    } else {
      const price = Math.round(t.price * ((st.flags && st.flags.trapDiscount) || 1));
      if (st.stats.gold < price) return;
      st.stats.gold -= price;
      paidPrice = price;
    }
    db.traps[k] = { id: trapId };
    ok = true;
  });
  if (ok) {
    toast(fromStock
      ? `${t.emo} ${t.name} dipasang dari gudang. Stok sisa ${Math.max(0, (getState().inventory[t.invKey] || 0))}.`
      : `${t.emo} ${t.name} dibeli darurat & terpasang (${paidPrice}g). Gudang kosong ya, bos.`,
      { ico: "trapmart", cls: "toast-ok" });
    emit("dungeon:changed", {});
  } else {
    toast(`Butuh ${t.name}: stok gudang kosong & kas kurang (${t.price}g). Belanja dulu di TrapMart.`, { ico: "coin", cls: "toast-bad" });
  }
  return ok;
}

export function removeTrap(x, y) {
  let refund = 0;
  mutate(st => {
    const db = st.dungeonBuild;
    const k = keyOf(x, y);
    const cell = db.traps[k];
    if (!cell) return;
    refund = Math.floor((TRAPS[cell.id] || { price: 0 }).price * REFUND_RATE);
    delete db.traps[k];
    st.stats.gold += refund;
  });
  if (refund) {
    toast(`Trap dicabut. Refund ${refund}g — rahasia departemen keuangan.`, { ico: "coin", cls: "toast-ok" });
    emit("dungeon:changed", {});
  }
}
