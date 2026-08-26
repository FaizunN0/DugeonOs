// Flappy v2 "Terbang Lorong" — APP RENEWAL v1.1.
// Kenari serikat menerobos lorong pilar trap; hindari naga melintas.
// Medal: 🥉50 · 🥈150 · 🥇300 · 👑500 = ENDING RAJA BURUNG.
// Standar anti-bug: semua timer/rAF lewat mgSession, auto-cleanup saat app ditutup.
import { mutate, setEnding } from "../state.js";
import { FLAPPY_ENDING } from "../content/endings.js";
import { Sound } from "../lib.js";
import { toast } from "../ui/toast.js";
import { mgSession } from "../ui/kit/mg.js";

const G = 0.42, FLAP_V = -6.8;
const PILLAR_W = 54, GAP = 132, SPEED = 2.3;
const MEDALS = [
  { min: 300, key: "gold",   emo: "🥇", label: "EMAS" },
  { min: 150, key: "silver", emo: "🥈", label: "PERAK" },
  { min: 50,  key: "bronze", emo: "🥉", label: "PERUNGGU" }
];

const flappy = (s) => ({
  body: `
    <p class="app-lead">TERBANG LORONG — ketuk untuk mengepak. Lewati pilar trap, jangan tabrak naga. 👑500 = takdir menantimu.</p>
    <div class="flap-wrap" id="flap-wrap">
      <canvas id="flap-cv"></canvas>
      <div class="flap-over" id="flap-over" hidden></div>
      <div class="flap-hud">Best <b>${s.flappy.best || 0}</b> · Terbang ${s.flappy.total || 0}x · 🥉${s.flappy.medals?.bronze || 0} 🥈${s.flappy.medals?.silver || 0} 🥇${s.flappy.medals?.gold || 0}</div>
    </div>
    <button class="action-btn flap-start" id="flap-start">${"🐦"}<span>Ketuk / Spasi untuk Mengepak</span></button>`,
  mount(screen, state, handlers) {
    const wrap = screen.querySelector("#flap-wrap");
    const cv = screen.querySelector("#flap-cv");
    const overEl = screen.querySelector("#flap-over");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = Math.max(280, wrap.clientWidth || 320), H = 380;
    cv.width = W; cv.height = H;

    const sess = mgSession(wrap);
    let bird, pillars, dragons, score, running, dead, spawnT, dragT, shake;

    function reset() {
      bird = { y: H / 2, v: 0 };
      pillars = [{ x: W + 40, gapY: rand(60, H - 60 - GAP), passed: false }];
      dragons = []; score = 0; running = false; dead = false; spawnT = 90; dragT = 480; shake = 0;
      overEl.hidden = true;
    }

    function flap() {
      if (dead) return;
      if (!running) { running = true; }
      bird.v = FLAP_V;
      Sound.blip();
    }

    function die() {
      if (dead) return;
      dead = true; running = false; shake = 8;
      Sound.play ? Sound.play("hit", 180, 0.05, "square") : Sound.blip();
      let reward = 0;
      mutate(st => {
        st.flappy.total = (st.flappy.total || 0) + 1;
        if (score > (st.flappy.best || 0)) st.flappy.best = score;
        for (const m of MEDALS) if (score >= m.min) st.flappy.medals[m.key] = (st.flappy.medals[m.key] || 0) + 1;
        reward = Math.min(40, Math.floor(score / 2));
        st.stats.gold += reward;
      });
      if (score >= 500) {
        overEl.hidden = false;
        overEl.innerHTML = `<div class="flap-king">👑</div><div class="flap-over-title">RAJA BURUNG</div>`;
        sess.timer(() => setEnding(FLAPPY_ENDING), 1400);
        return;
      }
      const medal = MEDALS.find(m => score >= m.min);
      overEl.hidden = false;
      overEl.innerHTML = `
        <div class="flap-over-title">${medal ? medal.emo + " " + medal.label : "TAMAT"} · ${score}</div>
        <div class="flap-over-sub">Best ${Math.max(score, s.flappy.best || 0)} · Reward +${reward}g</div>
        <button class="sheet-btn primary" id="flap-again">Main Lagi</button>`;
      overEl.querySelector("#flap-again").addEventListener("click", () => { reset(); });
      toast(`Jatuh di ${score}. ${reward > 0 ? "+" + reward + "g buat biaya perawatan sayap." : "Setidaknya gagal dengan gaya."}`, { ico: "bird", cls: "" });
      handlers.rerender();
    }

    function step() {
      if (running && !dead) {
        bird.v += G; bird.y += bird.v;
        if (bird.y > H - 14 || bird.y < -10) return die();
        spawnT--; dragT--;
        if (spawnT <= 0) { pillars.push({ x: W + 30, gapY: rand(60, H - 60 - GAP), passed: false }); spawnT = 92; }
        for (const p of pillars) {
          p.x -= SPEED;
          if (!p.passed && p.x + PILLAR_W < 40) { p.passed = true; score++; Sound.tap(); }
          // Tabrak pilar (burung lingkaran r=11 di x=40)
          if (40 + 11 > p.x && 40 - 11 < p.x + PILLAR_W && (bird.y - 11 < p.gapY || bird.y + 11 > p.gapY + GAP)) die();
        }
        pillars = pillars.filter(p => p.x > -PILLAR_W - 4);
        if (dragT <= 0) { dragons.push({ x: W + 34, y: rand(70, H - 90), vx: 3.6 }); dragT = 520; }
        for (const d of dragons) {
          d.x -= d.vx;
          if (40 + 9 > d.x && 40 - 9 < d.x + 34 && Math.abs(bird.y - d.y) < 24) die();
        }
        dragons = dragons.filter(d => d.x > -50);
        if (shake > 0) shake -= 1;
      }
      draw();
      if (sess.alive()) requestAnimationFrame(stepId);
    }

    function draw() {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - .5) * 5, (Math.random() - .5) * 5);
      // Lorong
      const grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, "#150d22"); grd.addColorStop(1, "#0c0820");
      ctx.fillStyle = grd; ctx.fillRect(-8, -8, W + 16, H + 16);
      // Pilar trap
      for (const p of pillars) {
        ctx.fillStyle = "#2a1650"; ctx.strokeStyle = "#7a3df0"; ctx.lineWidth = 2;
        ctx.fillRect(p.x, 0, PILLAR_W, p.gapY); ctx.strokeRect(p.x, -2, PILLAR_W, p.gapY + 2);
        ctx.fillRect(p.x, p.gapY + GAP, PILLAR_W, H - p.gapY - GAP); ctx.strokeRect(p.x, p.gapY + GAP, PILLAR_W, H - p.gapY + 2);
        ctx.font = "18px serif"; ctx.textAlign = "center";
        ctx.fillText("🧅", p.x + PILLAR_W / 2, p.gapY - 6);
        ctx.fillText("🧅", p.x + PILLAR_W / 2, p.gapY + GAP + 16);
      }
      // Naga
      ctx.font = "28px serif";
      for (const d of dragons) ctx.fillText("🐉", d.x, d.y);
      // Burung kenari serikat
      ctx.save();
      ctx.translate(40, bird.y);
      ctx.rotate(Math.max(-0.5, Math.min(1, bird.v * 0.06)));
      ctx.fillStyle = "#e0342b"; ctx.fillRect(-20, -3, 14, 7);       // spanduk serikat
      ctx.fillStyle = "#FFD86B"; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(4, -3, 3, 0, 7); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(5, -3, 1.4, 0, 7); ctx.fill();
      ctx.fillStyle = "#f39c12"; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(15, 2); ctx.lineTo(9, 4); ctx.fill();
      ctx.restore();
      // Skor & best
      ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = "bold 22px sans-serif";
      ctx.fillText("" + score, 12, 30);
      ctx.font = "11px sans-serif"; ctx.fillStyle = "#cdbef0";
      ctx.textAlign = "right"; ctx.fillText("BEST " + Math.max(score, s.flappy.best || 0), W - 10, 22);
      if (!running && !dead) {
        ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.textAlign = "center"; ctx.font = "bold 14px sans-serif";
        ctx.fillText("KETUK UNTUK TERBANG 🐤", W / 2, H / 2 - 60);
      }
      ctx.restore();
    }

    const rand = (a, b) => a + Math.random() * (b - a);
    const stepId = () => step();

    // Input diskrit: ketuk kanvas / tombol / spasi.
    cv.style.touchAction = "none";
    wrap.addEventListener("pointerdown", (e) => { e.preventDefault(); flap(); });
    const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); flap(); } };
    window.addEventListener("keydown", onKey);
    sess.cleanup(() => window.removeEventListener("keydown", onKey));

    reset();
    requestAnimationFrame(stepId);
  }
});

export { flappy };
