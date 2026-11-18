const key = 'aster-tide-save-v1';

export function loadSave(missionCount) {
  try {
    const save = JSON.parse(window.localStorage.getItem(key));
    if (!Array.isArray(save?.completed) || save.completed.length > missionCount ||
        !save.completed.every((number, index) => number === index + 1) ||
        !Number.isSafeInteger(save.cash) || save.cash < 0) return null;
    return save;
  } catch {
    return null;
  }
}

export function writeSave(save) {
  try {
    window.localStorage.setItem(key, JSON.stringify(save));
  } catch {
    // Play can continue when the browser denies storage.
  }
}
