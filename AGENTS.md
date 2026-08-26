# DungeonOS — Aturan Main Repo (v1.0 "Boss Sejati")

## Deployment & validasi
- Statis tanpa build: ES modules murni. **Push ke master = deploy Vercel otomatis** → setiap commit WAJIB dalam kondisi playable.
- Sebelum commit, validasi tiap file JS yang berubah sebagai module:
  `cp file.js /tmp/x.mjs && node --check /tmp/x.mjs`
- Browser tidak ada di lingkungan dev → selalu minta user hard-refresh saat menguji.

## Arsitektur (Fase 0+)
- `js/core/` — state, save, engine, eventBus. Antar-sistem berkomunikasi lewat **eventBus** (`emit`/`on`), dilarang saling import langsung.
- `js/apps/<nama>.js` — **satu app = satu modul**, diekspor & didaftarkan di `js/apps/index.js`. Helper lintas-app taruh di `js/apps/shared.js`.
- `js/ui/kit/` — komponen UI reusable (`modal.js`, `sheet.js`, `live.js`, `elements.js`, `mg.js`). Fitur baru dilarang menulis innerHTML raksasa; pakai kit.
- `js/content/` — **data-driven**: memes, endings, story, chapters, minions, jobs, traps, heroes, seasons, runes. *Balancing = edit data, bukan bedah logika.*
- `SCHEMA_VERSION` di `js/state.js` wajib naik setiap bentuk save berubah. Save pra-v2 otomatis diarsipkan ke **Museum Perusahaan** lalu reset total (kesepakatan v1.0).

## Standar APP RENEWAL v1.1
- **Gold selalu live**: jangan render angka gold manual — pakai `${liveGoldHtml()}` dari `ui/kit/live.js`; `bindLiveGold(screen)` sudah otomatis dipanggil di appScreen & homeScreen.
- **Mini-game wajib** pakai sesi `mgSession()` dari `ui/kit/mg.js`: input diskrit (tanpa reflex physics mentah), logika murni terpisah dari DOM, semua timer lewat session, auto-cleanup saat app ditutup.
- **Bottom-sheet** untuk aksi/konfirmasi mobile: `openSheet()` dari `ui/kit/sheet.js`.
- Tab dalam app: `subnav()/bindSubnav()/currentSubnav()` dari `ui/kit/elements.js`.

## Performa
- Animasi hanya `transform`/`opacity`, tambahkan `will-change` bila perlu; dilarang `filter` pada elemen yang dianimasikan.
- Mode Hemat (`body.perf`) wajib terus menghormati: semua efek visual baru harus ikut mati di perf mode.

## Tone konten
Satir · komedi · fantasi absurd, tidak menyasar pihak nyata. Lore sentral: **Mentri King Mouse masih dicari**.
