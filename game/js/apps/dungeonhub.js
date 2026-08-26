// Modul aplikasi mandiri — Fase 0 modularisasi v1.0.
import { getState, mutate, addNotification, setEnding } from "../state.js";
import { HUB_ENDING, HUB_REVOLT_ENDING } from "../content/endings.js";
import { icon, avatar } from "../ui/icons.js";
import { Lib, Sound, rand } from "../lib.js";
import { toast } from "../ui/toast.js";
import { staggerIn } from "../ui/anim.js";
import { PHASE_LABELS } from "../config.js";
import { getCurrentNode, resolveText, chooseOption, advance } from "../engine.js";
import { shiftFac, inv, addInv, takeInv, randomMeme, clamp } from "./shared.js";
import { choiceModal } from "../ui/kit/modal.js";

const HUB_MODULES = ["ride", "food", "mart", "pay"];
const HUB_LABEL = { ride: "Ride", food: "Food", mart: "Mart", pay: "Pay" };
const HUB_ACTIONS = [
  // RIDE
  { mod: "ride", id: "ride_go", label: "Dispatch driver", run: s => ({ g: 10, x: 5 }) },
  { mod: "ride", id: "ride_vip", label: "VIP Dragonride", run: s => ({ g: 18, x: 8, rep: 3 }) },
  { mod: "ride", id: "ride_surge", label: "Surge pricing", run: s => ({ g: 14, x: 6 }) },
  { mod: "ride", id: "ride_corp", label: "Akun korporat", run: s => ({ g: 22, x: 9, rep: -3 }) },
  { mod: "ride", id: "ride_night", label: "Shift malam", run: s => ({ g: 8, x: 4 }) },
  { mod: "ride", id: "ride_rate", label: "Manipulasi rating", run: s => ({ rating: 0.3, x: 3 }) },
  { mod: "ride", id: "ride_green", label: "Mode ramah bumi (PR)", run: s => ({ g: 6, x: 4, rep: 3 }) },
  // FOOD
  { mod: "food", id: "food_send", label: "Kirim makanan", run: s => ({ g: 9, x: 5, rep: 2 }) },
  { mod: "food", id: "food_5star", label: "Paksa 5 bintang", run: s => ({ g: 6, x: 4, rep: 2 }) },
  { mod: "food", id: "food_poison", label: "Makanan beracun (jebak)", run: s => ({ loot: 14, hero: -6, stab: 5 }) },
  { mod: "food", id: "food_influ", label: "Review influencer", run: s => ({ g: 12, x: 6, rep: 4 }) },
  { mod: "food", id: "food_portion", label: "Porsi mini (scam)", run: s => ({ g: 10, x: 5, rep: -2 }) },
  { mod: "food", id: "food_spicy", label: "Tantang pedas", run: s => ({ g: 7, x: 4, rep: 2 }) },
  { mod: "food", id: "food_halal", label: "Sertifikat halal palsu", run: s => ({ g: 8, x: 4, rep: -3 }) },
  // MART
  { mod: "mart", id: "mart_inflate", label: "Naikkan harga", run: s => ({ g: 12, x: 6, union: 4 }) },
  { mod: "mart", id: "mart_sub", label: "Subscription palsu", run: s => ({ g: 14, x: 6, rep: -2 }) },
  { mod: "mart", id: "mart_flash", label: "Flash sale quest", run: s => ({ g: 10, x: 5 }) },
  { mod: "mart", id: "mart_bundle", label: "Bundle tipu", run: s => ({ g: 16, x: 7, rep: -3 }) },
  { mod: "mart", id: "mart_member", label: "Tier membership", run: s => ({ g: 8, x: 5, rep: 3 }) },
  { mod: "mart", id: "mart_glitch", label: "Manfaatkan glitch harga", run: s => ({ g: 13, x: 6, rep: -2 }) },
  // PAY
  { mod: "pay", id: "pay_tax", label: "Pajak loot", run: s => ({ g: 12, x: 6 }) },
  { mod: "pay", id: "pay_wallet", label: "Top-up wallet kosong", run: s => ({ g: 10, x: 5 }) },
  { mod: "pay", id: "pay_cashback", label: "Promo cashback", run: s => ({ g: 9, x: 5, rep: 2 }) },
  { mod: "pay", id: "pay_interest", label: "Bunga pinjaman", run: s => ({ g: 18, x: 8, rep: -4 }) },
  { mod: "pay", id: "pay_late", label: "Denda telat (scam)", run: s => ({ g: 11, x: 5, rep: -2 }) },
  { mod: "pay", id: "pay_ppob", label: "Bayar tagihan absurd", run: s => ({ g: 7, x: 4 }) }
];
const HUB_EVENTS = [
  { t: "📞 Telpon Pelanggan Protes", html: "Pelanggan: 'Dragonya ngamuk, goblinnya nyetir sambil main roblox!'", choices: [
    { label: "Minta maaf + refund (rep+, gold-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation + 4, 0, 100); st.stats.gold = Math.max(0, st.stats.gold - 8); }) },
    { label: "Blokir & cuek (rep-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation - 6, 0, 100); }) }
  ] },
  { t: "🛵 Kurir Nyasar", html: "Kurir naga nyasar ke Elf Forest. Ongkir malah nambah.", choices: [
    { label: "Navigasi ulang (gold-)", run: () => mutate(st => { st.stats.gold = Math.max(0, st.stats.gold - 6); }) },
    { label: "Biarkan (rep-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation - 4, 0, 100); }) }
  ] },
  { t: "📦 Drama COD", html: "Hero pesan 'Bola api +1' COD, pas datang malah nolak bayar.", choices: [
    { label: "Tagih paksa (gold+)", run: () => mutate(st => { st.stats.gold += 12; }) },
    { label: "Batalin pesanan (rep-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation - 3, 0, 100); }) }
  ] },
  { t: "🧑‍🚀 Drama Kurir", html: "Kurir goblin nangis: 'Bos, gaji telat, anak mau masuk sekolah api neraka.'", choices: [
    { label: "Kasih tip (gold-)", run: () => mutate(st => { st.stats.gold = Math.max(0, st.stats.gold - 7); st.stats.morale = clamp(st.stats.morale + 5, 0, 100); }) },
    { label: "Marahin (morale-)", run: () => mutate(st => { st.stats.morale = clamp(st.stats.morale - 6, 0, 100); }) }
  ] },
  { t: "⭐ Review Palsu Ketahuan", html: "Netizen ngeh: 5 bintangmu beli dari bot.", choices: [
    { label: "Hapus & bayar influencer (gold-)", run: () => mutate(st => { st.stats.gold = Math.max(0, st.stats.gold - 10); }) },
    { label: "Bilang 'itu organik' (rep-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation - 5, 0, 100); }) }
  ] },
  { t: "💸 Promo Salah Harga", html: "Admin salah pasang: 'Naga gratis'. 900 orang antre.", choices: [
    { label: "Batalkan promo (rep-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation - 6, 0, 100); }) },
    { label: "Beri naga bekas (gold+)", run: () => mutate(st => { st.stats.gold += 14; }) }
  ] },
  { t: "🕵️ Hacker Ancam", html: "Pesan: 'Bayar 50g atau brankas bocor.' (mungkin hoax)", choices: [
    { label: "Bayar tebusan (gold-)", run: () => mutate(st => { st.stats.gold = Math.max(0, st.stats.gold - 50); }) },
    { label: "Blokir & lapor HQ (rep+)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation + 3, 0, 100); }) }
  ] },
  { t: "🍜 Komplain Halal/Haram", html: "Netizen debat menu 'daging misteri'. PR nyaris hancur.", choices: [
    { label: "Rilis sertifikat (rep+)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation + 4, 0, 100); }) },
    { label: "Abaikan (rep-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation - 4, 0, 100); }) }
  ] },
  { t: "🚖 Driver Mogok", html: "Driver goblin mogok: 'Kami mau serikat!'", choices: [
    { label: "Naikkan bagi hasil (gold-)", run: () => mutate(st => { st.stats.gold = Math.max(0, st.stats.gold - 12); st.stats.unionPower = clamp(st.stats.unionPower - 4, 0, 100); }) },
    { label: "Ancam pecat (union+)", run: () => mutate(st => { st.stats.unionPower = clamp(st.stats.unionPower + 6, 0, 100); st.stats.morale = clamp(st.stats.morale - 3, 0, 100); }) }
  ] },
  { t: "📉 Pesanan Salah Alamat", html: "Trap terkirim ke rumah hero, bukan brankasmu. Oops.", choices: [
    { label: "Klaim 'strategi' (loot+)", run: () => mutate(st => { st.stats.loot += 10; }) },
    { label: "Minta maaf (rep-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation - 3, 0, 100); }) }
  ] },
  { t: "🎤 Influencer Nyinyir", html: "Seleb dungeon: 'DungeonHub? Lebih ke scam.' Views meledak.", choices: [
    { label: "Collab (gold-, rep+)", run: () => mutate(st => { st.stats.gold = Math.max(0, st.stats.gold - 15); st.stats.reputation = clamp(st.stats.reputation + 5, 0, 100); }) },
    { label: "Blokir (rep-)", run: () => mutate(st => { st.stats.reputation = clamp(st.stats.reputation - 4, 0, 100); }) }
  ] },
  { t: "🧾 Audit Internal", html: "Tim HQ datang: 'Kok cuan terus, bos?'", choices: [
    { label: "Suap auditor (gold-)", run: () => mutate(st => { st.stats.gold = Math.max(0, st.stats.gold - 20); st.stats.stability = clamp(st.stats.stability + 5, 0, 100); }) },
    { label: "Buka buku (jujur)", run: () => mutate(st => { st.stats.unionPower = clamp(st.stats.unionPower + 3, 0, 100); }) }
  ] }
];
function auditPenalty(st) {
  // Hanya pajak kelebihan cuan harian (bukan semua earned), & sekali sehari.
  const over = Math.max(0, (st.hub.dayEarned || 0) - 120);
  const lost = Math.round(over * 0.5);
  st.stats.gold = Math.max(0, st.stats.gold - lost);
  st.hub.earned = Math.max(0, st.hub.earned - lost);
  st.stats.morale = clamp(st.stats.morale - 10, 0, 100);
  st.stats.reputation = clamp(st.stats.reputation - 8, 0, 100);
  st.hub.dayEarned = 0; st.hub.audit = (st.hub.audit || 0) + 1; st.hub.auditedToday = true;
}

// Catat hari ini "habis kuota" kalau quest 5/5 + energi 14/14 terpakai.
function markHubExhaustion() {
  const st = getState();
  const used = 14 - (st.hub.energy == null ? 14 : st.hub.energy);
  if ((st.hub.questDone || 0) >= 5 && used >= 14) {
    const day = st.day;
    mutate(s => { s.hub.exhaustedDays[day] = true; });
  }
}

// 10 hari berturut-turut (dari hari 1) habis kuota -> ending.
function checkHubGrind(handlers) {
  const st = getState();
  if (st.flags.hubGrind) return true;
  let n = 0;
  for (let d = 1; d < 300; d++) { if (st.hub.exhaustedDays && st.hub.exhaustedDays[d]) n++; else break; }
  if (n >= 10) {
    mutate(s => { s.flags.hubGrind = true; });
    setEnding(HUB_ENDING);
    handlers.rerender();
    return true;
  }
  return false;
}

// Inbox: muncul acak saat interaksi, MAKS 1 popup per 3 interaksi.
function maybeHubEvent(handlers) {
  let shown = false;
  mutate(st => {
    st.hub.sinceEvent = (st.hub.sinceEvent || 0) + 1;
    if (st.hub.sinceEvent >= 3 && Math.random() < 0.6) {
      st.hub.sinceEvent = 0;
      shown = true;
    }
  });
  if (shown) {
    const ev = HUB_EVENTS[Math.floor(Math.random() * HUB_EVENTS.length)];
    choiceModal(ev.t, `<p>${ev.html}</p>`, ev.choices.map(c => ({ label: c.label, run: c.run })), () => handlers.rerender());
    return true;
  }
  return false;
}
function checkLevel(st) {
  const xpNeed = 40 + (st.hub.level || 1) * 25;
  if ((st.hub.xp || 0) >= xpNeed) {
    st.hub.xp -= xpNeed; st.hub.level = (st.hub.level || 1) + 1;
    st.stats.gold += 40; st.hub.earned += 40;
  }
}
  const STATION_LABEL = { ride: "Ride", food: "Food", toko: "Toko", sec: "Keamanan" };
  const HUB_DIRECTIVES = [
    { id: "biasa", text: "HQ: Jalankan seperti biasa.", goldMul: 1, stamCost: 22, moraleCost: 12, ratingSwing: 1 },
    { id: "rating", text: "HQ: Genjot rating — pelayanan ekstra.", goldMul: 1.15, stamCost: 28, moraleCost: 16, ratingSwing: 1.6 },
    { id: "hemat", text: "HQ: Hemat tenaga — jangan bikin minion drop.", goldMul: 0.85, stamCost: 14, moraleCost: 8, ratingSwing: 0.8 },
    { id: "ekspansi", text: "HQ: Ekspansi cepat — cuan gede, risiko insiden naik.", goldMul: 1.3, stamCost: 26, moraleCost: 15, ratingSwing: 1.2, incBonus: 0.2 }
  ];
  const EVIL_JOBS = [
    { id: "ride", label: "Ojek Naga", sub: "Ride", icon: "rider", desc: "Antar penumpang & paket kilat. Macet, hujan, & pelanggan rewel.", color: "#34E7E4" },
    { id: "food", label: "Dapur", sub: "Food", icon: "food", desc: "Masak & racik minuman. Pesanan ngantri, bahan menipis, komplain pedas.", color: "#FF7A00" },
    { id: "toko", label: "Gudang", sub: "Mart", icon: "store", desc: "Sortir & kemas paket. Fragile, label salah, deadline mepet.", color: "#FFD86B" },
    { id: "sec", label: "Keamanan", sub: "Guard", icon: "shield", desc: "Jaga brankas dari hero & monster lepas. Fokus tinggi.", color: "#FF5E7A" }
  ];
  function rosterHtml(s) {
    const mins = s.hub.minions || [];
    return mins.map(m => `
      <div class="rost-card premium">
        <div class="rost-head"><div class="rost-ava">${icon("minion")}</div><div><b>${m.name}</b><span class="rost-trait">${m.trait}</span><div class="rost-skill">Skill: R${m.skill.ride||0}·F${m.skill.food||0}·T${m.skill.toko||0}·S${m.skill.sec||0}</div></div></div>
        <div class="rost-bar"><span>Morale</span><i class="${m.morale < 25 ? "crit" : m.morale < 50 ? "warn" : ""}" style="width:${clamp(m.morale, 0, 100)}%"></i><b>${m.morale}</b></div>
        <div class="rost-bar"><span>Stamina</span><i class="${m.stamina < 25 ? "crit" : ""}" style="width:${clamp(m.stamina, 0, 100)}%"></i><b>${m.stamina}</b></div>
      </div>`).join("");
  }
  function assignHtml(s) {
    const mins = s.hub.minions || [];
    const a = s.hub.assigned || {};
    const ids = ["ride", "food", "toko", "sec"];
    return ids.map(st2 => {
      const sel = a[st2];
      const job = EVIL_JOBS.find(j=>j.id===st2);
      const opts = mins.map(m => `<button class="assign-btn ${sel === m.id ? "on" : ""} ${m.stamina <= 0 ? "off" : ""}" data-station="${st2}" data-min="${m.id}">${m.name}${m.stamina <= 0 ? " ⛔" : ""}</button>`).join("");
      return `<div class="assign-row premium"><span class="assign-lab" style="--c:${job.color}"><span class="assign-dot" style="background:${job.color}"></span>${job.label}</span><div class="assign-btns">${opts}</div></div>`;
    }).join("");
  }
  function stockHtml(s) {
    const stock = s.hub.stock || {};
    const ids = ["ride", "food", "toko", "sec"];
    return ids.map(s2 => {
      const job = EVIL_JOBS.find(j=>j.id===s2);
      const v = stock[s2] || 0;
      const low = v <= 3;
      return `<div class="stock-row premium" style="--c:${job.color}"><span class="stock-lab"><span class="stock-dot" style="background:${job.color}"></span>${job.label}: <b class="${low?'low':''}">${v}</b></span><button class="restock-btn" data-stk="${s2}">+5 (4g)</button></div>`;
    }).join("");
  }
  function jobBoardHtml(s) {
    const enabled = s.hub.jobEnabled || { ride: true, food: true, toko: true, sec: true };
    const stock = s.hub.stock || {};
    const a = s.hub.assigned || {};
    return EVIL_JOBS.map(j => {
      const on = enabled[j.id];
      const st = stock[j.id] || 0;
      const min = (s.hub.minions||[]).find(m=>m.id===a[j.id]);
      const stamina = min ? min.stamina : 0;
      const morale = min ? min.morale : 0;
      const canRun = on && a[j.id] && stamina>0 && st>0;
      return `<div class="job-card ${on?'on':''} ${canRun?'':'disabled'}" data-job="${j.id}" style="--c:${j.color}">
        <div class="job-head"><span class="job-ico">${icon(j.icon)}</span><div><b>${j.label}</b><span class="job-sub">${j.sub} · ${j.desc}</span></div><label class="job-toggle"><input type="checkbox" data-job-toggle="${j.id}" ${on?'checked':''}><span></span></label></div>
        <div class="job-meta"><span class="job-min">${min?min.name:'—'} · S${stamina} M${morale}</span><span class="job-stock ${st<=3?'low':''}">Stok ${st}</span></div>
        <div class="job-foot"><span class="job-hint">${canRun?'Siap shift':'Butuh minion/stok'}</span><span class="job-cost">-stock 1 · -stamina/morale</span></div>
      </div>`;
    }).join("");
  }
  // ============ PREMIUM PER-ACTION MINIGAMES (production, per-tombol) ============
  const HUB_ACTION_GAMES = {
    ride_go: { engine: "courier", title: "Dispatch Driver", icon: "rider", color: "#34E7E4", prompt: "Antar naga: hindari rintangan di rute ekspres" },
    ride_vip: { engine: "timing", title: "VIP Dragonride", icon: "rider", color: "#FFD86B", prompt: "Jaga naga VIP tetap melayang stabil", lo: 36, hi: 64, speed: 1.8 },
    ride_surge: { engine: "slider", title: "Surge Pricing", icon: "wallet", color: "#FF5E7A", prompt: "Setel surge 1.8x di zona hijau — jangan serakah" },
    ride_corp: { engine: "quiz", title: "Akun Korporat", icon: "store", color: "#A855F7", questions: [{ q: "Klien korporat minta potongan 30%. Jawab?", opts: ["Setuju 30% (rugi)", "Tawarkan paket 15% + prioritas", "Tolak mentah"], correct: 1, hint: "Negosiasi butuh win-win" }] },
    ride_night: { engine: "courier", title: "Shift Malam", icon: "rider", color: "#6B7280", prompt: "Rute malam: lampu minim, hindari lubang" },
    ride_rate: { engine: "quiz", title: "Manipulasi Rating", icon: "star", color: "#FFD86B", questions: [{ q: "Review bintang 1: 'Dragon telat'. Balas?", opts: ["Hapus paksa", "Minta maaf + voucher + perbaiki", "Balas sarkas"], correct: 1 }] },
    ride_green: { engine: "sort", title: "Mode Ramah Bumi", icon: "store", color: "#34D399", prompt: "Pisahkan sampah organik/anorganik untuk PR" },
    food_send: { engine: "courier", title: "Kirim Makanan", icon: "food", color: "#FF7A00", prompt: "Antar makanan panas tepat waktu" },
    food_5star: { engine: "quiz", title: "Paksa 5 Bintang", icon: "star", color: "#FFD86B", questions: [{ q: "Pelanggan kasih bintang 3. Paksa jadi 5?", opts: ["Ancam blokir", "Tawarkan dessert gratis jika berkenan revisi", "Beli bot review"], correct: 1, hint: "Paksa = cheating, tawarkan = etis" }] },
    food_poison: { engine: "timing", title: "Makanan Beracun", icon: "skull", color: "#EF4444", prompt: "Sisip jebakan saat penjaga lengah — timing presisi", lo: 40, hi: 60, speed: 2.2 },
    food_influ: { engine: "quiz", title: "Review Influencer", icon: "dungeongram", color: "#EC4899", questions: [{ q: "Influencer mau review pedas. Menu apa?", opts: ["Sajikan level 3 aman", "Paksa level 10 tanpa warning", "Tolak influencer"], correct: 0 }] },
    food_portion: { engine: "slider", title: "Porsi Mini", icon: "food", color: "#F59E0B", prompt: "Atur porsi 'mini' di zona scam 30-45%" },
    food_spicy: { engine: "timing", title: "Tantang Pedas", icon: "food", color: "#DC2626", prompt: "Tahan pedas: lepas di zona tahan", lo: 45, hi: 65, speed: 2.0 },
    food_halal: { engine: "quiz", title: "Sertifikat Halal Palsu", icon: "shield", color: "#10B981", questions: [{ q: "Sertifikat mana yang valid?", opts: ["Stempel HQ palsu", "Sertifikat resmi MUI + audit", "Fotokopi buram"], correct: 1 }] },
    mart_inflate: { engine: "slider", title: "Naikkan Harga", icon: "store", color: "#F59E0B", prompt: "Naikkan 20% di zona hijau — jangan over" },
    mart_sub: { engine: "quiz", title: "Subscription Palsu", icon: "store", color: "#8B5CF6", questions: [{ q: "User klik 'x' tapi kejebak subscribe. Fix?", opts: ["Biarkan (cuan)", "Buat tombol batal jelas & konfirmasi", "Sembunyikan lagi"], correct: 1 }] },
    mart_flash: { engine: "tap", title: "Flash Sale", icon: "bolt", color: "#FACC15", prompt: "Tap secepatnya tapi jaga ritme — anti-spam" },
    mart_bundle: { engine: "sort", title: "Bundle Tipu", icon: "store", color: "#06B6D4", prompt: "Susun bundle yang jujur vs tipu — pilih yang adil" },
    mart_member: { engine: "quiz", title: "Tier Membership", icon: "star", color: "#A855F7", questions: [{ q: "Member protes tier gak jelas. Solusi?", opts: ["Tambah tier lagi", "Sederhanakan 2 tier dengan benefit jelas", "Naikkan harga tier"], correct: 1 }] },
    mart_glitch: { engine: "timing", title: "Glitch Harga", icon: "bolt", color: "#34E7E4", prompt: "Tangkap glitch di jendela 0.3s", lo: 42, hi: 58, speed: 2.8 },
    pay_tax: { engine: "quiz", title: "Pajak Loot", icon: "wallet", color: "#6B7280", questions: [{ q: "Loot 100g, pajak 15% = ?", opts: ["10g", "15g", "25g"], correct: 1 }] },
    pay_wallet: { engine: "slider", title: "Top-up Wallet", icon: "wallet", color: "#34D399", prompt: "Isi wallet pas 85% — jangan overfill" },
    pay_cashback: { engine: "sort", title: "Promo Cashback", icon: "coin", color: "#F59E0B", prompt: "Cocokkan kode cashback valid vs palsu" },
    pay_interest: { engine: "slider", title: "Bunga Pinjaman", icon: "wallet", color: "#EF4444", prompt: "Setel bunga 12% di zona hijau" },
    pay_late: { engine: "timing", title: "Denda Telat", icon: "hourglass", color: "#F59E0B", prompt: "Hindari denda: tekan pas deadline", lo: 38, hi: 62, speed: 2.1 },
    pay_ppob: { engine: "sort", title: "Bayar Tagihan Absurd", icon: "wallet", color: "#8B5CF6", prompt: "Urutkan tagihan: listrik > air > internet" }
  };
  function mgQuizPremium(gameEl, done, cfg) {
    const qs = cfg.questions || [];
    let idx = 0, score = 0, failed = false;
    const total = qs.length;
    const render = () => {
      if (idx >= total) { done(failed ? 0 : score / total); return; }
      const q = qs[idx];
      gameEl.innerHTML = `<div class="mg-premium quiz">
        <div class="mg-premium-head" style="--c:${cfg.color}"><span class="mg-premium-ico">${icon(cfg.icon)}</span><div><b>${cfg.title}</b><span>${cfg.prompt||""}</span></div><span class="mg-premium-step">${idx+1}/${total}</span></div>
        <div class="mg-premium-timer"><i id="mg-bar" style="width:100%"></i></div>
        <div class="mg-premium-q">${q.q}</div>
        <div class="mg-premium-opts">${q.opts.map((o,i)=>`<button class="mg-opt" data-i="${i}">${o}</button>`).join("")}</div>
        ${q.hint?`<div class="mg-premium-hint">${q.hint}</div>`:""}
      </div>`;
      const bar = gameEl.querySelector("#mg-bar");
      let t = 100, timer = setInterval(()=>{ t-=2.5; if(bar) bar.style.width=t+"%"; if(t<=0){ clearInterval(timer); failed=true; gameEl.innerHTML=`<div class="mg-premium result bad">⏰ Waktu habis! Gagal — kamu tidak menjawab.</div>`; setTimeout(()=>done(0),700);} },80);
      gameEl.querySelectorAll(".mg-opt").forEach(b=>b.addEventListener("click",()=>{
        clearInterval(timer);
        const pick = Number(b.dataset.i);
        if(pick===q.correct){ score++; b.classList.add("good"); Sound.blip(); } else { failed=true; b.classList.add("bad"); const correctEl = gameEl.querySelectorAll(".mg-opt")[q.correct]; if(correctEl) correctEl.classList.add("good"); Sound.bad(); }
        setTimeout(()=>{ idx++; render(); }, 600);
      }));
    };
    render();
  }
  function mgSliderPremium(gameEl, done, cfg) {
    const lo = cfg.lo ?? 38, hi = cfg.hi ?? 62, speed = cfg.speed ?? 1.9;
    gameEl.innerHTML = `<div class="mg-premium slider" style="--c:${cfg.color}">
      <div class="mg-premium-head"><span class="mg-premium-ico">${icon(cfg.icon)}</span><div><b>${cfg.title}</b><span>${cfg.prompt||"Stop di zona hijau"}</span></div></div>
      <div class="mg-slider-track"><span class="mg-slider-zone" style="left:${lo}%;width:${hi-lo}%"></span><i class="mg-slider-mark"></i></div>
      <button class="mg-premium-btn">STOP</button>
      <div class="mg-premium-hint">Presisi = bonus, meleset = penalti</div>
    </div>`;
    const mark = gameEl.querySelector(".mg-slider-mark"), btn = gameEl.querySelector(".mg-premium-btn");
    let pos=0, dir=1, raf=null, stopped=false;
    const loop=()=>{ if(stopped) return; pos+=dir*speed; if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;} mark.style.left=pos+"%"; raf=requestAnimationFrame(loop); };
    loop();
    btn.addEventListener("click",()=>{
      if(stopped) return; stopped=true; cancelAnimationFrame(raf);
      const ok = pos>=lo && pos<=hi;
      btn.textContent = ok ? "✓ PRESISI!" : "✗ MELESET";
      btn.classList.add(ok?"good":"bad");
      if(ok) Sound.blip(); else Sound.bad();
      setTimeout(()=>done(ok?1:0.2), 500);
    });
  }
  function mgTimingPremium(gameEl, done, cfg) {
    const lo = cfg.lo ?? 40, hi = cfg.hi ?? 60, speed = cfg.speed ?? 2.0;
    gameEl.innerHTML = `<div class="mg-premium timing" style="--c:${cfg.color}">
      <div class="mg-premium-head"><span class="mg-premium-ico">${icon(cfg.icon)}</span><div><b>${cfg.title}</b><span>${cfg.prompt||"Tahan & lepas di zona"}</span></div></div>
      <div class="mg-timing-track"><span class="mg-timing-zone" style="left:${lo}%;width:${hi-lo}%"></span><i class="mg-timing-mark"></i></div>
      <button class="mg-premium-btn hold">TAHAN</button>
    </div>`;
    const mark = gameEl.querySelector(".mg-timing-mark"), btn = gameEl.querySelector(".mg-premium-btn");
    let pos=0, dir=1, raf=null, holding=false;
    const loop=()=>{ pos+=dir*speed; if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;} mark.style.left=pos+"%"; raf=requestAnimationFrame(loop); };
    loop();
    const finish=(ok)=>{
      cancelAnimationFrame(raf);
      btn.textContent = ok ? "✓ SEMPURNA" : "✗ GAGAL";
      btn.classList.add(ok?"good":"bad");
      if(ok) Sound.blip(); else Sound.bad();
      setTimeout(()=>done(ok?1:0), 600);
    };
    btn.addEventListener("pointerdown",()=>{ holding=true; });
    btn.addEventListener("pointerup",()=>{ if(!holding) return; holding=false; const ok = pos>=lo && pos<=hi; finish(ok); });
    btn.addEventListener("pointerleave",()=>{ if(holding) { holding=false; finish(false); } });
  }
  function mgSortPremium(gameEl, done, cfg) {
    const bins = cfg.bins || [{label:"A",color:"#34E7E4"},{label:"B",color:"#FF7A00"},{label:"C",color:"#FFD86B"}];
    const items = cfg.items || Array.from({length:6},(_,i)=>({label:"Item "+(i+1), bin: i%3, icon: "store"}));
    let idx=0, score=0;
    const render=()=>{
      if(idx>=items.length){ done(score/items.length); return; }
      const it = items[idx];
      gameEl.innerHTML = `<div class="mg-premium sort" style="--c:${cfg.color}">
        <div class="mg-premium-head"><span class="mg-premium-ico">${icon(cfg.icon)}</span><div><b>${cfg.title}</b><span>${cfg.prompt||"Sortir dengan benar"}</span></div><span class="mg-premium-step">${idx+1}/${items.length}</span></div>
        <div class="mg-sort-item">${icon(it.icon)}<b>${it.label}</b><span>${it.desc||""}</span></div>
        <div class="mg-sort-bins">${bins.map((b,i)=>`<button class="mg-bin" data-bin="${i}" style="--bc:${b.color}">${b.label}</button>`).join("")}</div>
      </div>`;
      gameEl.querySelectorAll(".mg-bin").forEach(b=>b.addEventListener("click",()=>{
        const pick = Number(b.dataset.bin);
        if(pick===it.bin){ score++; b.classList.add("good"); Sound.blip(); } else { b.classList.add("bad"); Sound.bad(); }
        setTimeout(()=>{ idx++; render(); }, 400);
      }));
    };
    render();
  }
  function mgTapPremium(gameEl, done, cfg) {
    const N = 12; let n=0, hits=0, lastTap=0;
    gameEl.innerHTML = `<div class="mg-premium tap" style="--c:${cfg.color}">
      <div class="mg-premium-head"><span class="mg-premium-ico">${icon(cfg.icon)}</span><div><b>${cfg.title}</b><span>${cfg.prompt||"Tap ritme, jangan spam"}</span></div></div>
      <div class="mg-tap-area"><button class="mg-tap-btn">TAP!</button><div class="mg-tap-hint">Tap ${N}x dengan jeda 180-500ms</div></div>
      <div class="mg-premium-progress"><i style="width:${0}%"></i><span>${n}/${N}</span></div>
    </div>`;
    const btn = gameEl.querySelector(".mg-tap-btn"), bar = gameEl.querySelector(".mg-premium-progress i"), cnt = gameEl.querySelector(".mg-premium-progress span");
    btn.addEventListener("click",()=>{
      const now = Date.now();
      const diff = now - lastTap;
      if(lastTap && diff < 140){ // anti-spam
        gameEl.querySelector(".mg-tap-hint").textContent = "Jangan spam! Pelan.";
        Sound.bad(); return;
      }
      if(lastTap && diff > 600){ hits = Math.max(0, hits-1); }
      else if(n>0) hits++;
      lastTap = now; n++;
      bar.style.width = (n/N*100)+"%"; cnt.textContent = n+"/"+N;
      btn.classList.add("active"); setTimeout(()=>btn.classList.remove("active"),120);
      Sound.blip();
      if(n>=N) setTimeout(()=>done(hits/N), 400);
    });
  }
  function playActionGame(actionId, gameEl, done) {
    const cfg = HUB_ACTION_GAMES[actionId];
    if(!cfg){ // fallback per-mod
      const st = getState(); const a = HUB_ACTIONS.find(x=>x.id===actionId); const mod = a ? a.mod : "ride";
      return playJobGame(mod, gameEl, done);
    }
    const wrap = (sc)=>{ // premium result wrapper with anti-cheat: if score low, extra penalty will be handled by caller
      done(Math.max(0, Math.min(1, sc)));
    };
    if(cfg.engine==="courier") return mgCourier(gameEl, wrap);
    if(cfg.engine==="timing") return mgTimingPremium(gameEl, wrap, cfg);
    if(cfg.engine==="slider") return mgSliderPremium(gameEl, wrap, cfg);
    if(cfg.engine==="quiz") return mgQuizPremium(gameEl, wrap, cfg);
    if(cfg.engine==="sort") return mgSortPremium(gameEl, wrap, { ...cfg, bins: cfg.bins || [{label:"Benar",color:cfg.color},{label:"Salah",color:"#6B7280"}], items: cfg.items || [{label:"Pilihan A",bin:0,icon:cfg.icon},{label:"Pilihan B",bin:1,icon:cfg.icon}] });
    if(cfg.engine==="tap") return mgTapPremium(gameEl, wrap, cfg);
    return mgQuizPremium(gameEl, wrap, cfg);
  }

  function dispatchGame(gameEl, total, done) {
    gameEl.innerHTML = `<div class="ops-mini"><div class="ops-serve" id="ops-serve">${icon("minion")}<span>LAYANI!</span></div><div class="ops-info">Terlayani: <b id="ops-served">0</b>/${total}</div></div>`;
    const serve = gameEl.querySelector("#ops-serve");
    const servedEl = gameEl.querySelector("#ops-served");
    let served = 0, round = 0, active = false, timer = null;
    const next = () => {
      if (round >= total) { done(served); return; }
      round++; active = true; serve.classList.add("live");
      let t = 0;
      timer = setInterval(() => {
        t += 60;
        if (t >= 850) { clearInterval(timer); active = false; serve.classList.remove("live"); next(); }
      }, 60);
    };
    serve.addEventListener("click", () => {
      if (!active) return;
      active = false; clearInterval(timer); serve.classList.remove("live");
      served++; servedEl.textContent = served; next();
    });
    next();
  }
  function containmentGame(gameEl, done) {
    const RUNES = [
      { c: "#ff6b4a", g: "✦" }, { c: "#4ab0ff", g: "❉" },
      { c: "#5be08a", g: "✺" }, { c: "#ffd24a", g: "❖" }
    ];
    gameEl.innerHTML = `<div class="ops-seal">
      <div class="ops-seal-top"><span class="ops-seal-title">SEGEL RUNE</span><span class="ops-seal-timer"><i id="seal-bar"></i></span></div>
      <div class="ops-seal-status" id="seal-status">Tonton urutan HQ...</div>
      <div class="ops-runes">${RUNES.map((r, i) => `<button class="rune" data-r="${i}" style="--rc:${r.c}">${r.g}</button>`).join("")}</div>
      <div class="ops-seal-dots" id="seal-dots"></div>
    </div>`;
    const statusEl = gameEl.querySelector("#seal-status");
    const barEl = gameEl.querySelector("#seal-bar");
    const dotsEl = gameEl.querySelector("#seal-dots");
    const runeEls = [...gameEl.querySelectorAll(".rune")];
    const TIME = 15000;
    let timeLeft = TIME, seals = 0, round = 0, seq = [], inputPos = 0, locked = true, ended = false, timer = null;
    const finish = (ok) => { if (ended) return; ended = true; if (timer) clearInterval(timer); done(ok); };
    const renderDots = () => { dotsEl.textContent = "Segel: " + "●".repeat(seals) + "○".repeat(3 - seals) + "  (" + seals + "/3)"; };
    const flash = (i, good) => { const el = runeEls[i]; el.classList.add(good ? "lit" : "bad"); setTimeout(() => el.classList.remove("lit", "bad"), 320); };
    const playback = () => {
      locked = true; statusEl.textContent = "Tonton urutan HQ...";
      let i = 0;
      const step = () => {
        if (i >= seq.length) { locked = false; statusEl.textContent = "Ulangi urutannya!"; return; }
        flash(seq[i], true); i++; setTimeout(step, 520);
      };
      setTimeout(step, 400);
    };
    const startRound = () => {
      round++; seq = []; inputPos = 0;
      const len = 2 + round;
      for (let k = 0; k < len; k++) seq.push(Math.floor(Math.random() * 4));
      renderDots(); playback();
    };
    runeEls.forEach(el => el.addEventListener("click", () => {
      if (locked || ended) return;
      const i = +el.dataset.r;
      if (seq[inputPos] === i) {
        flash(i, true); inputPos++;
        if (inputPos >= seq.length) {
          seals++; renderDots();
          if (seals >= 3) { statusEl.textContent = "TERSEGEL! Monster aman."; setTimeout(() => finish(true), 350); }
          else { statusEl.textContent = "Segel ke-" + seals + " berhasil!"; setTimeout(startRound, 650); }
        }
      } else {
        flash(i, false); timeLeft -= 2500; statusEl.textContent = "Salah! -2.5dtk, ulangi...";
        inputPos = 0; setTimeout(playback, 500);
      }
    }));
    timer = setInterval(() => {
      timeLeft -= 100; barEl.style.width = Math.max(0, (timeLeft / TIME) * 100) + "%";
      if (timeLeft <= 0) { statusEl.textContent = "Waktu habis — monster lepas!"; finish(false); }
    }, 100);
    startRound();
  }
  // ============ FASE 3: MINI-GAME PER JOB ============
  const COURIER_GIMMICKS = [
    { e: "🕳️", t: "Lubang jalan", a: "duck" }, { e: "🐉", t: "Naga nyamber", a: "lompat" },
    { e: "🌳", t: "Pohon tumbang", a: "kiri" }, { e: "🪨", t: "Batu jatuh", a: "kanan" },
    { e: "🔥", t: "Api neraka", a: "lompat" }, { e: "🧊", t: "Es licin", a: "duck" },
    { e: "👻", t: "Hantu jalan", a: "kiri" }, { e: "🦇", t: "Kelelawar", a: "duck" },
    { e: "💀", t: "Tengkorak", a: "kanan" }, { e: "⚡", t: "Petir", a: "duck" },
    { e: "🌪️", t: "Tornado", a: "lompat" }, { e: "🌫️", t: "Kabut tebal", a: "kiri" },
    { e: "🚧", t: "Pembatas", a: "kanan" }, { e: "🐺", t: "Serigala", a: "lompat" },
    { e: "🤖", t: "Robot HQ", a: "kiri" }, { e: "🌀", t: "Portal gaib", a: "kanan" },
    { e: "🐍", t: "Ular raksasa", a: "duck" }, { e: "🦅", t: "Burung raksasa", a: "lompat" },
    { e: "🧨", t: "Ledakan", a: "duck" }, { e: "🛑", t: "Lampu merah", a: "kiri" },
    { e: "💸", t: "Pencuri dompet", a: "kanan" }, { e: "🍄", t: "Jamur ajaib", a: "lompat" },
    { e: "🌋", t: "Lava", a: "lompat" }, { e: "❄️", t: "Badai salju", a: "duck" }
  ];
  const COOK_ING = [{ e: "🍞", t: "Roti" }, { e: "🥩", t: "Daging" }, { e: "🧀", t: "Keju" }, { e: "🥬", t: "Sayur" }, { e: "🍅", t: "Tomat" }, { e: "🍳", t: "Telur" }];
  const PACK_BINS = [{ c: "#ff6b6b", t: "Merah" }, { c: "#4ab0ff", t: "Biru" }, { c: "#ffd24a", t: "Kuning" }];
  function mgCourier(gameEl, done) {
    const ROUNDS = 12;
    gameEl.innerHTML = `<div class="mg-courier">
      <div class="mg-info">KURIR: hindari <b id="c-num">0</b>/${ROUNDS} rintangan!</div>
      <div class="mg-hazard" id="c-haz">🛵 Siap!</div>
      <div class="mg-react">
        <button class="react" data-a="kiri">⬅️ Kiri</button>
        <button class="react" data-a="duck">⬇️ Duck</button>
        <button class="react" data-a="lompat">⬆️ Lompat</button>
        <button class="react" data-a="kanan">➡️ Kanan</button>
      </div>
      <div class="mg-prog"><i id="c-bar"></i></div>
    </div>`;
    const haz = gameEl.querySelector("#c-haz"), numEl = gameEl.querySelector("#c-num"), bar = gameEl.querySelector("#c-bar");
    const reacts = [...gameEl.querySelectorAll(".react")];
    let round = 0, hits = 0, cur = null, locked = false, timer = null, ended = false;
    const finish = (sc) => { if (ended) return; ended = true; if (timer) clearInterval(timer); done(sc); };
    const next = () => {
      if (round >= ROUNDS) { finish(hits / ROUNDS); return; }
      round++; numEl.textContent = round; cur = COURIER_GIMMICKS[Math.floor(Math.random() * COURIER_GIMMICKS.length)];
      haz.textContent = cur.e + " " + cur.t; locked = false; let t = 0; bar.style.width = "100%";
      timer = setInterval(() => { t += 50; bar.style.width = Math.max(0, 100 - t / 9) + "%"; if (t >= 900) { clearInterval(timer); locked = true; next(); } }, 50);
    };
    reacts.forEach(b => b.addEventListener("click", () => {
      if (locked || ended || !cur) return;
      const ok = b.dataset.a === cur.a; locked = true; clearInterval(timer); haz.textContent = ok ? "✅" : "❌"; if (ok) hits++; next();
    }));
    next();
  }
  function mgCook(gameEl, done) {
    const ORDERS = 5;
    gameEl.innerHTML = `<div class="mg-cook">
      <div class="mg-info">DAPUR: selesaikan <b id="ck-num">0</b>/${ORDERS} pesanan!</div>
      <div class="mg-order" id="ck-order"></div>
      <div class="mg-ing" id="ck-ing"></div>
    </div>`;
    const numEl = gameEl.querySelector("#ck-num"), orderEl = gameEl.querySelector("#ck-order"), ingEl = gameEl.querySelector("#ck-ing");
    let order = 0, need = [], ended = false;
    const finish = (sc) => { if (ended) return; ended = true; done(sc); };
    const mk = () => { const n = 2 + Math.floor(Math.random() * 2); const a = []; for (let k = 0; k < n; k++) a.push(Math.floor(Math.random() * COOK_ING.length)); return a; };
    const nextOrder = () => { need = mk(); orderEl.innerHTML = "Pesan: " + need.map(i => COOK_ING[i].e).join(" + "); };
    ingEl.innerHTML = COOK_ING.map((x, i) => `<button class="ing" data-i="${i}">${x.e} ${x.t}</button>`).join("");
    ingEl.querySelectorAll(".ing").forEach(b => b.addEventListener("click", () => {
      if (ended || !need.length) return;
      if (+b.dataset.i === need[0]) { need.shift(); if (!need.length) { order++; numEl.textContent = order; if (order >= ORDERS) finish(1); else nextOrder(); } }
      else { nextOrder(); }
    }));
    nextOrder(); setTimeout(() => finish(order / ORDERS), 22000);
  }
  function mgDrink(gameEl, done) {
    const DRINKS = 3; let d = 0, hits = 0, ended = false, running = true, pos = 0, dir = 1, raf = null, zLo = 0, zHi = 0;
    gameEl.innerHTML = `<div class="mg-drink">
      <div class="mg-info">BAR: isi <b id="dr-num">0</b>/${DRINKS} gelas pas!</div>
      <div class="mg-gauge"><i id="dr-fill"></i><span class="mg-zone" id="dr-zone"></span></div>
      <button class="mg-pour" id="dr-pour">TUANG!</button>
    </div>`;
    const numEl = gameEl.querySelector("#dr-num"), fill = gameEl.querySelector("#dr-fill"), pour = gameEl.querySelector("#dr-pour"), zone = gameEl.querySelector("#dr-zone");
    const newZone = () => { zLo = 35 + Math.random() * 35; zHi = zLo + 22; zone.style.left = zLo + "%"; zone.style.width = (zHi - zLo) + "%"; };
    const loop = () => { if (!running) return; pos += dir * 1.8; if (pos >= 100) { pos = 100; dir = -1; } if (pos <= 0) { pos = 0; dir = 1; } fill.style.height = pos + "%"; raf = requestAnimationFrame(loop); };
    const nextDrink = () => { d++; numEl.textContent = d; if (d > DRINKS) { running = false; if (raf) cancelAnimationFrame(raf); done(hits / DRINKS); return; } pos = 0; dir = 1; newZone(); };
    pour.addEventListener("click", () => {
      if (!running || ended) return;
      if (pos >= zLo && pos <= zHi) hits++;
      running = false; if (raf) cancelAnimationFrame(raf);
      setTimeout(() => { running = true; nextDrink(); loop(); }, 500);
    });
    newZone(); loop();
  }
  function mgPack(gameEl, done) {
    const N = 10;
    gameEl.innerHTML = `<div class="mg-pack">
      <div class="mg-info">TOKO: sortir <b id="pk-num">0</b>/${N} paket!</div>
      <div class="mg-item" id="pk-item">📦</div>
      <div class="mg-bins">${PACK_BINS.map((b, i) => `<button class="bin" data-b="${i}" style="--bc:${b.c}">${b.t}</button>`).join("")}</div>
    </div>`;
    const numEl = gameEl.querySelector("#pk-num"), itemEl = gameEl.querySelector("#pk-item"), bins = [...gameEl.querySelectorAll(".bin")];
    let n = 0, hits = 0, cur = 0, ended = false;
    const finish = (sc) => { if (ended) return; ended = true; done(sc); };
    const next = () => { if (n >= N) { finish(hits / N); return; } n++; numEl.textContent = n; cur = Math.floor(Math.random() * 3); itemEl.textContent = ["📦", "🎁", "🛍️", "📯", "🗳️"][Math.floor(Math.random() * 5)]; };
    bins.forEach(b => b.addEventListener("click", () => { if (ended) return; if (+b.dataset.b === cur) hits++; next(); }));
    next();
  }
  function mgFinance(gameEl, done) {
    const N = 5; let n = 0, hits = 0, pos = 0, dir = 1, raf = null, running = true, ended = false, sLo = 0, sHi = 0;
    gameEl.innerHTML = `<div class="mg-fin">
      <div class="mg-info">KEUANGAN: stem pel pas di zona AMAN <b id="fn-num">0</b>/${N}!</div>
      <div class="mg-track"><span class="mg-safe" id="fn-safe"></span><i id="fn-mark"></i></div>
      <button class="mg-stamp" id="fn-stamp">STEMPEL!</button>
    </div>`;
    const numEl = gameEl.querySelector("#fn-num"), mark = gameEl.querySelector("#fn-mark"), safe = gameEl.querySelector("#fn-safe"), stamp = gameEl.querySelector("#fn-stamp");
    const newSafe = () => { sLo = 30 + Math.random() * 45; sHi = sLo + 20; safe.style.left = sLo + "%"; safe.style.width = (sHi - sLo) + "%"; };
    const loop = () => { if (!running) return; pos += dir * 2; if (pos >= 100) { pos = 100; dir = -1; } if (pos <= 0) { pos = 0; dir = 1; } mark.style.left = pos + "%"; raf = requestAnimationFrame(loop); };
    const next = () => { n++; numEl.textContent = n; if (n > N) { running = false; if (raf) cancelAnimationFrame(raf); done(hits / N); return; } newSafe(); };
    stamp.addEventListener("click", () => {
      if (!running || ended) return;
      if (pos >= sLo && pos <= sHi) hits++;
      running = false; if (raf) cancelAnimationFrame(raf);
      setTimeout(() => { running = true; next(); loop(); }, 400);
    });
    newSafe(); loop();
  }
  function playJobGame(mod, gameEl, done) {
    if (mod === "ride") return mgCourier(gameEl, done);
    if (mod === "food") return (Math.random() < 0.5 ? mgCook : mgDrink)(gameEl, done);
    if (mod === "mart" || mod === "toko") return mgPack(gameEl, done);
    if (mod === "pay") return mgFinance(gameEl, done);
    if (mod === "sec") return containmentGame(gameEl, done);
    return mgCourier(gameEl, done);
  }

  function runShift(screen, handlers) {
    const st = getState();
    const out = screen.querySelector("#hub-shift-out");
    if (!out) return;
    if ((st.hub.strikeWarned || 0) >= 3) { setEnding(HUB_REVOLT_ENDING); handlers.rerender(); return; }
    const mins = st.hub.minions || [];
    const a = st.hub.assigned || {};
    const stock = st.hub.stock || {};
    const ids = ["ride", "food", "toko", "sec"];
    const log = (txt, cls) => { const d = document.createElement("div"); d.className = "ops-msg " + (cls || ""); d.textContent = txt; out.appendChild(d); out.scrollTop = out.scrollHeight; };
    const enabled = st.hub.jobEnabled || { ride: true, food: true, toko: true, sec: true };
    const enabledIds = ids.filter(id => enabled[id]);
    if (enabledIds.length === 0) { log("Centang minimal 1 pekerjaan di papan pekerjaan.", "bad"); return; }
    const okAssign = enabledIds.every(s2 => a[s2] && mins.find(m => m.id === a[s2] && (m.stamina || 0) > 0));
    if (!okAssign) { log("Assign minion untuk setiap pekerjaan yang dicentang (stamina >0).", "bad"); return; }
    const activeIds = enabledIds.filter(s2 => { const m = mins.find(x => x.id === a[s2]); return m && (stock[s2] || 0) > 0; });
    if (activeIds.length === 0) { log("Semua job terpilih kehabisan stok! Restock dulu (atau tunggu hari baru).", "bad"); return; }
    const dir = HUB_DIRECTIVES[Math.floor(Math.random() * HUB_DIRECTIVES.length)];
    mutate(s2 => { s2.hub.directive = { id: dir.id, text: dir.text }; });
    const prodStations = activeIds.filter(s2 => ["ride", "food", "toko"].includes(s2));
    const secActive = activeIds.includes("sec");
    if (prodStations.length === 0) { log("Tidak ada stasiun produksi aktif (Ride/Food/Toko). Assign & restock dulu.", "bad"); return; }
    let skillSum = 0, moralSum = 0, cnt = 0;
    prodStations.forEach(s2 => { const m = mins.find(x => x.id === a[s2]); if (m) { skillSum += (m.skill[s2] || 0); moralSum += (m.morale || 0); cnt++; } });
    const avgMorale = cnt ? moralSum / cnt : 50;
    const stockMul = activeIds.length / ids.length;
    const baseVis = Math.round((st.hub.rating || 4) * 6 + skillSum * 4);
    const visitors = Math.max(2, Math.round(baseVis * (0.6 + 0.4 * (avgMorale / 100)) * (0.4 + 0.6 * stockMul)));
    const total = Math.min(12, visitors);
    const perStation = Math.max(1, Math.round(total / prodStations.length));
    log("Shift dimulai! " + dir.text, "info");
    log("Pengunjung ~" + visitors + " · job aktif: " + prodStations.map(s2 => STATION_LABEL[s2]).join(", ") + (secActive ? " + Keamanan" : ""), "info");
    const gameEl = document.createElement("div"); gameEl.id = "ops-game"; out.appendChild(gameEl);
    let served = 0;
    const runStation = (i) => {
      if (i >= prodStations.length) { finishShift(); return; }
      const stn = prodStations[i];
      const label = stn === "ride" ? "KURIR" : stn === "food" ? "DAPUR/BAR" : "TOKO";
      log("▶ " + label + ": main mini-game...", "info");
      playJobGame(stn, gameEl, (score) => {
        const got = Math.round(score * perStation);
        served += got;
        log(label + " hasil: " + got + " unit (" + Math.round(score * 100) + "%).", score > 0.5 ? "good" : "warn");
        runStation(i + 1);
      });
    };
    const finishShift = () => {
      let gold = Math.round(served * 6 * dir.goldMul);
      const incident = Math.random() < (0.35 + (dir.incBonus || 0) - (secActive ? 0.15 : 0));
      let incidentOk = false;
      const finish = () => {
        mutate(st2 => {
          st2.stats.gold += gold; st2.hub.earned += gold; st2.hub.dayEarned += gold;
          st2.hub.xp += served * 2; checkLevel(st2);
          activeIds.forEach(s2 => {
            if ((st2.hub.stock[s2] || 0) > 0) st2.hub.stock[s2] = clamp((st2.hub.stock[s2] || 0) - 1, 0, 99);
            const m = mins.find(x => x.id === a[s2]);
            if (m) { m.stamina = clamp((m.stamina || 100) - dir.stamCost, 0, 100); m.morale = clamp((m.morale || 70) - dir.moraleCost, 0, 100); }
          });
          st2.hub.rating = clamp((st2.hub.rating || 4) + (served >= total * 0.7 ? 0.1 : -0.05) * dir.ratingSwing, 0, 5);
          const avg = activeIds.reduce((s3, s4) => { const m = mins.find(x => x.id === a[s4]); return s3 + (m ? (m.morale || 0) : 0); }, 0) / Math.max(1, activeIds.length);
          if (avg < 20) { st2.hub.strikeWarned = (st2.hub.strikeWarned || 0) + 1; st2.hub.rating = clamp((st2.hub.rating || 4) - 0.3, 0, 5); }
          st2.hub.lastShift = { served, total, gold, incident, ok: incident ? incidentOk : false };
        });
        if (avgMorale < 20) log("⚠ Minion murung — morale rendah. Istirahatkan sebelum mereka mogok!", "warn");
        markHubExhaustion();
        if (checkHubGrind(handlers)) return;
        maybeHubEvent(handlers);
        handlers.rerender();
      };
      if (incident) {
        log("⚠ INSIDEN: monster lepas! Segel dengan rune!", "warn");
        containmentGame(gameEl, (ok) => {
          incidentOk = ok;
          if (ok) { gold += 20; mutate(s3 => { s3.stats.gold += 20; s3.hub.earned += 20; s3.hub.rating = clamp((s3.hub.rating || 4) + 0.05 * dir.ratingSwing, 0, 5); }); log("TERSEGEL! Bonus +20g & rating naik.", "good"); }
          else { mutate(s3 => { s3.hub.rating = clamp((s3.hub.rating || 4) - 0.2, 0, 5); }); log("Lolos! Rating turun.", "bad"); }
          finish();
        });
      } else { finish(); }
    };
    runStation(0);
  }
  const dungeonhub = (s) => {
   const tab = s.hub.tab || "ride";
   const rating = s.hub.rating;
   const lvl = s.hub.level || 1;
   const xp = s.hub.xp || 0;
   const xpNeed = 40 + lvl * 25;
   const energy = s.hub.energy == null ? 14 : s.hub.energy;
   const noEnergy = energy <= 0;
   const mult = 1 + (lvl - 1) * 0.12;
   const qLeft = 5 - (s.hub.questDone || 0);
   const tabs = HUB_MODULES.map(m =>
     `<button class="hub-tab ${m === tab ? "on" : ""}" data-hub="${m}">${icon(m === "ride" ? "rider" : m === "food" ? "food" : m === "mart" ? "store" : "wallet")}<span>${HUB_LABEL[m]}</span></button>`).join("");
   const acts = HUB_ACTIONS.filter(a => a.mod === tab).map(a =>
     `<button class="hub-act ${noEnergy ? "disabled" : ""}" data-act="${a.id}" ${noEnergy ? "disabled" : ""}>${a.label}</button>`).join("");
    const q = HUB_QUESTS[(s.hub.questIdx || 0) % HUB_QUESTS.length];
     const roster = rosterHtml(s);
     const assign = assignHtml(s);
     const stock = stockHtml(s);
     const jobBoard = jobBoardHtml(s);
     const directive = s.hub.directive ? `<div class="ops-dir">📡 ${s.hub.directive.text}</div>` : "";
     const lastShift = s.hub.lastShift ? `<div class="ops-last">Shift terakhir: layani <b>${s.hub.lastShift.served}</b>/${s.hub.lastShift.total}, +${s.hub.lastShift.gold}g${s.hub.lastShift.incident ? (s.hub.lastShift.ok ? " · segel +20g" : " · monster lolos -rating") : ""}</div>` : "";
    return {
    body: `
      <div class="hub-wrap">
      <p class="app-lead">DungeonHub - super-app dungeon. Jalankan bisnis beneran: energi harian ${energy}/14, HQ awasin cuanmu.</p>
       <div class="hub-top">
         <div class="hub-level">LV <b>${lvl}</b></div>
         <div class="hub-xpwrap"><div class="hub-xp"><span style="width:${clamp((xp / xpNeed) * 100, 0, 100)}%"></span></div><div class="hub-xptxt">${xp}/${xpNeed} XP · mult x${mult.toFixed(2)}</div></div>
       </div>
       <div class="hub-rating">Rating: <b>${rating.toFixed(1)}</b> - Total cuan: <b>${s.hub.earned}g</b>${s.hub.audit ? " - Audit: <b>" + s.hub.audit + "</b>" : ""}</div>
       <div class="hub-energibar">Energi: <b>${energy}</b>/14 ${noEnergy ? "<span class='warn'>HABIS - tunggu hari baru</span>" : ""}</div>
       <div class="hub-energybar"><i style="width:${clamp(energy / 14 * 100, 0, 100)}%"></i></div>
       <div class="hub-tabs">${tabs}</div>
       <div class="hub-quest">
         <div class="hub-quest-tag">QUEST</div>
         <div class="hub-quest-body">${q.t}</div>
         <button class="hub-quest-btn" data-act="quest">Ambil (+${q.g}g, +${q.xp}xp) · sisa ${qLeft}/5</button>
       </div>
         <div class="hub-actions">${acts}</div>
         <div id="hub-action-out" class="hub-shift-out"></div>
          <div class="hub-ops premium">
           <div class="hub-ops-head">${icon("shield")}<span>EVIL OPS · Produksi</span><span class="hub-ops-badge">PRODUCTION</span></div>
           <div class="hub-ops-sub">Pilih pekerjaan untuk shift berikutnya — hanya pekerjaan aktif yang menguras stamina & stok dan memainkan minigame-nya.</div>
           <div class="roster">${roster}</div>
           <div class="assign">${assign}</div>
           <div class="stock-head">STOK & RESTOCK (tiap shift habis 1/job aktif)</div>
           <div class="stock">${stock}</div>
           <div class="job-board-head">PAPAN PEKERJAAN — centang job yang mau dijalankan</div>
           <div class="job-board">${jobBoard}</div>
           <button class="action-btn hub-shift premium" id="hub-shift">${icon("bolt")}<span>Mulai Shift Terpilih</span></button>
           ${directive}
           <div id="hub-shift-out" class="hub-shift-out"></div>
           ${lastShift}
         </div>
        </div>`,
     mount(screen, state, handlers) {
       screen.querySelectorAll(".hub-tab").forEach(b => b.addEventListener("click", () => {
         Sound.tap(); mutate(st => { st.hub.tab = b.dataset.hub; }); handlers.rerender();
       }));
        screen.querySelectorAll(".hub-act").forEach(b => {
          if (b.disabled) return;
          b.addEventListener("click", () => {
            const a = HUB_ACTIONS.find(x => x.id === b.dataset.act);
            if (!a) return;
            Sound.tap();
            const energy = (getState().hub.energy == null ? 14 : getState().hub.energy);
            if (energy <= 0) { toast("Energi habis. Tunggu hari baru.", { ico: "bolt", cls: "toast-bad" }); return; }
            const aout = screen.querySelector("#hub-action-out");
            if (aout) aout.innerHTML = "";
            playActionGame(a.id, aout, (raw) => {
              const sc = clamp(raw, 0, 1);
              const isFail = sc < 0.5;
              let audited = false;
              mutate(st => {
                st.hub.energy = (st.hub.energy == null ? 14 : st.hub.energy) - 1;
                if (isFail) {
                  // anti-cheat: gagal = harus mikir, ada penalti nyata
                  st.stats.reputation = clamp(st.stats.reputation - 2, 0, 100);
                  st.stats.morale = clamp(st.stats.morale - 3, 0, 100);
                  st.hub.rating = clamp(st.hub.rating - 0.08, 0, 5);
                  toast("Gagal! " + a.label + " butuh jawaban benar — coba pahami tugasnya.", { ico: "skull", cls: "toast-bad" });
                }
                const base = a.run(st) || {};
                const r = {};
                for (const k in base) { const v = base[k]; r[k] = (typeof v === "number") ? (["g", "x", "loot", "rep", "hero", "union", "stab", "morale"].includes(k) ? Math.round(v * sc) : v * sc) : v; }
                if (r.g) { st.stats.gold += r.g; st.hub.earned += r.g; st.hub.dayEarned = (st.hub.dayEarned || 0) + r.g; }
                if (r.x) st.hub.xp += r.x;
                if (r.rep) st.stats.reputation = clamp(st.stats.reputation + r.rep, 0, 100);
                if (r.morale) st.stats.morale = clamp(st.stats.morale + r.morale, 0, 100);
                if (r.loot) st.stats.loot += r.loot;
                if (r.hero) shiftFac(st, "hero", r.hero);
                if (r.union) shiftFac(st, "serikat", r.union);
                if (r.stab) st.stats.stability = clamp(st.stats.stability + r.stab, 0, 100);
                if (r.rating) st.hub.rating = clamp(st.hub.rating + r.rating, 0, 5);
                checkLevel(st);
                if (!st.hub.auditedToday && (st.hub.dayEarned || 0) > 160) { auditPenalty(st); audited = true; }
              });
              if (aout) aout.innerHTML = `<div class="ops-msg ${isFail ? "bad" : sc > 0.75 ? "good" : "warn"}">${a.label}: ${isFail ? "GAGAL" : "BERHASIL"} ${Math.round(sc * 100)}% ${isFail ? "· penalti -rep -morale" : ""}</div>`;
              markHubExhaustion();
              if (checkHubGrind(handlers)) return;
              if (audited) {
                choiceModal("⚠ AUDIT HQ", `<p>Cuan terlalu mulus hari ini. HQ curiga & mengaudit.</p><p class="modal-satir">Kelebihan cuan di atas wajar dipajak, morale &amp; reputasi turun. Main fair, bos.</p>`, [{ label: "Siap, bos", run: () => {} }], () => handlers.rerender());
                return;
              }
              if (maybeHubEvent(handlers)) return;
              handlers.rerender();
            });
          });
       });
       const qb = screen.querySelector(".hub-quest-btn");
       if (qb) qb.addEventListener("click", () => {
         Sound.tap();
         let blocked = false, audited = false;
         mutate(st => {
           if ((st.hub.questDone || 0) >= 5) { blocked = true; return; }
           const qq = HUB_QUESTS[st.hub.questIdx || 0]; const g = Math.round(qq.g * (1 + (st.hub.level - 1) * 0.12));
           st.stats.gold += g; st.hub.earned += g; st.hub.xp += qq.xp; st.hub.dayEarned = (st.hub.dayEarned || 0) + g;
           st.hub.questDone = (st.hub.questDone || 0) + 1;
           st.hub.questIdx = ((st.hub.questIdx || 0) + 1) % HUB_QUESTS.length;
           checkLevel(st);
           if (!st.hub.auditedToday && (st.hub.dayEarned || 0) > 160) { auditPenalty(st); audited = true; }
         });
         if (blocked) { toast("Kuota quest harian habis (5/5). Coba besok, bos.", { ico: "coin", cls: "toast-bad" }); handlers.rerender(); return; }
         markHubExhaustion();
         if (checkHubGrind(handlers)) return;
         if (audited) {
           choiceModal("⚠ AUDIT HQ", `<p>Cuan terlalu mulus hari ini. HQ curiga & mengaudit.</p><p class="modal-satir">Kelebihan cuan di atas wajar dipajak, morale &amp; reputasi turun. Main fair, bos.</p>`, [{ label: "Siap, bos", run: () => {} }], () => handlers.rerender());
           return;
         }
          if (maybeHubEvent(handlers)) return;
          handlers.rerender();
        });
        screen.querySelectorAll(".assign-btn").forEach(b => b.addEventListener("click", () => {
          Sound.tap();
          mutate(st => { if (!st.hub.assigned) st.hub.assigned = {}; st.hub.assigned[b.dataset.station] = b.dataset.min; });
          handlers.rerender();
        }));
        screen.querySelectorAll(".restock-btn").forEach(b => b.addEventListener("click", () => {
          Sound.tap();
          let ok = false;
          mutate(st => { const c = 4; if (st.stats.gold >= c) { st.stats.gold -= c; st.hub.stock[b.dataset.stk] = clamp((st.hub.stock[b.dataset.stk] || 0) + 5, 0, 99); ok = true; } });
          if (!ok) toast("Gold kurang buat restock.", { ico: "coin", cls: "toast-bad" });
          handlers.rerender();
        }));
        screen.querySelectorAll("[data-job-toggle]").forEach(cb => cb.addEventListener("change", () => {
          Sound.tap();
          mutate(st => { if (!st.hub.jobEnabled) st.hub.jobEnabled = { ride: true, food: true, toko: true, sec: true }; st.hub.jobEnabled[cb.dataset.jobToggle] = cb.checked; });
          handlers.rerender();
        }));
        const shiftBtn = screen.querySelector("#hub-shift");
        if (shiftBtn) shiftBtn.addEventListener("click", () => { Sound.tap(); runShift(screen, handlers); });
      }
    };
  };
const HUB_QUESTS = [
  { t: "Antar naga ke Elf Forest (bayar nyawa)", g: 30, xp: 12 },
  { t: "Flash sale 'Bunuh naga diskon 90%'", g: 22, xp: 10 },
  { t: "Review palsu biar rating naik", g: 16, xp: 8 },
  { t: "Potong pajak loot adventurer", g: 26, xp: 11 },
  { t: "Kirim makanan beracun ke hero", g: 24, xp: 9 },
  { t: "Survei 'puas gak puas' (absurd)", g: 18, xp: 7 }
];

// ===================== TRAPMART (control + upgrade) =====================

export { dungeonhub };
