// Floating, non-blocking toasts (stat changes, events).
import { icon } from "./icons.js";

let host = null;
function ensureHost() {
  if (host && host.isConnected) return host;
  host = document.createElement("div");
  host.id = "toast-host";
  host.setAttribute("aria-live", "polite");
  document.body.appendChild(host);
  return host;
}

const TONE = {
  gold:    { ico: "coin",   cls: "toast-gold" },
  morale:  { ico: "heart",  cls: "toast-good" },
  stability: { ico: "shield", cls: "toast-good" },
  reputation: { ico: "star", cls: "toast-good" },
  unionPower: { ico: "union", cls: "toast-bad" },
  loot:    { ico: "trapmart", cls: "toast-gold" },
  bugLevel: { ico: "skull", cls: "toast-bad" },
  devSuspicion: { ico: "devconsole", cls: "toast-bad" }
};

const LABEL = {
  gold: "Gold", morale: "Morale", stability: "Stabilitas", reputation: "Reputasi",
  unionPower: "Serikat", loot: "Loot", bugLevel: "Bug", devSuspicion: "Curiga HQ"
};

export function toast(msg, opts = {}) {
  const h = ensureHost();
  const el = document.createElement("div");
  el.className = "toast " + (opts.cls || "toast-info");
  if (opts.ico) {
    const i = document.createElement("span");
    i.className = "toast-ico";
    i.innerHTML = icon(opts.ico);
    el.appendChild(i);
  }
  const span = document.createElement("span");
  span.className = "toast-msg";
  span.textContent = msg;
  el.appendChild(span);
  h.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  const ttl = opts.ttl || 1700;
  setTimeout(() => { el.classList.add("hide"); setTimeout(() => el.remove(), 320); }, ttl);
}

export function emitStatToasts(delta) {
  for (const k of Object.keys(delta)) {
    const d = delta[k];
    if (!d) continue;
    const t = TONE[k] || { ico: "sparkle", cls: "toast-info" };
    const sign = d > 0 ? "+" : "";
    toast(`${LABEL[k] || k} ${sign}${d}`, { ico: t.ico, cls: t.cls });
  }
}
