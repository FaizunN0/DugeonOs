import { APPS, PHASE_LABELS } from "../config.js";
import { markAllNotificationsRead } from "../state.js";
import { icon, avatar } from "./icons.js";
import { staggerIn, moBurst, syncPerf } from "./anim.js";
import { Lib, Sound } from "../lib.js";
import { triggerGlitch } from "./glitch.js";
import { liveGoldHtml, bindLiveGold } from "./kit/live.js";

let lastAnomaly = 0;
let homeClockTimer = null;

function formatTime(d = new Date()) {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(d = new Date()) {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

function hudLine(s) {
  if (s.stats.morale < 30) return "⚠ Morale minion kritis. Seseorang sudah siapkan kardus pindah.";
  if (s.stats.unionPower > 60) return "🪧 Serikat lagi panas. Spanduk jumlahnya 3 digit.";
  if (s.stats.gold < 100) return "💸 Kas menipis. HQ pasti akan 'mengerti' (tidak).";
  if (s.stats.reputation > 70) return "✨ Reputasi menjulang. Dungeon jadi konten gen-Z.";
  if (s.stats.stability > 75) return "🟢 Stabil. Trap rapi, hero bingung, bos tenang.";
  return "🌀 Hari biasa di bawah tanah. Tunggu saja apa yang meledak.";
}

function statusLine(s) {
  const arr = [];
  if (s.flags.cheated) arr.push("🚨 AUDIT");
  if (s.flags.devConsole) arr.push("🧪 DEV");
  if (s.flags.memeWar) arr.push("😂 MEME WAR");
  if (s.flags.joinedHQ) arr.push("🪆 HQ");
  return arr.length ? arr.join(" · ") : "OS NORMAL";
}

function gremSays(s) {
  if (s.flags.cheated) return "Bos... audit nge-track kamu lho. Santai tapi waspadalah.";
  if (s.stats.morale < 30) return "Bos, kami capek. Sekali-kali bayar gaji tepat waktu, ya?";
  if (s.stats.gold < 100) return "Kas tipis, Bos. Trap mahal, hero makin berani.";
  return "Hai Bos! Buka DungeonFeed buat lanjut cerita. Aplikasi lain batas 5 aksi/hari ya.";
}

export function renderHome(screen, state, handlers) {
  syncPerf(!!(state.flags && state.flags.lowPerf));
  if (homeClockTimer) { clearInterval(homeClockTimer); homeClockTimer = null; }
  const visibleApps = APPS.filter(app => state.apps[app.id] === true);
  const day = state.day || 1;
  const phase = PHASE_LABELS[state.phase] || state.phase;
  const unreadFor = id => state.notifications.filter(n => n.appId === id && !n.read).length;

  const LIMITED = new Set(["minion", "union", "trapmart", "heroalert", "dungeongram"]);
  function remainingFor(id) {
    if (!LIMITED.has(id)) return null;
    const da = state.dailyActions, d = state.day || 1;
    if (!da || da.day !== d) return 5;
    return 5 - (da.counts[id] || 0);
  }

  const appTiles = visibleApps
    .map(app => {
      const badge = unreadFor(app.id);
      return `
      <div class="app-tile tilt ${badge ? "has-unread" : ""} ${app.core ? "core" : ""}" style="--accent:${app.accent}">
        <button data-app="${app.id}" aria-label="${app.name}">
          ${icon(app.icon)}
          ${badge ? `<span class="tile-badge">${badge}</span>` : ""}
        </button>
        <div class="app-label">${app.name}</div>
      </div>`;
    })
    .join("");

  const ATTENTION = [
    { id: "minion", label: "MinionApp" },
    { id: "union", label: "UnionDesk" },
    { id: "trapmart", label: "TrapMart" },
    { id: "heroalert", label: "HeroAlert" },
    { id: "dungeongram", label: "DungeonGram" }
  ];
  const attention = ATTENTION
    .filter(a => state.apps[a.id])
    .map(a => {
      const u = unreadFor(a.id);
      const rem = remainingFor(a.id);
      if (!u && (rem === null || rem >= 5)) return "";
      const note = u ? `${u} notif` : `${rem} aksi`;
      return `<button class="attn-chip" data-attn="${a.id}">${icon(a.id)}<span>${a.label}</span><b>${note}</b></button>`;
    })
    .filter(Boolean)
    .join("");

  const statPill = (label, val, tone) =>
    `<div class="stat-pill ${tone || ""}"><span>${label}</span><strong>${val}</strong></div>`;

  const unread = state.notifications.filter(n => !n.read).length;
  const notifs = state.notifications.length
    ? state.notifications
        .slice(0, 4)
        .map(n => `
          <div class="notification ${n.read ? "" : "unread"}">
            <div class="notification-title"><span>${n.title}</span><span class="notification-time">${formatTime(new Date(n.timestamp))}</span></div>
            <div class="notification-body">${n.body}</div>
          </div>`)
        .join("")
    : `<div class="empty">Tidak ada notifikasi. Dungeon tenang... mencurigakan.</div>`;

  screen.innerHTML = `
    <div class="home">
      <header class="home-top">
        <div class="home-greet">
          <div class="home-time" id="home-clock">${formatTime()}</div>
          <div class="home-date">${formatDate()} · Hari ${day}</div>
        </div>
        <div class="home-status">${statusLine(state)}</div>
      </header>

      <div class="home-mascot glass">
        <div class="mascot-ava">${avatar("grem")}</div>
        <div class="mascot-talk">
          <div class="mascot-name">Grem</div>
          <div class="mascot-line">${gremSays(state)}</div>
        </div>
      </div>

      <section class="hud">
        <div class="hud-head">
          <span class="hud-title">STATUS DUNGEON</span>
          <span class="hud-phase">${phase}</span>
        </div>
        <div class="hud-stats">
          ${statPill("Morale", state.stats.morale, state.stats.morale < 35 ? "bad" : "")}
          ${statPill("Stabil", state.stats.stability, state.stats.stability < 35 ? "bad" : "")}
          ${statPill("Reput", state.stats.reputation, state.stats.reputation < 20 ? "bad" : "")}
          ${statPill("Gold", liveGoldHtml(), state.stats.gold < 100 ? "bad" : "")}
          ${statPill("Serikat", state.stats.unionPower, state.stats.unionPower > 55 ? "bad" : "")}
        </div>
        <div class="hud-line">${hudLine(state)}</div>
      </section>

      <section class="app-section">
          <h2 class="section-title">Aplikasi</h2>
          <p class="app-tip">${icon("feed")} <b>DungeonFeed</b> buat lanjut cerita · aplikasi lain pun butuh perhatianmu</p>
        <div class="app-grid">${appTiles}</div>
      </section>

      ${attention ? `
      <section class="app-section attn-section">
        <h2 class="section-title">Butuh Perhatianmu</h2>
        <div class="attn-row">${attention}</div>
      </section>` : ""}

      <section class="app-section">
        <div class="section-head">
          <h2 class="section-title">Notifikasi</h2>
          ${unread ? `<button id="mark-read" class="small-btn">Tandai dibaca (${unread})</button>` : ""}
        </div>
        <div class="notif-panel glass">${notifs}</div>
      </section>

      <footer class="home-footer">DUNGEONOS v1.1.0 — BOSS SEJATI · APP RENEWAL</footer>
    </div>
  `;

  bindLiveGold(screen);

  screen.querySelectorAll(".app-tile button").forEach(b => {
    b.addEventListener("click", () => {
      Sound.tap();
      const r = b.getBoundingClientRect();
      moBurst(r.left + r.width / 2, r.top + r.height / 2, b.closest(".app-tile").style.getPropertyValue("--accent") || "#A855F7");
      handlers.openApp(b.dataset.app);
    });
  });

  const mark = screen.querySelector("#mark-read");
  if (mark) mark.addEventListener("click", () => { markAllNotificationsRead(); handlers.rerender(); });

  screen.querySelectorAll(".attn-chip").forEach(b => {
    b.addEventListener("click", () => { Sound.tap(); handlers.openApp(b.dataset.attn); });
  });

  // 3D tilt on tiles (vanilla-tilt) — guarded.
  if (Lib.VanillaTilt && !(state.flags && state.flags.lowPerf)) {
    try {
      Lib.VanillaTilt.init(screen.querySelectorAll(".app-tile button"), {
        max: 14, speed: 500, glare: true, "max-glare": 0.25, scale: 1.05
      });
    } catch (e) { /* noop */ }
  }

  if (!(state.flags && state.flags.lowPerf)) {
    staggerIn(screen.querySelectorAll(".app-tile"), { base: 0.04, step: 0.05, from: 14 });
    staggerIn(screen.querySelectorAll(".stat-pill"), { base: 0.1, step: 0.04 });
  }

  // Fase 6: anomali RNG sesekali (pecah layar fourth-wall).
  const now = Date.now();
  if (now - lastAnomaly > 25000 && Math.random() < 0.08) {
    lastAnomaly = now;
    setTimeout(() => triggerGlitch(), 600);
  }

  // Jam besar di home ikut waktu asli (update tiap detik, auto-clear saat ganti layar).
  homeClockTimer = setInterval(() => {
    const el = screen.querySelector("#home-clock");
    if (!el) { clearInterval(homeClockTimer); homeClockTimer = null; return; }
    el.textContent = formatTime();
  }, 1000);
}
