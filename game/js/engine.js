import { getState, mutate, setEnding } from "./state.js";
import { getNode, START_NODE } from "./content/story.js";
import { evaluateEnding } from "./content/endings.js";
import { emit } from "./core/eventBus.js";
import { clamp } from "./core/util.js";

const CLAMPED = ["morale", "stability", "reputation", "unionPower", "devSuspicion"];

function clampStats(st) {
  for (const key of CLAMPED) {
    if (typeof st.stats[key] === "number") {
      st.stats[key] = Math.max(0, Math.min(100, st.stats[key]));
    }
  }
  if (st.stats.gold < 0) st.stats.gold = 0;
  if (st.stats.loot < 0) st.stats.loot = 0;
}

function enter(st, id) {
  const node = getNode(id);
  if (!node) {
    triggerEnding();
    return;
  }
  st.story.currentNode = id;
  st.story.finished = false;
  const prevDay = st.day;
  st.day = node.day;
  st.phase = node.phase;
  // Pendapatan pasif: tiap hari baru, dungeon dapat upeti + hasil trap.
  if (typeof prevDay === "number" && node.day > prevDay) {
    const income = Math.round(45 + st.stats.loot * 0.4 + st.stats.stability * 0.25);
    st.stats.gold += income;
    st.flags.lastIncome = income;
    st.notifications.unshift({
      id: "inc" + Date.now(),
      appId: "feed",
      title: "Pendapatan Harian",
      body: "Upeti minion & hasil trap masuk: +" + income + " gold. Dungeon tetap berputar.",
      read: false,
      timestamp: new Date().toISOString()
    });
    if (st.trapmart && st.trapmart.auto) {
      const autoLoot = 6 + (st.trapmart.level || 1) * 3;
      st.stats.loot += autoLoot;
    }
    // reset harian untuk mekanisme anti-curang
    if (st.cctv) st.cctv.scans = 6;
    if (st.hub) {
      st.hub.energy = 14; st.hub.dayEarned = 0; st.hub.questDone = 0; st.hub.sinceEvent = 0; st.hub.auditedToday = false;
      st.hub.shiftDay = (st.hub.shiftDay || 1) + 1;
      (st.hub.minions || []).forEach(m => {
        m.stamina = clamp((m.stamina || 0) + 30, 0, 100);
        m.morale = clamp((m.morale || 0) + 12, 0, 100);
      });
      const sk = st.hub.stock || {};
      ["ride", "food", "toko", "sec"].forEach(k => { sk[k] = clamp((sk[k] || 0) + 2, 0, 99); });
      st.hub.directive = null;
    }
    emit("day:new", { day: st.day });
  }
  clampStats(st);
}

function resolveNext(nextValue, st) {
  if (typeof nextValue === "function") return nextValue(st);
  return nextValue;
}

export function getCurrentNode() {
  const s = getState();
  if (!s || !s.story) return null;
  return getNode(s.story.currentNode);
}

export function resolveText(value, state) {
  return typeof value === "function" ? value(state) : value;
}

export function startStory() {
  mutate(st => {
    if (!st.story) st.story = { currentNode: START_NODE, finished: false };
    enter(st, st.story.currentNode || START_NODE);
  });
}

export function ensureStarted() {
  const s = getState();
  if (s && s.story && !s.story.finished && !getCurrentNode()) {
    startStory();
  }
}

export function chooseOption(index) {
  const s = getState();
  const node = getCurrentNode();
  if (!node || !node.choices) return;

  const choice = node.choices[index];
  if (!choice) return;

  mutate(st => {
    if (choice.apply) choice.apply(st);
    clampStats(st);
    st.choiceHistory.push({
      day: node.day,
      phase: node.phase,
      nodeId: node.id,
      choice: choice.text
    });

    const nextId = resolveNext(
      choice.next !== undefined ? choice.next : node.next,
      st
    );
    if (nextId === null || nextId === undefined) {
      st.story.finished = true;
    } else {
      enter(st, nextId);
    }
  });

  if (getState().story.finished) {
    triggerEnding();
  }
}

export function advance() {
  const node = getCurrentNode();
  if (!node) {
    triggerEnding();
    return;
  }

  mutate(st => {
    const nextId = resolveNext(node.next, st);
    if (nextId === null || nextId === undefined) {
      st.story.finished = true;
    } else {
      enter(st, nextId);
    }
  });

  if (getState().story.finished) {
    triggerEnding();
  }
}

export function triggerEnding() {
  const ending = evaluateEnding(getState());
  setEnding(ending);
}
