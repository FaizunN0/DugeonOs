// SoundStone v2 — APP RENEWAL W5. Playlist BGM procedural + chord pad +
// NOW-PLAYING BAR dengan ekualiser (animasi transform-only, hormati Mode Hemat).
import { getState, mutate } from "../state.js";
import { icon } from "../ui/icons.js";
import { Sound } from "../lib.js";
import { mgSession } from "../ui/kit/mg.js";

const TRACKS = [
  { name: "Dungeon Lullaby", sub: "BGM malam bawah tanah", freq: 392 },
  { name: "Trap Techno",     sub: "Beat untuk pasang jebakan", freq: 523 },
  { name: "Union Anthem",    sub: "Hymne mogok minion",        freq: 330 },
  { name: "Hero's Downfall", sub: "Soundtrack boss fight",     freq: 262 },
  { name: "Onion Waltz",     sub: "Melodi Grem",               freq: 440 }
];

let sess = null;

function body(s) {
  const playing = typeof s.flags.jukeTrack === "number" ? s.flags.jukeTrack : -1;
  const bgm = Sound.bgmTracks();
  const bgmOn = Sound.bgmIsPlaying();
  const bgmT = Sound.bgmTrack();
  const npTrack = bgmOn ? bgm[bgmT]?.name : playing >= 0 ? TRACKS[playing].name : null;
  return `
  <div id="ss-root" class="ss-wrap">
    <p class="app-lead">SoundStone — pemutar sihir dungeon. BGM procedural tanpa copyright, chord cepat tanpa rasa bersalah.</p>

    <div class="bgm-head">🎵 BGM DUNGEON <button class="bgm-stop" id="ss-bgm-stop">${bgmOn ? "Stop" : "Mati"}</button></div>
    <div class="bgm-grid">${bgm.map((t, i) => `
      <div class="bgm-track ${bgmOn && bgmT === i ? "on" : ""}" data-bgm="${i}">
        <button class="bgm-play">${icon(bgmOn && bgmT === i ? "sound" : "music")}</button>
        <div class="bgm-name">${t.name}</div>
      </div>`).join("")}</div>

    <div class="juke-sep">— atau mainkan chord cepat —</div>
    <canvas class="juke-vis" id="juke-vis"></canvas>
    <div class="juke">${TRACKS.map((t, i) => `
      <div class="juke-track ${playing === i ? "playing" : ""}" data-track="${i}">
        <button class="juke-play" data-play="${i}">${icon(playing === i ? "sound" : "jukebox")}</button>
        <div class="juke-meta"><div class="juke-name">${t.name}</div><div class="juke-sub">${t.sub}</div></div>
      </div>`).join("")}</div>

    <div class="ss-nowbar ${npTrack ? "on" : ""}">
      <span class="ss-eq"><i></i><i></i><i></i><i></i></span>
      <div class="ss-np-txt"><small>NOW PLAYING</small><b>${npTrack || "—"}</b></div>
      ${bgmOn ? `<button class="hq-btn danger" id="ss-bgm-stop2">■</button>` : ""}
    </div>
    <div class="db-comment">Volume global ikut pengaturan perangkat. Mode Hemat mematikan visualizer demi baterai.</div>
  </div>`;
}

function bodyVis(s) { return body(s); }

export const soundstone = (s) => ({
  body: bodyVis(s),
  mount(screen, state, handlers) {
    const root = screen.querySelector("#ss-root");
    if (!root) return;
    sess?.end();
    sess = mgSession(root);

    const stopBgm = () => {
      Sound.bgmStop();
      mutate(st => { st.flags.jukeTrack = -1; });
      handlers.rerender();
    };
    root.querySelector("#ss-bgm-stop")?.addEventListener("click", stopBgm);
    root.querySelector("#ss-bgm-stop2")?.addEventListener("click", stopBgm);

    root.querySelectorAll("[data-bgm]").forEach(el => el.addEventListener("click", () => {
      const i = Number(el.dataset.bgm);
      if (Sound.bgmIsPlaying() && Sound.bgmTrack() === i) return stopBgm();
      Sound.bgmStart(i);
      handlers.rerender();
    }));

    // Visualizer kecil (canvas), matikan total di perf mode.
    const cv = screen.querySelector("#juke-vis");
    const perf = document.body.classList.contains("perf");
    if (cv && !perf) {
      const ctx = cv.getContext("2d");
      cv.width = cv.clientWidth || 280; cv.height = 46;
      let t = 0;
      sess.interval(() => {
        t += 0.08;
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.fillStyle = "#7a3df0";
        for (let x = 0; x < cv.width; x += 7) {
          const h = 6 + Math.abs(Math.sin(t + x * 0.05)) * 30;
          ctx.fillRect(x, cv.height - h, 4, h);
        }
      }, 60);
    }
  }
});
