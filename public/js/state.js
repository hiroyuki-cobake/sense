export const state = {
  owned: {
    hand: [],
    foot: [],
  },
  settings: {
    hand: "none",
    foot: "none",
    sound: "spatial",
    pulse: "normal",
    light: "off",
  },
};

export function updateSetting(key, value) {
  state.settings[key] = value;
  localStorage.setItem("sense_settings", JSON.stringify(state.settings));
}

export function loadSettings() {
  const saved = localStorage.getItem("sense_settings");
  if (saved) {
    state.settings = JSON.parse(saved);
  }
}
