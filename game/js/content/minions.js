// Data kandidat minion & trait (Fase 1). Balancing = edit di sini.
export const TRAITS = {
  rajin:    { label: "Rajin", workMul: 1.25, salary: 15, cv: "Bangun 04:00 tanpa alarm. Menyeramkan tapi efektif." },
  ceroboh:  { label: "Ceroboh", workMul: 0.85, salary: 8, cv: "Pernah menjatuhkan brankas. Dua kali. Tahun yang sama." },
  unionis:  { label: "Unionis", workMul: 1.0, salary: 11, cv: "Hafal UU Ketenagakerjaan lebih dari hafal jalan pulang." },
  loyal:    { label: "Loyal", workMul: 1.1, salary: 13, cv: "Setia pada perusahaan. Perusahaan belum tahu." },
  ngantuk:  { label: "Ngantuk", workMul: 0.7, salary: 6, cv: "Bawa bantal sendiri. Menghemat budget kantor." },
  dramatis: { label: "Dramatis", workMul: 0.95, salary: 9, cv: "Semua kejadian diceritakan ulang tiga kali lipat." },
  ahliTrap: { label: "Ahli Trap", workMul: 1.2, salary: 16, cv: "Sertifikasi trap palsu, tapi skill-nya asli." },
  hemat:    { label: "Hemat", workMul: 1.05, salary: 7, cv: "Makan sekali sehari demi 'efisiensi perusahaan'." },
  legendaris: { label: "Legendaris", workMul: 3, salary: 999, cv: "CV satu halaman: 'Saya yang punya brankas itu.'" }
};

export const MINION_POOL = [
  { id: "p_budi",   name: "Budi",   trait: "rajin" },
  { id: "p_sinta",  name: "Sinta",  trait: "ceroboh" },
  { id: "p_ujang",  name: "Ujang",  trait: "unionis" },
  { id: "p_dewi",   name: "Dewi",   trait: "loyal" },
  { id: "p_tono",   name: "Tono",   trait: "ngantuk" },
  { id: "p_ririn",  name: "Ririn",  trait: "dramatis" },
  { id: "p_gogon",  name: "Gogon",  trait: "ahliTrap" },
  { id: "p_mimin",  name: "Mimin",  trait: "hemat" },
  { id: "p_agus",   name: "Agus",   trait: "rajin" },
  { id: "p_lulu",   name: "Lulu",   trait: "ngantuk" },
  { id: "p_basro",  name: "Basro",  trait: "unionis" },
  { id: "p_kiki",   name: "Kiki",   trait: "dramatis" }
];

export const INTERVIEW_Q = [
  {
    q: "Kenapa mau kerja di dungeon?",
    opts: ["Gaji tepat waktu (bohong boleh)", "Suka memandang hero tersesat", "Lupa cara pulang"]
  },
  {
    q: "Kelebihan terbesarmu?",
    opts: ["Datang tepat waktu", "Nggak banyak tanya", "Tahan bawang"]
  },
  {
    q: "Kalau HQ audit, kamu jawab apa?",
    opts: ["'Data lagi dirapikan'", "'Silakan cek lorong 3'", "Menangis dulu, bicara kemudian"]
  },
  {
    q: "Ekspektasi gaji?",
    opts: ["Sesuai UMK dungeon", "Bonusnya aja cukup", "Yang penting diangkat"]
  },
  {
    q: "Pernah mogok?",
    opts: ["Belum, tapi terbuka", "Rutin, tiap Senin", "Mogok itu mitos"]
  }
];

// Surat pribadi minion untuk bos (MinionApp Personalia, W4).
export const LETTERS = {
  rajin:    "Bos, saya bangun 04:00 bukan karena disuruh. Saya cuma tidak percaya jam dinding dungeon ini.",
  ceroboh:  "Kalau ada brankas jatuh lagi, itu bukan saya. Ada dua saksi mata. Keduanya juga saya, tapi tetap dua.",
  unionis:  "Merujuk pasal 9 ayat terakhir yang saya tulis sendiri kemarin: hak kita atas istirahat itu suci.",
  loyal:    "Saya di sini bukan karena gaji. Saya di sini karena sudah terlanjur sayang sama tempat curang ini.",
  ngantuk:  "Bos, kalau saya tidur berdiri itu bukan malas. Itu proses loading. Jangan diganggu, nanti corrupt.",
  dramatis: "Hari ini hujan di lorong timur. Tidak ada yang mati. Tapi rasanya seperti harus ada yang menangis.",
  ahliTrap: "Sertifikat saya palsu, Bos. Skill-nya asli. Kalau trap saya gagal, namanya bukan gagal — namanya eksperimen.",
  hemat:    "Saya makan sekali sehari demi efisiensi perusahaan. Tolong jangan bilang HRD, nanti jadi SOP.",
  legendaris: "Surat ini kutulis sebelum kau membacanya. Begitu juga brankasnya, sebelum kau menyimpannya. - M.K.M."
};
