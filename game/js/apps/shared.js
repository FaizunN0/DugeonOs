// Helper lintas-app (faksi, inventori, meme, clamp).
import { MEMES } from "../content/memes.js";

export function shiftFac(st, key, d) {
  if (!st.factions) return;
  st.factions[key] = Math.max(0, Math.min(100, (st.factions[key] || 0) + d));
}
export function inv(st, id) { return st.inventory[id] || 0; }
export function addInv(st, id, n = 1) { st.inventory[id] = (st.inventory[id] || 0) + n; }
export function takeInv(st, id, n = 1) {
  const has = st.inventory[id] || 0;
  if (has < n) return false;
  st.inventory[id] = has - n;
  return true;
}
export { clamp } from "../core/util.js";
export function randomMeme() {
  if (MEMES && MEMES.length) return MEMES[Math.floor(Math.random() * MEMES.length)];
  return "Dihina-hina saya diam, tapi di DungeonUnion ini saya katakan: SAYA AKAN LAWAN!";
}
