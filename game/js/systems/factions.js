// Relasi faksi -> modifikasi rule simulasi (Fase 3).
import { getState, mutate } from "../state.js";
import { on } from "../core/eventBus.js";

export const FAC_KEYS = ["hq", "serikat", "hero", "grem"];
export const FAC_LABEL = { hq: "HQ Bawang Suci", serikat: "Serikat Minion", hero: "Guild Hero", grem: "Kultus Grem" };

export function facValue(st, key) {
  const v = st.factions ? st.factions[key] : 50;
  return typeof v === "number" ? v : 50;
}

// Modifikator yang dipakai sistem lain. Semua turunan data faksi — tanpa hardcode tersebar.
export function modifiers(st) {
  return {
    // Serikat marah -> payroll naik; serikat senang -> loyalitas menahan biaya.
    payrollMul: 1 + Math.max(0, 50 - facValue(st, "serikat")) / 250,           // 1.00 .. 1.20
    // Hero kesal -> gelombang raid lebih ganas.
    heroRageMul: 1 + Math.max(0, 50 - facValue(st, "hero")) / 125,             // hp x1 .. x1.4
    // HQ percaya -> audit jarang menyapa. Grem senang -> kabar angin menguntungkan.
    hqLeniency: facValue(st, "hq") / 100,
    gremWhisper: facValue(st, "grem") / 100
  };
}

function drift() {
  mutate(st => {
    if (!st.factions) return;
    for (const k of FAC_KEYS) {
      const pull = (50 - st.factions[k]) * 0.06;   // gravitasi lembut ke titik netral
      const noise = (Math.random() - 0.5) * 5;
      st.factions[k] = Math.max(0, Math.min(100, Math.round(st.factions[k] + pull + noise)));
    }
  });
}

export function statusWord(v) {
  if (v >= 75) return { txt: "SANGAT SETIA", cls: "good" };
  if (v >= 55) return { txt: "HANGAT", cls: "" };
  if (v >= 40) return { txt: "NETRAL", cls: "" };
  if (v >= 25) return { txt: "MENDEKAM", cls: "warn" };
  return { txt: "SIAP PERANG", cls: "bad" };
}

let bound = false;
export function initFactions() {
  if (bound) return;
  bound = true;
  on("sim:newDay", drift);
}
