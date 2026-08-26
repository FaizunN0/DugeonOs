// Sistem belanja bersama (W2): pembelian item trap lintas-app.
import { getState, mutate } from "../state.js";
import { toast } from "../ui/toast.js";
import { TRAPS } from "../content/traps.js";

export function trapPrice(trapId) {
  const t = TRAPS[trapId];
  if (!t) return 0;
  const st = getState();
  return Math.round(t.price * ((st.flags && st.flags.trapDiscount) || 1));
}

// Beli 1 unit trap ke gudang (inventory). Return true bila sukses.
export function buyTrapItem(trapId) {
  const t = TRAPS[trapId];
  if (!t) return false;
  let ok = false;
  mutate(st => {
    const price = Math.round(t.price * ((st.flags && st.flags.trapDiscount) || 1));
    if (st.stats.gold < price) return;
    st.stats.gold -= price;
    if (!st.inventory[t.invKey]) st.inventory[t.invKey] = 0;
    st.inventory[t.invKey] += 1;
    ok = true;
  });
  if (ok) toast(`${t.emo} ${t.name} masuk gudang. Siap ditanam di BangunRuang.`, { ico: "cart", cls: "toast-ok" });
  else toast(`Kas kurang untuk ${t.name} (${trapPrice(trapId)}g).`, { ico: "coin", cls: "toast-bad" });
  return ok;
}
