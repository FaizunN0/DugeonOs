// mgSession — standar anti-bug untuk semua mini-game baru (APP RENEWAL v1.1).
// Aturan: (1) input diskrit, (2) logika murni dipisah dari DOM,
// (3) SEMUA timer/interval lewat helper ini agar otomatis dibersihkan,
// (4) callback tidak pernah jalan setelah app ditutup / kontainer lepas.
//
// Pemakaian:
//   const s = mgSession(container);
//   s.timer(nextRound, 900);            // setTimeout aman
//   s.interval(tick, 100);              // setInterval aman
//   s.cleanup(() => cancelSomething()); // bersih-bersih tambahan
//   ... saat selesai: s.end();
export function mgSession(container) {
  const cleanups = [];
  let alive = true;
  const isAlive = () => alive && document.contains(container);

  return {
    alive: isAlive,
    cleanup(fn) { if (typeof fn === "function") cleanups.push(fn); },
    timer(fn, ms) {
      const id = setTimeout(() => { if (isAlive()) fn(); }, ms);
      this.cleanup(() => clearTimeout(id));
      return id;
    },
    interval(fn, ms) {
      const id = setInterval(() => { if (!isAlive()) { this.end(); return; } fn(); }, ms);
      this.cleanup(() => clearInterval(id));
      return id;
    },
    end() {
      if (!alive) return;
      alive = false;
      for (const f of cleanups.splice(0)) { try { f(); } catch { /* noop */ } }
    }
  };
}
