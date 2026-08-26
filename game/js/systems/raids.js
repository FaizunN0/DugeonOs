// Mesin raid: gelombang hero menyusuri lorong secara real-time (Fase 2).
// Loop interval mandiri (100ms), berhenti otomatis kalau layar app ditutup.
import { getState, mutate } from "../state.js";
import { toast } from "../ui/toast.js";
import { PATH, VAULT_CELL } from "./dungeon.js";
import { TRAPS } from "../content/traps.js";
import { HERO_TYPES, WAVES, STEAL_PER_LEAK, REP_LOSS_PER_LEAK } from "../content/heroes.js";
import { modifiers } from "./factions.js";
import { activeSeason } from "../content/seasons.js";
import { activeBuffs, RUNE_MATS, MAT_KEYS, matInvKey } from "../content/runes.js";
import { addInv } from "../apps/shared.js";
import { clamp } from "../apps/shared.js";
import { emit } from "../core/eventBus.js";

const TICK = 100;
let run = null;

export function raidRunning() { return !!run; }

export function cancelRaid() {
  if (!run) return;
  clearInterval(run.timer);
  run.field.querySelectorAll(".db-hero").forEach(el => el.remove());
  run = null;
}

function keyOf(x, y) { return `${x},${y}`; }

export function startRaid({ field, commentary, onDone }) {
  if (run) return null;
  const st = getState();
  const trapsCfg = st.dungeonBuild.traps || {};
  const rageMul = modifiers(st).heroRageMul * (activeSeason((st.sim && st.sim.day) || 1).hpMul || 1) * activeBuffs(st).heroHpMul;
  const waveType = WAVES[Math.floor(Math.random() * WAVES.length)];
  const spawnGap = Math.max(700, 1500 - waveType.length * 90);

  const heroes = waveType.map((tid, i) => {
    const cfg = HERO_TYPES[tid];
    const el = document.createElement("div");
    el.className = "db-hero";
    el.title = cfg.name;
    el.textContent = cfg.emo;
    field.appendChild(el);
    return {
      cfg, el,
      hpMax: Math.round(cfg.hp * rageMul),
      spawnAt: i * spawnGap,
      spawned: false, tileIdx: 0, acc: 0,
      slowTile: false, dead: false
    };
  });

  // Lapisan cooldown per petak: waktu terakhir trap memicu.
  const cdUntil = {};
  let t = 0, kills = 0, leaks = 0, done = false;
  const lines = [
    "Hero masuk lewat lorong utara. Satu bawa kamera.",
    "HQ mengingatkan: kekalahan boleh, review busuk jangan.",
    "Trap bekerja. HRD menangis terharu (atau karena bawang).",
    "Brankas bergetar pelan. Semangat, penjaga gaji.",
    "Serikat menonton sambil jualan gorengan di pinggir lorong."
  ];
  let lineIdx = 0;

  function placeHero(h) {
    const [x, y] = PATH[h.tileIdx];
    h.el.style.left = ((x + 0.5) * 100) / 5 + "%";
    h.el.style.top = ((y + 0.5) * 100) / 4 + "%";
  }

  run = {
    field,
    timer: setInterval(() => {
      if (document.hidden) return;                       // hemat & adil saat tab disimpan
      if (!document.contains(field)) { cancelRaid(); return; }
      t += TICK;
      if (commentary && t > (lineIdx + 1) * 2600 && lineIdx < lines.length) {
        commentary.textContent = lines[lineIdx++];
      }

      for (const h of heroes) {
        if (h.dead) continue;
        if (!h.spawned) {
          if (t >= h.spawnAt) { h.spawned = true; h.hp = h.hpMax; placeHero(h); }
          continue;
        }
        h.acc += TICK * (h.slowTile ? 2 : 1);            // ilusi: setengah kecepatan
        const speed = h.cfg.speed;
        while (h.acc >= speed && !h.dead) {
          h.acc -= speed;
          h.slowTile = false;
          h.tileIdx++;
          if (h.tileIdx >= PATH.length) {                // sampai brankas
            h.dead = true; leaks++;
            mutate(s => {
              s.stats.gold = Math.max(0, s.stats.gold - STEAL_PER_LEAK);
              s.stats.reputation = clamp(s.stats.reputation - REP_LOSS_PER_LEAK, 0, 100);
            });
            toast(`${h.cfg.name} nyolong brankas (-${STEAL_PER_LEAK}g)!`, { ico: "skull", cls: "toast-bad" });
            h.el.remove();
            break;
          }
          placeHero(h);
          const cell = trapsCfg[keyOf(PATH[h.tileIdx][0], PATH[h.tileIdx][1])];
          if (cell) {
            const trap = TRAPS[cell.id];
            const last = cdUntil[keyOf(PATH[h.tileIdx][0], PATH[h.tileIdx][1])] || 0;
            if (t >= last) {
              cdUntil[keyOf(PATH[h.tileIdx][0], PATH[h.tileIdx][1])] = t + trap.cd;
              h.hp -= trap.dmg;
              h.slowTile = !!trap.slow;
              flash(field, PATH[h.tileIdx]);
              if (h.hp <= 0) {
                h.dead = true; kills++;
                let dropEmo = "";
                mutate(s => {
                  s.stats.gold += h.cfg.bounty;
                  // Codex dinamis: rekap monster yang tumbang.
                  s.codexKills = s.codexKills || {};
                  s.codexKills[h.cfg.id] = (s.codexKills[h.cfg.id] || 0) + 1;
                  // Drop bahan rune (35%): jembatan BangunRuang -> RuneForge.
                  if (Math.random() < 0.35) {
                    const k = MAT_KEYS[Math.floor(Math.random() * MAT_KEYS.length)];
                    addInv(s, matInvKey(k), 1);
                    dropEmo = RUNE_MATS[k].emo;
                  }
                });
                h.el.classList.add("dead");
                setTimeout(() => h.el.remove(), 350);
                toast(`${h.cfg.name} tumbang (+${h.cfg.bounty}g${dropEmo ? ` +drop ${dropEmo}` : ""}).`, { ico: "skull", cls: "toast-ok" });
              }
            }
          }
        }
      }

      if (!done && heroes.every(h => h.dead)) {
        done = true;
        clearInterval(run.timer);
        const res = { kills, leaks, total: heroes.length };
        emit("social", { kind: leaks ? "raid_leak" : "raid_win",
          text: `Laporan raid: ${kills}/${heroes.length} hero tumbang${leaks ? `, ${leaks} sampai brankas` : ""}.` });
        run = null;
        onDone(res);
      }
    }, TICK)
  };
  return { wave: waveType.length };
}

function flash(field, [x, y]) {
  const f = document.createElement("span");
  f.className = "db-flash";
  f.style.left = (x * 100) / 5 + "%";
  f.style.top = (y * 100) / 4 + "%";
  f.style.width = 100 / 5 + "%";
  f.style.height = 100 / 4 + "%";
  field.appendChild(f);
  setTimeout(() => f.remove(), 240);
}
