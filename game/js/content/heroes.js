// Data hero penyerbu & gelombang raid (Fase 2). Balancing = edit di sini.
// speed = milidetik per petak lorong (makin kecil makin cepat).
export const HERO_TYPES = {
  rembes: { id: "rembes", name: "Sir Rembes",     emo: "🛡️", hp: 40, speed: 900,  bounty: 10, taunt: "Brankas mana? Saya bayar parkir loh." },
  panah:  { id: "panah",  name: "Panji Panahan",  emo: "🏹", hp: 26, speed: 650,  bounty: 8,  taunt: "Review 1 bintang siap di-upload." },
  tebal:  { id: "tebal",  name: "Baja Tebal",     emo: "🗿", hp: 95, speed: 1350, bounty: 20, taunt: "Trap? Itu pijakan, kan?" },
  cepat:  { id: "cepat",  name: "Kaki Cepat",     emo: "💨", hp: 18, speed: 430,  bounty: 9,  taunt: "Ambil loot dulu, gym belakangan." }
};

// Tiap raid memakai satu gelombang acak dari daftar ini.
export const WAVES = [
  ["rembes", "rembes", "panah"],
  ["rembes", "panah", "cepat", "cepat"],
  ["tebal", "rembes", "panah", "cepat"],
  ["rembes", "rembes", "rembes", "panah", "cepat", "cepat"]
];

export const STEAL_PER_LEAK = 30;   // gold dicuri tiap hero sampai brankas
export const REP_LOSS_PER_LEAK = 2;
