// Feed sosial terpusat (W3): semua peristiwa sim jadi postingan yang bisa
// dibaca UnionDesk / DungeonGram / CCTV. Sumber = event bus.
import { getState, mutate } from "../state.js";
import { on } from "../core/eventBus.js";
import { activeSeason } from "../content/seasons.js";

export const KIND_META = {
  strike:      { emo: "🪧", label: "Protes" },
  fired:       { emo: "📦", label: "PHK" },
  hire:        { emo: "🤝", label: "Rekrutmen" },
  raid_win:    { emo: "⚔️", label: "Raid Ditahan" },
  raid_leak:   { emo: "💸", label: "Brankas Bobol" },
  payroll_ok:  { emo: "💵", label: "Gajian" },
  payroll_late:{ emo: "🚨", label: "Gaji Telat" },
  merger:      { emo: "💼", label: "Merger" },
  chapter:     { emo: "📰", label: "Berita HQ" },
  season:      { emo: "📅", label: "Hari Baru" },
  cctv:        { emo: "📹", label: "Rekaman" }
};

// Faksi yang bergeser saat postingan di-like (pertama kali).
const LIKE_FAC = {
  strike: ["serikat", 1], fired: ["serikat", 1], payroll_late: ["serikat", 1],
  raid_win: ["hq", 1], raid_leak: ["hero", -1], merger: ["hq", 1]
};

export function post(kind, text) {
  mutate(st => {
    st.socialFeed.unshift({
      id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      ts: Date.now(), kind, text,
      likes: 0, liked: false, comments: []
    });
    if (st.socialFeed.length > 40) st.socialFeed.length = 40;
  });
}

export function likePost(id) {
  let facShift = null;
  mutate(st => {
    const p = st.socialFeed.find(x => x.id === id);
    if (!p || p.liked) return;
    p.liked = true; p.likes++;
    const map = LIKE_FAC[p.kind];
    if (map && st.factions) st.factions[map[0]] = Math.max(0, Math.min(100, (st.factions[map[0]] || 50) + map[1]));
    if (map) facShift = map;
  });
  return facShift;
}

export function commentPost(id, text) {
  mutate(st => {
    const p = st.socialFeed.find(x => x.id === id);
    if (!p) return;
    p.comments.push(text);
    if (p.comments.length > 6) p.comments.shift();
  });
}

let bound = false;
export function initSocial() {
  if (bound) return;
  bound = true;

  on("social", ({ kind, text }) => post(kind, text));

  on("sim:newDay", ({ day }) => {
    const s = activeSeason(day);
    post("season", `Hari operasional #${day}. ${s.name} — ${s.line}`);
  });

  on("econ:report", ({ day, paid, payroll }) => {
    if (!day) return;
    post(paid ? "payroll_ok" : "payroll_late",
      paid ? `Gaji hari #${day} CAIR (${payroll}g). Antrean ATM lorong aman.`
           : `Gaji hari #${day} TELAT. Kas kurang ${payroll}g. Spanduk dicetak ulang.`);
  });
}
