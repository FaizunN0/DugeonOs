import { GAME_CONFIG, APPS } from "./config.js";
import { saveGame, loadGame } from "./save.js";

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

  fn(state);
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
  if (!s.hub || typeof s.hub !== "object") s.hub = { tab: "ride", rating: 4.8, rides: 0, foods: 0, mart: 0, pay: 0, earned: 0, level: 1, xp: 0, questIdx: 0, energy: 14, dayEarned: 0, audit: 0, questDone: 0, sinceEvent: 0, auditedToday: false, exhaustedDays: {} };
  if (!s.heroalert || typeof s.heroalert !== "object") s.heroalert = { level: 2 };
  if (s.flags && s.flags.lowPerf === undefined) s.flags.lowPerf = false;
  if (!s.tokooren || typeof s.tokooren !== "object") s.tokooren = { bought: 0, broken: 0 };
  if (!s.trapmart || typeof s.trapmart !== "object") s.trapmart = { level: 1, auto: false, slots: [null, null, null] };
  if (!s.slots || typeof s.slots !== "object") s.slots = { balance: 0, best: 0, rig: 0, _win: false, _big: false };
  if (!s.flappy || typeof s.flappy !== "object") s.flappy = { best: 0 };
  if (!s.cooldowns) s.cooldowns = {};
  if (!s.choiceHistory) s.choiceHistory = [];
  if (!s.notifications) s.notifications = [];
  if (!s.minions) s.minions = {};
  if (!s.unions) s.unions = {};
  if (!s.story) s.story = { currentNode: "intro", finished: false };
  if (!s.factions || typeof s.factions !== "object") s.factions = { hq: 50, serikat: 50, hero: 50, grem: 50 };
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