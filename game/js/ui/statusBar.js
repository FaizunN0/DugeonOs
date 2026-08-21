import { icon } from "./icons.js";

let clockTimer = null;

function clock() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function renderStatusBar(element, state) {
  if (clockTimer) clearInterval(clockTimer);

  const unread = state.notifications.filter(n => !n.read).length;

  element.innerHTML = `
    <span class="sb-brand"><span class="mark">${icon("onion")}</span>DungeonOS</span>
    <span class="sb-time" id="sb-clock">${clock()}</span>
    <span class="sb-chips">
      <span class="sb-chip coin" title="Gold">${icon("coin")}<span>${state.stats.gold}</span></span>
      <span class="sb-chip bell ${unread > 0 ? "has-unread" : ""}" title="Notifikasi">
        ${icon("bell")}${unread > 0 ? `<span class="badge-dot"></span>` : ""}
      </span>
    </span>
  `;

  clockTimer = setInterval(() => {
    const el = element.querySelector("#sb-clock");
    if (el) el.textContent = clock();
  }, 1000);
}
