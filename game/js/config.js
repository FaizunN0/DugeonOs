export const GAME_CONFIG = {
  title: "DungeonOS: Boss, Kami Mau Mogok!",
  version: "1.1.0",
  maxDay: 10,
  phases: ["morning", "afternoon", "night"],
  saveSlots: 3,
  autosave: true,
  sqliteMode: false
};

export const PHASE_LABELS = {
  morning: "Pagi",
  afternoon: "Siang",
  night: "Malam"
};

export const APPS = [
  {
    id: "feed",
    name: "DungeonFeed",
    icon: "feed",
    accent: "#A855F7",
    description: "Cerita utama DungeonOS. Buka untuk lanjutkan hari & balas pesan Grem.",
    defaultUnlocked: true,
    core: true,
    hidden: false
  },
  {
    id: "minion",
    name: "MinionApp",
    icon: "minion",
    accent: "#34D399",
    description: "Kelola minion: gaji, istirahat, dan seni menyuruh tanpa dibilang 'tiran'.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "union",
    name: "UnionDesk",
    icon: "union",
    accent: "#FF4FD8",
    description: "Serikat Minion & tuntutan mereka. 'Gaji layak' kata mereka. 'Gaji ya sudah' kata kamu.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "faction",
    name: "Faksi",
    icon: "hqOrb",
    accent: "#9CA3FF",
    description: "Peta kekuatan DungeonOS Inc.: HQ, Serikat, Hero & Grem. Siapa yang sebenarnya bos?",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "trapmart",
    name: "TrapMart",
    icon: "trapmart",
    accent: "#FFB23E",
    description: "E-commerce pertahanan: katalog + keranjang + review bintang lima palsu. Stok masuk gudang BangunRuang.",
    defaultUnlocked: true,
    core: true,
    hidden: false
  },
  {
    id: "heroalert",
    name: "HeroAlert",
    icon: "heroalert",
    accent: "#FF5E7A",
    description: "Radar hero + mini-game SERGAP & interogasi timing.",
    defaultUnlocked: true,
    core: true,
    hidden: false
  },
  {
    id: "dungeongram",
    name: "DungeonGram",
    icon: "dungeongram",
    accent: "#34E7E4",
    description: "Reputasi dungeon lu di dunia luar.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "codex",
    name: "Grimoire",
    icon: "codex",
    accent: "#C77DFF",
    description: "Bestiary & lore dungeon: minion, hero, boss, dan rahasia bawang.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "jukebox",
    name: "SoundStone",
    icon: "jukebox",
    accent: "#FF7AC6",
    description: "Pemutar sihir: BGM dungeon & SFX. Hidupkan suaranya.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "physics",
    name: "RuneForge",
    icon: "physics",
    accent: "#22D3EE",
    description: "Bengkel Rune: tempa bahan drop raid jadi artefak berbuff nyata. Gagal? Meledak.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "weather",
    name: "Ramalan",
    icon: "weather",
    accent: "#7DD3FC",
    description: "Ramalan cuaca magis 5 hari. Hujan bawang? Bisa jadi.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "gallery",
    name: "BawangPedia",
    icon: "gallery",
    accent: "#FBBF24",
    description: "Ensiklopedia meme & fakta absurd dunia dungeon.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "patchnote",
    name: "PatchNotes",
    icon: "patchnote",
    accent: "#FB923C",
    description: "Catatan rilis DungeonOS, dari versi purba sampai yang paling baru.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "standup",
    name: "Standup",
    icon: "hourglass",
    accent: "#FBBF24",
    description: "Meeting pagi DungeonOS Inc. Grem tanya, kamu jawab — sebelum waktu habis. Kalau diam, dia catat 'Setuju'.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "bazzaar",
    name: "Bazzaar",
    icon: "gift",
    accent: "#FFD86B",
    description: "Toko 'premium' DungeonOS Inc. Harga wajar, manfaat kosong. Selamat datang di kapitalisme bawah tanah.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "orakel",
    name: "Orakel",
    icon: "scroll",
    accent: "#34E7E4",
    description: "Orakel DungeonOS. Melihat masa depan — dan sedikit ke luar layar.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "tokooren",
    name: "Toko Oren",
    icon: "cart",
    accent: "#FF7A1A",
    description: "Diskon gila-gilaan! Garansi 3 detik. Risiko rusak ditampilkan jujur — beli = setuju.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "cctv",
    name: "CCTV",
    icon: "cctv",
    accent: "#FF6B6B",
    description: "Pantau hero, awasi pekerja, cek kotak item. 'Keamanan' ala DungeonOS Inc. Beli dulu di Toko Oren.",
    defaultUnlocked: false,
    hidden: false
  },
  {
    id: "dungeonhub",
    name: "DungeonHub",
    icon: "hub",
    accent: "#00B388",
    description: "Super-app dungeon: Ride, Food, Mart & Pay. Kamu yang atur, mereka yang bayar.",
    defaultUnlocked: true,
    core: true,
    hidden: false
  },
  {
    id: "dungeonbuild",
    name: "BangunRuang",
    icon: "trapmart",
    accent: "#7CFFB2",
    description: "Susun lorong & tanam trap. Uji pertahanan sebelum hero datang beneran.",
    defaultUnlocked: true,
    core: false,
    hidden: false
  },
  {
    id: "merger",
    name: "Merger & Akuisisi",
    icon: "coin",
    accent: "#FFD86B",
    description: "Jual dungeon, tukar jadi Saham, mulai baru dengan perk permanen. Font kontrak kecil tapi sah.",
    defaultUnlocked: true,
    core: false,
    hidden: false
  },
  {
    id: "monopoli",
    name: "Monopoli",
    icon: "coin",
    accent: "#FFD86B",
    description: "Konon akan ada. Atau tidak jadi. Masih dibahas.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "settings",
    name: "Settings",
    icon: "settings",
    accent: "#8B5CF6",
    description: "Pengaturan DungeonOS. Termasuk cara membuka sesuatu yang tidak boleh dibuka.",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "devconsole",
    name: "DevConsole",
    icon: "devconsole",
    accent: "#34E7E4",
    description: "Akses aneh. Sepertinya tidak dimaksudkan untuk boss biasa. (jangan bilang ke HQ)",
    defaultUnlocked: false,
    hidden: true
  },
  {
    id: "flappy",
    name: "Flappy Dungeon",
    icon: "bird",
    accent: "#FFD86B",
    description: "Game: terbang hindari pipa bawang. Skor = gold!",
    defaultUnlocked: true,
    hidden: false
  },
  {
    id: "judi",
    name: "DungeonSlots",
    icon: "slot",
    accent: "#FF4FD8",
    description: "Judi slot dungeon. Top up gold, putar, menang/boncos. Hati-hati bangkrut.",
    defaultUnlocked: true,
    hidden: false
  }
];

export function getAppById(appId) {
  return APPS.find(app => app.id === appId) || null;
}
