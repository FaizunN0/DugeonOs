// Prestige "Merger & Akuisisi" (Fase 4): jual perusahaan, mulai baru dengan Saham & perk permanen.
import { getState, mutate, addNotification, createInitialGameState } from "../state.js";
import { toast } from "../ui/toast.js";
import { emit } from "../core/eventBus.js";
import { TRAITS } from "../content/minions.js";

export const PERKS = {
  modal:    { name: "Modal Warisan",   desc: "+200g kas awal tiap run baru.",            max: 5 },
  merek:    { name: "Reputasi Merek",  desc: "+10 Reputasi awal tiap level.",            max: 5 },
  sdm:      { name: "SDM Unggul",      desc: "+1 minion Rajin gratis di roster awal.",   max: 3 },
  jaringan: { name: "Jaringan Pemasok",desc: "Harga trap -5% per level.",                max: 5 }
};
export const perkCost = lvl => 2 + lvl * 2;

function ensureMeta(st) {
  if (!st.meta || typeof st.meta !== "object") st.meta = { mergers: 0, saham: 0, perks: {} };
  for (const k of Object.keys(PERKS)) if (typeof st.meta.perks[k] !== "number") st.meta.perks[k] = 0;
}

export function perkLevel(key) {
  const st = getState();
  return (st.meta && st.meta.perks && st.meta.perks[key]) || 0;
}

export function valuation(st) {
  const traps = Object.keys((st.dungeonBuild || {}).traps || {}).length;
  const facAvg = ["hq", "serikat", "hero", "grem"].reduce((a, k) => a + (st.factions?.[k] ?? 50), 0) / 4;
  return Math.round(
    (st.stats.gold || 0) +
    (st.minionsCorp?.hired.length || 0) * 40 +
    traps * 25 +
    (st.stats.reputation || 0) * 2 +
    ((st.sim && st.sim.day) || 1) * 5 +
    facAvg * 0.5
  );
}
export const sahamGain = v => Math.max(1, Math.round(Math.sqrt(Math.max(1, v)) / 2));

// Jalankan merger: arsipkan run ke Museum, reset gameplay, pertahankan meta.
export function doMerger() {
  let summary = null;
  mutate(st => {
    ensureMeta(st);
    const v = valuation(st);
    const gain = sahamGain(v);
    const keep = {
      meta: JSON.parse(JSON.stringify(st.meta)),
      museum: Array.isArray(st.flags.museum) ? st.flags.museum : [],
      lowPerf: !!st.flags.lowPerf,
      schemaVersion: st.schemaVersion
    };
    keep.meta.mergers += 1;
    keep.meta.saham += gain;

    // Arsip ke Museum Perusahaan.
    keep.museum.push({
      archivedAt: new Date().toISOString(),
      day: (st.sim && st.sim.day) || 1,
      gold: st.stats.gold || 0,
      endingTitle: `Merger & Akuisisi #${keep.meta.mergers}`,
      note: `Dijual seharga ${v}g → ${gain} Saham. Pembeli tidak diberi tahu soal lorong 3.`
    });

    const fresh = createInitialGameState();
    for (const k of Object.keys(st)) delete st[k];
    Object.assign(st, fresh);
    st.schemaVersion = keep.schemaVersion;
    st.flags.museum = keep.museum;
    st.flags.lowPerf = keep.lowPerf;
    st.meta = keep.meta;

    // Terapkan perk ke run baru.
    st.stats.gold += 200 * keep.meta.perks.modal;
    st.stats.reputation = Math.min(100, (st.stats.reputation || 50) + 10 * keep.meta.perks.merek);
    for (let i = 0; i < keep.meta.perks.sdm; i++) {
      st.minionsCorp.hired.push({
        id: "w_sdm" + i, name: ["Ucok", "Beben", "Ratna"][i % 3], trait: "rajin",
        salary: TRAITS.rajin.salary, stamina: 100, morale: 85,
        job: "nganggur", resting: false, mogok: false
      });
    }
    if (keep.meta.perks.jaringan > 0) st.flags.trapDiscount = Math.max(0.75, 1 - 0.05 * keep.meta.perks.jaringan);

    summary = { value: v, gain, mergers: keep.meta.mergers };
  });
  if (summary) {
    addNotification("merger", "Merger ditandatangani", `Perusahaan lama terjual ${summary.value}g. Masuk kas... pihak konsorsium. Kamu dapat ${summary.gain} Saham.`);
    emit("social", { kind: "merger", text: `Merger #${summary.mergers}: perusahaan lama cair ${summary.value}g → ${summary.gain} Saham.` });
    toast(`Merger #${summary.mergers} selesai! +${summary.gain} Saham. Selamat memulai dari nol, lagi.`, { ico: "coin", cls: "toast-ok" });
    emit("econ:report", {});
    emit("minions:changed", {});
    emit("dungeon:changed", {});
  }
  return summary;
}

export function buyPerk(key) {
  const def = PERKS[key];
  if (!def) return false;
  let ok = false;
  mutate(st => {
    ensureMeta(st);
    const lvl = st.meta.perks[key] || 0;
    if (lvl >= def.max) return;
    const cost = perkCost(lvl);
    if (st.meta.saham < cost) return;
    st.meta.saham -= cost;
    st.meta.perks[key] = lvl + 1;
    ok = true;
  });
  if (ok) toast(`${def.name} naik level. Investasi masa depan yang tidak akan dilupakan rapat.`, { ico: "coin", cls: "toast-ok" });
  else toast("Saham kurang atau level maksimal.", { ico: "coin", cls: "toast-bad" });
  return ok;
}
