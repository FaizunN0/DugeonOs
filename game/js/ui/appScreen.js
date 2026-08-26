import { getAppById, PHASE_LABELS } from "../config.js";
import { getState, mutate, addNotification, startNewGame, setScreen, clampStats } from "../state.js";
import { getCurrentNode, resolveText, chooseOption, advance, ensureStarted } from "../engine.js";
import { icon, avatar } from "./icons.js";
import { staggerIn, moBurst, syncPerf } from "./anim.js";
import { Lib, Sound, rand } from "../lib.js";
import { triggerGlitch } from "./glitch.js";
import { emitStatToasts, toast } from "./toast.js";
import { NEW_VIEWS, NEW_RENDERFEED } from "../apps/index.js";
import { MEMES } from "../content/memes.js";
import { bindLiveGold } from "./kit/live.js";

// Popup modal ringan (bukan error) untuk gimmick & satir.
export function showPopup(title, html, btn) {
  const root = document.getElementById("phone") || document.body;
  const m = document.createElement("div");
  m.className = "modal-pop";
  m.innerHTML = `<div class="modal-card">
    <div class="modal-title">${title}</div>
    <div class="modal-body">${html}</div>
    <button class="modal-close" type="button">${btn || "Mengerti"}</button>
  </div>`;
  m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
  const close = m.querySelector(".modal-close");
  if (close) close.addEventListener("click", () => m.remove());
  root.appendChild(m);
  return m;
}

const STAT_KEYS = ["gold","morale","stability","reputation","unionPower","loot","bugLevel","devSuspicion"];

// Aksi terpusat: batas 5/app/hari (anti-kecurangan) + biaya gold.
const LIMITED = new Set(["minion", "union", "trapmart", "heroalert", "dungeongram"]);

export function doAction(appId, key, m) {
  let pending = null;
  let delta = null;
  mutate(st => {
    const before = {};
    for (const k of STAT_KEYS) before[k] = st.stats[k];

    const cost = m.cost || 0;
  if (cost && st.stats.gold < cost) {
    pending = "Gold tidak cukup (butuh " + cost + ").";
    return;
  }

  if (LIMITED.has(appId)) {
    const d = st.day || 1;
    if (!st.dailyActions || st.dailyActions.day !== d) st.dailyActions = { day: d, counts: {} };
    const used = st.dailyActions.counts[appId] || 0;
    if (used >= 5) {
      pending = "🚫 Batas harian tercapai (5/5). Lanjutkan cerita untuk hari baru.";
      return;
    }
    st.dailyActions.counts[appId] = used + 1;
  }

  if (cost) st.stats.gold -= cost;
    if (m.run) m.run(st);
    clampStats(st);
    pending = m.note === undefined ? null : m.note;

    delta = {};
    for (const k of STAT_KEYS) {
      const d = st.stats[k] - before[k];
      if (d !== 0) delta[k] = d;
    }
  });

  if (pending) addNotification("system", "Aksi", pending);
  if (delta && Object.keys(delta).length) emitStatToasts(delta);
}

function usedToday(state, appId) {
  const da = state.dailyActions;
  const d = state.day || 1;
  if (!da || da.day !== d) return 0;
  return da.counts[appId] || 0;
}

function statBar(label, value, max = 100) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return `
    <div class="mini-stat">
      <span class="mini-label">${label}</span>
      <div class="mini-bar"><span style="width:${pct}%"></span></div>
      <strong>${value}</strong>
    </div>`;
}

function avatarKind(speaker) {
  const s = String(speaker || "").toLowerCase();
  if (s.includes("grem")) return "grem";
  if (s.includes("hero")) return "hero";
  if (s.includes("devconsole")) return "devconsole";
  if (s.includes("union")) return "union";
  return "os";
}

function moodOf(morale) {
  if (morale >= 70) return { icon: "moodHappy", t: "Semangat", c: "good" };
  if (morale >= 45) return { icon: "moodNeutral", t: "Biasa", c: "mid" };
  if (morale >= 25) return { icon: "moodAngry", t: "Cemberut", c: "bad" };
  return { icon: "moodRage", t: "Mau Mogok", c: "bad" };
}

// Hasil mini-game negosiasi UnionDesk. L = konsesi ke pekerja (0..100).
function negoOutcome(L) {
  let morale, union, cost, tone, note;
  if (L < 20) {
    morale = -12; union = 14; cost = 0; tone = "bad";
    note = "Kamu pelit. Spanduk baru: 'BOS = Bapak Omong Kosong'.";
  } else if (L < 50) {
    morale = 4; union = 4; cost = 20 + Math.round(L * 0.4); tone = "mid";
    note = "Nego ala kadarnya. Grem manggut setengah hati.";
  } else if (L < 80) {
    morale = 8; union = -12; cost = 20 + Math.round(L * 0.6); tone = "good";
    note = "Titik manis! Grem puas, dompet cuma sesak.";
  } else {
    morale = 12; union = -20; cost = 60 + Math.round(L); tone = "mid";
    note = "Kamu terlalu murah hati. Serikat senang, tapi menganggapmu lembek.";
  }
  return { morale, union, cost, tone, note };
}

// Geser trust faksi (0..100) dengan aman.
function shiftFac(st, key, d) {
  const cur = st.factions && st.factions[key] != null ? st.factions[key] : 50;
  st.factions[key] = Math.min(100, Math.max(0, Math.round(cur + d)));
}

function factionBar(label, value, ic) {
  const pct = Math.max(0, Math.min(100, value));
  return `
    <div class="fac-row">
      <div class="fac-ico">${icon(ic)}</div>
      <div class="fac-meta">
        <div class="fac-name">${label}</div>
        <div class="fac-bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="fac-val">${value}</div>
    </div>`;
}

const ROSTER = [
  { icon: "goblin", name: "Grob", role: "Penjaga pintu" },
  { icon: "slime", name: "Slm-9", role: "Operator trap" },
  { icon: "skeleton", name: "Bones", role: "Admin lorong" },
  { icon: "ghost", name: "Wisp", role: "CCTV hantu" }
];

// Catatan rilis, dari yang paling lama -> terbaru.
const PATCHES = [
  { ver: "v0.0.1", date: "Era Purba", title: "DungeonOS Purba", items: ["Boot screen muncul. Kadang. Kalau tidak, lihat background ungu.", "Home & app placeholder jadi. Tombol belum tahu harus kemana.", "Minion belum punya nama. Mereka cuma 'unit'."] },
  { ver: "v0.0.5", date: "31 Feb (katanya)", title: "Evil Management Suite", items: ["Tema neon ungu-magenta + kaca (glassmorphism) hadir.", "Status bar dengan jam & notifikasi. Boss merasa seperti punya HP sungguhan.", "Grid aplikasi rapi. Sayangnya app-nya masih kosong."] },
  { ver: "v0.1.0", date: "Hari Mogok I", title: "Mogok Mendekat", items: ["Cerita bercabang: pilihanmu mengubah jalan & ending.", "33 ending (10 biasa, 8 unik, 6 anomali, 5 plot-twist, 4 nested).", "Perbaiki layar kosong: animasi sekarang anti-stuck.", "DevConsole: /loop, /gravity, /ai, /meta, dan 'behind'.", "Satir masuk: 'Harga platinum naik jadi 18 gold? Orang dungeon kan gak pakai platinum!'"] },
  { ver: "v0.1.1", date: "Hari Mogok II", title: "Audit HQ", items: ["Tips discoverability app supaya pemain tahu aksi berpengaruh ke ending.", "Badge 'ANOMALI' untuk ending jenis itu.", "Grem resmi jadi bos tersembunyi di beberapa rute."] },
  { ver: "v0.2.0", date: "Update Besar", title: "Layar HP Asli", items: ["Home jadi launcher murni. Cerita pindah ke app DungeonFeed.", "Batas 5 aksi/app/hari — spam tidak lagi jadi cara curang.", "Background partikel neon live + font Bungee + confetti ending.", "App dibuat ulang: roster minion, radar hero, feed serikat, toko trap.", "Sekarang full online: GSAP & canvas-confetti dari CDN."] },
  { ver: "v0.2.1", date: "Hari Ini", title: "Catatan Rilis", items: ["App PatchNotes ini ditambahkan. Kamu sedang membacanya.", "Riwayat dari v0.0.1 sampai sekarang, urut naik.", "Masih ada bug? Laporkan ke serikat. Mereka senang dapat alasan mogok."] },
  { ver: "v0.3.0", date: "Hari Ini", title: "Wajah Anime & 12 Pustaka", items: ["Redesign total: estetika anime/fantasy, sakura & rune bercahaya.", "12 library online: anime.js, tsParticles, mo.js, html2canvas, vanilla-tilt, rough.js, PixiJS, Matter.js, kute.js, Howler + GSAP/confetti.", "App baru: Grimoire, SoundStone, RuneForge (fisika!), Ramalan, BawangPedia.", "Animasi seru: transisi layar, entri stagger, burst sihir tiap aksi.", "Ikon & avatar dibuat ulang detail. Cerita & ending tetap utuh."] },
  { ver: "v0.4.0", date: "Hari Ini", title: "DungeonOS Inc.", items: ["Sistem Faksi: HQ, Serikat, Hero & Grem punya trust sendiri. Pilihanmu menggesernya.", "App baru: Faksi (org-chart), Standup (meeting berbatas waktu!), Bazzaar (toko premium kosong), Orakel (nubuat keluar-layar).", "Mini-game: susun koridor trap di TrapMart, interogasi hero ber-timing di HeroAlert.", "DevConsole /glitch & anomali RNG 'Lubang Ke-4' sesekali memecah layar.", "Hari ke-10 lebih kaya: tiap ending kini menyebut faksi & spanduk 'Bapak Omong Kosong'."] },
  { ver: "v0.4.5-special", date: "Hari Ini", title: "Paket Ekspansi Satir", items: [
    "CORE 4: DungeonFeed (lebar + gimmick meme & tap bawang), HeroAlert (radar + SERGAP + interogasi timing), DungeonHub (super-app ber-level: Ride/Food/Mart/Pay + quest), TrapMart (kendali 3 slot + upgrade + auto-defense).",
    "App baru: Toko Oren (marketplace, 50% barang murahan rusak), CCTV (WAJIB dibeli dulu di Toko Oren), Flappy Dungeon (skor = gold), DungeonSlots (judi slot, top-up gold; kalau gold & saldo habis -> Ending Koplak).",
    "Ekonomi: pendapatan harian pasif + sumber gold dari CCTV, Hub, Toko, tap bawang, Flappy, auto-defense trap.",
    "Ending baru class KOPLAK: memaki-maki player dengan bahasa kasar (rating 0/10, tapi lucu).",
    "SoundStone: 8 lagu BGM procedural tanpa copyright (WebAudio) — biar tidak jenuh.",
    "RuneForge: fisika bola diperbaiki (memantul sungguhan + dorongan berkala + klik untuk tendang).",
    "DevConsole: perintah baru /rainbow, /summon goblin, /mute, tampilan konsol hidup.",
    "Stabilitas: overlay error tidak lagi menimpa layar gara-gara lib CDN; cerita DungeonFeed tidak lagi 'rusak style'."
  ] },
  { ver: "v0.4.6", date: "Hari Ini", title: "Setingan & Satir Bisnis", items: [
    "DungeonSlots SEKARANG DIRIGI: awal menang banyak -> kalah -> menang lagi -> FULL KAalah sampai Rungkat. (Pakai /slotgacor di DevConsole buat cheat 'selalu menang' + popup satir.)",
    "HeroAlert: tangkap hero pakai LEVEL (Mudah/Normal/Susah) — makin tinggi, hadiah & risiko makin besar. Target tak se-cepat kilat lagi.",
    "DungeonHub dirombak jadi 'bisnis beneran': ~30 mekanisme (ride/food/mart/pay + puluhan gimmick: telpon protes, kurir nyasar, drama COD, drama kurir, refund scam, dll). Ada energi harian & audit HQ anti-curang.",
    "CCTV dibatasi (scan harian) & bukan ladang gold lagi — plus gimmick 'spot anomali' lucu.",
    "Grimoire diperluas (lebih banyak lore & tab Mitos).",
    "Ikons & nama app dikecilkan biar tak mepet. Hint anomali muncul kalau DevConsole belum aktif.",
    "Perbaikan potensi curang lain (Hub/CCTV/Flappy) — kecuali cheat DevConsole yang emang buat itu."
  ] },
  { ver: "v0.4.6b", date: "Hari Ini", title: "Patch Perbaikan (Part 2)", items: [
    "HeroAlert: INTEROGASI diperbaiki — zona hijau yang kelihatan SEKARANG persis zona yang dihitung (pakai deteksi piksel), jadi 'udah di zona hijau tapi gagal' sudah fix. Level Mudah bikin kursor lebih lambat & zona lebih lebar. Tombol & target tangkap hero dibesarkan biar gampang diklik.",
    "DungeonHub: tampilan energi yang ke-clip sudah diperbaiki (bar & teks terpisah). Audit HQ kini cuma pajak kelebihan cuan harian (bukan 25% semua cuan) & sekali sehari — gold tak lagi 'balik ke 1000' tiba-tiba.",
    "DungeonHub: kuota QUEST dibatasi 5/hari (anti-spam). Inbox bukan tombol spam lagi: event satir muncul ACAK saat interaksi, MAKS 1 popup per 3 interaksi.",
    "Ending baru (rahasia): habiskan SELURUH kuota DungeonHub (5 quest + 14 aksi) tiap hari dari hari 1 sampai 10 berturut-turut -> 'Ending Bos Hyper-Produktif'.",
    "DungeonSlots: desain 'fase' & penjelasan mekanisme kalah DIHAPUS dari aplikasi — info cuma ada di patch note ini.",
    "DungeonHub: perbaikan layout — tab & tombol aksi kini tak overlap/clip lagi (label dipendekkan, grid di-wrap rapi, bisa discroll).",
    "HeroAlert: mini-game SERGAP (tangkap hero) kini punya waktu jauh lebih longgar per level (Mudah 13 dtk, Normal 10 dtk, Susah 7.5 dtk) & target lebih pelan di Mudah — Brave-X tak lagi selalu kabur.",
    "CCTV: desain ulang jadi persis alat CCTV asli — unit kamera (lensa + REC), monitor tiap kamera dengan scanline, grid lantai, blip gerak & timestamp LIVE.",
    "Mode Hemat: tombol baru di Pengaturan (default MATI) yang mematiin blur, blend-mode, glow & animasi terus-menerus + sembunyikan lapisan partikel — buat hp yang ngelag."
  ] },
  { ver: "v0.4.7-mini", date: "Hari Ini", title: "Mini Update: Perbaikan, Slot Revamp & DungeonHub", items: [
    "DungeonFeed: perbaiki ikon tombol 'Lanjut' (bolt) yang membesar menutupi teks di node cerita tanpa pilihan — ukurannya kini normal.",
    "DungeonSlots: revamp total — 'Top Up ALL' (ubah semua gold jadi saldo), taruhan 1x/2x/5x/10x/ALL-IN, & simbol jadi berarti (3 SAMA = menang, tiap ikon punya nilai x3/x5/x8/x10/x12). Uang jadi gampang habis.",
    "Aplikasi baru (placeholder): Monopoli — masih dibahas mau dibuat atau tidak; berisi pesan bercanda.",
    "DungeonHub 'Evil Ops' (BESAR): konsep SELESAI & DISSETUJUI (seimbang + per-shift + boleh kalah). FASE 1+2+3 MASUK: loop per-shift, roster minion + morale/stamina, supply chain (stok + restock gold), directive HQ, & ending 'Mogok Besar' (boleh kalah). Mini-game PER-JOB: Kurir (perjalanan dgn 24 rintangan/gimmick), Dapur (susun pesanan) / Bar (tuang pas), Toko (sortir kemas), Keuangan (stempel pas), & Segel Rune (tangani insiden) — tiap tombol aksi & tiap stasiun shift punya mini-gamenya sendiri."
  ] },
  { ver: "v0.4.7-final", date: "Hari Ini", title: "DungeonHub Production — Evil OPS Final", items: [
    "DungeonHub bukan prototipe lagi: upgrade produksi penuh — premium, modern, anti-asal-jadi.",
    "28 aksi kini punya minigame sendiri-sendiri (bukan per kategori): 'Paksa 5 Bintang' = debat persuasif, 'Surge Pricing' = slider presisi, 'Makanan Beracun' = timing stealth, dll. — tiap tombol sesuai labelnya, tidak aneh lagi.",
    "Anti-cheat & anti-spam: harus jawab benar/mikir — gagal = penalti nyata (-rep -morale -rating), tidak bisa spam asal tap.",
    "Evil OPS skala besar dirombak: boring & tidak relate → papan pekerjaan relatable (Ojek Naga, Dapur, Gudang, Keamanan) dengan deskripsi & gimmick harian. Stok, stamina & minigame kini per-pekerjaan: kalau cuma Ojek ya cuma Ojek yang terkuras, kalau Masak & Antar ya hanya itu.",
    "Roster, assignment & stok kini premium (glass, gradient, job board dengan toggle). Shift hanya jalankan job yang dicentang — lebih strategis & tidak membosankan.",
    "Semua minigame kini premium modern: glass card, gradient accent per job, timer, progress, feedback good/bad dengan animasi & sound.",
    "Stabilitas & performa: will-change, animasi GPU-friendly, anti-lag, Mode Hemat tetap tersedia."
  ] },
  { ver: "⚠ PERINGATAN", warn: true, date: "Sekarang", title: "DungeonHub Ditutup Sementara", items: [
    "Aplikasi DungeonHub sedang ditutup untuk sementara waktu.",
    "Uangnya di bawa mentri king mouse semua. Mohon maaf atas ketidaknyamanannya karena kami sedang mencari keberadaan Mentri king mouse.",
    "Ini gimmik kecil sambil kami kembangkan DungeonOS ke versi 1.0."
  ] },
  { ver: "DEV-PREVIEW", date: "Fase 1", title: "Operasional HQ Membuka Pintu", items: [
    "DungeonHub buka lagi dengan wajah baru: OPERASIONAL HQ — jam dunia real-time (pagi/siang/sore/malam) dengan jeda & kecepatan 2x/4x.",
    "MinionCorp: roster pegawai beneran — gaji harian otomatis, stamina & morale hidup, mogok kalau terlalu dieksploitasi.",
    "HRD Gila: wawancara kerja absurd untuk merekrut kandidat baru. Tidak ada jawaban salah, cuma jawaban yang bikin HRD curiga.",
    "Laporan keuangan per hari operasional: masuk, payroll, net. Kalau kas kurang saat gajian... selamat menghadapi serikat."
  ] },
  { ver: "DEV-PREVIEW 2", date: "Fase 2", title: "BangunRuang & Raid Defense", items: [
    "App baru BangunRuang: grid lorong 5x4 — tanam Trap Bawang, Duri, Ilusi (pelambat), sampai Napalm Naga Mini di jalur hero.",
    "Raid Uji real-time: gelombang hero (Sir Rembes, Panji Panahan, Baja Tebal 🗿, Kaki Cepat) menyusuri lorongmu; mati = bounty, lolos = brankas dicongkel.",
    "Ekonomi tersambung: beli trap mengeluarkan kas, bounty menambah kas, hero yang lolos mencuri 30g & merusak reputasi.",
    "Cabut trap dapat refund 50% — rahasia departemen keuangan yang tidak boleh disebar."
  ] },
  { ver: "DEV-PREVIEW 3", date: "Fase 3", title: "Campaign, Faksi & Si Tikus Berjubah", items: [
    "Campaign berbab: tiap milestone hari operasional muncul babak keputusan (rapat KPI, inspeksi HQ, tuntutan gaji, petisi hero, audit besar) — pilihanmu mengubah rule simulasi beneran.",
    "Relasi Faksi hidup: HQ, Serikat, Guild Hero & Kultus Grem punya trust yang bergeser tiap hari — menentukan payroll, tebal zirah hero saat raid, dan kelonggaran audit.",
    "Ending v1.0: Pailit (gaji telat 3 hari), Republik Minion (semua pegawai mogok serempak) — kalah itu nyata sekarang.",
    "RAHASIA: setelah Op#6, mata-matailah pool HRD. Sosok berjubah kadang melamar kerja. Gajinya absurd. Konsekuensinya... coba sendiri."
  ] },
  { ver: "v1.0.0", date: "Hari Ini", title: "BOSS SEJATI — Lompatan Besar Selesai", items: [
    "Dari visual novel jadi Dungeon Management Simulator: jam dunia real-time, ekonomi satu dompet dengan laporan keuangan akurat, roster pegawai hidup, raid tower-defense & dungeon builder.",
    "Prestige MERGER & AKUISISI: jual perusahaan (dinilai dari kas, pegawai, trap, reputasi, faksi) → Saham → perk permanen (Modal Warisan, Reputasi Merek, SDM Unggul, Jaringan Pemasok) untuk semua run berikutnya.",
    "Musim operasional 12-hari: Jumat Berkah Bawang (+25% income), Purnama Pemberani (hero +30% HP), Musim Audit — banner muncul di HQ.",
    "Balancing besar: gaji trait turun ~35%, rate kerja naik 2x, upeti lorong pasif, ledger mencatat SEMUA sumber gold tanpa kecuali.",
    "Arsitektur modular penuh (core/systems/apps/content), save skema v7, Museum Perusahaan merekam tiap era perusahaanmu.",
    "33 ending lama tetap bisa diburu lewat cerita; 3 ending baru v1 menunggu bos yang cukup nekat. Mentri King Mouse? Dia lebih dekat dari dugaanmu."
  ] },
  { ver: "v1.1-W1", date: "APP RENEWAL · Wave 1", title: "Flappy Lorong, Bengkel Rune & Kota Fantasi", items: [
    "GOLD KINI LIVE DI SEMUA APP: satu dompet, angka bergerak real-time di mana pun (fondasi kit baru).",
    "Flappy v2 'Terbang Lorong': lorong dungeon beneran — pilar trap 🧅, naga melintas 🐉, kenari serikat bawa spanduk. Medal 🥉50 🥈150 🥇300. 👑 Skor 500 = ENDING RAJA BURUNG.",
    "RuneForge v2 'Bengkel Rune': fisika diganti crafting — bahan drop 35% dari hero yang tumbang di BangunRuang; tempa Rune Semangat/Kasir/Pelindung dengan buff sim nyata (slot aktif 2); gagal = meledak & bahan lenyap.",
    "Monopoli premium gimmick: Kota Dungeon dijual duluan, countdown rilis yang selalu reset sendiri, tombol pre-order dengan alasan gagal bergilir, testimoni M. King Mouse. Tetap bukan game — memang disengaja."
  ] },
  { ver: "v1.1-W2", date: "APP RENEWAL · Wave 2", title: "Commerce Kit — Belanja Kayak Orang Sipil", items: [
    "TrapMart jadi e-commerce beneran: katalog produk dengan review ⭐⭐⭐⭐⭐ palsu ('Trapnya bekerja. Korban: saya.'), KERANJANG + checkout, dan tab Rak & Layanan untuk mekanik lama (upgrade, auto-defense, slot).",
    "STOK TERSINKRON: semua trap yang dibeli masuk GUDANG dan dipakai BangunRuang — pasang dari stok gratis; kalau kosong, tersedia opsi beli darurat langsung di grid.",
    "Toko Oren identitas baru 'Murah Meriah': badge diskon -72%, harga coret dramatis, garansi 3 detik, dan risiko rusak kini ditampilkan JUJUR (karena tidak punya pilihan lain). Reputasi kejujuran toko dihitung real-time.",
    "Bonus Monopoli: muncul pesan berbisik yang menonjol 🤫 soal seseorang bermain 20 putaran tanpa kelar-kelar. Konon."
  ] },
  { ver: "v1.1-W3", date: "APP RENEWAL · Wave 3", title: "Intelijen & Sosial — Dungeon Kini Punya Gosip", items: [
    "HeroAlert v2: SERGAP refleks dimusnahkan, lahir INTEROGASI KARTU BUKTI — baca mood tersangka (😡😅😏), pilih pendekatan tepat (Teh Hangat/Tekan/Bukti), reward intelijen nyata. Radar kini menampilkan ancaman raid sungguhan (musim + kemarahan Guild).",
    "CCTV v2: monitor menyiarkan REKAMAN HIDUP simulasi (raid, mogok, gajian, merger) dengan jam real-time per kamera; scan harian & anomali tetap.",
    "DungeonGram v2: postingan otomatis lahir dari event dungeon — like pertama menggeser trust faksi, komentar pilihan HRD ikut menggeser.",
    "UnionDesk v2: papan memo resmi serikat dari feed peristiwa + Formulir Komplain Resmi (1x/hari operasional, trust serikat +2, arsipnya rahasia negara)."
  ] },
  { ver: "v1.1-W4", date: "APP RENEWAL · Wave 4", title: "Personalia & Lore — Dungeon Punya Memori", items: [
    "MinionApp jadi PERSONALIA HR: profil tiap pegawai (CV asli trait, kontrak, masa kerja, bar morale), sparkline net keuangan 7 hari, dan SURAT PRIBADI minion untuk bos — tiap trait punya isinya sendiri.",
    "Codex dinamis: monster raid yang tumbang tercatat otomatis (Sir Rembes & kawan ditumbangkan berapa kali), dan halaman Rahasia M. King Mouse menolak dibaca... sampai kamu tahu caranya.",
    "Ramalan & Orakel tidak lagi menggibeng: mereka membaca LEDGER-mu beneran — tren net, risiko mogok, musim esok, sampai estimasi 'hari kas minus'. Menyeramkan karena akurat.",
    "Faksi org-chart hidup: trust live per cabang + riwayat peristiwa + Kirim Hadiah 20g (+3 trust, sekali sehari, namanya anggaran diplomasi)."
  ] },
  { ver: "v1.1.0", date: "APP RENEWAL · FINAL", title: "v1.1 RESMI — Semua Aplikasi Baru", items: [
    "SoundStone v2: NOW-PLAYING BAR dengan ekualiser hidup (mati di Mode Hemat), kontrol BGM procedural & chord pad dirapikan jadi satu panggung.",
    "BawangPedia v2: layout MAJALAH — cover story meme utama, kolom editorial berkategori (Ekonomi/Politik/Kuliner/Absurd/Teknologi) + Kotak Meme Pembaca.",
    "Bazzaar v2: butik premium yang meyakinkan — KOSONG SIGNATURE™ edisi terbatas selamanya, waitlist prestige yang tumbuh konsisten, dan concierge yang bergosip tiap 5 detik.",
    "Fondasi lintas app: Gold Live-Time di semua layar, kit UI (LiveGold/Sheet/Subnav/PriceTag/EmptyState/mgSession), standar mini-game anti-bug, feed sosial terpusat.",
    "DungeonOS kini v1.1.0. Mentri King Mouse masih dicari. Dia selalu satu langkah di depan — dan satu lorong di bawah."
  ] }
];

// ---- data for new apps ----
const CODEX = [
  { tab: 0, name: "Slm-9", tag: "Operator Trap", icon: "slime", desc: "Makhluk lumpur biru penjaga rangkaian trap. Bicaranya cuma 'klik-klik'.", chips: ["Cerah", "Setia", "Suka bawang goreng"] },
  { tab: 0, name: "Grob", tag: "Penjaga Pintu", icon: "goblin", desc: "Ogre pemalu. Dianggap menakutkan, padahal cuma demam sosial.", chips: ["Kuat x10", "Malu", "Nulis puisi"] },
  { tab: 0, name: "Bones", tag: "Admin Lorong", icon: "skeleton", desc: "Skeleton yang urus peta lorong. Sering lupa tulang panggulnya ada di mana.", chips: ["Rapi", "Pelupa", "Pensiunan"] },
  { tab: 0, name: "Kurir-P", tag: "Kurir Lorong", icon: "truck", desc: "Kurir yang selalu nyasar ke lorong salah. Pesanan brankas sering sampai ke sarang slime.", chips: ["Nyasar", "Cepat tapi Buntu", "Suka COD"] },
  { tab: 0, name: "Nyi-Lorong", tag: "Pembersih Shift Malam", icon: "ghost", desc: "Hantu pembersih yang protes karena tak dapat THR. Menyapu tulang tapi ninggalin trauma.", chips: ["Gaib", "Kritis", "Minta seragam"] },
  { tab: 0, name: "Pikul", tag: "Buruh Angkat Brankas", icon: "minion", desc: "Minion otot yang angkat brankas HQ tiap audit. Punggungnya sudah jadi legenda serikat.", chips: ["Kuat", "Lelah", "Mogok pelan"] },
  { tab: 1, name: "Brave-X", tag: "Hero Party", icon: "heroCrest", desc: "Tim hero 'penyelamat desa' yang tiap minggu jarah brankasmu.", chips: ["Lv 9", "Naif", "Lapar emas"] },
  { tab: 1, name: "Saint-E", tag: "Hero Penyembuh", icon: "saint", desc: "Penyembuh yang gemar 'accidental' nembak trap sendiri.", chips: ["Lv 8", "Clumsy", "Baik hati"] },
  { tab: 1, name: "Ranger-Z", tag: "Hero Penyela", icon: "heroCrest", desc: "Pemanah yang 'nggak sengaja' nembak kabel alarm trap sendiri.", chips: ["Lv 7", "Blunder", "Konyol tapi baik"] },
  { tab: 1, name: "Rogue-K", tag: "Hero Pencuri", icon: "coin", desc: "Pencuri brankas yang merasa 'mengambil kembali milik rakyat'. Rakyat: itu duit HQ, bos.", chips: ["Lv 8", "Licik", "Dibusukin CCTV"] },
  { tab: 2, name: "Grem", tag: "Bos Tersembunyi", icon: "holyOnion", desc: "Bawang misterius. Kadang bos, kadang buruh, kadang pengamat fourth-wall.", chips: ["Meta", "Licik", "Berlapis"] },
  { tab: 2, name: "HQ", tag: "Dewan Eksekutif", icon: "hqOrb", desc: "Makhluk berlapis yang cuma muncul kalau audit gagal.", chips: ["ABSTRACT", "Dingin", "Suka jargon"] },
  { tab: 2, name: "Audit-7", tag: "Bot Audit HQ", icon: "hqOrb", desc: "Mesin penilai efisiensi. Kalau angka merah, minion yang dipotong, bukan bonus.", chips: ["OTOMATIS", "Dingin", "Cari salah"] },
  { tab: 2, name: "MamaBawang", tag: "Bos Rahasia", icon: "holyOnion", desc: "Bawang purba yang disebut-sebut pencipta dungeon. Atau cuma legenda kuliner bawah tanah.", chips: ["META", "Misterius", "Berlapis bawang"] },
  { tab: 3, name: "Bawang Suci", tag: "Artefak", icon: "holyOnion", desc: "Konon satu gigitan memberi keberanian mogok massal.", chips: ["LEGEND", "Pahit", "Mengubah nasib"] },
  { tab: 3, name: "Lubang Ke-4", tag: "Anomali", icon: "voidHole", desc: "Lorong yang keluar ke layar pengembang. Jangan masuk kalau tidak siap.", chips: ["GLITCH", "Berbahaya", "Lucu"] },
  { tab: 3, name: "CCTV-Entity", tag: "Anomali Pantau", icon: "cctv", desc: "Entitas di balik layar CCTV yang kadang ngelambaikan tangan ke kamu.", chips: ["GLITCH", "Mengamati", "Lucu"] },
  { tab: 3, name: "DevConsole-Phantom", tag: "Hantu Konsol", icon: "devconsole", desc: "Muncul kalau kamu buka Dev Console. Katanya: 'asal jangan pakai /slotgacor'.", chips: ["DEV", "Memperingatkan", "Fourth-wall"] },
  { tab: 4, name: "Hari Tanpa Gaji", tag: "Mitos I", icon: "coin", desc: "Konon ada hari di mana minion dibayar tepat waktu. Belum ada yang pernah melihatnya.", chips: ["LEGEND", "Tak terbukti", "Diidamkan"] },
  { tab: 4, name: "Brankas Abadi", tag: "Mitos II", icon: "wallet", desc: "Brankas yang isinya tak pernah habis, kecuali pas giliran minion yang butuh.", chips: ["IMPOSSIBLE", "Hanya HQ", "Curiga"] },
  { tab: 4, name: "Lorong Ke-13", tag: "Mitos III", icon: "voidHole", desc: "Lorong yang tak ada di peta. Masuknya gratis, keluarinnya butuh Dev Console.", chips: ["GLITCH", "Terlarang", "Menarik"] },
  { tab: 4, name: "Onion Messiah", tag: "Mitos IV", icon: "wBless", desc: "Nubuat: bawang suci akan turun dan bikin semua hero menangis (bawang, bukan trauma).", chips: ["PROFETIK", "Pahit", "Penyelamat"] }
];

const JUKE = [
  { name: "Dungeon Lullaby", sub: "BGM malam bawah tanah", freq: 392 },
  { name: "Trap Techno", sub: "Beat untuk pasang jebakan", freq: 523 },
  { name: "Union Anthem", sub: "Hymne mogok minion", freq: 330 },
  { name: "Hero's Downfall", sub: "Soundtrack boss fight", freq: 262 },
  { name: "Onion Waltz", sub: "Melodi Grem", freq: 440 }
];

const GALLERY = [
  { icon: "memeOnion", c: "Fakta: bawang adalah satu-satunya makhluk yang bisa nangis lebih keras dari minion kena potong gaji." },
  { icon: "memeTrap", c: "Meme: 'Trap ku mahal, tapi hero bayar dengan nyawanya. Win-win.'" },
  { icon: "memeSign", c: "Spanduk serikat: 'GAJI TEPAT WAKTU = INVESTASI. GAJI TELAT = NYANYI.'" },
  { icon: "memeGem", c: "Fakta: HQ percaya 'stabilitas' bisa dibeli di TrapMart. Minion percaya tidak." },
  { icon: "memeHero", c: "Meme: hero masuk lorong, keluar bawa brankas + trauma." },
  { icon: "memeFlask", c: "Anomali: DevConsole muncul kalau kamu tepuk layar 5 kali (jangan tanya kenapa)." }
];

function randomMeme() {
  return MEMES[Math.floor(Math.random() * MEMES.length)];
}

// ---- visualizer for jukebox ----
function jukeVisualizer(canvas, isPlaying) {
  const ctx = canvas.getContext("2d");
  const w = Math.max(canvas.clientWidth || 320, 240), h = 70;
  canvas.width = w; canvas.height = h;
  const bars = 26;
  const hs = Array.from({ length: bars }, () => Math.random());
  let raf;
  function frame() {
    if (!canvas.isConnected) { cancelAnimationFrame(raf); return; }
    ctx.clearRect(0, 0, w, h);
    const active = isPlaying();
    for (let i = 0; i < bars; i++) {
      hs[i] += active ? (Math.random() - 0.5) * 0.34 : (0.3 - hs[i]) * 0.1;
      hs[i] = Math.max(0.05, Math.min(1, hs[i]));
      const bh = hs[i] * h * 0.92;
      const x = i * (w / bars);
      ctx.fillStyle = `hsl(${280 - i * 6}, 90%, ${active ? 66 : 40}%)`;
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = active ? 10 : 0;
      ctx.fillRect(x + 1, h - bh, w / bars - 2, bh);
    }
    ctx.shadowBlur = 0;
    raf = requestAnimationFrame(frame);
  }
  frame();
  return () => cancelAnimationFrame(raf);
}

// ---- Matter.js sandbox ----
function initPhysics(canvas) {
  const M = Lib.Matter;
  if (!M) return null;
  const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body } = M;
  const w = Math.max(canvas.clientWidth || 340, 280), h = 260;
  canvas.width = w; canvas.height = h;
  const engine = Engine.create();
  engine.gravity.y = 1; engine.gravity.scale = 0.0016;
  const wall = { isStatic: true, restitution: 0.85, friction: 0.02 };
  const T = 60;
  Composite.add(engine.world, [
    Bodies.rectangle(w / 2, h + T / 2, w + T * 2, T, wall),
    Bodies.rectangle(w / 2, -T / 2, w + T * 2, T, wall),
    Bodies.rectangle(-T / 2, h / 2, T, h + T * 2, wall),
    Bodies.rectangle(w + T / 2, h / 2, T, h + T * 2, wall)
  ]);
  const cols = ["#A855F7", "#FF4FD8", "#34E7E4", "#FFD86B", "#34D399", "#FF6B6B", "#7CFC00", "#00C2FF"];
  const balls = Array.from({ length: 9 }, (_, i) =>
    Bodies.circle(rand(40, w - 40), rand(20, 130), rand(12, 22), {
      restitution: 0.92, friction: 0.01, frictionAir: 0.0015,
      render: { fillStyle: cols[i % cols.length] }
    })
  );
  Composite.add(engine.world, balls);
  // beri dorongan awal agar langsung bergerak & memantul
  balls.forEach(b => Body.setVelocity(b, { x: rand(-6, 6), y: rand(-3, 3) }));
  const mouse = Mouse.create(canvas);
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.1, render: { visible: false } } });
  Composite.add(engine.world, mc);
  const runner = Runner.create();
  Runner.run(runner, engine);
  const MAXV = 24;
  const clampBalls = () => {
    for (const b of balls) {
      const v = b.velocity, sp = Math.hypot(v.x, v.y);
      if (sp > MAXV) Body.setVelocity(b, { x: v.x / sp * MAXV, y: v.y / sp * MAXV });
      const r = b.circleRadius;
      let { x, y } = b.position; let vx = v.x, vy = v.y, hit = false;
      if (x < r) { x = r; vx = Math.abs(vx) * 0.9; hit = true; }
      else if (x > w - r) { x = w - r; vx = -Math.abs(vx) * 0.9; hit = true; }
      if (y < r) { y = r; vy = Math.abs(vy) * 0.9; hit = true; }
      else if (y > h - r) { y = h - r; vy = -Math.abs(vy) * 0.9; hit = true; }
      if (hit) { Body.setPosition(b, { x, y }); Body.setVelocity(b, { x: vx, y: vy }); }
    }
  };
  Events.on(engine, "afterUpdate", clampBalls);
  // jaga agar arena tetap hidup: dorongan kecil berkala
  const kick = setInterval(() => {
    if (!canvas.isConnected) { clearInterval(kick); return; }
    const b = balls[Math.floor(Math.random() * balls.length)];
    if (b) Body.applyForce(b, b.position, { x: rand(-0.012, 0.012), y: rand(-0.02, -0.006) });
  }, 2600);
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (w / rect.width);
    const py = (e.clientY - rect.top) * (h / rect.height);
    let best = null, bd = 1e9;
    for (const b of balls) { const d = Math.hypot(b.position.x - px, b.position.y - py); if (d < bd) { bd = d; best = b; } }
    if (best) Body.setVelocity(best, { x: best.velocity.x + rand(-4, 4), y: -9 });
  });
  const ctx = canvas.getContext("2d");
  let raf;
  function draw() {
    if (!canvas.isConnected) { Runner.stop(runner); cancelAnimationFrame(raf); clearInterval(kick); return; }
    ctx.clearRect(0, 0, w, h);
    for (const b of Composite.allBodies(engine.world)) {
      if (b.isStatic) continue;
      ctx.beginPath();
      ctx.arc(b.position.x, b.position.y, b.circleRadius || 12, 0, Math.PI * 2);
      ctx.fillStyle = b.render.fillStyle || "#A855F7";
      ctx.shadowColor = b.render.fillStyle; ctx.shadowBlur = 14;
      ctx.fill(); ctx.shadowBlur = 0;
    }
    raf = requestAnimationFrame(draw);
  }
  draw();
  return () => { Runner.stop(runner); cancelAnimationFrame(raf); clearInterval(kick); };
}

const APP_VIEWS = {
  minion(s) {
    const mood = moodOf(s.stats.morale);
    const roster = ROSTER.map(r => `
      <div class="roster-card">
        <div class="roster-ava">${icon(r.icon)}</div>
        <div class="roster-info">
          <div class="roster-name">${r.name}</div>
          <div class="roster-role">${r.role}</div>
          <div class="mood ${mood.c}">${icon(mood.icon)}<span>${mood.t}</span></div>
        </div>
      </div>`).join("");

    return {
      meta: {
        pay: { label: "💰 Gaji + (50g)", icon: "coin", cost: 50, note: "Gaji dibayar. Minion manggut, wallet menangis.", run: st => { st.stats.morale += 10; st.stats.unionPower -= 6; st.flags.treatWell = true; shiftFac(st, "serikat", 8); shiftFac(st, "grem", 2); } },
        motivate: { label: "🎉 Motivasi (10g)", icon: "heart", cost: 10, note: "Kamu pujinya. Aneh, tapi morale naik.", run: st => { st.stats.morale += 6; shiftFac(st, "serikat", 4); } },
        rest: { label: "🛏️ Istirahat", icon: "sparkle", note: "Minion istirahat. Trap agak berdebu.", run: st => { st.stats.morale += 6; st.stats.stability -= 4; shiftFac(st, "serikat", 2); } },
        cut: { label: "✂️ Potong gaji", icon: "skull", note: "Gaji dipotong. Serikat: 'kami catat.'", run: st => { st.stats.gold += 30; st.stats.morale -= 10; st.stats.unionPower += 8; st.flags.exploit = true; shiftFac(st, "serikat", -10); shiftFac(st, "grem", -2); } }
      },
      body: `
        <p class="app-lead">SDM dungeon. 5 aksi/hari — setelah itu audit HQ datang. Pilih bijak, Bos.</p>
        <div class="roster">${roster}</div>
        <div class="mini-stats">
          ${statBar("Morale", s.stats.morale)}
          ${statBar("Stability", s.stats.stability)}
          ${statBar("Union", s.stats.unionPower)}
          ${statBar("Gold", s.stats.gold)}
        </div>
        <p class="quip">"Gaji tepat waktu = investasi. Gaji telat = serikat nyanyi." — Grem, mungkin.</p>`
    };
  },

  union(s) {
    const feed = [
      { who: "Grem 🧅", txt: "Bos, kami minta jadwal wajar & gaji tepat waktu. Itu saja. (untuk sekarang)" },
      { who: "Serikat", txt: "Kalau diabaikan, mogok dibahas rapat. Atau besok. Kami fleksibel soal huruf." }
    ].map(p => `
      <div class="post">
        <div class="post-ava">${avatar("union")}</div>
        <div class="post-body"><div class="post-who">${p.who}</div><div class="post-txt">${p.txt}</div></div>
      </div>`).join("");

    return {
      meta: {
        reject: { label: "🚫 Tolak", icon: "skull", note: "Kamu tolak. Spanduk baru: 'BOS = Bapak Omong Kosong'.", run: st => { st.stats.morale -= 10; st.stats.unionPower += 14; st.flags.exploit = true; shiftFac(st, "serikat", -10); shiftFac(st, "grem", -4); } },
        accord: { label: "📜 Accord (80g)", icon: "shield", cost: 80, note: "Accord diteken. Serikat tenang (untuk kuartal ini).", run: st => { st.stats.unionPower -= 20; st.stats.morale += 6; shiftFac(st, "serikat", 12); shiftFac(st, "grem", 6); } }
      },
      body: `
        <p class="app-lead">UnionDesk. Serikat kuat = berani mogok. Bicara bisa murah, atau mahal banget.</p>
        <div class="feed">${feed}</div>
        <div class="nego">
          <div class="nego-head"><span class="nego-title">🤝 Meja Nego — seret</span><span id="nego-lvl" class="nego-lvl">50%</span></div>
          <input id="nego-slider" class="nego-slider" type="range" min="0" max="100" value="50" />
          <div class="nego-hint">Kiri = pelit. Kanan = boros. Cari titik Grem senang, dompet nggak nangis.</div>
          <div id="nego-out" class="nego-out good">L50 · morale +8, union -12, biaya 50</div>
          <button id="nego-final" class="quick primary"><span class="quick-i">${icon("heart")}</span><span class="quick-t">Finalkan Nego</span></button>
        </div>
        <div class="mini-stats">
          ${statBar("Union Power", s.stats.unionPower)}
          ${statBar("Morale", s.stats.morale)}
        </div>
        <p class="quip">"Kami bukan anti-kerja. Kami anti 'kerja tapi gaji ilang'."</p>`,
      mount(screen, _state, handlers) {
        const sl = screen.querySelector("#nego-slider");
        const out = screen.querySelector("#nego-out");
        const lvl = screen.querySelector("#nego-lvl");
        const fin = screen.querySelector("#nego-final");
        if (!sl) return;
        const preview = () => {
          const L = +sl.value;
          const o = negoOutcome(L);
          lvl.textContent = L + "%";
          out.className = "nego-out " + o.tone;
          out.textContent = `L${L} · morale ${o.morale >= 0 ? "+" : ""}${o.morale}, union ${o.union >= 0 ? "+" : ""}${o.union}, biaya ${o.cost}g`;
        };
        sl.addEventListener("input", preview);
        preview();
        fin.addEventListener("click", () => {
          Sound.tap();
          const L = +sl.value;
          const o = negoOutcome(L);
          doAction("union", "nego", {
            cost: o.cost,
            note: o.note,
            run: st => {
              st.stats.morale += o.morale;
              st.stats.unionPower += o.union;
              shiftFac(st, "serikat", o.union < 0 ? 8 : -8);
              shiftFac(st, "grem", o.morale >= 0 ? 4 : -4);
            }
          });
          if (handlers && typeof handlers.rerender === "function") handlers.rerender();
        });
      }
    };
  },

  trapmart(s) {
    const traps = [
      { id: "spike", name: "Trap Duri", price: 40, desc: "Lantai berduri. Hero menangis." },
      { id: "pit", name: "Lubang Jebak", price: 60, desc: "Lubang dalam. Hero jatuh, loot naik." },
      { id: "illusion", name: "Illusi Bawang", price: 30, desc: "Hologram bawang. Murah & membingungkan." }
    ];
    const shop = traps.map(t => `
      <div class="trap-card">
        <div class="trap-ico">${icon("trapmart")}</div>
        <div class="trap-name">${t.name}</div>
        <div class="trap-desc">${t.desc}</div>
        <div class="trap-owned">punya: ${s.traps[t.id] || 0}</div>
      </div>`).join("");

    const meta = {};
    for (const t of traps) {
      meta["buy_" + t.id] = {
        label: `🪤 ${t.name} (${t.price}g)`, icon: "trapmart", cost: t.price,
        note: "Trap terpasang. Berderit mengancam.",
        run: st => { st.traps[t.id] = (st.traps[t.id] || 0) + 1; st.stats.stability += 8; }
      };
    }
    meta["rawat"] = {
      label: "🔧 Rawat semua (20g)", icon: "settings", cost: 20,
      note: "Semua trap dirawat. HQ bilang 'infrastruktur'.",
      run: st => { const owned = Object.values(st.traps).reduce((a, b) => a + b, 0); st.stats.stability += 6 + owned; }
    };

    return {
      meta,
      body: `
        <p class="app-lead">TrapMart — beli & rawat. Stabil naik, gold turun. Over-buy = maintenance mahal.</p>
        <div class="shop-grid">${shop}</div>
        <div class="corr-wrap">
          <div class="corr-head">Susun Koridor <span class="corr-sub">klik petak untuk ganti trap</span></div>
          <div id="trap-corridor" class="corr-row"></div>
          <div id="trap-rating" class="corr-rating">Rating Koridor: 0</div>
          <button id="trap-final" class="quick primary"><span class="quick-i">${icon("trapmart")}</span><span class="quick-t">Finalkan Koridor</span></button>
        </div>
        <div class="mini-stats">
          ${statBar("Stability", s.stats.stability)}
          ${statBar("Gold", s.stats.gold)}
        </div>
        <p class="quip">"Infrastruktur trap dibangun, tapi lorongnya berlubang." — Audit HQ, 2026.</p>`,
      mount(screen, _state, handlers) {
        const corridor = screen.querySelector("#trap-corridor");
        const ratingEl = screen.querySelector("#trap-rating");
        const finalBtn = screen.querySelector("#trap-final");
        if (!corridor) return;
        const types = [null, "spike", "pit", "illusion"];
        const names = { spike: "Trap Duri", pit: "Lubang Jebak", illusion: "Illusi Bawang" };
        let layout = (getState().trapLayout || [0, 0, 0]).slice();
        const rate = () => {
          let r = 0; const used = [];
          for (const idx of layout) {
            if (!idx) continue;
            const id = types[idx];
            r += id === "spike" ? 10 : id === "pit" ? 14 : 8;
            used.push(id);
          }
          if (used.length === 3 && new Set(used).size === 3) r += 12;
          return r;
        };
        const render = () => {
          corridor.innerHTML = layout.map((idx, i) => `
            <button class="corr-slot ${idx ? "filled" : ""}" data-slot="${i}">
              <div class="corr-ico">${idx ? icon(types[idx]) : ""}</div>
              <div class="corr-name">${idx ? names[types[idx]] : "Kosong"}</div>
            </button>`).join("");
          const r = rate();
          ratingEl.textContent = `Rating Koridor: ${r}` + (r >= 40 ? " (Sempurna!)" : r >= 25 ? " (Mantap)" : "");
          corridor.querySelectorAll(".corr-slot").forEach(b => b.addEventListener("click", () => {
            Sound.tap();
            layout[+b.dataset.slot] = (layout[+b.dataset.slot] + 1) % types.length;
            render();
          }));
        };
        render();
        finalBtn.addEventListener("click", () => {
          Sound.tap();
          const r = rate();
          doAction("trapmart", "layout", {
            note: `Koridor difinalkan. Rating ${r}.`,
            run: st => { st.stats.stability += Math.round(r / 2); st.stats.loot += Math.round(r / 3); st.trapLayout = layout.slice(); }
          });
          if (handlers && typeof handlers.rerender === "function") handlers.rerender();
        });
      }
    };
  },

  heroalert(s) {
    const threat = s.stats.stability < 40 ? "TINGGI" : (s.stats.stability < 65 ? "sedang" : "rendah");
    const threatTone = threat === "TINGGI" ? "bad" : (threat === "sedang" ? "mid" : "good");
    const heroes = [
      { id: "brave", name: s.flags.secretHero ? "??? (misterius)" : "Brave-X", meta: "Lv 9 · lorong utara", blip: "#FF5E7A" },
      { id: "saint", name: "Saint-E", meta: "Lv 8 · lorong timur", blip: "#FFD86B" }
    ];
    const heroCards = heroes.map(h => `
      <div class="hero-card" data-hero="${h.id}">
        <div class="hero-blip" style="background:${h.blip};box-shadow:0 0 12px ${h.blip}"></div>
        <div class="hero-info">
          <div class="hero-name">${h.name}</div>
          <div class="hero-meta">${h.meta}</div>
        </div>
        <div class="hero-actions">
          <button class="hero-scan" data-scan="${h.id}">Lacak</button>
          <button class="hero-inter" data-inter="${h.id}">Interogasi</button>
        </div>
      </div>`).join("");

    return {
      meta: {
        alert: { label: "Siagakan (30g)", icon: "heroalert", cost: 30, note: "Trap disiagakan. Hero hati-hati.", run: st => { st.stats.stability += 8; st.stats.loot += 10; } },
        bribe: { label: "Suap hero (70g)", icon: "coin", cost: 70, note: "Hero dibujuk. Tapi ini... curang?", run: st => { st.stats.morale -= 2; st.stats.loot += 20; st.flags.exploit = true; } },
        ignore: { label: "Abaikan", icon: "skull", note: "Hero lewat. Minion sedikit trauma, tapi loot tetap kamu jual (+12 gold).", run: st => { st.stats.gold += 12; st.stats.loot += 8; st.stats.morale -= 4; } }
      },
      body: `
        <p class="app-lead">HeroAlert — radar real-time. Biarkan terlalu lama, mereka sampai ke brankasmu (dan ke gajimu).</p>
        <div class="radar" id="radar">
          <div class="radar-ring"></div>
          <div class="radar-sweep" id="radar-sweep"></div>
          <div class="radar-blip" style="left:62%;top:38%"></div>
          <div class="radar-blip" style="left:30%;top:64%;background:#FFD86B;box-shadow:0 0 12px #FFD86B"></div>
          <div class="radar-blip" style="left:74%;top:70%;background:#34E7E4;box-shadow:0 0 12px #34E7E4"></div>
          <button class="radar-scan" id="radar-scan" type="button">Pindai</button>
        </div>
        <div class="threat-gauge">
          <span class="threat-label">Ancaman</span>
          <div class="threat-bar"><span class="${threatTone}" style="width:${threat === "TINGGI" ? 92 : threat === "sedang" ? 60 : 32}%"></span></div>
          <b class="threat-val ${threatTone}">${threat}</b>
        </div>
        <div class="hero-list">${heroCards}</div>
        <div id="interogasi" class="interogasi"></div>
        <div class="mini-stats">${statBar("Stability", s.stats.stability)}</div>
        <p class="quip">"Kami datang menyelamatkan desa!" — hero, lalu menjarah brankasmu.</p>`,
      mount(screen) {
        const scan = screen.querySelector("#radar-scan");
        const sweep = screen.querySelector("#radar-sweep");
        const panel = screen.querySelector("#interogasi");
        if (scan && sweep) scan.addEventListener("click", () => {
          sweep.style.animationDuration = "0.8s";
          Sound.tap();
          toast("Memindai lorong…", { ico: "heroalert", cls: "toast-info" });
          setTimeout(() => { sweep.style.animationDuration = ""; }, 1600);
        });
        screen.querySelectorAll(".hero-card [data-scan]").forEach(b => b.addEventListener("click", (e) => {
          e.stopPropagation();
          const h = heroes.find(x => x.id === b.dataset.scan);
          Sound.blip();
          toast(`${h.name}: ${h.meta}`, { ico: "heroalert", cls: "toast-info" });
        }));
        if (!panel) return;
        let raf = null, pos = 0, dir = 1, active = false;
        const stop = () => { active = false; if (raf) cancelAnimationFrame(raf); raf = null; };
        const startGame = (hid) => {
          if (active) return;
          const h = heroes.find(x => x.id === hid);
          panel.innerHTML = `
            <div class="inter-q">Interogasi ${h.name} — tangkap saat penanda di zona hijau!</div>
            <div class="inter-track"><span class="inter-zone"></span><span class="inter-marker"></span></div>
            <button id="inter-catch" class="quick primary"><span class="quick-t">Tangkap!</span></button>`;
          const marker = panel.querySelector(".inter-marker");
          const catchBtn = panel.querySelector("#inter-catch");
          active = true; pos = 0; dir = 1;
          const loop = () => {
            if (!active) return;
            if (!screen.isConnected || getState().activeApp !== "heroalert") { stop(); return; }
            pos += dir * 0.022;
            if (pos >= 1) { pos = 1; dir = -1; }
            if (pos <= 0) { pos = 0; dir = 1; }
            marker.style.left = (pos * 100) + "%";
            raf = requestAnimationFrame(loop);
          };
          loop();
          catchBtn.addEventListener("click", () => {
            if (!active) return;
            const hit = pos >= 0.42 && pos <= 0.58;
            stop();
            if (hit) {
              doAction("heroalert", "inter_" + hid, {
                note: `${h.name} terinterogasi. Rahasia bocor, brankas bertambah.`,
                run: st => { st.stats.gold += 22; st.stats.loot += 10; st.stats.morale += 4; shiftFac(st, "hero", -8); }
              });
              panel.innerHTML = `<div class="inter-result good">Tangkap! ${h.name} panik &amp; bocor rahasia. +22 gold, +10 loot, hero curiga.</div>`;
            } else {
              doAction("heroalert", "inter_" + hid, {
                note: `${h.name} lepas. Interogasi gagal.`,
                run: st => { st.stats.morale -= 5; shiftFac(st, "hero", 6); }
              });
              panel.innerHTML = `<div class="inter-result bad">Lepas! ${h.name} kabur sambil ketawa. -5 morale, hero makin percaya diri.</div>`;
            }
          });
        };
        screen.querySelectorAll(".hero-card [data-inter]").forEach(b => b.addEventListener("click", (e) => {
          e.stopPropagation();
          startGame(b.dataset.inter);
        }));
      }
    };
  },

  dungeongram(s) {
    const viral = s.stats.reputation >= 50
      ? `<div class="post viral"><div class="post-ava">${avatar("os")}</div><div class="post-body"><div class="post-who">DungeonGram 🔥</div><div class="post-txt">VIRAL! "Hari di dungeon anti-karat." 9.2k suka. HQ panik.</div></div></div>`
      : "";
    const feed = `
      <div class="post"><div class="post-ava">${avatar("grem")}</div><div class="post-body"><div class="post-who">Grem</div><div class="post-txt">${randomMeme()}</div></div></div>
      <div class="post"><div class="post-ava">${avatar("grem")}</div><div class="post-body"><div class="post-who">Grem</div><div class="post-txt">Bos kalau baca ini, tolong bayar gaji ya. Salam, buruh.</div></div></div>
      <div class="post"><div class="post-ava">${avatar("hero")}</div><div class="post-body"><div class="post-who">HeroOfficial</div><div class="post-txt">Dungeon ini trap-nya kok bawang semua sih 😭</div></div></div>
      ${viral}`;

    return {
      meta: {
        post: { label: "📸 Post (10g)", icon: "dungeongram", cost: 10, note: "Konten diunggah. 12 slime menyukai.", run: st => { st.stats.reputation += 6; st.flags.mediaSavvy = true; } },
        meme: { label: "😂 Meme sindir HQ", icon: "onion", note: "Meme sindir HQ disebar. Netizen terbahak.", run: st => { st.stats.reputation += 8; st.flags.memeWar = true; } },
        collab: { label: "🤳 Collab hero", icon: "star", note: "Collab viral. DungeonBawang trending.", run: st => { st.stats.reputation += 12; st.flags.mediaSavvy = true; } }
      },
      body: `
        <p class="app-lead">DungeonGram. Viral = leverage (atau cuma konten). 5 aksi/hari, jangan spam.</p>
        <div class="feed">${feed}</div>
        <div class="mini-stats">${statBar("Reputation", s.stats.reputation)}</div>
        <p class="quip">"Harga platinum naik dari 12 gold jadi 18 gold? Gold inflasi? Orang dungeon kan gak pakai platinum!"</p>`
    };
  },

  settings(s) {
    const devOn = s.apps.devconsole;
    const notifCount = (s.notifications || []).length;
    return {
      meta: { new: { label: "Main baru (reset)", icon: "restart" } },
      body: `
        <p class="app-lead">Pengaturan DungeonOS.</p>
        <div class="set-card ${devOn ? "dev-open" : ""}">
          <div class="set-row">
            <div class="set-ico">${icon("bell")}</div>
            <div class="set-meta"><div class="set-k">Notifikasi</div><div class="set-v">${notifCount} pesan · aktif</div></div>
            <span class="set-toggle on">ON</span>
          </div>
          <div class="set-row">
            <div class="set-ico">${icon("devconsole")}</div>
            <div class="set-meta"><div class="set-k">Mode Pengembang</div><div class="set-v">${devOn ? "Terbuka" : "Terkunci"}</div></div>
            <span class="set-toggle ${devOn ? "on" : "off"}">${devOn ? "ON" : "OFF"}</span>
          </div>
          <div class="set-row">
            <div class="set-ico">${icon("sound")}</div>
            <div class="set-meta"><div class="set-k">Suara &amp; Musik</div><div class="set-v">SoundStone</div></div>
            <span class="set-toggle on">ON</span>
          </div>
          <div class="set-row" id="perf-row">
            <div class="set-ico">${icon("sparkle")}</div>
            <div class="set-meta"><div class="set-k">Mode Hemat</div><div class="set-v">${s.flags.lowPerf ? "Aktif — efek berat dimatiin" : "Nonaktif (default)"}</div></div>
            <span class="set-toggle ${s.flags.lowPerf ? "on" : "off"}" id="perf-toggle">${s.flags.lowPerf ? "ON" : "OFF"}</span>
          </div>
        </div>
        <div class="dev-log">${devOn ? "&gt; Mode Pengembang: AKTIF" : "&gt; Mode Pengembang: TERKUNCI"}</div>
        <p class="secret-hint">${devOn ? "DevConsole terbuka. Sesuatu memperhatikanmu." : "v0.3.0 — stable (katanya)"}</p>
        <button id="secret-tap" class="secret-tap">${devOn ? "Akses aneh sudah aktif 👁️" : "DungeonOS v0.3.0 — Evil Management Suite"}</button>`,
      actions: { new: () => { startNewGame(); ensureStarted(); setScreen("home"); } },
      mount(screen, state, handlers) {
        const t = screen.querySelector("#perf-toggle");
        if (t) t.addEventListener("click", () => {
          Sound.tap();
          mutate(st => { st.flags.lowPerf = !st.flags.lowPerf; });
          syncPerf(getState().flags.lowPerf);
          handlers.rerender();
        });
      }
    };
  },

  devconsole(s) {
    const cmd = (key, label, ico, run, note) => ({
      label, icon: ico, run: st => { run(st); if (note) addNotification("devconsole", "Konsol", note); }
    });
    return {
      meta: {
        glitch: cmd("glitch", "🌀 /glitch", "voidHole", st => { st.flags.metaBreak = true; triggerGlitch(); }, "Lapisan realitas retak sejenak."),
        behind: cmd("behind", "👁️ LIHAT KE BALIK LAYAR", "devconsole", st => { st.stats.devSuspicion = 40; st.flags.devConsole = true; st.flags.devLog = "/behind -> lapisan ditembus. ada yang melihatmu."; }, "Kamu melihat balik layar. Sesuatu melihat balik ke kamu."),
        gold: cmd("gold", "🪙 /give gold 500", "coin", st => { st.stats.gold += 500; st.flags.cheated = true; st.flags.devLog = "/give gold 500 -> +500g. (curang tercatat)"; }, "Gold muncul dari nowhere. Audit mencatatmu curang."),
        loop: cmd("loop", "🔁 /loop", "restart", st => { st.flags.loop = true; st.flags.devLog = "/loop -> waktu dilipat."; }, "[ANOMALI] Waktu dilipat."),
        gravity: cmd("gravity", "🪂 /gravity off", "sparkle", st => { st.flags.gravity = true; st.flags.devLog = "/gravity off -> hukum alam nonaktif."; }, "[ANOMALI] Gravitasi mati."),
        ai: cmd("ai", "🤖 /ai", "settings", st => { st.flags.aiMinion = true; st.flags.devLog = "/ai -> minion jadi digital."; }, "[ANOMALI] Minion jadi kode."),
        goldvirus: cmd("goldvirus", "🤢 /goldvirus", "skull", st => { st.flags.goldSick = true; st.flags.devLog = "/goldvirus -> gold menular."; }, "[ANOMALI] Gold menular."),
        dream: cmd("dream", "💤 /dream", "onion", st => { st.flags.dream = true; st.flags.devLog = "/dream -> ini cuma mimpi."; }, "[ANOMALI] Semuanya mimpi."),
        meta: cmd("meta", "🧅 /meta", "onion", st => { st.flags.metaBreak = true; st.flags.devLog = "/meta -> bawang menangis."; }, "[ANOMALI] Bawang menangis."),
        rainbow: cmd("rainbow", "🌈 /rainbow", "sparkle", st => { st.flags.rainbow = !st.flags.rainbow; st.flags.devLog = "/rainbow -> mode pelangi " + (st.flags.rainbow ? "ON" : "OFF") + "."; }, "Layar jadi pelangi. Mata HQ ikut pusing."),
        goblin: cmd("goblin", "👺 /summon goblin", "goblin", st => { addNotification("devconsole", "Goblin", "Seekor goblin muncul & langsung main roblox."); st.flags.devLog = "/summon goblin -> entity ditambah."; }, "Goblin baru bergabung."),
        mute: cmd("mute", "🔇 /mute", "sound", st => { st.flags.muted = !st.flags.muted; Sound.enabled = !st.flags.muted; st.flags.devLog = "/mute -> audio " + (st.flags.muted ? "OFF" : "ON") + "."; }, "Audio di-toggle dari konsol."),
        slotgacor: {
          label: "🎰 /slotgacor", icon: "slot",
          run: st => {
            st.flags.slotGacor = !st.flags.slotGacor;
            st.flags.devLog = "/slotgacor -> mesin slot " + (st.flags.slotGacor ? "DISET GACOR (cheat)" : "normal lagi") + ".";
            if (st.flags.slotGacor) {
              st.flags.cheated = true;
              showPopup("CHEAT: SLOT GACOR 🎰",
                `<p>Mesin slot DungeonSlots sekarang <b>selalu menang</b> buat kamu.</p>
                 <p class="modal-satir">Tahu kan? Game slot itu emang <b>setingan</b>. Akal-akalan barat: kasih menang di awal biar ketagihan, lalu diatur ke <b>full kalah</b> sampai lu <b>Rungkat</b>. Sekarang lu yang setir — tapi ingat, ini cuma karena cheat. Tanpa ini, rumah lu bisa amblas.</p>`);
            }
          }
        },
        petruk: cmd("petruk", "🃏 /petruk", "star", st => { st.flags.devLog = "/petruk -> error 404 humor."; }, "Konsol: 'Humor tidak tersedia di region ini.'")
      },
      body: `
        <p class="dev-warn">⚠ AKSES DEVELOPER. Narasi ini tidak seharusnya bisa kamu buka.</p>
        <div class="dev-screen">
          <div class="dev-bar"><span class="dev-dot r"></span><span class="dev-dot y"></span><span class="dev-dot g"></span><span class="dev-bar-t">root@dungeonos:~#</span></div>
          <div class="dev-log">&gt; akun=PLAYER<br>&gt; realitas=OPTIONAL<br>&gt; lapisan=<span class="blink">?</span><br>${s.flags.devLog ? "&gt; " + s.flags.devLog : "&gt; <span class='dev-cursor'>menunggu input_</span>"}</div>
        </div>
        <p class="secret-hint">Tiap perintah mengubah realitas. Beberapa membuka ending anomali. Coba /rainbow, /summon goblin, /mute.</p>`
    };
  },

  patchnote(s) {
    const museum = (s && s.flags && s.flags.museum) || [];
    const museumHtml = museum.length ? `
      <div class="patch warn">
        <div class="patch-head"><span class="patch-ver">MUSEUM</span><span class="patch-date">${museum.length} arsip</span></div>
        <div class="patch-title">Museum Perusahaan</div>
        <ul class="patch-items">
          <li>Save era pra-v1.0 direset total sesuai keputusan direksi. Jejaknya diarsipkan di sini.</li>
          ${museum.map(m => `<li>Hari ${m.day} · kas akhir ${m.gold ?? 0}g — ${m.endingTitle ? `ditutup lewat "${m.endingTitle}"` : "ditutup tanpa ending (drama bebas)"}.</li>`).join("")}
          <li>Mentri King Mouse? Belum ketemu. Kasus masih dibuka.</li>
        </ul>
      </div>` : "";
    const list = PATCHES.map((p, i) => `
      <div class="patch ${i === PATCHES.length - 1 ? "latest" : ""} ${p.warn ? "warn" : ""}">
        <div class="patch-head"><span class="patch-ver">${p.ver}</span><span class="patch-date">${p.date}</span></div>
        <div class="patch-title">${p.title}</div>
        <ul class="patch-items">${p.items.map(t => `<li>${t}</li>`).join("")}</ul>
      </div>`).join("");

    return {
      readOnly: true,
      body: `
        <p class="app-lead">Riwayat rilis DungeonOS. Dari purba sampai sekarang — biar kamu tahu seberapa jauh kita sudah merusak... eh, menyempurnakan.</p>
        ${museumHtml}
        <div class="patch-list">${list}</div>`
    };
  },

  codex(s) {
    const tabs = ["Minion", "Hero", "Boss", "Rahasia", "Mitos"];
    const tab = s.flags.codexTab || 0;
    const items = CODEX.filter(c => c.tab === tab);
    const tabHtml = tabs.map((t, i) => `<button class="codex-tab ${i === tab ? "active" : ""}" data-tab="${i}">${t}</button>`).join("");
    const cards = items.map(c => `
      <div class="lore-card">
        <div class="lore-ava">${icon(c.icon)}</div>
        <div class="lore-name">${c.name}</div>
        <div class="lore-tag">${c.tag}</div>
        <div class="lore-desc">${c.desc}</div>
        <div class="lore-stats">${c.chips.map(x => `<span class="lore-chip">${x}</span>`).join("")}</div>
      </div>`).join("");
    return {
      body: `
        <p class="app-lead">Grimoire — catat semua makhluk & rahasia bawah tanah.</p>
        <div class="codex-tabs">${tabHtml}</div>
        <div class="lore-grid">${cards}</div>`,
      mount(screen, state, handlers) {
        screen.querySelectorAll(".codex-tab").forEach(b =>
          b.addEventListener("click", () => { state.flags.codexTab = Number(b.dataset.tab); Sound.tap(); handlers.rerender(); })
        );
        // rough.js sketch ring around each lore avatar (guarded).
        if (Lib.rough) {
          screen.querySelectorAll(".lore-ava").forEach(el => {
            try {
              const c = document.createElement("canvas");
              c.width = 46; c.height = 46;
              c.style.cssText = "position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:.8";
              el.style.position = "relative";
              const rc = Lib.rough.canvas(c);
              rc.circle(23, 23, 40, { stroke: "#C77DFF", strokeWidth: 2, roughness: 2.2 });
              el.appendChild(c);
            } catch (e) { /* noop */ }
          });
        }
      }
    };
  },

  jukebox(s) {
    const playing = (typeof s.flags.jukeTrack === "number") ? s.flags.jukeTrack : -1;
    const tracks = JUKE.map((t, i) => `
      <div class="juke-track ${playing === i ? "playing" : ""}" data-track="${i}">
        <button class="juke-play" data-play="${i}">${icon(playing === i ? "sound" : "jukebox")}</button>
        <div class="juke-meta"><div class="juke-name">${t.name}</div><div class="juke-sub">${t.sub}</div></div>
      </div>`).join("");
    const bgm = Sound.bgmTracks();
    const bgmOn = Sound.bgmIsPlaying();
    const bgmT = Sound.bgmTrack();
    const bgmList = bgm.map((t, i) => `
      <div class="bgm-track ${bgmOn && bgmT === i ? "on" : ""}" data-bgm="${i}">
        <button class="bgm-play">${icon(bgmOn && bgmT === i ? "sound" : "music")}</button>
        <div class="bgm-name">${t.name}</div>
      </div>`).join("");
    return {
      body: `
        <p class="app-lead">SoundStone — pemutar sihir dungeon. Nyalakan suara & nikmati BGM procedural (8 lagu, tanpa copyright).</p>
        <div class="bgm-head">🎵 BGM DUNGEON <button class="bgm-stop" id="bgm-stop">${bgmOn ? "Stop" : "Mati"}</button></div>
        <div class="bgm-grid">${bgmList}</div>
        <div class="juke-sep">— atau mainkan chord cepat —</div>
        <canvas class="juke-vis" id="juke-vis"></canvas>
        <div class="juke">${tracks}</div>
        <div class="juke-vol">🔊 <input id="juke-vol" type="range" min="0" max="1" step="0.1" value="${s.flags.jukeMute ? 0 : 1}"></div>`,
      mount(screen, state, handlers) {
        screen.querySelectorAll("[data-play]").forEach(btn =>
          btn.addEventListener("click", () => {
            const i = Number(btn.dataset.play);
            const t = JUKE[i];
            if (state.flags.jukeTrack === i) {
              state.flags.jukeTrack = -1;
            } else {
              state.flags.jukeTrack = i;
              [0, 4, 7, 12].forEach((n, k) => setTimeout(() => Sound.play("j" + i + n, t.freq * Math.pow(2, n / 12), 0.18, "sine"), k * 90));
            }
            handlers.rerender();
          })
        );
        screen.querySelectorAll("[data-bgm]").forEach(btn =>
          btn.addEventListener("click", () => {
            const i = Number(btn.dataset.bgm);
            if (Sound.bgmIsPlaying() && Sound.bgmTrack() === i) Sound.bgmStop();
            else Sound.bgmStart(i);
            handlers.rerender();
          })
        );
        const stop = screen.querySelector("#bgm-stop");
        if (stop) stop.addEventListener("click", () => { Sound.bgmStop(); handlers.rerender(); });
        const vol = screen.querySelector("#juke-vol");
        if (vol) vol.addEventListener("input", () => { Sound.enabled = Number(vol.value) > 0; });
        const vis = screen.querySelector("#juke-vis");
        if (vis) jukeVisualizer(vis, () => (typeof state.flags.jukeTrack === "number" ? state.flags.jukeTrack : -1) >= 0);
      }
    };
  },

  physics() {
    return {
      body: `
        <p class="app-lead">RuneForge — mainkan rune & bola dengan gravitasi nyata. Tarik & lepas. (Matter.js)</p>
        <div class="phys-wrap"><canvas class="phys-canvas" id="phys"></canvas></div>
        <p class="phys-hint">${Lib.Matter ? "Fisika aktif. Kalau layar kosong, library belum selesai load." : "Matter.js belum tersedia — cek koneksi online."}</p>`,
      mount(screen) {
        const c = screen.querySelector("#phys");
        if (c) initPhysics(c);
      }
    };
  },

  weather(s) {
    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const conds = [
    { icon: "wRain", t: "Hujan Bawang", d: "Trap jadi licin. Stabilitas tipis.", m: "Siapkan payung antimage.", cls: "" },
    { icon: "wStorm", t: "Badai Mana", d: "Hero linglung, loot naik.", m: "Sabar, ini berpihak ke kita.", cls: "wx-storm" },
    { icon: "wBless", t: "Berlah HQ", d: "Mood minion naik.", m: "Jangan sia-siakan.", cls: "wx-bless" },
    { icon: "wCurse", t: "Kutukan", d: "Morale turun random.", m: "Musik pengusir kutukan, perhaps.", cls: "wx-curse" },
    { icon: "wClear", t: "Cerah Magis", d: "Semua tenang.", m: "Hari baik buat trap.", cls: "" }
  ];
  const seed = (s.day || 1) * 7;
  const cards = Array.from({ length: 5 }, (_, i) => {
    const c = conds[(seed + i) % conds.length];
    return `<div class="wx-card ${c.cls}">
      <div class="wx-icon">${icon(c.icon)}</div>
        <div class="wx-day">${days[(seed + i) % 7]}</div>
        <div class="wx-temp">${12 + ((seed * 3 + i * 7) % 16)}°C</div>
        <div class="wx-desc">${c.t}<br>${c.d}</div>
        <div class="wx-mood">${c.m}</div>
      </div>`;
    }).join("");
    return {
      body: `<p class="app-lead">Ramalan 5 hari ke depan. Cuaca bawah tanah tetap dramatis.</p><div class="wx-grid">${cards}</div>`
    };
  },

  gallery() {
    const cards = GALLERY.map(g => `
      <div class="gal-card"><div class="gal-emoji">${icon(g.icon)}</div><div class="gal-cap">${g.c}</div></div>`).join("");
    const memeCards = MEMES.map(m => `
      <div class="gal-card gal-meme"><div class="gal-emoji">${icon("onion")}</div><div class="gal-cap">${m}</div></div>`).join("");
    return {
      body: `<p class="app-lead">BawangPedia — ensiklopedia meme & fakta absurd dunia dungeon.</p><div class="gal-grid">${cards}${memeCards}</div>`
    };
  },

  faction(s) {
    const F = s.factions;
    const rows = [
      { key: "hq", name: "Dewan HQ", ic: "hqOrb", blurb: "Makhluk berlapis yang cuma muncul kalau audit gagal. Suka jargon & KPI." },
      { key: "serikat", name: "Serikat Minion", ic: "union", blurb: "Minta gaji layak & jadwal wajar. Kalau dilanggar: spanduk." },
      { key: "hero", name: "Hero Party", ic: "heroCrest", blurb: "Tim 'penyelamat desa' yang tiap minggu jarah brankasmu." },
      { key: "grem", name: "Grem", ic: "holyOnion", blurb: "Bawang misterius. Kadang bos, kadang buruh, kadang pengamat layar." }
    ];
    const bars = rows.map(r => factionBar(r.name, F[r.key], r.ic)).join("");
    return {
      body: `
        <p class="app-lead">Org chart DungeonOS Inc. Empat faksi, satu kamu di tengah. Pilih jurusnya.</p>
        <div class="fac-list">${bars}</div>
        <p class="quip">"Kamu bukan bos. Kamu cuma titik temu kepentingan empat pihak yang saling curiga."</p>
        <button id="fac-scan" class="quick primary"><span class="quick-i">${icon("radar")}</span><span class="quick-t">Selidiki Faksi</span></button>
        <div id="fac-intel" class="fac-intel"></div>`,
      mount(screen) {
        const btn = screen.querySelector("#fac-scan");
        const out = screen.querySelector("#fac-intel");
        if (!btn) return;
        btn.addEventListener("click", () => {
          Sound.tap();
          const F = getState().factions;
          const lines = [
            `HQ trust ${F.hq}%. Memorimu: "aset berisiko sedang, butuh audit."`,
            `Serikat trust ${F.serikat}%. Mogok diprediksi ${F.serikat > 60 ? "mundur" : "dekat"}.`,
            `Hero trust ${F.hero}%. Mereka masih mengira kamu NPC penjaga pintu.`,
            `Grem trust ${F.grem}%. Dia tahu lebih banyak soal game ini daripada kamu.`
          ];
          out.innerHTML = lines.map(t => `<div class="fac-line">${t}</div>`).join("");
          out.classList.add("show");
          moBurst(120, 60, "var(--violet-2)");
        });
      }
    };
  },

  standup(_s, _state, handlers) {
    const prompts = [
      {
        q: "Grem: \"Apa blocker kamu minggu ini, Bos?\"",
        opts: [
          { t: "Budget cekak", run: st => { st.stats.stability += 4; shiftFac(st, "hq", 3); } },
          { t: "Minion mau mogok", run: st => { st.stats.morale -= 4; shiftFac(st, "serikat", 5); } },
          { t: "Hero terlalu rajin", run: st => { st.stats.reputation += 4; shiftFac(st, "hero", -3); } }
        ]
      },
      {
        q: "Grem: \"Achievement kamu pekan ini?\"",
        opts: [
          { t: "0 bug (hampir)", run: st => { st.stats.bugLevel = Math.max(0, st.stats.bugLevel - 5); shiftFac(st, "hq", 4); } },
          { t: "Bikin meme", run: st => { st.stats.morale += 4; st.flags.memeWar = true; } },
          { t: "Tidur yang cukup", run: st => { st.stats.morale += 2; } }
        ]
      }
    ];
    return {
      body: `
        <p class="app-lead">Standup harian. Grem tanya, kamu jawab — sebelum pasir habis. Diam = 'Setuju'.</p>
        <div id="standup-body"></div>`,
      mount(screen) {
        const body = screen.querySelector("#standup-body");
        if (!body) return;
        let i = 0, timer = null, done = false;

        const finish = () => {
          if (timer) clearTimeout(timer);
          done = true;
          body.innerHTML = `<div class="standup-memo">
            <div class="standup-memo-h">📝 NOTULEN STANDUP</div>
            <div>Bos hadir (secara fisik). Keputusan: ditunda ke sprint berikutnya.</div>
            <div>Serikat: \"standup lagi besok, ya.\"</div>
            <div>Grem: \"Efisien. Kami suka karyawan yang hemat kata.\"</div>
          </div>`;
        };

        const showPrompt = () => {
          if (i >= prompts.length) { finish(); return; }
          const p = prompts[i];
          body.innerHTML = `
            <div class="standup-q">${p.q}</div>
            <div class="standup-opts">
              ${p.opts.map((o, oi) => `<button class="quick" data-opt="${oi}"><span class="quick-t">${o.t}</span></button>`).join("")}
            </div>
            <div class="standup-timer"><span></span></div>`;
          const bar = body.querySelector(".standup-timer span");
          if (bar) { bar.style.transition = "none"; bar.style.width = "100%"; requestAnimationFrame(() => { bar.style.transition = "width 8s linear"; bar.style.width = "0%"; }); }
          body.querySelectorAll(".standup-opts .quick").forEach(b => {
            b.addEventListener("click", () => {
              if (timer) clearTimeout(timer);
              const o = p.opts[+b.dataset.opt];
              doAction("standup", "ans", { note: "Jawaban dicatat di notulen.", run: st => { if (o.run) o.run(st); } });
              i++;
              showPrompt();
            });
          });
          timer = setTimeout(() => {
            if (done || !screen.isConnected || getState().activeApp !== "standup") return;
            doAction("standup", "timeout", { note: "Bos diam. Grem catat: 'Setuju'.", run: st => { st.stats.morale -= 3; shiftFac(st, "serikat", -4); } });
            i++;
            showPrompt();
          }, 8000);
        };
        showPrompt();
      }
    };
  },

  bazzaar(_s) {
    return {
      meta: {
        skin: { label: "Skin Bawang Emas (99g)", icon: "gift", cost: 99, note: "Kosmetik murni. Minion tetap mengeluh, tapi kini berkilau.", run: st => {} },
        noads: { label: "Hapus Iklan (50g)", icon: "eye", cost: 50, note: "Iklan memang tidak ada. Tapi kini resmi 'hilang'.", run: st => { st.flags.noAds = true; } },
        box: { label: "Lootbox Misteri (30g)", icon: "diamond", cost: 30, note: "Lootbox dibuka. Isinya... mengejutkan.", run: st => {
          const r = Math.random();
          if (r >= 0.75) st.stats.gold += 60;
          else if (r >= 0.5) st.stats.gold += 20;
        } }
      },
      body: `
        <p class="app-lead">Bazzaar — toko "premium" DungeonOS Inc. Harga wajar, manfaat kosong. Saham naik.</p>
        <p class="quip">"Bayar nyata, dapat pixel. Selamat datang di masa depan."</p>`
    };
  },

  orakel(_s) {
    const lines = [
      "Aku melihat… layarmu. Ya, LAYAR-mu. Kamu sedang membaca ini, kan?",
      "Serikat akan mogok. Atau tidak. Aku kan orakel, bukan manajer HR.",
      "Hero yang kau takuti sebenarnya cuma nyari wifi gratis.",
      "Di save file-mu ada baris yang tidak seharusnya ada. Abaikan.",
      "Bawang suci akan menjawab pertanyaan yang belum kau tanyakan.",
      "HQ memprediksi kegagalanmu sejak purba. Mereka senang.",
      "Tutup game ini pun, dungeon tetap jalan. Kami punya serikat, ingat?"
    ];
    const predik = () => {
      const f = getState().factions;
      const dom = Object.entries(f).sort((a, b) => b[1] - a[1])[0];
      const domName = { hq: "HQ", serikat: "Serikat", hero: "Hero", grem: "Grem" }[dom[0]];
      return `Faksi dominan: ${domName} (${dom[1]}%). Endingmu condong ke arah mereka. Tapi ingat: aku sering salah.`;
    };
    return {
      body: `
        <p class="app-lead">Orakel DungeonOS. Melihat masa depan — dan sedikit ke luar layar.</p>
        <div id="ora-out" class="ora-out">"Tanyakan. Aku bosan jadi pixel."</div>
        <button id="ora-ask" class="quick primary"><span class="quick-i">${icon("scroll")}</span><span class="quick-t">Tanya Orakel</span></button>
        <button id="ora-pred" class="quick"><span class="quick-i">${icon("eye")}</span><span class="quick-t">Ramalkan Ending</span></button>`,
      mount(screen) {
        const out = screen.querySelector("#ora-out");
        const ask = screen.querySelector("#ora-ask");
        const pred = screen.querySelector("#ora-pred");
        if (!out) return;
        const flash = (txt) => { out.textContent = txt; out.classList.remove("show"); void out.offsetWidth; out.classList.add("show"); };
        ask.addEventListener("click", () => { Sound.tap(); flash(lines[Math.floor(Math.random() * lines.length)]); moBurst(120, 60, "var(--cyan)"); });
        pred.addEventListener("click", () => { Sound.tap(); flash(predik()); });
      }
    };
  },
  monopoli(s) {
    return {
      body: `
        <p class="app-lead">Monopoli — aplikasi yang konon akan ada. Status: masih dibahas, mau dibuat apa tidak jadi.</p>
        <div class="mono-card">
          <p class="mono-note">Aplikasi <b>Monopoli</b> masih didiskusikan: apa jadi dibuat, apa tidak jadi. Nanti kalau disetujui, baru kami koding. Sabar, Bos.</p>
          <div class="mono-hush">🤫 Konon katanya ada yang sudah main 20 putaran tapi belum kelar kelar</div>
        </div>`
    };
  }
};

function renderFeed(screen, state, accent, handlers) {
  const node = getCurrentNode();
  if (!node) {
    screen.innerHTML = `
      <div class="app-screen">
        <div class="topbar"><button class="ghost-btn" data-back>${icon("back")} Beranda</button></div>
        <div class="placeholder">Cerita sudah selesai. Lihat ending-mu di layar berikutnya.</div>
      </div>`;
    screen.querySelector("[data-back]").addEventListener("click", () => handlers.back());
    return;
  }

  const speaker = resolveText(node.speaker, state) || "DungeonOS";
  const kind = avatarKind(speaker);
  const value = resolveText(node.body, state);
  const arr = Array.isArray(value) ? value : [value];
  const bubbles = arr.map((t, i) => `<div class="bubble ${kind}" data-i="${i}">${t}</div>`).join("");

  const hasChoices = Array.isArray(node.choices) && node.choices.length > 0;
  const quick = hasChoices
    ? node.choices.map((c, i) => `<button class="quick" data-choice="${i}"><span class="quick-i">${i + 1}</span><span class="quick-body"><span class="quick-t">${c.text}</span>${c.hint ? `<span class="quick-sub">↳ ${c.hint}</span>` : ""}</span></button>`).join("")
    : `<button class="quick primary" id="advance">${icon("bolt")} <span>Lanjut</span></button>`;

  screen.innerHTML = `
    <div class="app-screen feed-screen">
      <div class="topbar">
        <button class="ghost-btn" data-back>${icon("back")} Beranda</button>
        <div class="app-title" style="color:${accent}">${icon("feed")} DungeonFeed</div>
      </div>
      <div class="chat">
        <div class="chat-head">
          <div class="chat-ava ${kind}">${avatar(kind)}</div>
          <div class="chat-id">
            <div class="chat-name">${speaker}</div>
            <div class="chat-status"><span class="dot"></span> online · Hari ${node.day} · ${PHASE_LABELS[node.phase] || node.phase}</div>
          </div>
          <div class="chat-pill">STORY</div>
        </div>
        <div class="chat-body">
          ${bubbles}
          <div class="typing" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>
        <div class="chat-quick">${quick}</div>
       </div>
       <div class="feed-meme"><span class="feed-meme-ico">${icon("onion")}</span><span>${randomMeme()}</span></div>
       <div class="feed-nudge">
         <span class="feed-nudge-ico">${icon("sparkle")}</span>
         DungeonFeed seru, tapi jangan lupa: <b>MinionApp</b>, <b>UnionDesk</b> &amp; <b>TrapMart</b> juga butuh perhatianmu hari ini.
       </div>
    </div>`;

  screen.querySelector("[data-back]").addEventListener("click", () => handlers.back());

  if (hasChoices) {
    screen.querySelectorAll(".chat-quick .quick").forEach(b =>
      b.addEventListener("click", () => { chooseOption(Number(b.dataset.choice)); handlers.rerender(); })
    );
  } else {
    const adv = screen.querySelector("#advance");
    if (adv) adv.addEventListener("click", () => { advance(); handlers.rerender(); });
  }

  // Gimmick: "typing…" indicator, then messages appear one-by-one (chat feel),
  // choices unlock only after the last message lands.
  const bubbleEls = Array.from(screen.querySelectorAll(".bubble"));
  const typingEl = screen.querySelector(".typing");
  const quickEl = screen.querySelector(".chat-quick");
  bubbleEls.forEach(b => b.classList.remove("show"));
  if (typingEl) typingEl.style.display = "inline-flex";
  if (quickEl) quickEl.style.visibility = "hidden";

  let bi = 0;
  const step = () => {
    if (!screen.contains(bubbleEls[0])) return; // screen changed, abort
    if (bi < bubbleEls.length) {
      bubbleEls[bi].classList.add("show");
      bi++;
      setTimeout(step, 380 + Math.random() * 260);
    } else {
      if (typingEl) typingEl.style.display = "none";
      if (quickEl) quickEl.style.visibility = "visible";
      if (!(state.flags && state.flags.lowPerf)) staggerIn(quickEl ? quickEl.querySelectorAll(".quick") : [], { base: 0.06, step: 0.06, from: 12 });
    }
  };
  setTimeout(step, 520);
}

export function renderApp(screen, state, handlers) {
  syncPerf(!!(state.flags && state.flags.lowPerf));
  const app = getAppById(state.activeApp);
  const appName = app ? app.name : "Aplikasi";
  const appAccent = app ? app.accent : "#8B5CF6";
  const appDesc = app ? app.description : "Aplikasi tidak terdaftar.";
  const isFeed = app && app.id === "feed";

  if (isFeed) { (NEW_RENDERFEED || renderFeed)(screen, state, appAccent, handlers); return; }

  if (app && app.id === "cctv" && !state.apps.cctv) {
    screen.innerHTML = `
      <div class="app-screen">
        <div class="topbar"><button class="ghost-btn" data-back>${icon("back")} Beranda</button></div>
        <div class="placeholder locked">
          <div class="lock-ico">${icon("cctv")}</div>
          <h3>CCTV Terkunci</h3>
          <p>Belum kamu miliki. Beli <b>CCTV Pro</b> di Toko Oren (150g) untuk membukanya.</p>
          <button class="action-btn" data-buy="tokooren">${icon("cart")}<span>Buka Toko Oren</span></button>
        </div>
      </div>`;
    const back = screen.querySelector("[data-back]");
    if (back) back.addEventListener("click", () => handlers.back());
    const buy = screen.querySelector("[data-buy]");
    if (buy) buy.addEventListener("click", () => { Sound.tap(); handlers.openApp(buy.dataset.buy); });
    return;
  }

  const getView = (id) => (NEW_VIEWS && NEW_VIEWS[id]) || (APP_VIEWS && APP_VIEWS[id]);
  const view = app && getView(app.id) ? getView(app.id)(state) : null;
  const content = view ? view.body : `<div class="placeholder">Modul <strong>${appName}</strong> belum dibangun.</div>`;
  const isReadOnly = !!(view && view.readOnly);
  const limited = !!(app && LIMITED.has(app.id));

  const used = usedToday(state, app.id);
  const blocked = limited && used >= 5;
  const limiter = limited && !isReadOnly
    ? `<div class="limiter ${blocked ? "full" : ""}"><span>Aksi hari ini</span><div class="limit-bar"><span style="width:${used * 20}%"></span></div><b>${used}/5</b></div>`
    : "";

  let actionHtml = "";
  if (view && view.meta && !blocked) {
    actionHtml = `<div class="action-list">` + Object.entries(view.meta)
      .map(([key, m]) => {
        const cls = key === "behind" ? "action-btn danger" : "action-btn";
        const costTag = m.cost ? `<span class="cost">${m.cost}g</span>` : "";
        return `<button class="${cls}" data-act="${key}">${icon(m.icon)}<span>${m.label}</span>${costTag}</button>`;
      })
      .join("") + `</div>`;
  }

  screen.innerHTML = `
    <div class="app-screen">
      <div class="topbar">
        <button class="ghost-btn" data-back>${icon("back")} Beranda</button>
        <div class="app-title" style="color:${appAccent}">${icon(app ? app.id : "settings")} ${appName}</div>
      </div>
      <div class="app-desc">${appDesc}</div>
      ${limiter}
      ${content}
      ${actionHtml}
      ${blocked ? `<div class="limit-note">🚫 Batas harian 5 aksi tercapai. Buka <b>DungeonFeed</b> untuk lanjut ke hari baru.</div>` : ""}
    </div>`;

  bindLiveGold(screen);
  screen.querySelector("[data-back]").addEventListener("click", () => handlers.back());

  if (view && view.meta) {
    screen.querySelectorAll(".action-btn").forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener("click", () => {
        const key = btn.dataset.act;
        const m = view.meta[key];
        if (!m) return;
        // aksi khusus (bukan sistem doAction), mis. reset game di Settings
        if (view.actions && typeof view.actions[key] === "function") {
          Sound.tap();
          view.actions[key]();
          handlers.rerender();
          return;
        }
        doAction(app.id, key, m);
        const r = btn.getBoundingClientRect();
        moBurst(r.left + r.width / 2, r.top + r.height / 2, appAccent);
        Sound.good();
        handlers.rerender();
      });
    });
  }

  if (app && app.id === "settings") {
    const secret = screen.querySelector("#secret-tap");
    if (secret) secret.addEventListener("click", () => {
      mutate(st => {
        st.flags.settingsTaps = (st.flags.settingsTaps || 0) + 1;
        if (st.flags.settingsTaps >= 5 && !st.apps.devconsole) {
          st.apps.devconsole = true;
          addNotification("devconsole", "Akses Aneh", "DevConsole terbuka. Sesuatu memperhatikanmu.");
        }
      });
      handlers.rerender();
    });
  }

  if (view && view.mount) view.mount(screen, state, handlers);

  if (actionHtml && !(state.flags && state.flags.lowPerf)) staggerIn(screen.querySelectorAll(".action-btn"), { base: 0.05, step: 0.05, from: 12 });
}
