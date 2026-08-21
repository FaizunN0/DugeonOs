// Sistem ikon SVG konsisten (stroke = currentColor).
// Semua viewBox 24x24, gaya outline unified.

const S = (inner) => {
  return `<svg class="ico" viewBox="0 0 24 24" width="100%" height="100%" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${inner}</svg>`;
};

export const ICONS = {
  minion: S(`
    <path d="M5 13a7 7 0 0 1 14 0v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/>
    <circle cx="9.2" cy="13.5" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="14.8" cy="13.5" r="1.3" fill="currentColor" stroke="none"/>
    <path d="M10.5 17.5c.8.7 1.7 1 2.5 1s1.7-.3 2.5-1"/>
    <path d="M9 9.5 7.5 7M15 9.5 16.5 7"/>
  `),

  union: S(`
    <path d="M9 11V8a3 3 0 0 1 6 0v3"/>
    <path d="M6 11h12v2a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z"/>
    <path d="M12 8V5M12 5c-1 0-2 .8-2 1.6M12 5c1 0 2 .8 2 1.6"/>
  `),

  trapmart: S(`
    <circle cx="12" cy="12" r="8.5"/>
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>
    <path d="M12 8.5 13.6 12 12 15.5 10.4 12z" fill="currentColor" stroke="none" opacity=".9"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
  `),

  heroalert: S(`
    <path d="M12 3.5 21 19H3z"/>
    <path d="M12 10v4"/>
    <path d="M12 16.6h.01"/>
    <path d="M16.5 13l2-2 1.5 1.5-2 2z" opacity=".85"/>
  `),

  dungeongram: S(`
    <rect x="3" y="4.5" width="18" height="15" rx="4.5"/>
    <circle cx="12" cy="12" r="3.6"/>
    <path d="M16.5 7.5h.01"/>
    <path d="M8.5 18.5c1.5-3 6.5-3 8 0"/>
  `),

  settings: S(`
    <circle cx="12" cy="12" r="3.2"/>
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"/>
  `),

  devconsole: S(`
    <rect x="2.5" y="4" width="19" height="16" rx="3"/>
    <path d="M6.5 9.5 9.5 12l-3 2.5"/>
    <path d="M12.5 15h5"/>
  `),

  feed: S(`
    <path d="M4 6.4A2.4 2.4 0 0 1 6.4 4h11.2A2.4 2.4 0 0 1 20 6.4v7.2A2.4 2.4 0 0 1 17.6 16H10l-4.2 4v-4H6.4"/>
    <circle cx="9" cy="10" r="1.05" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="10" r="1.05" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="10" r="1.05" fill="currentColor" stroke="none"/>
  `),

  patchnote: S(`
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/>
    <path d="M14 3v4h4"/>
    <path d="M8.5 11h7M8.5 14h7M8.5 17h4"/>
  `),

  back: S(`<path d="M14.5 5.5 8 12l6.5 6.5"/>`),

  hourglass: S(`
    <path d="M6.5 3.5h11M6.5 20.5h11"/>
    <path d="M7 4c0 5 4 6 4 8s-4 3-4 8M17 4c0 5-4 6-4 8s4 3 4 8"/>
  `),

  gift: S(`
    <rect x="3.5" y="9" width="17" height="11" rx="1.5"/>
    <path d="M3.5 12.5h17"/>
    <path d="M12 9v11"/>
    <path d="M12 9c-1.4-3-5-2-4 0.6M12 9c1.4-3 5-2 4 0.6"/>
  `),

  scroll: S(`
    <path d="M6 4h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H6"/>
    <path d="M6 4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2"/>
    <path d="M9 8h7M9 11h7"/>
  `),

  cctv: S(`
    <path d="M3 8h11l4 3v5H3z"/>
    <path d="M3 8V6h3M7 6h4M3 16v2M17 16v2"/>
    <circle cx="7" cy="11.5" r="1.4" fill="currentColor" stroke="none"/>
  `),
  cart: S(`
    <path d="M3 4h2l2 11h11l2-7H7"/>
    <circle cx="9" cy="19" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="17" cy="19" r="1.5" fill="currentColor" stroke="none"/>
  `),
  hub: S(`
    <circle cx="12" cy="5" r="2.2"/>
    <circle cx="5" cy="18" r="2.2"/>
    <circle cx="19" cy="18" r="2.2"/>
    <path d="M12 7.2 6.4 16M12 7.2 17.6 16M7 18h10"/>
  `),
  rider: S(`
    <circle cx="12" cy="5" r="2.1"/>
    <path d="M12 7v6M9 13l3 4 3-4M8 21l1.5-5h5L16 21"/>
  `),
  food: S(`
    <path d="M4 11h16a8 8 0 0 1-16 0Z"/>
    <path d="M3 11v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M12 11V5M9 5h6"/>
  `),
  wallet: S(`
    <rect x="3" y="6" width="18" height="13" rx="2.4"/>
    <path d="M3 9h18M16 13h2"/>
  `),
  store: S(`
    <path d="M4 9 5 4h14l1 5M4 9v10h16V9M4 9h16"/>
    <path d="M9 13h6"/>
  `),
  truck: S(`
    <rect x="2" y="7" width="12" height="9" rx="1.4"/>
    <path d="M14 10h4l3 3v3h-7z"/>
    <circle cx="6.5" cy="18" r="1.6" fill="currentColor" stroke="none"/>
    <circle cx="17" cy="18" r="1.6" fill="currentColor" stroke="none"/>
  `),


  bell: S(`
    <path d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.5 1.8 6.3.4.5 0 1.2-.8 1.2H5c-.8 0-1.2-.7-.8-1.2C4.8 14.5 6 13 6 9Z"/>
    <path d="M9.8 19.5a2.4 2.4 0 0 0 4.4 0"/>
  `),

  coin: S(`
    <circle cx="12" cy="12" r="8.5"/>
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 8.2v7.6M9.8 10.1h2.7c1 0 1.7.6 1.7 1.4s-.7 1.4-1.7 1.4H9.8"/>
  `),

  onion: S(`
    <path d="M12 20c4.2 0 7-2.6 7-6.2 0-3-2.4-5-4.6-6.7C13.7 5.8 12.9 4.7 12 3.5c-.9 1.2-1.7 2.3-2.4 3.6C7.4 8.8 5 10.8 5 13.8 5 17.4 7.8 20 12 20Z"/>
    <path d="M12 20c-1.6-3-2-6.4 0-9.4M12 20c1.6-3 2-6.4 0-9.4" opacity=".7"/>
    <path d="M5.5 13.8c2 .9 4.6 1.1 6.5.4M18.5 13.8c-2 .9-4.6 1.1-6.5.4" opacity=".7"/>
  `),

  restart: S(`
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/>
    <path d="M19.5 4.5V9h-4.5"/>
  `),

  sparkle: S(`
    <path d="M12 3.5c.6 3.8 1.7 4.9 5.5 5.5-3.8.6-4.9 1.7-5.5 5.5-.6-3.8-1.7-4.9-5.5-5.5 3.8-.6 4.9-1.7 5.5-5.5Z"/>
    <path d="M18.5 14.5c.3 1.7.8 2.2 2.5 2.5-1.7.3-2.2.8-2.5 2.5-.3-1.7-.8-2.2-2.5-2.5 1.7-.3 2.2-.8 2.5-2.5Z" opacity=".8"/>
  `),

  heart: S(`<path d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.6 12 20 12 20Z" fill="currentColor" stroke="none"/>`),

  skull: S(`
    <path d="M12 3.5c-4.2 0-7 2.9-7 6.6 0 2.2 1 3.7 2.4 4.7V17a2 2 0 0 0 2 2h.6v-2h1.2v2h1.6v-2h1.2v2h.6a2 2 0 0 0 2-2v-2.2c1.4-1 2.4-2.5 2.4-4.7 0-3.7-2.8-6.6-7-6.6Z"/>
    <circle cx="9.2" cy="11" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="14.8" cy="11" r="1.3" fill="currentColor" stroke="none"/>
  `),

  star: S(`<path d="M12 3.5l2.4 5 5.5.8-4 3.9 1 5.5-4.9-2.6L6.6 18.7l1-5.5-4-3.9 5.5-.8z" fill="currentColor" stroke="none"/>`),

  shield: S(`
    <path d="M12 2.6 19.5 6v6c0 4.4-3.2 7.8-7.5 9.4C7.7 19.8 4.5 16.4 4.5 12V6z"/>
    <path d="M12 7.5v9M8.5 10.5h7M8.5 13.5h7" opacity=".8"/>
  `),

  codex: S(`
    <path d="M5 4.5h9a3 3 0 0 1 3 3V19a2 2 0 0 0-2-2H5z"/>
    <path d="M5 4.5v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5a3 3 0 0 0-3-3"/>
    <path d="M9 8.5h5M9 11.5h5M9 14.5h3" opacity=".8"/>
  `),

  jukebox: S(`
    <path d="M9 17V9l8-2v8"/>
    <circle cx="6.5" cy="17" r="2.6"/>
    <circle cx="14.5" cy="15" r="2.6"/>
    <path d="M16 13.4V6.2" opacity=".85"/>
  `),

  music: S(`
    <path d="M9 17V5l10-2v12"/>
    <circle cx="6.5" cy="17" r="2.6"/>
    <circle cx="16.5" cy="15" r="2.6"/>
  `),

  physics: S(`
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>
    <ellipse cx="12" cy="12" rx="9" ry="3.6"/>
    <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>
  `),

  weather: S(`
    <path d="M7 16a4 4 0 0 1 .5-7.9 5 5 0 0 1 9.6 1.2A3.5 3.5 0 0 1 17 16z"/>
    <path d="M9 18.5l-1 1.6M12 18.5l-1 1.6M15 18.5l-1 1.6" opacity=".85"/>
  `),

  gallery: S(`
    <rect x="3.5" y="4.5" width="17" height="15" rx="3"/>
    <circle cx="9" cy="10" r="2"/>
    <path d="M5 17l4.5-4.5 3 3L16 11l3 3.5"/>
  `),

  mail: S(`
    <rect x="3" y="5.5" width="18" height="13" rx="3"/>
    <path d="M4 7l8 5.5L20 7"/>
  `),

  magic: S(`
    <path d="M14 3.5 15.2 7l3.5 1.2-3.5 1.2L14 13l-1.2-3.5L9.3 8.2 12.8 7z" fill="currentColor" stroke="none"/>
    <path d="M6 14.5 6.8 17l2.2.8-2.2.8L6 20.5l-.8-2.2L3 17.8l2.2-.8z" fill="currentColor" stroke="none" opacity=".9"/>
  `),

  bolt: S(`<path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor" stroke="none"/>`),

  flask: S(`
    <path d="M9 3h6M10 3v6l-4 8a2 2 0 0 0 1.8 3h8.4A2 2 0 0 0 18 17l-4-8V3"/>
    <path d="M7.5 13h9" opacity=".8"/>
  `),

  upgrade: S(`
    <path d="M12 3 6 11h4v9h4v-9h4z" fill="currentColor" stroke="none"/>
  `),

  bird: S(`
    <path d="M4 14c4 0 6-2 9-6 2-2.5 5-3 5-3s-1 4-3 6c-2 2-5 3-8 3-1.5 0-3 .5-3 0z"/>
    <circle cx="13" cy="8.5" r="1" fill="currentColor" stroke="none"/>
    <path d="M18 5l2-1-1 2" />
  `),

  slot: S(`
    <rect x="3.5" y="3.5" width="17" height="17" rx="3"/>
    <circle cx="9" cy="11" r="3.2"/>
    <circle cx="15" cy="11" r="3.2" opacity=".7"/>
    <path d="M7 17h10" />
  `),


  sound: S(`
    <path d="M5 9.5v5h3l4 3.5v-12L8 9.5z"/>
    <path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12" opacity=".85"/>
  `),

  /* ---- creatures (replace emoji in roster / codex) ---- */
  goblin: S(`
    <path d="M7 13a5 5 0 0 1 10 0v3a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z"/>
    <path d="M5.5 9 4 5M18.5 9 20 5" stroke-width="1.6"/>
    <circle cx="9.5" cy="14" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="14.5" cy="14" r="1.2" fill="currentColor" stroke="none"/>
    <path d="M9.5 17c1 .8 4 .8 5 0"/>
  `),
  slime: S(`
    <path d="M5 16c0-5 3-9 7-9s7 4 7 9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"/>
    <circle cx="10" cy="14" r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="14" cy="14" r="1.1" fill="currentColor" stroke="none"/>
  `),
  skeleton: S(`
    <circle cx="12" cy="9" r="5"/>
    <circle cx="10" cy="9" r="1" fill="currentColor" stroke="none"/>
    <circle cx="14" cy="9" r="1" fill="currentColor" stroke="none"/>
    <path d="M12 14v6M9 16h6M9.5 20l3-2 3 2"/>
  `),
  ghost: S(`
    <path d="M6 19v-7a6 6 0 0 1 12 0v7l-2-2-2 2-2-2-2 2-2-2Z"/>
    <circle cx="9.5" cy="11" r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="14.5" cy="11" r="1.1" fill="currentColor" stroke="none"/>
  `),
  heroCrest: S(`
    <path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6z"/>
    <path d="M9 12l2 2 4-4"/>
  `),
  saint: S(`
    <path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6z"/>
    <path d="M12 9v6M9 12h6"/>
  `),
  hqOrb: S(`
    <circle cx="12" cy="12" r="8"/>
    <circle cx="12" cy="12" r="3.4"/>
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>
  `),
  holyOnion: S(`
    <path d="M12 20c4.2 0 7-2.6 7-6.2 0-3-2.4-5-4.6-6.7C13.7 5.8 12.9 4.7 12 3.5c-.9 1.2-1.7 2.3-2.4 3.6C7.4 8.8 5 10.8 5 13.8 5 17.4 7.8 20 12 20Z"/>
    <path d="M12 20c-1.6-3-2-6.4 0-9.4M12 20c1.6-3 2-6.4 0-9.4" opacity=".7"/>
    <path d="M8 9l1.5-1.5M16 9l-1.5-1.5" opacity=".8"/>
  `),
  voidHole: S(`
    <ellipse cx="12" cy="12" rx="8" ry="5"/>
    <ellipse cx="12" cy="12" rx="4" ry="2.4" fill="currentColor" stroke="none" opacity=".5"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" opacity=".6"/>
  `),

  /* ---- weather (replace emoji) ---- */
  wRain: S(`
    <path d="M7 14a4 4 0 0 1 .5-7.9 5 5 0 0 1 9.6 1.2A3.5 3.5 0 0 1 17 14z"/>
    <path d="M8 17l-1 2.5M12 17l-1 2.5M16 17l-1 2.5" opacity=".85"/>
  `),
  wStorm: S(`
    <path d="M7 13a4 4 0 0 1 .5-7.9 5 5 0 0 1 9.6 1.2A3.5 3.5 0 0 1 17 13z"/>
    <path d="M12 13l-2 4h3l-2 4" fill="currentColor" stroke="none"/>
  `),
  wBless: S(`
    <circle cx="12" cy="9" r="5"/>
    <path d="M12 2v2M12 14v2M5 9H3M21 9h-2M7 4l1.5 1.5M17 4l-1.5 1.5" opacity=".8"/>
    <path d="M9 20c1.5-1.5 4.5-1.5 6 0"/>
  `),
  wCurse: S(`
    <path d="M7 14a4 4 0 0 1 .5-7.9 5 5 0 0 1 9.6 1.2A3.5 3.5 0 0 1 17 14z"/>
    <path d="M9 17c1 1 5 1 6 0M10 20c1 .8 3 .8 4 0" opacity=".8"/>
  `),
  wClear: S(`
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" opacity=".8"/>
  `),

  /* ---- meme glyphs (replace emoji in gallery) ---- */
  memeOnion: S(`
    <path d="M12 20c4.2 0 7-2.6 7-6.2 0-3-2.4-5-4.6-6.7C13.7 5.8 12.9 4.7 12 3.5c-.9 1.2-1.7 2.3-2.4 3.6C7.4 8.8 5 10.8 5 13.8 5 17.4 7.8 20 12 20Z"/>
    <path d="M12 20c-1.6-3-2-6.4 0-9.4M12 20c1.6-3 2-6.4 0-9.4" opacity=".7"/>
  `),
  memeTrap: S(`
    <circle cx="12" cy="12" r="8.5"/>
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>
    <path d="M12 8.5 13.6 12 12 15.5 10.4 12z" fill="currentColor" stroke="none" opacity=".9"/>
  `),
  memeSign: S(`
    <rect x="5" y="4" width="14" height="11" rx="2"/>
    <path d="M12 15v5M9 20h6"/>
    <path d="M8.5 9h7M8.5 12h5" opacity=".8"/>
  `),
  memeGem: S(`
    <path d="M6 4h12l3 5-9 11L3 9z"/>
    <path d="M3 9h18M9 4 6 9l6 11M15 4l3 5-6 11" opacity=".7"/>
  `),
  memeHero: S(`
    <path d="M12 3.2 13.6 8l4.8 1.4-3.6 3 1 4.8L12 14.8 8.2 17l1-4.8-3.6-3L10.4 8z" opacity=".9"/>
  `),
  memeFlask: S(`
    <path d="M9 3h6M10 3v6l-4 8a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-4-8V3"/>
    <path d="M7.5 14h9" opacity=".8"/>
  `),
  moodHappy: S(`
    <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,.06)"/>
    <circle cx="8.5" cy="10" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="10" r="1.3" fill="currentColor" stroke="none"/>
    <path d="M8 14.4c1.2 1.8 6.8 1.8 8 0" stroke-width="1.8" stroke-linecap="round"/>
  `),
  moodNeutral: S(`
    <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,.06)"/>
    <circle cx="8.5" cy="10" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="10" r="1.3" fill="currentColor" stroke="none"/>
    <path d="M8 14.6h8" stroke-width="1.8" stroke-linecap="round"/>
  `),
  moodAngry: S(`
    <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,.06)"/>
    <path d="M7 8.6 10 10" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M17 8.6 14 10" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="9" cy="11.6" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="11.6" r="1.2" fill="currentColor" stroke="none"/>
    <path d="M8.2 16Q12 17.6 15.8 16" stroke-width="1.8" stroke-linecap="round"/>
  `),
  moodRage: S(`
    <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,.06)"/>
    <path d="M6.6 8 10 9.6" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M17.4 8 14 9.6" stroke-width="1.7" stroke-linecap="round"/>
    <circle cx="9" cy="11.6" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="11.6" r="1.2" fill="currentColor" stroke="none"/>
    <path d="M8 16.4Q12 18.4 16 16.4" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M18.4 5.2 20.2 7M20.4 4.6 21.6 5.8M18 7.4 19.4 8.8" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
  `)
};

export function icon(name, className = "") {
  const svg = ICONS[name];
  if (!svg) return "";
  return className ? svg.replace('class="ico"', `class="ico ${className}"`) : svg;
}

export function avatar(kind = "os") {
  const map = {
    os: icon("onion"),
    grem: S(`
      <circle cx="12" cy="9.5" r="5.2"/>
      <circle cx="10" cy="9" r="1" fill="currentColor" stroke="none"/>
      <circle cx="14" cy="9" r="1" fill="currentColor" stroke="none"/>
      <path d="M9.5 12c1 .8 4 .8 5 0"/>
      <path d="M12 14.7V19M7.5 21c1.5-2 7.5-2 9 0"/>
      <path d="M7 7 5 4.5M17 7l2-2.5"/>
    `),
    hero: S(`
      <path d="M12 3.2 13.6 8l4.8 1.4-3.6 3 1 4.8L12 14.8 8.2 17l1-4.8-3.6-3L10.4 8z" opacity=".9"/>
      <path d="M12 14.8V21"/>
    `),
    union: icon("union"),
    devconsole: icon("devconsole"),
    hero: icon("heroCrest")
  };
  return map[kind] || icon("onion");
}
