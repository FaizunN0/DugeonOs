// Glue simulasi: nyalakan jam dunia + semua sistem pendukung (Fase 1-3).
import { startSimClock } from "../core/time.js";
import { initEconomy } from "./economy.js";
import { initMinionSystems } from "./minions.js";
import { initFactions } from "./factions.js";
import { initCampaign } from "./campaign.js";
import { initEndingsV1 } from "./endings_v1.js";
import { initSocial } from "./social.js";

export function startSim() {
  // Urutan penting: minion (gajian) dulu, lalu ekonomi menutup buku
  // sehingga payroll terhitung di hari yang sama.
  initMinionSystems();
  initEconomy();
  initFactions();
  initCampaign();
  initEndingsV1();
  initSocial();
  startSimClock();
}
