// Script narasi Dungeon Bawang — bercabang, ber-meme, ber-twist.
// Node: { id, day, phase, speaker?, title?, body, choices?, next? }
// body/title/speaker boleh string atau fn(state). choices: [{text, hint?, apply(s), next?}]
// next boleh string, null (akhir -> ending), atau fn(state) untuk percabangan.

export const START_NODE = "intro";

export const STORY_NODES = {
  intro: {
    id: "intro", day: 1, phase: "morning",
    speaker: "DungeonOS", title: "Hari Pertama (Katanya)",
    body: s => [
      "Selamat pagi, Boss. Dungeon Bawang sudah online. 47 minion, 1 koperasi bawang, dan 0 gaji dibayar tepat waktu.",
      "Di pojok, sesosok goblin berjas rapi memegang clipboard. Namanya Grem. 'Kami mau mogok, Boss. Tapi santai dulu, kami baru rapat.'",
      "Ini bukan dungeon biasa. Ini juga bukan kantor biasa. Pilihanmu hari ini akan menentukan jalan cerita ke depan."
    ],
    choices: [
      { text: "Sapa minion dengan ramah", hint: "jalan baik",
        apply: s => { s.flags.treatWell = true; s.flags.path = "kind"; s.stats.morale += 8; }, next: "d1_afternoon" },
      { text: "Abaikan, mereka cuma NPC", hint: "jalan tiran",
        apply: s => { s.flags.exploit = true; s.flags.path = "cruel"; s.stats.morale -= 10; }, next: "d1_afternoon" },
      { text: "Posting selfie 'Boss Santai'", hint: "jalan media",
        apply: s => { s.flags.mediaSavvy = true; s.flags.path = "show"; s.stats.reputation += 8; }, next: "d1_afternoon" }
    ]
  },

  d1_afternoon: {
    id: "d1_afternoon", day: 1, phase: "afternoon",
    speaker: "Grem (Serikat Minion)", title: "Tuntutan Hari Ini",
    body: s => [
      "Grem meletakkan selembar kertas. 'Tiga tuntutan: naik gaji 20%, istirahat 8 jam, ruang makan tanpa bau belerang.'",
      s.flags.exploit
        ? "Ia menatap tajam. 'Kami tahu bos baru suka tekan. Tapi ingat: yang diinjak hari ini, besok jadi atasannya.'"
        : "Ia tersenyum. 'Kalau bos baru ramah, maybe kita bisa damai. Tapi papernya tetap harus ditandatangani.'"
    ],
    choices: [
      { text: "Setuju naik gaji", hint: "-gold, +morale",
        apply: s => { s.stats.gold -= 80; s.stats.morale += 12; s.stats.unionPower -= 10; s.flags.treatWell = true; }, next: "d1_night" },
      { text: "Tolak mentah-mentah", hint: "+gold, -morale, +power",
        apply: s => { s.stats.gold += 40; s.stats.morale -= 12; s.stats.unionPower += 18; s.flags.exploit = true; }, next: "d1_night" },
      { text: "Bikin 'serikat tiruan' milikmu", hint: "pengkhianatan...",
        apply: s => { s.stats.unionPower += 8; s.stats.devSuspicion += 12; s.flags.betrayedUnion = true; s.flags.hqTest = true; s.stats.morale -= 4; }, next: "d1_night" }
    ]
  },

  d1_night: {
    id: "d1_night", day: 1, phase: "night",
    speaker: "HeroAlert", title: "Ada Party Hero Masuk",
    body: s => [
      "Alarm HeroAlert berbunyi. Satu party hero level 5 turun lewat lorong utara. Slime penjaga sudah gemetar.",
      "Grem menatap. 'Kalau kami mogok sekarang, siapa yang jaga trap?' Ia sedang menguji, atau sekadar jujur."
    ],
    choices: [
      { text: "Pasang trap ekstra", hint: "-gold, +stability",
        apply: s => { s.stats.gold -= 60; s.stats.stability += 10; s.stats.loot += 20; }, next: "d2_morning" },
      { text: "Biarkan minion hadapi", hint: "-morale, +loot",
        apply: s => { s.stats.morale -= 8; s.stats.loot += 40; }, next: "d2_morning" },
      { text: "Lapor ke konsol aneh?", hint: "hanya kalau buka DevConsole",
        apply: s => { s.stats.devSuspicion += 8; }, next: "d2_morning" }
    ]
  },

  d2_morning: {
    id: "d2_morning", day: 2, phase: "morning",
    speaker: "DungeonGram", title: "Viral Kecil",
    body: s => [
      "Foto hero kalah di dungeonmu nyasar ke DungeonGram. 'Dungeon Bawang ternyata susah, bawangnya bikin nangis.' Netizen suka.",
      "Grem menatap layar. 'Bos, kalau viral, kita punya leverage. Atau kita cuma konten. Bedanya tipis.'"
    ],
    choices: [
      { text: "Galakkan promosi", hint: "+reputation, jalan media",
        apply: s => { s.stats.reputation += 12; s.flags.mediaSavvy = true; s.stats.gold -= 20; }, next: "d2_afternoon" },
      { text: "Post meme sindir HQ", hint: "meme war 🔥",
        apply: s => { s.flags.mediaSavvy = true; s.flags.memeWar = true; s.stats.reputation += 10; }, next: "d2_afternoon" },
      { text: "Fokus urus minion", hint: "+morale",
        apply: s => { s.stats.morale += 8; s.flags.treatWell = true; }, next: "d2_afternoon" }
    ]
  },

  d2_afternoon: {
    id: "d2_afternoon", day: 2, phase: "afternoon",
    speaker: "UnionDesk", title: "Demo Damai (Tapi Berisik)",
    body: s => [
      "Serikat turun ke lobi dengan spanduk: 'GAJI LAYAK, BAWANG TIDAK.' Seorang slime pegang megafon malu-malu.",
      "Grem: 'Kami demo damai, Boss. Tapi kalau besok tak ada jawaban, kami demo lapar. Itu lebih berbahaya, perut slime berisik.'"
    ],
    choices: [
      { text: "Nego: naik 10%", hint: "-gold, +morale, -power",
        apply: s => { s.stats.gold -= 40; s.stats.morale += 8; s.stats.unionPower -= 12; s.flags.treatWell = true; }, next: "d2_night" },
      { text: "Ancam tutup dungeon", hint: "-morale, +power",
        apply: s => { s.stats.morale -= 12; s.stats.unionPower += 14; s.flags.exploit = true; }, next: "d2_night" }
    ]
  },

  d2_night: {
    id: "d2_night", day: 2, phase: "night",
    speaker: "Grem", title: "Obrolan Tengah Malam",
    body: s => [
      "Grem mendatangi ruangmu. 'Boss, jujur saja. Aku dulu minion biasa. Sekarang wakil serikat. Aneh ya, naik jabatan lewat mogok.'",
      "Ia meletakkan sebutir bawang di mejamu. 'Ini lambang kami. Bawang menangis tapi tetap utuh. Seperti kami.'"
    ],
    choices: [
      { text: "Ambil bawang, hargai simbol", hint: "jalan kultus bawang",
        apply: s => { s.flags.leanOnion = true; s.stats.morale += 6; }, next: "d3_morning" },
      { text: "Tolak, itu cuma sayur", hint: "-morale",
        apply: s => { s.stats.morale -= 6; }, next: "d3_morning" },
      { text: "Foto bawang buat postingan", hint: "+reputation",
        apply: s => { s.flags.mediaSavvy = true; s.stats.reputation += 6; }, next: "d3_morning" }
    ]
  },

  d3_morning: {
    id: "d3_morning", day: 3, phase: "morning",
    speaker: "HeroAlert", title: "Party Lebih Gede",
    body: s => [
      "HeroAlert: party level 9 masuk. Ketuanya bawa pedang berlabel 'HR Departemen Hero'. Aneh. Kok ada HR di Guild Hero?",
      "Grem menyipit. 'Boss, logo di pedang itu mirip logo memo HQ. Jangan-jangan mereka satu induk.'"
    ],
    choices: [
      { text: "Siagakan semua trap", hint: "-gold, +stability",
        apply: s => { s.stats.gold -= 70; s.stats.stability += 8; }, next: "d3_afternoon" },
      { text: "Curiga sama HQ", hint: "buka jalur rahasia",
        apply: s => { s.flags.hqTest = true; s.stats.devSuspicion += 10; }, next: "d3_afternoon" }
    ]
  },

  d3_afternoon: {
    id: "d3_afternoon", day: 3, phase: "afternoon",
    speaker: "Memo HQ", title: "Surat dari Atas",
    body: s => [
      "Kotak masuk: MEMO HQ #666 — 'Boss, performa dungeon menurun. Jika serikat terlalu kuat, kami akan evaluasi posisimu.'",
      "Tak ada tanda tangan. Hanya stempel bawang merah terlalu besar. Grem bisik: 'HQ tak suka kalau kita terlalu sadar hak.'"
    ],
    choices: [
      { text: "Patuh pada HQ", hint: "jadi yes-man",
        apply: s => { s.stats.unionPower -= 14; s.stats.morale -= 6; s.flags.exploit = true; s.flags.joinedHQ = true; }, next: "d3_night" },
      { text: "Bela serikat", hint: "+morale, -gold",
        apply: s => { s.stats.morale += 10; s.stats.gold -= 30; s.flags.treatWell = true; }, next: "d3_night" },
      { text: "Selidiki HQ diam-diam", hint: "+devSuspicion, rahasia",
        apply: s => { s.flags.hqTest = true; s.stats.devSuspicion += 16; }, next: "d3_night" }
    ]
  },

  d3_night: {
    id: "d3_night", day: 3, phase: "night",
    speaker: "DungeonOS", title: "Laporan Malam",
    body: s => [
      "Ringkasan: " +
        (s.flags.treatWell ? "kamu memihak minion. " : "") +
        (s.flags.exploit ? "kamu menekan minion. " : "") +
        (s.flags.mediaSavvy ? "kamu sibuk di media. " : "") +
        "Union makin percaya diri. Besok mereka kirim ultimatum."
    ],
    choices: [
      { text: "Tidur tenang", next: "d4_morning" },
      { text: "Stalk DungeonGram sampai pagi", hint: "+reputation",
        apply: s => { s.flags.mediaSavvy = true; s.stats.reputation += 5; }, next: "d4_morning" }
    ]
  },

  d4_morning: {
    id: "d4_morning", day: 4, phase: "morning",
    speaker: "Grem", title: "Ultimatum",
    body: s => [
      "Grem membawa kertas berukuran banner. 'Pilihan akhir, Boss: aku mau mogok, atau aku mau jadi partner. Tapi ada satu rahasia.'",
      "Ia menarik napas. 'Sebenarnya... aku bukan goblin biasa. Aku bos dungeon ini sebelum kamu. Mereka turunkan aku jadi serikat supaya mudah dikendalikan.'",
      "Twist kecil hari ini: orang yang kamu anggap pengganggu, dulu duduk di kursimu."
    ],
    choices: [
      { text: "Angkat Grem jadi partner", hint: "+morale, aliansi",
        apply: s => { s.stats.morale += 10; s.stats.unionPower -= 10; s.flags.treatWell = true; s.flags.unionSide = true; }, next: "d4_afternoon" },
      { text: "Tolak, kau bos sekarang", hint: "+power, -morale",
        apply: s => { s.stats.unionPower += 10; s.stats.morale -= 10; s.flags.exploit = true; }, next: "d4_afternoon" },
      { text: "Tanya: siapa yang turunkan dia?", hint: "+devSuspicion, rahasia",
        apply: s => { s.stats.devSuspicion += 12; s.flags.hqTest = true; }, next: "d4_afternoon" },
      { text: "Aku terima, kau memang bos", hint: "??",
        apply: s => { s.flags.gremWasBoss = true; s.stats.morale += 4; }, next: "d4_afternoon" }
    ]
  },

  d4_afternoon: {
    id: "d4_afternoon", day: 4, phase: "afternoon",
    speaker: "DungeonOS", title: "PLOT TWIST: Siapa Bos Sebenarnya",
    body: s => {
      if (s.flags.gremWasBoss)
        return ["Karena kau terima, Grem tertawa lebar. 'Akhirnya. Aku bos, kau bos bayangan. Kita berdua tahu siapa yang pegang kendali sebenarnya.'", "Layar berkedip: 'VERSI 6.6.6 — IDENTITAS: TERKONFIRMASI'. Kau bukan boss. Kau legenda urban."];
      if (s.flags.exploit)
        return ["Karena kamu suka menekan, Grem tertawa: 'Kau kira kau bos? Hero yang kau lawan minggu lalu... mereka dikirim HQ untuk audit. Kau cuma pion berjas.'", "Layar berkedip: 'VERSI 6.6.6 — REALITY OPTIONAL'. Kamu menelan ludah. Atau tak punya ludah."];
      if (s.flags.mediaSavvy)
        return ["Karena kamu sibuk konten, Grem menyeringai: 'Bos yang sibuk foto tak sempat kelola. Makanya HQ berani tekan. Viral bukan berarti menang, Boss.'", "Layar berkedip: 'VERSI 6.6.6 — AUDIENCE: MANIPULATIF'. Netizen tertawa, kamu menangis."];
      return ["Grem menatap: 'Bos sebenarnya? Tidak ada. Cuma rantai orang lelah. Hari ini kau di ujung, besok mungkin aku. Sistemnya yang bosan, bukan kita.'", "Layar berkedip: 'VERSI 6.6.6 — REALITY OPTIONAL'. Kamu menelan ludah. Atau tak punya ludah."];
    },
    choices: [
      { text: "Terima fakta, lanjut", next: "d4_night" },
      { text: "Cek konsol aneh di pojok", hint: "hanya kalau DevConsole terbuka",
        apply: s => { s.stats.devSuspicion += 10; }, next: "d4_night" }
    ]
  },

  d4_night: {
    id: "d4_night", day: 4, phase: "night",
    speaker: s => (s.flags.devConsole ? "DevConsole" : "Grem"),
    title: s => (s.flags.devConsole ? "Akses Aneh" : "Tenang Sejenak"),
    body: s => {
      if (s.flags.devConsole)
        return ["DevConsole menyala walau tak seharusnya. 'WARNING: narasi diawasi. akun: PLAYER.'", "Tombol muncul: [LIHAT KE BALIK LAYAR]. Jari bergetar di atasnya."];
      return ["Malam sunyi. Minion tidur di selasar. Grem duduk di tangga memakan bawang mentah.",
        "Ia tak menyindir malam ini. Mungkin besok adalah hari penentuan."];
    },
    choices: [
      { text: "Buka DevConsole (jika ada)", hint: "jalur rahasia berlapis",
        apply: s => { if (s.flags.devConsole) s.stats.devSuspicion += 40; }, next: "d5_morning" },
      { text: "Tidur", next: "d5_morning" }
    ]
  },

  d5_morning: {
    id: "d5_morning", day: 5, phase: "morning",
    speaker: "UnionDesk", title: "Hitung Mundur",
    body: s => [
      "Spanduk baru: 'H-5 hari sebelum MOGOK BESAR.' Angka simbolis, tapi terasa berat.",
      s.flags.path === "cruel"
        ? "Grem: 'Bos yang suka tekan, kami siap. Tapi ingat: yang diinjak akan bangkit. Dan mereka punya clipboard.'"
        : "Grem: 'Bos, kali ini aku serius. Kecuali kau kasih sesuatu yang bukan cuma gaji.'"
    ],
    choices: [
      { text: "Janjikan kesejahteraan nyata", hint: "-gold, +morale",
        apply: s => { s.stats.gold -= 100; s.stats.morale += 14; s.stats.unionPower -= 16; s.flags.treatWell = true; }, next: "d6_branch" },
      { text: "Janjikan 'kekeluargaan' doang", hint: "-morale, +power",
        apply: s => { s.stats.morale -= 10; s.stats.unionPower += 16; s.flags.exploit = true; }, next: "d6_branch" }
    ]
  },

  // Percabangan: ke node meme / pajak / biasa tergantung flag
  d6_branch: {
    id: "d6_branch", day: 6, phase: "morning",
    speaker: "DungeonOS", title: "Arah Cerita Berubah",
    body: s => ["Cabang cerita tercipta dari pilihanmu. Dungeon mulai punya arah sendiri."],
    next: s => {
      if (s.flags.memeWar) return "d6_memewar";
      if (s.flags.taxDungeon) return "d6_tax";
      return "d6_tax";
    }
  },

  d6_memewar: {
    id: "d6_memewar", day: 6, phase: "afternoon",
    speaker: "DungeonGram", title: "Perang Meme Dimulai",
    body: s => [
      "Kau posting: 'Harga platinum naik dari 12 gold jadi 18 gold? Gold inflasi? Orang dungeon kan gak pakai platinum!'",
      "Netizen ledak. Satu lagi: 'Gaji naik 20%? Itu cuma di surat, di rekening beda.' Trending. HQ murka, bikin satgas yang cuma bikin stiker."
    ],
    choices: [
      { text: "Lanjut meme serangan", hint: "+reputation, memeWar",
        apply: s => { s.flags.memeWar = true; s.stats.reputation += 14; }, next: "d6_tax" },
      { text: "Hapus sebelum diperkarakan", hint: "-reputation",
        apply: s => { s.stats.reputation -= 8; }, next: "d6_tax" }
    ]
  },

  d6_tax: {
    id: "d6_tax", day: 6, phase: "afternoon",
    speaker: "Memo HQ", title: "Pajak Dungeon Naik",
    body: s => [
      "Memo HQ #690: 'Pajak dungeon naik 30%. Katanya untuk rakyat, kok yang makin kaya cuma HQ.'",
      "Grem: 'Infrastruktur trap dibangun, tapi lorongnya berlubang. Mentri TrapMart bilang stabilitas naik, rakyat dungeon bilang mana buktinya.'"
    ],
    choices: [
      { text: "Protes pakai meme", hint: "memeWar + pajak",
        apply: s => { s.flags.memeWar = true; s.flags.taxDungeon = true; s.stats.reputation += 8; }, next: "d7_night" },
      { text: "Bayar pajak (pasrah)", hint: "-gold, kena pajak",
        apply: s => { s.flags.taxDungeon = true; s.stats.gold -= 60; s.flags.joinedHQ = true; }, next: "d7_night" },
      { text: "Tolak bayar", hint: "-morale, +power",
        apply: s => { s.flags.taxDungeon = true; s.stats.morale -= 8; s.stats.unionPower += 12; s.flags.exploit = true; }, next: "d7_night" }
    ]
  },

  d7_night: {
    id: "d7_night", day: 7, phase: "night",
    speaker: "Grem", title: "Renungan Bawang",
    body: s => [
      "Grem kembali bawa bawang. 'Tahukah kau, Boss? Bawang punya lapisan. Kau kupas satu, ada lagi di bawah. Sama seperti cerita kita.'",
      s.flags.exploit
        ? "Ia tersenyum tipis: 'Yang sabar punya batas, yang diam punya suara. Hati-hati, Boss. Suaramu sudah di ujung.'"
        : "Ia tersenyum tulus: 'Mungkin twist besok bukan tentang siapa bos. Tapi tentang apa gunanya jadi bos.'"
    ],
    choices: [
      { text: "Ambil bawang lagi", hint: "jalan kultus",
        apply: s => { s.flags.leanOnion = true; s.stats.morale += 6; }, next: "d8_morning" },
      { text: "Peluk Grem (canggung)", hint: "+morale",
        apply: s => { s.stats.morale += 8; s.flags.treatWell = true; }, next: "d8_morning" },
      { text: "Dungeon ini adalah aku", hint: "??",
        apply: s => { s.flags.dungeonItuKamu = true; s.stats.devSuspicion += 6; }, next: "d8_morning" }
    ]
  },

  d8_morning: {
    id: "d8_morning", day: 8, phase: "morning",
    speaker: "Memo HQ", title: "HQ Makin Penasaran",
    body: s => [
      "Memo HQ #667: 'Engagement naik tapi produktivitas turun. Kami kirim tim penilai. Jangan khawatir, mereka ramah. (Mereka bawa pedang.)'",
      "Grem: 'Tim penilai = tim eksekusi. HQ mulai tak sabar. Kita harus tentukan sikap minggu ini.'"
    ],
    choices: [
      { text: "Lindungi minion dari tim HQ", hint: "+morale, -gold",
        apply: s => { s.stats.morale += 10; s.stats.gold -= 60; s.flags.treatWell = true; s.flags.unionSide = true; }, next: "d9_afternoon" },
      { text: "Serahkan minion ke HQ", hint: "-morale, +power HQ",
        apply: s => { s.stats.morale -= 14; s.stats.unionPower -= 10; s.flags.exploit = true; s.flags.betrayedUnion = true; s.flags.joinedHQ = true; }, next: "d9_afternoon" },
      { text: "Rekam semua buat viral", hint: "+reputation",
        apply: s => { s.flags.mediaSavvy = true; s.flags.memeWar = true; s.stats.reputation += 10; }, next: "d9_afternoon" }
    ]
  },

  d9_afternoon: {
    id: "d9_afternoon", day: 9, phase: "afternoon",
    speaker: "Grem", title: "Hari Penentuan",
    body: s => [
      "Grem: 'Besok, Boss. Besok aku umumkan apa pun yang kau putuskan malam ini. Jadi... mau jadi bos apa?'",
      "Ia menatap tajam. 'Bos yang ditakuti, bos yang dicintai, atau... bukan bos sama sekali.'"
    ],
    choices: [
      { text: "Jadi bos yang adil", hint: "jalur baik",
        apply: s => { s.stats.morale += 6; s.flags.treatWell = true; s.stats.unionPower -= 8; }, next: "d10_night" },
      { text: "Jadi bos yang ditakuti", hint: "jalur buruk",
        apply: s => { s.stats.morale -= 8; s.flags.exploit = true; s.stats.unionPower += 12; }, next: "d10_night" },
      { text: "Gabung jadi partner serikat", hint: "aliansi",
        apply: s => { s.flags.unionSide = true; s.stats.morale += 6; s.stats.unionPower -= 12; }, next: "d10_night" },
      { text: "Aku sebenarnya hero penyusup", hint: "??",
        apply: s => { s.flags.secretHero = true; s.stats.devSuspicion += 10; }, next: "d10_night" }
    ]
  },

  d10_night: {
    id: "d10_night", day: 10, phase: "night",
    speaker: "DungeonOS", title: "Hari ke-10: Keputusan Akhir",
    body: s => {
      const style = s.flags.exploit ? "penindas" : s.flags.treatWell ? "penyelamat" : s.flags.mediaSavvy ? "selebriti" : "orang biasa";
      return [
        "Lampu dungeon meredup. Grem berdiri di lobi, dikelilingi minion yang menahan napas.",
        `Kau bukan lagi ${style} yang sama seperti hari pertama. Tak ada pilihan bergaya. Hanya satu tindakan terakhirmu.`,
        "Layar berkedip: 'ENDING SEQUENCE READY.'"
      ];
    },
    choices: [
      { text: "Ucapkan kata terakhir untuk semua", hint: "lihat ending-mu",
        apply: s => {}, next: null }
    ]
  }
};

export function getNode(id) {
  return STORY_NODES[id] || null;
}
