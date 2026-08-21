import { icon } from "./icons.js";

const LINES = [
  { t: "DungeonOS v6.6.6 boot...", c: "" },
  { t: "memori bawang: 64TB", c: "" },
  { t: "mount /dungeon ... OK", c: "ok" },
  { t: "serikat minion: TERDETEKSI", c: "warn" },
  { t: "HQ link: ENCRYPTED", c: "" },
  { t: "realitas: OPTIONAL", c: "" },
  { t: "siap. selamat bekerja, Boss.", c: "ok" }
];

export function renderBoot(screen, onComplete) {
  let finished = false;

  screen.innerHTML = `
    <div class="boot">
      <div class="boot-logo" id="boot-logo">${icon("onion")}</div>
      <h1>DungeonOS</h1>
      <p class="ver">v6.6.6 — Evil Management Suite</p>
      <div class="boot-log" id="boot-log"></div>
      <div class="boot-bar"><span></span></div>
      <div class="boot-hint" id="boot-hint" style="visibility:hidden">Ketuk untuk masuk ▸</div>
    </div>
  `;

  const logEl = screen.querySelector("#boot-log");
  const logo = screen.querySelector("#boot-logo");
  const hint = screen.querySelector("#boot-hint");

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(autoTimer);
    clearInterval(stepTimer);
    logo.classList.add("glitch");
    screen.removeEventListener("click", finish);
    setTimeout(onComplete, 260);
  }

  let i = 0;
  const stepTimer = setInterval(() => {
    if (i >= LINES.length) {
      clearInterval(stepTimer);
      return;
    }
    const ln = LINES[i++];
    const div = document.createElement("div");
    div.className = "line";
    const colored = ln.c ? `<span class="${ln.c}">${ln.t}</span>` : ln.t;
    div.innerHTML = colored + (i === LINES.length ? ` <span class="cursor"></span>` : "");
    logEl.appendChild(div);
    if (i === LINES.length) hint.style.visibility = "visible";
  }, 340);

  const autoTimer = setTimeout(finish, 3200);
  screen.addEventListener("click", finish);
}
