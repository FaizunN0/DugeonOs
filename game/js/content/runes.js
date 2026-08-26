// Bengkel Rune (Fase APP RENEWAL): bahan, resep & helper buff artefak aktif.
// Balancing = edit data di sini.
export const RUNE_MATS = {
  ember: { name: "Rune Bara",      emo: "🔥", flavor: "Panas yang tidak bisa diajak negosiasi." },
  frost: { name: "Rune Beku",      emo: "❄️", flavor: "Dinginnya bikin hero mikir ulang hidup." },
  bolt:  { name: "Rune Kilat",     emo: "⚡", flavor: "Cepat, keras, dan sedikit berisik." },
  onion: { name: "Rune Bawang",    emo: "🧅", flavor: "Penyeimbang segala. Bikin nangis yang jahat." },
  voidr: { name: "Rune Kehampaan", emo: "🕳️", flavor: "Isinya tidak ada. Tapi berkualitas." }
};
export const MAT_KEYS = Object.keys(RUNE_MATS);

export const RECIPES = [
  { id: "semangat",  name: "Rune Semangat",  emo: "💪", need: ["onion", "onion", "bolt"],  durDays: 5, desc: "+1 morale SEMUA pegawai tiap fase." },
  { id: "kasir",     name: "Rune Kasir",     emo: "💰", need: ["ember", "ember", "frost"], durDays: 3, desc: "+10% pemasukan kerja." },
  { id: "pelindung", name: "Rune Pelindung", emo: "🛡️", need: ["frost", "frost", "voidr"], durDays: 4, desc: "Zirah hero saat raid −15%." }
];
export const MAX_SLOTS = 2;
export const FAIL_BASE = 0.2;

export const matInvKey = k => "rune_" + k;

// Gabungkan artefak aktif jadi satu paket modifier (dipakai economy/minions/raids).
export function activeBuffs(st) {
  const out = { moralePerPhase: 0, incomePct: 0, heroHpMul: 1 };
  for (const a of (st.runeForge && st.runeForge.active) || []) {
    if (a.id === "semangat")  out.moralePerPhase += 1;
    if (a.id === "kasir")     out.incomePct += 0.10;
    if (a.id === "pelindung") out.heroHpMul *= 0.85;
  }
  return out;
}
