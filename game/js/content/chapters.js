// Campaign berbab (Fase 3): cutscene keputusan di milestone hari operasional.
// Balancing & narasi = edit data di sini. apply(st) dieksekusi di dalam mutate.
export const CHAPTERS = [
  {
    id: "rapat_senin",
    at: 2,
    title: "Bab 1 — Rapat Senin Pukul 07:00",
    paras: [
      "HQ mengirim surat: 'Diskusi strategi Q1'. Tempatnya lorong lembap, konferensinya meja kayu serabutan.",
      "Grem datang tanpa diundang, duduk paling depan, membawa snackbar sendiri."
    ],
    choices: [
      { label: "Bikin KPI baru (yang mustahil)", satir: "KPI: 'Hero nangis bahagia'. Target: 100%. Realita: nunggu.", apply: st => { st.factions.hq += 5; st.factions.serikat -= 3; } },
      { label: "Beliin snack rapat (20g)", satir: "Minion senang. Perut kenyang, hati damai, angka tetap merah.", apply: st => { st.stats.gold = Math.max(0, st.stats.gold - 20); st.minionsCorp.hired.forEach(m => m.morale = Math.min(100, m.morale + 6)); } },
      { label: "Tunda rapat selamanya", satir: "Agenda dipindah ke 'Q selanjutnya'. Tradisi abdi negara mana pun.", apply: st => { st.factions.hq -= 2; } }
    ]
  },
  {
    id: "inspeksi_hq",
    at: 4,
    title: "Bab 2 — Inspeksi Mendadak HQ",
    paras: [
      "Inspektur HQ turun dengan jas rapi dan sepatu yang terlalu bersih untuk dungeon.",
      "Dia menatap lorongmu lama. Terlalu lama. Lalu tersenyum makna apa pun itu."
    ],
    choices: [
      { label: "Suap 30g (dalam map 'dokumen')", satir: "Map berisi dokumen. Dokumen berisi map. Ekonomi berputar.", apply: st => { st.stats.gold = Math.max(0, st.stats.gold - 30); st.factions.hq += 8; } },
      { label: "Terima inspeksi dengan jujur", satir: "Kejujuran: mahal, tapi tidak bikin keringet dingin tiap telepon.", apply: st => { st.stats.reputation = Math.min(100, st.stats.reputation + 4); st.factions.hq -= 4; } },
      { label: "Pamerkan koleksi trap", satir: "Inspektur kena Trap Ilusi. Dia pulang membawa filosofi hidup baru.", apply: st => { st.factions.hero -= 5; st.stats.reputation = Math.min(100, st.stats.reputation + 2); } }
    ]
  },
  {
    id: "naik_gaji",
    at: 6,
    title: "Bab 3 — Serikat Minta Naik Gaji",
    paras: [
      "Spanduk baru terpasang: 'GAJI ANJAKAN ATAU SHIFT DIANJIRKAN'. Ejaannya salah, semangatnya tidak.",
      "Perwakilan serikat masuk membawa tiga map tebal dan satu termos besar."
    ],
    choices: [
      { label: "Setujui naik 15%", satir: "Payroll membengkak, tapi spanduk berganti jadi 'BOS TERBAIK (SEMENTARA)'.", apply: st => { st.flags.payrollMul = 1.15; st.factions.serikat = Math.min(100, st.factions.serikat + 12); } },
      { label: "Nego jadi 8%", satir: "Kompromi: semua agak senang, nobody fully happy. Demokrasi bekerja.", apply: st => { st.flags.payrollMul = 1.08; st.factions.serikat = Math.min(100, st.factions.serikat + 5); } },
      { label: "Tolak dengan PowerPoint 40 slide", satir: "Slide 39: 'Kenapa Kalian Salah'. Karier HRDmu bersinar, kas aman.", apply: st => { st.factions.serikat = Math.max(0, st.factions.serikat - 12); } }
    ]
  },
  {
    id: "petisi_hero",
    at: 9,
    title: "Bab 4 — Hero Bikin Petisi Online",
    paras: [
      "'#DungeonBerbahaya' trending. Isinya keluhan wajar: terlalu banyak trap, kurang ramah penyandang disabilitas zirah.",
      "Divisi humas dungeon (satu orang, paruh waktu) menunggu arahanmu."
    ],
    choices: [
      { label: "Balas pakai meme", satir: "Viral lagi. Reputasi naik, harga diri hero turun. Seimbang.", apply: st => { st.factions.hero = Math.max(0, st.factions.hero - 6); st.stats.reputation = Math.min(100, st.stats.reputation + 3); } },
      { label: "Jawab formal & empati", satir: "Tidak viral. Tapi Guild Hero memperhatikan gesturnya.", apply: st => { st.factions.hero = Math.min(100, st.factions.hero + 8); } },
      { label: "Abaikan, scroll feed sendiri", satir: "Kamu ketahuan like postingan lawan. Diplomasi tingkat dewa.", apply: st => { st.factions.hero = Math.max(0, st.factions.hero - 3); st.stats.reputation = Math.max(0, st.stats.reputation - 1); } }
    ]
  },
  {
    id: "audit_besar",
    at: 12,
    title: "Bab 5 — Audit Besar-Besaranan",
    paras: [
      "Tim audit datang dengan kotak arsip enam. Enam.",
      "Pertanyaan pertama mereka: 'Di mana kas?' Pertanyaan kedua: 'Serius, di mana?'"
    ],
    choices: [
      { label: "Serahkan semua laporan (apa adanya)", satir: "Auditor diam lama. Lalu bilang: 'Ini... jujur banget sih.' Status: bingung.", apply: st => { st.factions.hq = Math.min(100, st.factions.hq + 6); st.stats.reputation = Math.min(100, st.stats.reputation + 2); } },
      { label: "Pinjam gold minion dulu (refund besok*)", satir: "*besok tahun depan. Morale turun, kas selamat, dosa dicatat.", apply: st => { st.minionsCorp.hired.forEach(m => m.morale = Math.max(0, m.morale - 8)); } },
      { label: "Blame sistem (buat slide lagi)", satir: "'Sistemnya begitu' — kalimat sakti lintas peradaban birokrasi.", apply: st => { st.factions.hq -= 3; } }
    ]
  },
  {
    id: "kabar_mkm",
    at: 15,
    title: "Bab 6 — Kabar Tentang Tikus Berjubah",
    paras: [
      "CCTV rusak merekam sosok kecil berjubah di lorong timur. Bawa kopiah. Bawa juga... kunci brankas?",
      "Para saksi menyebut namanya pelan-pelan: Men... Tri... King... Mouse."
    ],
    choices: [
      { label: "Burukan! Pasang umpan keju premium", satir: "Operasi pencarian resmi dibuka. Anggaran: tidak ditanyakan.", apply: st => { st.flags.mkmBoost = true; } },
      { label: "Pantau diam-diam lewat CCTV", satir: "Kamu belajar satu hal: dia juga mengawasimu balik.", apply: st => { st.factions.grem = Math.min(100, (st.factions.grem || 50) + 4); } },
      { label: "Itu cuma tikus biasa (denial)", satir: "Denial tahap satu dari lima. Selamat datang, bos.", apply: st => {} }
    ]
  }
];
