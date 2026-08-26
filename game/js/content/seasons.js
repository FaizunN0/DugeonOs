// Musim operasional (Fase 4): siklus 12 hari, efek ke ekonomi & raid.
export const SEASONS = [
  { id: "biasa",        dayMod: null, name: "Hari Biasa",           incomeMul: 1.00, hpMul: 1.00, line: "Tidak ada yang spesial. Spesial itu mahal." },
  { id: "jumat_bawang", dayMod: 3,    name: "Jumat Berkah Bawang",  incomeMul: 1.25, hpMul: 1.00, line: "Permintaan bawang melonjak. Ojek naga lembur." },
  { id: "purnama",      dayMod: 6,    name: "Purnama Pemberani",    incomeMul: 0.90, hpMul: 1.30, line: "Hero jadi berani karena bulan terang. Logika." },
  { id: "audit_musim",  dayMod: 9,    name: "Musim Audit Tahunan",  incomeMul: 1.10, hpMul: 1.10, line: "HQ sibuk menghitung. Kamu sibuk menghitung juga." }
];

export function activeSeason(opDay) {
  const d = ((opDay % 12) + 12) % 12;
  return SEASONS.find(s => s.dayMod === d) || SEASONS[0];
}
