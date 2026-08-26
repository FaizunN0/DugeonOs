// Data pekerjaan operasional dungeon (Fase 1, rebalance Fase 3.5).
// rate = potensi gold/hari pada trait 1.0 & morale 100 (dibagi 4 per fase).
export const JOBS = {
  nganggur: { label: "Nganggur", icon: "slime", rate: 0, desc: "Gaji tetap jalan. Kerja? Nanti dulu." },
  ojek:     { label: "Ojek Naga", icon: "rider", rate: 14, desc: "Antar penumpang. Helmnya cuma satu, bergantian." },
  dapur:    { label: "Dapur Neraka", icon: "food", rate: 18, desc: "Menu hari ini: apa pun yang tidak kabur." },
  gudang:   { label: "Gudang Loot", icon: "store", rate: 10, desc: "Rapikan hasil jarahan. Jangan dicicil." },
  keamanan: { label: "Keamanan Lorong", icon: "skull", rate: 7, desc: "Berdiri tegap sampai hero kapok." }
};
export const JOB_ORDER = ["nganggur", "ojek", "dapur", "gudang", "keamanan"];
