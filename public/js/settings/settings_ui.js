// public/js/settings/settings_ui.js
import { state, setSetting, saveSettings } from "../state.js";

const SETTINGS_CONFIG = [
  { key: "sound", label: "sound field", options: ["spatial", "mono"] },
  { key: "light", label: "light", options: ["off", "low"] },
  { key: "pulse", label: "pulse", options: ["low", "normal", "high"] },
  { key: "hand", label: "bring what you have (hand)", options: ["none", "stick", "light", "glove"] },
  { key: "foot", label: "bring what you have (foot)", options: ["none", "shoes", "leather", "heel", "zori"] },
];

export function initSettingsUI() {
  const overlay = document.getElementById("settingsOverlay");
  const list = document.getElementById("settingsList");
  const closeBtn = document.getElementById("settingsClose");

  list.innerHTML = "";

  const shuffled = [...SETTINGS_CONFIG].sort(() => Math.random() - 0.5);

  for (const item of shuffled) {
    const row = document.createElement("div");
    row.className = "setting-item";

    const label = document.createElement("span");
    label.textContent = item.label;

    const select = document.createElement("select");
    select.className = "setting-select";

    for (const opt of item.options) {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (state.settings[item.key] === opt) o.selected = true;
      select.appendChild(o);
    }

    select.addEventListener("change", (e) => {
      setSetting(item.key, e.target.value);
      saveSettings();
    });

    row.appendChild(label);
    row.appendChild(select);
    list.appendChild(row);
  }

  closeBtn.onclick = () => { overlay.hidden = true; };

  // 外側タップで閉じる（パネル内は閉じない）
  overlay.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".settings-panel")) overlay.hidden = true;
  });
}

export function openSettings() {
  const overlay = document.getElementById("settingsOverlay");
  overlay.hidden = false;
}

export function closeSettings() {
  const overlay = document.getElementById("settingsOverlay");
  overlay.hidden = true;
}
