// App baru & rewrite: Toko Oren, CCTV, DungeonHub, TrapMart, HeroAlert, DungeonFeed,
// Flappy Bird, Slots (judi rigged) + ending Koplak. Semua override APP_VIEWS via NEW_VIEWS.
import { getState, mutate, addNotification, setEnding } from "../state.js";
import { HUB_ENDING } from "../content/endings.js";
import { icon, avatar } from "./icons.js";
import { Lib, Sound, rand } from "../lib.js";
import { toast } from "./toast.js";
import { staggerIn } from "./anim.js";
import { PHASE_LABELS } from "../config.js";
import { MEMES } from "./appScreen.js";
import { getCurrentNode, resolveText, chooseOption, advance } from "../engine.js";

function shiftFac(st, key, d) {
  if (!st.factions) return;
  st.factions[key] = Math.max(0, Math.min(100, (st.factions[key] || 0) + d));
}
function inv(st, id) { return st.inventory[id] || 0; }
function addInv(st, id, n = 1) { st.inventory[id] = (st.inventory[id] || 0) + n; }
function takeInv(st, id, n = 1) {
  const has = st.inventory[id] || 0;
  if (has < n) return false;
  st.inventory[id] = has - n;
  return true;
}
function randomMeme() {
  if (MEMES && MEMES.length) return MEMES[Math.floor(Math.random() * MEMES.length)];
  return "Dihina-hina saya diam, tapi di DungeonUnion ini saya katakan: SAYA AKAN LAWAN!";
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Modal pilihan (gimmick/event DungeonHub).
function choiceModal(title, html, choices, after) {
  const root = document.getElementById("phone") || document.body;
  const m = document.createElement("div");
  m.className = "modal-pop";
  const btns = choices.map((c, i) => `<button class="modal-choice" data-i="${i}">${c.label}</button>`).join("");
  m.innerHTML = `<div class="modal-card"><div class="modal-title">${title}</div><div class="modal-body">${html}</div><div class="modal-choices">${btns}</div></div>`;
  m.addEventListener("click", e => { if (e.target === m) m.remove(); });
  m.querySelectorAll(".modal-choice").forEach(b => b.addEventListener("click", () => {
    const c = choices[Number(b.dataset.i)];
    m.remove();
    if (c && c.run) c.run();
    if (after) after();
  }));
  root.appendChild(m);
  return m;
}

// ===================== TOKO OREN =====================
const TOKO_PRODUCTS = [
  { id: "trap_basic", name: "Trap Bawang", icon: "trapmart", price: 30, cheap: false, desc: "Jebakan klasik. Selalu jalan." },
  { id: "trap_spike", name: "Trap Duri", icon: "trapmart", price: 55, cheap: false, desc: "Nyiksa hero pelan-pelan, efek moral." },
  { id: "trap_illusion", name: "Trap Ilusi", icon: "trapmart", price: 80, cheap: false, desc: "Hero lupa tujuan hidup. Stabil naik." },
  { id: "potion_hp", name: "Potion HP", icon: "flask", price: 25, cheap: false, desc: "Pulihkan morale minion." },
  { id: "crystal", name: "Crystal Mana", icon: "magic", price: 40, cheap: false, desc: "Bahan sihir murni." },
  { id: "murah1", name: "Trap 'Murah Banget'", icon: "cart", price: 8, cheap: true, desc: "Murah? 50% rusak / tidak sesuai." },
  { id: "murah2", name: "Potion 'Promo 1+1'", icon: "cart", price: 12, cheap: true, desc: "Kadang isinya air keran." },
  { id: "murah3", name: "Crystal 'Kw Super'", icon: "cart", price: 15, cheap: true, desc: "Bersinar, tapi kosong." }
];

const tokooren = (s) => {
  const cctvOwned = s.apps.cctv;
  const body = `
    <p class="app-lead">Toko Oren — marketplace dungeon. Harga murah? Waspadalah: barang murahan 50% rusak/tidak sesuai. Trap & item beli di sini, pasang di TrapMart.</p>
    <div class="tok-banner">Toko Oren - "Harga murah, kualitas... nanti kami lihat."</div>
    <div class="tok-grid">${TOKO_PRODUCTS.map(p => `
      <div class="tok-card ${p.cheap ? "cheap" : ""}">
        <div class="tok-emoji">${icon(p.icon)}</div>
        <div class="tok-name">${p.name}</div>
        <div class="tok-desc">${p.desc}</div>
        <div class="tok-foot"><span class="tok-price">${p.price}g</span><button class="tok-buy" data-buy="${p.id}">Beli</button></div>
        ${inv(s, p.id) ? `<div class="tok-owned">dimiliki: ${inv(s, p.id)}</div>` : ""}
      </div>`).join("")}</div>
    <div class="tok-svc">
      <div class="tok-svc-ico">${icon("cctv")}</div>
      <div class="tok-svc-info"><div class="tok-svc-name">CCTV Pro</div><div class="tok-svc-desc">Pantau hero &amp; pekerja. Wajib sebelum dipakai.</div></div>
      ${cctvOwned
        ? `<span class="tok-owned">OWNED</span>`
        : `<button class="tok-buy tok-buy-svc" data-buy="cctv">150g</button>`}
    </div>`;
  return {
    body,
    mount(screen, state, handlers) {
      screen.querySelectorAll(".tok-buy").forEach(b => b.addEventListener("click", () => {
        const id = b.dataset.buy;
        Sound.tap();
        if (id === "cctv") {
          mutate(st => {
            if (st.apps.cctv) return;
            if (st.stats.gold < 150) { toast("Gold tidak cukup untuk CCTV (butuh 150g).", { ico: "coin", cls: "toast-bad" }); return; }
            st.stats.gold -= 150; st.apps.cctv = true;
            addNotification("cctv", "CCTV Terpasang", "Kamu kini bisa memantau dungeon. Buka app CCTV.");
          });
          handlers.rerender();
          return;
        }
        const p = TOKO_PRODUCTS.find(x => x.id === id);
        mutate(st => {
          if (st.stats.gold < p.price) { toast("Gold tidak cukup untuk " + p.name, { ico: "coin", cls: "toast-bad" }); return; }
          st.stats.gold -= p.price; st.tokooren.bought++;
          if (p.cheap && Math.random() < 0.5) { st.tokooren.broken++; toast(p.name + " rusak/tidak sesuai! Gold hangus.", { ico: "cart", cls: "toast-bad" }); }
          else { addInv(st, p.id, 1); toast(p.name + " dibeli & masuk inventori.", { ico: "cart", cls: "toast-good" }); }
        });
        handlers.rerender();
      }));
    }
  };
};

// ===================== CCTV (scan limit + fun, bukan ladang gold) =====================
const CCTV_FEEDS = [
  { name: "Lorong Utara", threat: "hero" },
  { name: "Brankas HQ", threat: "aman" },
  { name: "Dapur Minion", threat: "makan" },
  { name: "Pintu Rahasia", threat: "hero" }
];
const CCTV_SCENES = [
  { t: "Hero Brave-X terlihat mengintip brankas. Siapkan trap.", intel: 1 },
  { t: "Minion Bob tidur saat jam kerja. Didenda potong morale.", morale: -6 },
  { t: "Kotak item #2 kosong - ada yang mencuri! Lapor HQ.", box: true },
  { t: "Hero Saint-E memberi tips ke goblin. Sindiran terdengar.", intel: 1 },
  { t: "Grem ternyata main roblox di jam kerja. Lucu, tapi catat.", intel: 1 },
  { t: "Lorong utara sepi. Trap bekerja otomatis, +loot.", loot: 8 },
  { t: "Hero menyelinap lewat ventilasi. CCTV nangkap momen.", intel: 1 },
  { t: "Kamera #3 mati sebentar - bukan karena diganggu, katanya.", intel: 0 }
];
const CCTV_ANOMALY = [
  "Kamera nangkap goblin lagi nari gemoy di depan brankas. Dia tahu dia diawasi.",
  "Layar berkedip: ada teks 'SERIKAT MEMINTA KAMERA DIMATIKAN'. Lucu, tapi sedikit menyeramkan.",
  "CCTV merekam hero yang JUSTRU membantu minion angkat koper. Plot twist harian.",
  "Seekor bawang raksasa lewat di koridor. Bukan anomali. Mungkin bos lama."
];
const cctv = (s) => {
  const scans = s.cctv.scans || 0;
  const noScan = scans <= 0;
  const logs = (s.cctv.logs || []).slice(0, 6).map(l =>
    `<div class="cctv-log"><span class="cctv-dot"></span>${l}</div>`).join("") ||
    `<div class="cctv-log muted">Belum ada rekaman. Pantau (ada batas scan harian).</div>`;
  const times = ["23:41:07", "23:41:12", "23:41:19", "23:41:23"];
  const feeds = CCTV_FEEDS.map((f, i) => {
    const cls = f.threat === "hero" ? "hot" : (f.threat === "makan" ? "warn" : "ok");
    return `<div class="cctv-mon ${cls}">
      <div class="cctv-mon-top"><span>CAM 0${i + 1}</span><span class="cctv-mon-live">● LIVE</span></div>
      <div class="cctv-mon-scene">
        <div class="cctv-mon-floor"></div>
        <div class="cctv-mon-blip"></div>
        <div class="cctv-mon-label">${f.name}</div>
      </div>
      <div class="cctv-mon-bot"><span>${f.threat === "hero" ? "DETEKSI HERO" : f.threat === "makan" ? "AKTIVITAS" : "AMAN"}</span><span class="cctv-mon-time">${times[i] || "23:41:00"}</span></div>
      <div class="cctv-scanline2"></div>
    </div>`;
  }).join("");
  return {
    body: `
      <p class="app-lead">CCTV DungeonOS Inc. - pantau hero, awasi pekerja, cek kotak item. Bukan sumber gold: batas scan harian ${scans}/6.</p>
      <div class="cctv-cam-unit">
        <div class="cctv-cam-body">
          <div class="cctv-lens"><span class="cctv-lens-glare"></span></div>
          <div class="cctv-cam-info"><span class="cctv-rec">● REC</span><span class="cctv-cam-id">CTRL-01</span></div>
        </div>
        <div class="cctv-mount"></div>
      </div>
      <div class="cctv-feeds">${feeds}</div>
      <div class="cctv-statbar">Kotak item: <b>${s.cctv.boxes}</b> · Dipantau: <b>${s.cctv.watched}</b>x · Intel: <b>${s.cctv.intel || 0}</b> · Scan: <b>${scans}</b></div>
      <div class="cctv-logs">${logs}</div>
      <button class="action-btn cctv-pantau" id="cctv-pantau" ${noScan ? "disabled" : ""}>${icon("cctv")}<span>${noScan ? "Scan habis (coba hari baru)" : "Pantau Sekarang"}</span></button>`,
    mount(screen, state, handlers) {
      const btn = screen.querySelector("#cctv-pantau");
      if (btn && !noScan) btn.addEventListener("click", () => {
        Sound.tap();
        let anom = false;
        mutate(st => {
          if ((st.cctv.scans || 0) <= 0) return;
          st.cctv.scans--; st.cctv.watched++;
          const sc = CCTV_SCENES[Math.floor(Math.random() * CCTV_SCENES.length)];
          if (sc.box) st.cctv.boxes = Math.max(0, st.cctv.boxes - 1);
          st.cctv.logs.unshift("[" + st.cctv.watched + "] " + sc.t);
          if (Math.random() < 0.35) { const g = 4 + Math.floor(Math.random() * 8); st.stats.gold += g; st.flags.lastIncome = (st.flags.lastIncome || 0) + g; }
          else { st.cctv.intel = (st.cctv.intel || 0) + (sc.intel || 0); }
          if (sc.morale) st.stats.morale = Math.max(0, Math.min(100, st.stats.morale + sc.morale));
          if (sc.loot) st.stats.loot += sc.loot;
          if (Math.random() < 0.2) anom = true;
        });
        if (anom) {
          const txt = CCTV_ANOMALY[Math.floor(Math.random() * CCTV_ANOMALY.length)];
          choiceModal("ANOMALI CCTV 👁️", `<p>${txt}</p><p class="modal-satir">Catatan: ini bukan gold. Ini cuma hiburan. Jangan jadiin CCTV ladang curang.</p>`, [{ label: "Tutup", run: () => {} }], () => handlers.rerender());
          return;
        }
        handlers.rerender();
      });
    }
  };
};

// ===================== DUNGEONHUB (bisnis beneran: ~30 mekanisme + rebalance) =====================
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
           let audited = false;
           mutate(st => {
             if ((st.hub.energy == null ? 14 : st.hub.energy) <= 0) return;
             st.hub.energy = (st.hub.energy == null ? 14 : st.hub.energy) - 1;
             const r = a.run(st) || {};
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
const TRAP_NAMES = { trap_basic: "Trap Bawang", trap_spike: "Trap Duri", trap_illusion: "Trap Ilusi" };
const trapmart = (s) => {
  const lvl = s.trapmart.level || 1;
  const auto = s.trapmart.auto;
  const owned = Object.keys(s.inventory).filter(k => k.startsWith("trap_") && inv(s, k) > 0);
  const slots = [0, 1, 2].map(i => {
    const id = s.trapmart.slots[i];
    if (id) {
      return `<div class="trap-slot filled"><div class="trap-slot-ico">${icon("trapmart")}</div><div class="trap-slot-name">${TRAP_NAMES[id] || id}</div><button class="trap-unset" data-unset="${i}">Lepas</button></div>`;
    }
    const opts = owned.length ? owned.map(k => `<button class="trap-set" data-slot="${i}" data-trap="${k}">${TRAP_NAMES[k] || k} (${inv(s, k)})</button>`).join("") : `<span class="muted">Beli trap di Toko Oren.</span>`;
    return `<div class="trap-slot"><div class="trap-slot-ico dim">${icon("trapmart")}</div><div class="trap-slot-name">Slot ${i + 1} kosong</div><div class="trap-slot-opts">${opts}</div></div>`;
  }).join("");
  return {
    body: `
      <p class="app-lead">TrapMart - ruang kendali jebakan. Pasang, upgrade, &amp; auto-defense.</p>
      <div class="trap-delivery">Delivery: pesan trap dari Toko Oren, tiba tanpa kamu gerak.</div>
      <div class="trap-upgrade">
        <div class="trap-up-info">Trap Lv <b>${lvl}</b> - efek +${(lvl - 1) * 12}% stabil/loot</div>
        <button class="trap-up-btn" data-up="1">${icon("upgrade")} Upgrade (${40 + lvl * 20}g)</button>
      </div>
      <div class="trap-auto ${auto ? "on" : ""}">
        <div><b>Auto-Defense</b><br><span class="muted">Pasif +loot tiap hari</span></div>
        <button class="trap-auto-btn" data-auto="1">${auto ? "ON" : "OFF"}</button>
      </div>
      <div class="trap-slots">${slots}</div>
      <div class="trap-cctv-row"><button class="trap-cctv" data-cctv="1">${icon("cctv")} Buka CCTV</button></div>`,
    mount(screen, state, handlers) {
      screen.querySelectorAll(".trap-set").forEach(b => b.addEventListener("click", () => {
        Sound.tap();
        const i = Number(b.dataset.slot), id = b.dataset.trap;
        mutate(st => {
          if (!takeInv(st, id, 1)) { toast("Trap habis.", { ico: "trapmart", cls: "toast-bad" }); return; }
          st.trapmart.slots[i] = id;
          const l = st.trapmart.level || 1;
          st.stats.stability = Math.min(100, st.stats.stability + 6 + (l - 1) * 2); st.stats.loot += 8;
          toast((TRAP_NAMES[id] || id) + " dipasang! +stabilitas, +loot.", { ico: "trapmart", cls: "toast-good" });
        });
        handlers.rerender();
      }));
      screen.querySelectorAll(".trap-unset").forEach(b => b.addEventListener("click", () => {
        Sound.tap();
        const i = Number(b.dataset.unset);
        mutate(st => { const id = st.trapmart.slots[i]; if (id) { addInv(st, id, 1); st.trapmart.slots[i] = null; } });
        handlers.rerender();
      }));
      const up = screen.querySelector(".trap-up-btn");
      if (up) up.addEventListener("click", () => {
        Sound.tap();
        mutate(st => {
          const cost = 40 + (st.trapmart.level || 1) * 20;
          if (st.stats.gold < cost) { toast("Gold kurang untuk upgrade (" + cost + "g).", { ico: "coin", cls: "toast-bad" }); return; }
          st.stats.gold -= cost; st.trapmart.level = (st.trapmart.level || 1) + 1;
          toast("Trap naik ke Lv " + st.trapmart.level + "!", { ico: "upgrade", cls: "toast-good" });
        });
        handlers.rerender();
      });
      const autoBtn = screen.querySelector(".trap-auto-btn");
      if (autoBtn) autoBtn.addEventListener("click", () => {
        Sound.tap();
        mutate(st => { st.trapmart.auto = !st.trapmart.auto; });
        toast(st.trapmart.auto ? "Auto-Defense ON." : "Auto-Defense OFF.", { ico: "trapmart" });
        handlers.rerender();
      });
      const c = screen.querySelector(".trap-cctv");
      if (c) c.addEventListener("click", () => { Sound.tap(); handlers.openApp("cctv"); });
    }
  };
};

// ===================== HEROALERT (radar + SERGAP + interogasi + LEVEL) =====================
const HERO_LIST = [
  { id: "brave", name: "Brave-X", meta: "Lv 9 - lorong utara", blip: "#FF5E7A", threat: 70 },
  { id: "saint", name: "Saint-E", meta: "Lv 8 - lorong timur", blip: "#FFD86B", threat: 55 },
  { id: "lance", name: "Lance-O", meta: "Lv 7 - lorong selatan", blip: "#34E7E4", threat: 45 }
];
const HERO_LEVELS = [
  { id: 1, name: "Mudah", spd: 4, rew: 20, pen: 4 },
  { id: 2, name: "Normal", spd: 6.5, rew: 30, pen: 8 },
  { id: 3, name: "Susah", spd: 10, rew: 44, pen: 14 }
];
const heroalert = (s) => {
  const lvl = s.heroalert.level || 2;
  const threat = s.stats.stability < 40 ? "TINGGI" : (s.stats.stability < 65 ? "sedang" : "rendah");
  const heroes = HERO_LIST.map(h => ({ ...h, name: (h.id === "brave" && s.flags.secretHero) ? "??? (misterius)" : h.name }));
  const heroCards = heroes.map(h => `
    <div class="hero-card" data-hero="${h.id}">
      <div class="hero-blip" style="background:${h.blip};box-shadow:0 0 12px ${h.blip}"></div>
      <div class="hero-info"><div class="hero-name">${h.name}</div><div class="hero-meta">${h.meta} - ancaman ${h.threat}</div></div>
      <button class="hero-ambush" data-ambush="${h.id}">SERGAP</button>
    </div>`).join("");
  const lvBtns = HERO_LEVELS.map(L => `<button class="hero-lvl ${L.id === lvl ? "on" : ""}" data-lvl="${L.id}">${L.name}</button>`).join("");
  return {
    meta: {
      alert: { label: "Siagakan (30g)", icon: "heroalert", cost: 30, note: "Trap disiagakan. Hero hati-hati.", run: st => { st.stats.stability += 8; st.stats.loot += 10; } },
      bribe: { label: "Suap hero (70g)", icon: "coin", cost: 70, note: "Hero dibujuk. Tapi ini... curang?", run: st => { st.stats.morale -= 2; st.stats.loot += 20; st.flags.exploit = true; } },
      ignore: { label: "Abaikan", icon: "skull", note: "Hero lewat. Loot kau jual (+12 gold).", run: st => { st.stats.gold += 12; st.stats.loot += 8; st.stats.morale -= 4; } }
    },
    body: `
      <p class="app-lead">HeroAlert - radar real-time, mini-game SERGAP, &amp; interogasi timing. Pilih LEVEL: makin tinggi, hadiah &amp; risiko makin besar.</p>
      <div class="hero-lvl-row">Level Tangkap: ${lvBtns}</div>
      <div class="radar" id="radar">
        <div class="radar-ring"></div>
        <div class="radar-sweep" id="radar-sweep"></div>
        ${heroes.map((h, i) => `<div class="radar-blip" style="left:${30 + i * 22}%;top:${40 + (i % 2) * 28}%"></div>`).join("")}
        <button class="radar-scan" id="radar-scan" type="button">Pindai</button>
      </div>
      <div class="threat-gauge"><span class="threat-label">Ancaman</span>
        <div class="threat-bar"><span class="${threat === "TINGGI" ? "bad" : threat === "sedang" ? "mid" : "good"}" style="width:${threat === "TINGGI" ? 92 : threat === "sedang" ? 60 : 32}%"></span></div>
        <b class="threat-val ${threat === "TINGGI" ? "bad" : threat === "sedang" ? "mid" : "good"}">${threat}</b></div>
      <div class="hero-list">${heroCards}</div>
      <div id="interogasi" class="interogasi"></div>
      <div id="hero-game-mount"></div>
      <p class="quip">"Kami datang menyelamatkan desa!" - hero, lalu menjarah brankasmu.</p>`,
    mount(screen, state, handlers) {
      const sweep = screen.querySelector("#radar-sweep");
      const scan = screen.querySelector("#radar-scan");
      if (scan && sweep) scan.addEventListener("click", () => {
        sweep.style.animationDuration = "0.8s"; Sound.tap();
        toast("Memindai lorong...", { ico: "heroalert", cls: "toast-info" });
        setTimeout(() => { sweep.style.animationDuration = ""; }, 1600);
      });
      screen.querySelectorAll(".hero-lvl").forEach(b => b.addEventListener("click", () => {
        Sound.tap(); mutate(st => { st.heroalert.level = Number(b.dataset.lvl); }); handlers.rerender();
      }));
      const ig = screen.querySelector("#interogasi");
      screen.querySelectorAll(".hero-ambush").forEach(b => b.addEventListener("click", () => {
        const h = heroes.find(x => x.id === b.dataset.ambush);
        startHeroGame(screen, state, handlers, h);
      }));
      screen.querySelectorAll(".hero-card").forEach(card => card.addEventListener("click", () => {
        const h = heroes.find(x => x.id === card.dataset.hero);
        startInterogasi(ig, state, handlers, h);
      }));
    }
  };
};

function startHeroGame(screen, state, handlers, h) {
  const mount = screen.querySelector("#hero-game-mount");
  if (!mount) return;
  const L = HERO_LEVELS.find(x => x.id === (getState().heroalert.level || 2)) || HERO_LEVELS[1];
  mount.innerHTML = `
    <div class="hero-game">
      <div class="hg-title">SERGAP ${h.name} [${L.name}] - klik dia 5x sebelum kabur!</div>
      <div class="hg-arena" id="hg-arena"><div class="hg-target" id="hg-target">${icon("heroCrest")}</div></div>
      <div class="hg-score">Tangkap: <b id="hg-count">0</b>/5 · Hadiah ~${L.rew + Math.floor(h.threat / 4)}g</div>
    </div>`;
  const arena = mount.querySelector("#hg-arena");
  const target = mount.querySelector("#hg-target");
  const countEl = mount.querySelector("#hg-count");
  let count = 0, escaped = false, raf = null, pos = { x: 50, y: 50 };
  const sp = [0, 2.2, 3.6, 5][L.id];
  const vel = { x: sp, y: sp * 0.7 };
  const move = () => {
    if (!arena.isConnected) { cancelAnimationFrame(raf); return; }
    if (escaped) return;
    pos.x += vel.x; pos.y += vel.y;
    if (pos.x < 8 || pos.x > 92) vel.x *= -1;
    if (pos.y < 10 || pos.y > 86) vel.y *= -1;
    target.style.left = pos.x + "%"; target.style.top = pos.y + "%";
    raf = requestAnimationFrame(move);
  };
  move();
  const onClick = () => {
    if (escaped) return;
    count++; countEl.textContent = count; Sound.blip();
    if (count >= 5) {
      escaped = true; cancelAnimationFrame(raf);
      const reward = L.rew + Math.floor(h.threat / 4);
      mutate(st => { st.stats.gold += reward; st.stats.loot += 8; shiftFac(st, "hero", -8); });
      mount.innerHTML = `<div class="inter-result good">${h.name} tertangkap! +${reward} gold, hero capai.</div>`;
      handlers.rerender(); return;
    }
    pos.x = 10 + Math.random() * 80; pos.y = 12 + Math.random() * 72;
  };
  target.addEventListener("click", onClick);
  const limit = [0, 13000, 10000, 7500][L.id];
  const t = setTimeout(() => {
    if (!escaped && arena.isConnected) {
      escaped = true; cancelAnimationFrame(raf);
      mutate(st => { st.stats.morale = Math.max(0, st.stats.morale - L.pen); shiftFac(st, "hero", 5); });
      mount.innerHTML = `<div class="inter-result bad">${h.name} kabur! Moral -${L.pen}, hero makin pede.</div>`;
    }
  }, limit);
}

 function startInterogasi(panel, state, handlers, h) {
   if (!panel) return;
   const L = HERO_LEVELS.find(x => x.id === (getState().heroalert.level || 2)) || HERO_LEVELS[1];
   const lo = [0, 33, 38, 43][L.id], hi = [0, 72, 66, 60][L.id];
   const speed = [0, 1.6, 2.2, 2.9][L.id];
   panel.innerHTML = `
     <div class="intero">
       <div class="intero-title">INTEROGASI ${h.name} [${L.name}]</div>
       <div class="intero-bar"><div class="intero-zone" style="left:${lo}%;width:${hi - lo}%"></div><div class="intero-cursor" id="intero-cursor"></div></div>
       <button class="intero-btn" id="intero-btn">TEKAN DI ZONA HIJAU</button>
     </div>`;
   const cursor = panel.querySelector("#intero-cursor");
   const btn = panel.querySelector("#intero-btn");
   let pos = 0, dir = 1, stopped = false, raf;
   const tick = () => {
     if (!cursor.isConnected) { cancelAnimationFrame(raf); return; }
     pos += dir * speed; if (pos > 100 || pos < 0) { dir *= -1; pos = clamp(pos, 0, 100); }
     cursor.style.left = pos + "%";
     raf = requestAnimationFrame(tick);
   };
   tick();
   btn.addEventListener("click", () => {
     if (stopped) return; stopped = true; cancelAnimationFrame(raf);
     const bar = cursor.parentElement;
     const barRect = bar.getBoundingClientRect();
     const curRect = cursor.getBoundingClientRect();
     const curCenter = (curRect.left + curRect.right) / 2 - barRect.left;
     const zone = bar.querySelector(".intero-zone").getBoundingClientRect();
     const inZone = (curCenter >= zone.left - barRect.left) && (curCenter <= zone.right - barRect.left);
     if (inZone) {
       const g = 18 + L.id * 6; mutate(st => { st.stats.gold += g; st.stats.loot += 10; st.flags.intelHero = (st.flags.intelHero || 0) + 1; });
       panel.innerHTML = `<div class="inter-result good">Timing sempurna! ${h.name} bicara: +${g}g, +intel.</div>`;
     } else {
       mutate(st => { st.stats.morale = Math.max(0, st.stats.morale - 3); });
       panel.innerHTML = `<div class="inter-result bad">Melenceng! ${h.name} tutup mulut. Moral -3.</div>`;
     }
   });
 }

// ===================== FLAPPY BIRD =====================
const flappy = (s) => ({
  body: `
    <p class="app-lead">Flappy Dungeon - ketuk untuk terbang, hindari pipa bawang. Skor = gold (maks +25/putaran)!</p>
    <div class="flap-wrap"><canvas class="flap-canvas" id="flap"></canvas>
      <div class="flap-hud">Best: <b>${s.flappy.best || 0}</b></div>
    </div>
    <button class="action-btn flap-start" id="flap-start">${icon("bolt")}<span>Mulai / Ketuk</span></button>`,
  mount(screen, state, handlers) {
    const cv = screen.querySelector("#flap"); if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.clientWidth || 320, H = 360; cv.width = W; cv.height = H;
    let bird = { y: H / 2, v: 0 }, pipes = [], score = 0, run = false, over = false, raf, spawnT = 0;
    const G = 0.42, FLAP = -7, PW = 54, GAP = 130;
    function reset() { bird = { y: H / 2, v: 0 }; pipes = [{ x: W + 40, gap: rand(60, H - 60 - GAP) }]; score = 0; over = false; }
    function flap() { if (!run) { run = true; reset(); } if (over) { run = false; over = false; reset(); run = true; return; } bird.v = FLAP; Sound.blip(); }
    function loop() {
      if (!cv.isConnected) { cancelAnimationFrame(raf); return; }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0c0820"; ctx.fillRect(0, 0, W, H);
      bird.v += G; bird.y += bird.v;
      if (bird.y > H - 16 || bird.y < 0) { die(); }
      if (run && !over) {
        spawnT--; if (spawnT <= 0) { pipes.push({ x: W + 20, gap: rand(60, H - 60 - GAP) }); spawnT = 95; }
        for (const p of pipes) p.x -= 2.2;
        for (const p of pipes) {
          if (!p.passed && p.x + PW < 40) { p.passed = true; score++; Sound.tap(); }
          if (40 < p.x + PW && p.x < 40 + 24 && (bird.y < p.gap || bird.y > p.gap + GAP)) die();
        }
        pipes = pipes.filter(p => p.x > -PW);
      }
      ctx.fillStyle = "#FFD86B"; ctx.beginPath(); ctx.arc(40, bird.y, 11, 0, 7); ctx.fill();
      ctx.fillStyle = "#34E7E4";
      for (const p of pipes) { ctx.fillRect(p.x, 0, PW, p.gap); ctx.fillRect(p.x, p.gap + GAP, PW, H - p.gap - GAP); }
      ctx.fillStyle = "#fff"; ctx.font = "bold 20px sans-serif"; ctx.fillText("" + score, 12, 26);
      raf = requestAnimationFrame(loop);
    }
    function die() {
      if (over) return; over = true; run = false;
      mutate(st => { const best = st.flappy.best || 0; if (score > best) st.flappy.best = score; const g = Math.min(25, Math.floor(score / 2)); st.stats.gold += g; st.flags.lastIncome = (st.flags.lastIncome || 0) + g; });
      const g = Math.min(25, Math.floor(score / 2));
      toast("Game over! Skor " + score + " -> +" + g + "g", { ico: "coin", cls: g > 0 ? "toast-good" : "" });
      handlers.rerender();
    }
    cv.addEventListener("pointerdown", flap);
    const btn = screen.querySelector("#flap-start");
    if (btn) btn.addEventListener("click", (e) => { e.stopPropagation(); flap(); });
    reset(); loop();
  }
});

// ===================== SLOTS (judi RIGGED + koplak ending) =====================
// Simbol punya nilai: 3 SAMA = menang, besaran x simbol. Jadi icon jadi berarti.
const SLOTS_SYM = [
  { e: "⚔️", name: "Pedang",  mult: 3 },
  { e: "💎", name: "Berlian", mult: 12 },
  { e: "🐉", name: "Naga",    mult: 8 },
  { e: "🧅", name: "Bawang",  mult: 3 },
  { e: "💰", name: "Dompet",  mult: 5 },
  { e: "🔥", name: "Api",     mult: 10 },
];
const _randSym = () => Math.floor(Math.random() * SLOTS_SYM.length);
const _pickHigh = () => [1, 2, 5][Math.floor(Math.random() * 3)]; // berlian / naga / api (gacor)
const _pickLow = () => [0, 3, 4][Math.floor(Math.random() * 3)];  // pedang / bawang / dompet (ciut)
function _distinct3() {
  const a = _randSym(); let b = _randSym(); while (b === a) b = _randSym();
  let c = _randSym(); while (c === a || c === b) c = _randSym();
  return [a, b, c];
}
// taruhan dalam chip: mode angka = x10, "all" = ALL-IN (saldo penuh)
const _betCost = (mode, balance) => mode === "all" ? balance : (Number(mode) || 1) * 10;
const KOPLAK_ENDING = {
  tone: "koplak",
  title: "ENDING KOPLAK: LU MAIN JUDI PAKE GOLD DUNGEON?",
  tag: "Class Koplak - rating 0/10, tapi bikin ketawa",
  body: [
    "Wah, gila. Bos dungeon nyata-nyata main slot pakai gold yang sebenernya milik minion.",
    "Sekarang dompet kosong, brankas kosong, dan minion lagi ngejar lu bawa sapu.",
    "LU PANTAS DIGEBURIN. Otak udang, nasib udang, akhirnya jadi bahan meme bawah tanah.",
    "Tapi tenang, setidaknya lu hibur kita semua. Makasih ya, badut dungeon."
  ]
};
const judi = (s) => {
  const bal = s.slots.balance || 0;
  const betMode = s.slots.bet || 1;
  const cost = _betCost(betMode, bal);
  const costLabel = betMode === "all" ? "ALL-IN" : (cost + "c");
  const topAll = s.stats.gold * 2;
  return {
    body: `
      <p class="app-lead">DungeonSlots - mesin slot bawah tanah. 3 simbol SAMA = jackpot! (DevConsole: /slotgacor)</p>
      <div class="slot-bal">Saldo: <b>${bal}</b> chip · Gold: <b>${s.stats.gold}</b>g · Best: <b>${s.slots.best || 0}</b></div>
      <div class="slot-machine">
        <div class="slot-reel" id="slot-r0">${SLOTS_SYM[0].e}</div>
        <div class="slot-reel" id="slot-r1">${SLOTS_SYM[1].e}</div>
        <div class="slot-reel" id="slot-r2">${SLOTS_SYM[2].e}</div>
      </div>
      <div class="slot-msg" id="slot-msg">Pilih taruhan, lalu Spin.</div>
      <div class="slot-bet">
        <span class="slot-bet-label">Taruhan:</span>
        ${[1, 2, 5, 10].map(m => `<button class="bet-btn ${betMode === m ? "on" : ""}" data-bet="${m}">${m}x</button>`).join("")}
        <button class="bet-btn ${betMode === "all" ? "on" : ""}" data-bet="all">ALL-IN</button>
      </div>
      <div class="slot-actions">
        <button class="action-btn" id="slot-topup">${icon("coin")}<span>Top Up 50g = 100c</span></button>
        <button class="action-btn" id="slot-topup-all">${icon("coin")}<span>Top Up ALL (${s.stats.gold}g→${topAll}c)</span></button>
        <button class="action-btn slot-spin" id="slot-spin">${icon("bolt")}<span>Spin (${costLabel})</span></button>
      </div>`,
    mount(screen, state, handlers) {
      const r0 = screen.querySelector("#slot-r0"), r1 = screen.querySelector("#slot-r1"), r2 = screen.querySelector("#slot-r2");
      const msg = screen.querySelector("#slot-msg");
      screen.querySelectorAll(".bet-btn").forEach(b => b.addEventListener("click", () => {
        Sound.tap();
        mutate(st => { st.slots.bet = b.dataset.bet === "all" ? "all" : Number(b.dataset.bet); });
        handlers.rerender();
      }));
      screen.querySelector("#slot-topup").addEventListener("click", () => {
        Sound.tap();
        mutate(st => {
          if (st.stats.gold < 50) { toast("Gold kurang untuk top up (50g).", { ico: "coin", cls: "toast-bad" }); return; }
          st.stats.gold -= 50; st.slots.balance = (st.slots.balance || 0) + 100;
        });
        handlers.rerender();
      });
      screen.querySelector("#slot-topup-all").addEventListener("click", () => {
        Sound.tap();
        mutate(st => {
          if (st.stats.gold <= 0) { toast("Gold kosong.", { ico: "coin", cls: "toast-bad" }); return; }
          st.slots.balance = (st.slots.balance || 0) + st.stats.gold * 2; st.stats.gold = 0;
        });
        handlers.rerender();
      });
      screen.querySelector("#slot-spin").addEventListener("click", () => {
        Sound.tap();
        const st0 = getState();
        const bal0 = st0.slots.balance || 0;
        const cost0 = _betCost(st0.slots.bet || 1, bal0);
        if (bal0 < (st0.slots.bet === "all" ? 1 : cost0)) { toast("Saldo habis. Top up dulu.", { ico: "coin", cls: "toast-bad" }); return; }
        let last = null;
        mutate(st => {
          const mode = st.slots.bet || 1;
          const cost2 = _betCost(mode, st.slots.balance || 0);
          if ((st.slots.balance || 0) < cost2) { toast("Saldo habis. Top up dulu.", { ico: "coin", cls: "toast-bad" }); return; }
          st.slots.balance -= cost2;
          let win, sym;
          if (st.flags.slotGacor) { win = true; sym = 1; }
          else {
            const r = st.slots.rig || 0; st.slots.rig = r + 1;
            if (r <= 3) { win = true; sym = _pickHigh(); }            // awal gacor banget
            else if (r <= 7) { win = Math.random() < 0.55; sym = win ? _randSym() : -1; }
            else if (r <= 10) { win = false; }                       // mulai rangkak
            else if (r <= 12) { win = Math.random() < 0.35; sym = win ? _pickLow() : -1; }
            else { win = false; }                                    // Rungkat total
          }
          let syms;
          if (win) syms = [sym, sym, sym];   // 3 SAMA = menang, icon jelas
          else syms = _distinct3();          // beda semua = kalah, konsisten dg pesan
          st.slots._cost = cost2; st.slots._sym = win ? sym : -1; st.slots._win = win; st.slots._last = syms;
          last = syms;
        });
        if (!last) return;
        let n = 0; const spin = setInterval(() => {
          r0.textContent = SLOTS_SYM[_randSym()].e; r1.textContent = SLOTS_SYM[_randSym()].e; r2.textContent = SLOTS_SYM[_randSym()].e;
          if (++n > 12) {
            clearInterval(spin);
            r0.textContent = SLOTS_SYM[last[0]].e; r1.textContent = SLOTS_SYM[last[1]].e; r2.textContent = SLOTS_SYM[last[2]].e;
            resolveSpin(screen, handlers);
          }
        }, 60);
      });
    }
  };
};
function resolveSpin(screen, handlers) {
  const st = getState();
  const win = st.slots._win, sym = st.slots._sym, cost = st.slots._cost || 0;
  const pay = win ? cost * SLOTS_SYM[sym].mult : 0;
  const msg = screen.querySelector("#slot-msg");
  mutate(s => {
    if (win) { s.slots.balance += pay; s.stats.gold += Math.floor(pay / 4); if (pay > (s.slots.best || 0)) s.slots.best = pay; }
  });
  if (win) {
    Sound.good();
    msg.textContent = "JACKPOT " + SLOTS_SYM[sym].e + " " + SLOTS_SYM[sym].name + " x" + SLOTS_SYM[sym].mult + "! +" + pay + " chip";
    msg.className = "slot-msg good";
  } else {
    Sound.bad(); msg.textContent = "Boncos. Coba lagi, bos."; msg.className = "slot-msg bad";
  }
  if ((st.slots.balance || 0) <= 0 && st.stats.gold < 50) {
    msg.textContent = "DOMPET & SALDO KOSONG. Ini akhirnya...";
    setTimeout(() => { setEnding(KOPLAK_ENDING); handlers.rerender(); }, 900);
    return;
  }
  setTimeout(() => handlers.rerender(), 850);
}

// ===================== DUNGEONFEED (rewrite, story sama) =====================
function renderFeedNew(screen, state, accent, handlers) {
  const nodeData = getCurrentNode();
  if (!nodeData) {
    screen.innerHTML = `
      <div class="app-screen">
        <div class="topbar"><button class="ghost-btn" data-back>${icon("back")} Beranda</button></div>
        <div class="placeholder">Cerita sudah selesai. Lihat ending-mu di layar berikutnya.</div>
      </div>`;
    const back = screen.querySelector("[data-back]");
    if (back) back.addEventListener("click", () => handlers.back());
    return;
  }
  const speaker = resolveText(nodeData.speaker, state) || "DungeonOS";
  const kind = avatarKindOf(speaker);
  const value = resolveText(nodeData.body, state);
  const arr = Array.isArray(value) ? value : [value];
  const bubbles = arr.map((t, i) => `<div class="bubble ${kind}" style="animation-delay:${i * 0.18}s">${t}</div>`).join("");
  const hasChoices = Array.isArray(nodeData.choices) && nodeData.choices.length > 0;
  const quick = hasChoices
    ? nodeData.choices.map((c, i) => `<button class="quick" data-choice="${i}"><span class="quick-i">${i + 1}</span><span class="quick-body"><span class="quick-t">${c.text}</span>${c.hint ? `<span class="quick-sub">- ${c.hint}</span>` : ""}</span></button>`).join("")
    : `<button class="quick primary" id="advance">${icon("bolt")} <span>Lanjut</span></button>`;

  const showHint = !state.apps.devconsole && Math.random() < 0.5;
  const sideCard = showHint
    ? `<div class="side-h">⚠ CELAH TERDETEKSI</div><div class="side-meme">Layar ini retak tipis. Di <b>Settings</b>, ketuk 5x untuk membuka sesuatu yang tak seharusnya ada.</div>`
    : `<div class="side-h">Gimmick Hari Ini</div><div class="side-meme">${randomMeme()}</div>`;

  screen.innerHTML = `
    <div class="app-screen feed-screen feed-wide">
      <div class="topbar">
        <button class="ghost-btn" data-back>${icon("back")} Beranda</button>
        <div class="app-title" style="color:${accent}">${icon("feed")} DungeonFeed</div>
      </div>
      <div class="feed-layout">
        <div class="chat">
          <div class="chat-head">
            <div class="chat-ava ${kind}">${avatar(kind)}</div>
            <div class="chat-id"><div class="chat-name">${speaker}</div>
              <div class="chat-status"><span class="dot"></span> online - Hari ${nodeData.day} - ${PHASE_LABELS[nodeData.phase] || nodeData.phase}</div></div>
            <div class="chat-pill">STORY</div>
          </div>
          <div class="chat-body">${bubbles}<div class="typing" aria-hidden="true"><span></span><span></span><span></span></div></div>
          <div class="chat-quick">${quick}</div>
        </div>
        <aside class="feed-side">
          <div class="side-card">${sideCard}</div>
          <div class="side-card tap-game" id="tap-game">
            <div class="side-h">Tumbuk Bawang (tap!)</div>
            <div class="tap-bawang" id="tap-bawang">${icon("onion")}</div>
            <div class="tap-score">Skor: <b id="tap-score">0</b> - Gold: <b id="tap-gold">0</b></div>
          </div>
        </aside>
      </div>
    </div>`;

  const back = screen.querySelector("[data-back]");
  if (back) back.addEventListener("click", () => handlers.back());
  if (hasChoices) {
    screen.querySelectorAll(".chat-quick .quick").forEach(b =>
      b.addEventListener("click", () => { chooseOption(Number(b.dataset.choice)); handlers.rerender(); }));
  } else {
    const adv = screen.querySelector("#advance");
    if (adv) adv.addEventListener("click", () => { advance(); handlers.rerender(); });
  }

  const typingEl = screen.querySelector(".typing");
  setTimeout(() => { if (typingEl && typingEl.isConnected) typingEl.style.visibility = "hidden"; }, 600 + arr.length * 180);

  const tg = screen.querySelector("#tap-game");
  const tb = screen.querySelector("#tap-bawang");
  const scoreEl = screen.querySelector("#tap-score");
  const goldEl = screen.querySelector("#tap-gold");
  let score = 0, gold = 0;
  if (tb && tg) {
    const place = () => {
      if (!tb.isConnected) return;
      const r = tg.getBoundingClientRect();
      const pad = 8, size = 42;
      const x = pad + Math.random() * Math.max(1, (r.width - size - pad * 2));
      const y = 26 + Math.random() * Math.max(1, (r.height - size - 26 - 8));
      tb.style.left = x + "px"; tb.style.top = y + "px";
    };
    tb.addEventListener("click", () => {
      score++; if (scoreEl) scoreEl.textContent = score;
      if (score % 8 === 0) { gold += 2; if (goldEl) goldEl.textContent = gold; Sound.blip(); mutate(st => { st.stats.gold += 2; }); }
      place();
    });
    place();
  }
}

function avatarKindOf(sp) {
  const s = String(sp || "").toLowerCase();
  if (s.includes("grem")) return "grem";
  if (s.includes("hero")) return "hero";
  if (s.includes("devconsole")) return "devconsole";
  return "os";
}

export const NEW_VIEWS = { tokooren, cctv, dungeonhub, trapmart, heroalert, flappy, judi };
export { renderFeedNew as NEW_RENDERFEED };
