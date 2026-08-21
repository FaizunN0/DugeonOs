const SAVE_PREFIX = "dungeon_union_save_";

export function saveGame(slot, state) {
  const key = `${SAVE_PREFIX}${slot}`;

  const payload = {
    version: state.version,
    slot,
    timestamp: new Date().toISOString(),
    state
  };

  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.error("Save failed:", error);
  }
}

export function loadGame(slot) {
  const key = `${SAVE_PREFIX}${slot}`;
  const raw = localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Save corrupt:", error);
    return null;
  }
}

export function deleteSave(slot) {
  const key = `${SAVE_PREFIX}${slot}`;
  localStorage.removeItem(key);
}

export function hasSave(slot) {
  const key = `${SAVE_PREFIX}${slot}`;
  return Boolean(localStorage.getItem(key));
}