// public/js/state.js
const LS_SETTINGS = "sense_settings_v1";
const LS_OWNED = "sense_owned_v1";

export const state = {
  owned: {
    hand: [], // ["stick","light","glove"]
    foot: [], // ["shoes","leather","heel","zori"]
  },
  settings: {
    sound: "spatial", // spatial | mono
    pulse: "normal",  // low | normal | high
    light: "off",     // off | low
    hand: "none",     // none | stick | light | glove
    foot: "none",     // none | shoes | leather | heel | zori
  },
  runtime: {
    lastInputAt: performance.now(),
    idleMs: 0,
  },
};

export function loadState() {
  try {
    const s = localStorage.getItem(LS_SETTINGS);
    if (s) state.settings = { ...state.settings, ...JSON.parse(s) };
  } catch {}
  try {
    const o = localStorage.getItem(LS_OWNED);
    if (o) state.owned = { ...state.owned, ...JSON.parse(o) };
  } catch {}
}

export function saveSettings() {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(state.settings));
}

export function saveOwned() {
  localStorage.setItem(LS_OWNED, JSON.stringify(state.owned));
}

export function setSetting(key, value) {
  state.settings[key] = value;
  saveSettings();
}

export function hasItem(kind, id) {
  return (state.owned[kind] || []).includes(id);
}

export function touchInput() {
  state.runtime.lastInputAt = performance.now();
}

export function getIdleMs(now = performance.now()) {
  return Math.max(0, now - state.runtime.lastInputAt);
}
