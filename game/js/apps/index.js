// Registry aplikasi modular. Nambah app = buat folder/file + daftar di sini.
import { tokooren } from "./tokooren.js";
import { cctv } from "./cctv.js";
import { hqOps } from "./hq.js";
import { trapmart } from "./trapmart.js";
import { heroalert } from "./heroalert.js";
import { flappy } from "./flappy.js";
import { judi } from "./judi.js";
import { dungeonbuild } from "./dungeonbuild.js";
import { merger } from "./merger.js";
import { runeForge } from "./runeforge.js";
import { monopoliApp } from "./monopoli.js";
import { dungeongram } from "./dungeongram.js";
import { unionDesk } from "./uniondesk.js";
import { minionApp } from "./minionapp.js";
import { codex } from "./codex.js";
import { ramalan } from "./ramalan.js";
import { orakelApp } from "./orakel.js";
import { faxOrg } from "./faxorg.js";
import { soundstone } from "./soundstone.js";
import { bawangpedia } from "./gallery.js";
import { bazzaarApp } from "./bazzaar.js";

export const NEW_VIEWS = { tokooren, cctv, dungeonhub: hqOps, dungeonbuild, merger, physics: runeForge, monopoli: monopoliApp, trapmart, heroalert, flappy, judi, dungeongram, union: unionDesk, minion: minionApp, codex, weather: ramalan, orakel: orakelApp, faction: faxOrg, jukebox: soundstone, gallery: bawangpedia, bazzaar: bazzaarApp };
export { dungeonhub as LEGACY_HUB } from "./dungeonhub.js"; // shift langsung (dipakai Fase 1 lanjutan)
export { renderFeedNew as NEW_RENDERFEED } from "./feed.js";
