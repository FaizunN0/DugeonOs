// Interogasi Kartu Bukti (W3) — pengganti mini-game refleks SERGAP.
// Logika bisa dipelajari: mood tersangka terlihat -> pendekatan yang tepat pasti benar.
export const MOODS = {
  marah: { label: "Marah",  emo: "😡", best: "diplomasi", tell: "Nada tinggi. Menyebut kata 'pengacara' tiap 10 detik." },
  gugup: { label: "Gugup",  emo: "😅", best: "tekan",     tell: "Keringat dingin. Kaki goyang seperti mesin tik." },
  licik: { label: "Licik",  emo: "😏", best: "bukti",     tell: "Senyum tipis. Semua jawabannya halus seperti mentega." }
};

export const APPROACH = {
  tekan:     { label: "Tekan Psikologis",    emo: "😤", desc: "\"Kamu pikir lorong ini milikmu?!\"" },
  diplomasi: { label: "Diplomasi Teh Hangat", emo: "🍵", desc: "\"Silakan duduk. Tehnya dua gula, kan?\"" },
  bukti:     { label: "Pamer Dokumen Bukti",  emo: "📄", desc: "*letakkan map tebal di meja, pelan*" }
};

// Setiap kartu terikat satu mood — tell-nya tertulis jelas di narasi.
export const CARDS = [
  { mood: "marah", txt: "\"Ini pemerasan!\" bentak hero sambil menendang kursi. Kursinya pindah 2 meter." },
  { mood: "marah", txt: "\"PANGGIL PENGACARAKU!\" Teriakannya. Pengacaranya ternyata juga sedang ditahan di ruang sebelah." },
  { mood: "gugup", txt: "Tangannya basah, matanya scan pintu keluar tiap 4 detik. Dia pegang sesuatu di kantong." },
  { mood: "gugup", txt: "\"S-saya tidak melakukan apa-apa,\" katanya, dua kali, sebelum ditanya apa pun." },
  { mood: "licik", txt: "\"Sebenarnya kalau dipikir-pikir,\" ucapnya sambil tersenyum, \"definisi 'mencuri' itu relatif." },
  { mood: "licik", txt: "Dia memutar kursi, menyandarkan kaki, dan mengutip pasal yang bahkan belum ada." },
  { mood: "gugup", txt: "Air tehnya ia teguk sekali habis. Gelas kedua juga. Tangan masih gemetar halus." },
  { mood: "marah", txt: "Dia membanting map bukti ke lantai. Isinya malah tersebar rapi — dia yang melipatnya." },
  { mood: "licik", txt: "\"Aku hanya turis,\" katanya, lengkap dengan kamera, peta brankas, dan seragam guild." }
];

export const ROUNDS = 5;
export const REWARD_PER_CORRECT = { g: 8, loot: 4 };

// Nama tersangka dipinjam dari dunia raid biar terasa satu universe.
export const SUSPECT_NAMES = ["Sir Rembes", "Panji Panahan", "Baja Tebal", "Kaki Cepat", "Brave-X Jr.", "Saint-E"];
