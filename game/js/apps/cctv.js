// CCTV v2 — APP RENEWAL W3. Monitor multi-cam kini menampilkan REKAMAN HIDUP
// dari feed simulasi (raid, mogok, gajian, merger, MKM). Scan harian dipertahankan.
import { getState, mutate } from "../state.js";
import { icon } from "../ui/icons.js";
import { Sound } from "../lib.js";
import { toast } from "../ui/toast.js";
import { choiceModal } from "../ui/kit/modal.js";
import { mgSession } from "../ui/kit/mg.js";
import { KIND_META } from "../systems/social.js";

const CHANNELS = [
  { name: "Lorong Utara", kinds: ["raid_win", "raid_leak"], threat: "hero",  fallback: "Sepi. Terlalu sepi. Mencurigakan." },
  { name: "Dapur & Personalia", kinds: ["strike", "fired", "hire"], threat: "makan", fallback: "Panci menganga. Minion saling pandang." },
  { name: "Brankas HQ", kinds: ["payroll_ok", "payroll_late", "merger"], threat: "aman", fallback: "Gembok terkunci rapat. Katanya." },
  { name: "Lorong Timur (Rahasia)", kinds: ["chapter", "season", "merger"], threat: "hero", fallback: "Bayangan kecil berjubah lewat. Mungkin cuma tikus." }
];

const CCTV_SCENES = [
  { t: "Hero Brave-X terlihat mengintip brankas. Siapkan trap.", intel: 1 },
  { t: "Minion Bob tidur saat jam kerja. Didenda potong morale.", morale: -6 },
  { t: "Kotak item #2 kosong - ada yang mencuri! Lapor HQ.", box: true },
  { t: "Hero Saint-E memberi tips ke goblin. Sindiran terdengar.", intel: 1 },
  { t: "Grem ternyata main roblox di jam kerja. Lucu, tapi catat.", intel: 1 },
  { t: "Lorong utara sepi. Trap bekerja otomatis, +loot.", loot: 8 }
];
const CCTV_ANOMALY = [
  "Kamera nangkap goblin nari gemoy di depan brankas. Dia tahu dia diawasi.",
  "Layar berkedip: 'SERIKAT MEMINTA KAMERA DIMATIKAN'. Lucu, tapi sedikit menyeramkan.",
  "CCTV merekam hero yang JUSTRU membantu minion angkat koper. Plot twist harian.",
  "Seekor bawang raksasa lewat di koridor. Bukan anomali. Mungkin bos lama."
];

function latestFor(st, ch) {
  return (st.socialFeed || []).find(p => ch.kinds.includes(p.kind)) || null;
}

function sceneLine(p) {
  if (!p) return null;
  const meta = KIND_META[p.kind] || { emo: "📹" };
  return `${meta.emo} ${p.text}`;
}

function body(s) {
  const scans = s.cctv.scans || 0;
  const noScan = scans <= 0;
  const feeds = CHANNELS.map((ch, i) => {
    const p = latestFor(s, ch);
    const line = sceneLine(p) || ch.fallback;
    const cls = p ? (p.kind.includes("leak") || p.kind === "strike" || p.kind === "payroll_late" ? "hot" : "warn") : "ok";
    return `<div class="cctv-mon ${cls}">
      <div class="cctv-mon-top"><span>CAM 0${i + 1} · ${ch.name}</span><span class="cctv-mon-live">● LIVE</span></div>
      <div class="cctv-mon-scene">
        <div class="cctv-mon-floor"></div>
        <div class="cctv-mon-blip"></div>
        <div class="cctv-mon-label">${line.length > 64 ? line.slice(0, 61) + "…" : line}</div>
      </div>
      <div class="cctv-mon-bot"><span>${p ? (KIND_META[p.kind]?.label || "REKAMAN") : "AMAN"}</span><span class="cctv-mon-time" data-live-ts>00:00:00</span></div>
      <div class="cctv-scanline2"></div>
    </div>`;
  }).join("");
  const logs = (s.cctv.logs || []).slice(0, 6).map(l =>
    `<div class="cctv-log"><span class="cctv-dot"></span>${l}</div>`).join("") ||
    `<div class="cctv-log muted">Belum ada rekaman manual. Pantau (batas scan harian).</div>`;
  return `
  <div id="cc-root" class="">
    <p class="app-lead">CCTV DungeonOS Inc. — kamera kini menyiarkan hidup dungeonmu. Bukan ladang gold: scan harian ${scans}/6.</p>
    <div class="cctv-cam-unit"><div class="cctv-cam-body">
      <div class="cctv-lens"><span class="cctv-lens-glare"></span></div>
      <div class="cctv-cam-info"><span class="cctv-rec">● REC</span><span class="cctv-cam-id">CTRL-01</span></div>
    </div><div class="cctv-mount"></div></div>
    <div class="cctv-feeds">${feeds}</div>
    <div class="cctv-statbar">Kotak item: <b>${s.cctv.boxes}</b> · Dipantau: <b>${s.cctv.watched}</b>x · Intel: <b>${s.cctv.intel || 0}</b> · Scan: <b>${scans}</b></div>
    <div class="cctv-logs">${logs}</div>
    <button class="action-btn cctv-pantau" id="cctv-pantau" ${noScan ? "disabled" : ""}>${icon("cctv")}<span>${noScan ? "Scan habis (tunggu hari baru)" : "Pantau Sekarang"}</span></button>
  </div>`;
}

export const cctv = (s) => ({
  body: body(s),
  mount(screen, state, handlers) {
    // Jam live di tiap monitor — satu interval via mgSession.
    const sess = mgSession(screen);
    sess.interval(() => {
      const t = new Date().toLocaleTimeString("id-ID", { hour12: false });
      screen.querySelectorAll("[data-live-ts]").forEach(el => el.textContent = t);
    }, 1000);

    const btn = screen.querySelector("#cctv-pantau");
    if (btn && !btn.disabled) btn.addEventListener("click", () => {
      Sound.tap();
      let anom = false;
      mutate(st => {
        if ((st.cctv.scans || 0) <= 0) return;
        st.cctv.scans--; st.cctv.watched++;
        const sc = CCTV_SCENES[Math.floor(Math.random() * CCTV_SCENES.length)];
        if (sc.box) st.cctv.boxes = Math.max(0, st.cctv.boxes - 1);
        st.cctv.logs.unshift("[" + st.cctv.watched + "] " + sc.t);
        if (Math.random() < 0.35) { const g = 4 + Math.floor(Math.random() * 8); st.stats.gold += g; }
        else st.cctv.intel = (st.cctv.intel || 0) + (sc.intel || 0);
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
});
