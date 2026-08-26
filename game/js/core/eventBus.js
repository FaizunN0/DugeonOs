// EventBus mini — sistem berkomunikasi lewat event, bukan saling import.
// API: on(name, fn) -> unsubscribe, off(name, fn), emit(name, payload)
const listeners = new Map();

export function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => off(name, fn);
}

export function off(name, fn) {
  const set = listeners.get(name);
  if (set) set.delete(fn);
}

export function emit(name, payload) {
  const set = listeners.get(name);
  if (!set) return;
  for (const fn of [...set]) {
    try { fn(payload); }
    catch (err) { console.error(`[bus] listener "${name}" error`, err); }
  }
}
