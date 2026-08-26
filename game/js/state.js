import { GAME_CONFIG, APPS } from "./config.js";
import { saveGame, loadGame } from "./save.js";
import { emit } from "./core/eventBus.js";
import { TRAITS } from "./content/minions.js";

// Skema save (kesepakatan DungeonOS v1.0). Naikkan tiap breaking change.
export const SCHEMA_VERSION = 10;
const RESET_BELOW = 2; // hanya pra-v2 yang di-reset total ke Museum Perusahaan.

let state = null;

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialGameState() {
  const apps = {};

  for (const app of APPS) {
    apps[app.id] = Boolean(app.defaultUnlocked);
  }

  return {
    version: GAME_CONFIG.version,
    startedAt: new Date().toISOString(),
    day: 1,
    phase: "morning",
    screen: "boot",
    activeApp: null,

    stats: {
      gold: 500,
      loot: 0,
      reputation: 10,
      morale: 70,
      stability: 80,
      bugLevel: 0,
      devSuspicion: 0,
      unionPower: 0
    },

    factions: {
      hq: 50,
      serikat: 50,
      hero: 50,
      grem: 50
    },

    flags: {
      tutorialDone: false,
      unionAllowed: false,
      betrayedUnion: false,
      secretDeveloperKey: false,

      treatWell: false,
      exploit: false,
      mediaSavvy: false,
      leanOnion: false,
      freedMinions: false,
      hqTest: false,
      secretHero: false,
      devConsole: false,
      settingsTaps: 0,

      path: "",
      joinedHQ: false,
      memeWar: false,
      taxDungeon: false,
      unionSide: false,
      gremWasBoss: false,
      dungeonItuKamu: false,

      metaBreak: false,
      dream: false,
      loop: false,
      gravity: false,
      aiMinion: false,
      goldSick: false,
      devLog: "",

      cheated: false,

      lowPerf: false
    },

    apps,

    minions: {},
    unions: {},
    traps: {},
    inventory: {},
    cctv: { logs: [], watched: 0, boxes: 3, intel: 0, scans: 6 },
    hub: { tab: "ride", rating: 4.8, rides: 0, foods: 0, mart: 0, pay: 0, earned: 0, level: 1, xp: 0, questIdx: 0, energy: 14, dayEarned: 0, audit: 0, questDone: 0, sinceEvent: 0, auditedToday: false, exhaustedDays: {} },
    heroalert: { level: 2 },
    tokooren: { bought: 0, broken: 0 },
    trapmart: { level: 1, auto: false, slots: [null, null, null] },
    slots: { balance: 0, best: 0, rig: 0, _win: false, _big: false },
    flappy: { best: 0 },
    cooldowns: {},
    dailyActions: { day: 0, counts: {} },
    cheatSpam: 0,

    activeEvents: [],
    completedEvents: [],
    scheduledEvents: [],

    notifications: [],

    currentRaid: null,
    endingRoute: null,
    choiceHistory: [],

    story: {
      currentNode: "intro",
      finished: false
    },
    currentEnding: null
  };
}

export function getState() {
  return state;
}

export function persist() {
  if (state) {
    saveGame("auto", state);
  }
}

export function mutate(fn) {
  if (!state) {
    throw new Error("Game state belum diinisialisasi.");
  }

  // Gold live-time: satu titik choke mendeteksi perubahan dompet global.
  const beforeGold = state.stats ? state.stats.gold : null;
  fn(state);
  const afterGold = state.stats ? state.stats.gold : null;
  if (beforeGold !== afterGold) {
    emit("gold:changed", { gold: afterGold, delta: (afterGold || 0) - (beforeGold || 0) });
  }
  persist();
}

export function setScreen(screen) {
  mutate(s => {
    s.screen = screen;
  });
}

export function setActiveApp(appId) {
  mutate(s => {
    s.activeApp = appId;
  });
}

export function addNotification(appId, title, body) {
  mutate(s => {
    s.notifications.unshift({
      id: createId(),
      appId,
      title,
      body,
      read: false,
      timestamp: new Date().toISOString()
    });
  });
}

export function markAllNotificationsRead() {
  mutate(s => {
    for (const notification of s.notifications) {
      notification.read = true;
    }
  });
}

export function initGame() {
  const saved = loadGame("auto");

  if (saved && saved.state) {
    state = saved.state;
    migrate(state);

    if (state.screen === "boot") {
      state.screen = "home";
    }

    return;
  }

  state = createInitialGameState();

  addNotification(
    "system",
    "DungeonOS aktif",
    "Selamat datang, Boss. Sistem dungeon sudah online. Jangan lupa bayar minion."
  );

  persist();
}

// Bawa save lama ke struktur terbaru: app baru wajib terbuka default,
// dan field yang belum ada diisi dengan nilai default.
function migrate(s) {
  // v1.0 Fase 0: save lama (pra-skema v2) diarsipkan ke Museum Perusahaan, lalu reset total.
  const legacy = !s.schemaVersion || s.schemaVersion < RESET_BELOW;
  if (legacy) {
    const m = (s.flags && Array.isArray(s.flags.museum)) ? s.flags.museum : [];
    m.push({
      archivedAt: new Date().toISOString(),
      day: s.day || 1,
      gold: (s.stats && s.stats.gold) || 0,
      endingTitle: (s.currentEnding && s.currentEnding.title) || null,
      note: "Laporan penutupan perusahaan lama. Mentri King Mouse masih dicari."
    });
    const fresh = createInitialGameState();
    fresh.flags.museum = m;
    for (const k of Object.keys(s)) delete s[k];
    Object.assign(s, fresh);
  }
  s.schemaVersion = SCHEMA_VERSION;
  if (!s.apps || typeof s.apps !== "object") s.apps = {};
  for (const app of APPS) {
    if (typeof s.apps[app.id] !== "boolean") {
      s.apps[app.id] = Boolean(app.defaultUnlocked);
    }
  }
  if (!s.flags || typeof s.flags !== "object") s.flags = {};
  if (!s.stats || typeof s.stats !== "object") s.stats = {};
  if (!s.dailyActions) s.dailyActions = { day: 0, counts: {} };
  if (!s.traps) s.traps = {};
  if (!s.inventory) s.inventory = {};
  if (!s.cctv || typeof s.cctv !== "object") s.cctv = { logs: [], watched: 0, boxes: 3, intel: 0, scans: 6 };
  function defaultHubMinions() {
    return [
      { id: "m1", name: "Bowo", trait: "rajin", morale: 80, stamina: 100, skill: { ride: 3, food: 2, toko: 2, sec: 1 } },
      { id: "m2", name: "Sari", trait: "ceroboh", morale: 70, stamina: 100, skill: { ride: 2, food: 3, toko: 2, sec: 1 } },
      { id: "m3", name: "Joko", trait: "unionis", morale: 60, stamina: 100, skill: { ride: 2, food: 2, toko: 3, sec: 2 } },
      { id: "m4", name: "Dewi", trait: "loyal", morale: 85, stamina: 100, skill: { ride: 1, food: 2, toko: 2, sec: 3 } }
    ];
  }
  if (!s.hub || typeof s.hub !== "object") s.hub = {
    tab: "ride", rating: 4.8, rides: 0, foods: 0, mart: 0, pay: 0, earned: 0, level: 1, xp: 0,
    questIdx: 0, energy: 14, dayEarned: 0, audit: 0, questDone: 0, sinceEvent: 0, auditedToday: false,
    exhaustedDays: {}, minions: defaultHubMinions(), assigned: { ride: "m1", food: "m2", toko: "m3", sec: "m4" }, shiftDay: 1, strikeWarned: 0, stock: { ride: 10, food: 10, toko: 10, sec: 10 }, directive: null, jobEnabled: { ride: true, food: true, toko: true, sec: true }
  };
  if (s.hub && !s.hub.minions) s.hub.minions = defaultHubMinions();
  if (s.hub && !s.hub.assigned) s.hub.assigned = { ride: "m1", food: "m2", toko: "m3", sec: "m4" };
  if (s.hub && s.hub.shiftDay == null) s.hub.shiftDay = 1;
  if (s.hub && s.hub.strikeWarned == null) s.hub.strikeWarned = 0;
  if (s.hub && !s.hub.stock) s.hub.stock = { ride: 10, food: 10, toko: 10, sec: 10 };
  if (s.hub && s.hub.directive == null) s.hub.directive = null;
  if (s.hub && !s.hub.jobEnabled) s.hub.jobEnabled = { ride: true, food: true, toko: true, sec: true };
  if (!s.heroalert || typeof s.heroalert !== "object") s.heroalert = { level: 2 };
  if (s.flags && s.flags.lowPerf === undefined) s.flags.lowPerf = false;
  if (!s.tokooren || typeof s.tokooren !== "object") s.tokooren = { bought: 0, broken: 0 };
  if (!s.trapmart || typeof s.trapmart !== "object") s.trapmart = { level: 1, auto: false, slots: [null, null, null] };
  if (!s.slots || typeof s.slots !== "object") s.slots = { balance: 0, best: 0, rig: 0, bet: 1, _win: false, _big: false, _cost: 0, _sym: -1 };
  if (!s.flappy || typeof s.flappy !== "object") s.flappy = { best: 0 };
  if (s.slots && s.slots.bet === undefined) s.slots.bet = 1;
  if (!s.cooldowns) s.cooldowns = {};
  if (!s.choiceHistory) s.choiceHistory = [];
  if (!s.notifications) s.notifications = [];
  if (!s.minions) s.minions = {};
  if (!s.unions) s.unions = {};
  if (!s.story) s.story = { currentNode: "intro", finished: false };
  if (!s.factions || typeof s.factions !== "object") s.factions = { hq: 50, serikat: 50, hero: 50, grem: 50 };
  // Fase 1: lapisan simulasi operasional.
  if (!s.sim || typeof s.sim !== "object") s.sim = { day: 1, phaseIdx: 0 };
  if (!s.economy || typeof s.economy !== "object") s.economy = { incomeToday: 0, expenseToday: 0, reports: [], unpaidStreak: 0 };
  if (s.economy.unpaidStreak == null) s.economy.unpaidStreak = 0;
  // Fase 3: campaign bab & flag naratif v1.
  if (!s.campaign || !Array.isArray(s.campaign.done)) s.campaign = { done: [] };
  // Rebalance Fase 3.5: gaji tersimpan di roster lama disinkronkan ke tabel trait baru.
  for (const m of (s.minionsCorp && s.minionsCorp.hired) || []) {
    if (m.trait !== "legendaris") m.salary = (TRAITS[m.trait] || { salary: m.salary }).salary;
    if (m.joined == null) m.joined = (s.sim && s.sim.day) || 1;
  }
  if (!s.codexKills || typeof s.codexKills !== "object") s.codexKills = {};
  // Fase 4: meta prestige (merger, saham, perk) — bertahan lintas merger.
  if (!s.meta || typeof s.meta !== "object") s.meta = { mergers: 0, saham: 0, perks: {} };
  if (!s.meta.perks || typeof s.meta.perks !== "object") s.meta.perks = {};
  // APP RENEWAL v1.1: flappy v2 & runeForge.
  if (!s.flappy || typeof s.flappy !== "object") s.flappy = { best: 0 };
  if (s.flappy.total == null) s.flappy.total = 0;
  if (!s.flappy.medals || typeof s.flappy.medals !== "object") s.flappy.medals = { bronze: 0, silver: 0, gold: 0 };
  if (!s.runeForge || typeof s.runeForge !== "object") s.runeForge = { active: [], forged: 0, failed: 0 };
  if (!Array.isArray(s.runeForge.active)) s.runeForge.active = [];
  // APP RENEWAL W3: feed sosial & statistik interogasi.
  if (!Array.isArray(s.socialFeed)) s.socialFeed = [];
  if (!s.heroalert || typeof s.heroalert !== "object") s.heroalert = { level: 2 };
  if (s.heroalert.wins == null) s.heroalert.wins = 0;
  if (s.heroalert.cases == null) s.heroalert.cases = 0;
  if (!s.minionsCorp || !Array.isArray(s.minionsCorp.hired)) {
    const legacyMinions = (s.hub && Array.isArray(s.hub.minions)) ? s.hub.minions : [];
    s.minionsCorp = {
      hired: legacyMinions.map((m, i) => ({
        id: "w" + (i + 1),
        name: m.name || "Anon" + i,
        trait: m.trait || "rajin",
        salary: (TRAITS[m.trait] || { salary: 15 }).salary,
        stamina: m.stamina == null ? 100 : m.stamina,
        morale: m.morale == null ? 80 : m.morale,
        job: "nganggur", resting: false, mogok: false
      })),
      candidates: [], seq: 100
    };
  }
  if (!Array.isArray(s.minionsCorp.candidates)) s.minionsCorp.candidates = [];
  if (!s.minionsCorp.seq) s.minionsCorp.seq = 100;
  // Fase 2: dungeon builder (grid lorong + trap).
  if (!s.dungeonBuild || typeof s.dungeonBuild !== "object") s.dungeonBuild = { traps: {}, seq: 1 };
  if (!s.dungeonBuild.traps || typeof s.dungeonBuild.traps !== "object") s.dungeonBuild.traps = {};
  if (!Array.isArray(s.flags.museum)) s.flags.museum = [];
  if (legacy) persist();
}

export function startNewGame() {
  state = createInitialGameState();

  addNotification(
    "system",
    "DungeonOS aktif",
    "Permainan baru dimulai. Hari pertama sebagai bos dungeon."
  );

  persist();
}

export function setEnding(ending) {
  mutate(s => {
    s.currentEnding = ending;
    s.screen = "ending";
    s.story.finished = true;
  });
  emit("ending:reached", ending ? ending.id : null);
}

export function getEnding() {
  return getState() ? getState().currentEnding : null;
}

export function clampStats(s) {
  const st = s.stats;
  st.gold = Math.max(0, Math.round(st.gold));
  st.loot = Math.max(0, Math.round(st.loot));
  st.reputation = Math.min(100, Math.max(0, Math.round(st.reputation)));
  st.morale = Math.min(100, Math.max(0, Math.round(st.morale)));
  st.stability = Math.min(100, Math.max(0, Math.round(st.stability)));
  st.bugLevel = Math.min(100, Math.max(0, Math.round(st.bugLevel)));
  st.devSuspicion = Math.min(100, Math.max(0, Math.round(st.devSuspicion)));
  st.unionPower = Math.min(100, Math.max(0, Math.round(st.unionPower)));
}