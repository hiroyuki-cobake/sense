import { state, updateSetting, loadSettings } from "../state.js";

const SETTINGS_CONFIG = [
  {
    key: "hand",
    label: "bring what you have (hand)",
    options: ["none", "stick", "light", "glove"],
  },
  {
    key: "foot",
    label: "bring what you have (foot)",
    options: ["none", "shoes", "leather", "heel", "zori"],
  },
  {
    key: "sound",
    label: "sound field",
    options: ["spatial", "mono"],
  },
  {
    key: "pulse",
    label: "pulse",
    options: ["low", "normal", "high"],
  },
  {
    key: "light",
    label: "light",
    options: ["off", "low"],
  },
];

export function initSettingsUI() {
  loadSettings();

  const overlay = document.getElementById("settingsOverlay");
  const list = document.getElementById("settingsList");
  const closeBtn = document.getElementById("settingsClose");

  list.innerHTML = "";

  // 並びをランダムに
  const shuffled = [...SETTINGS_CONFIG].sort(() => Math.random() - 0.5);

  shuffled.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "setting-item";

    const label = document.createElement("span");
    label.textContent = item.label;

    const select = document.createElement("select");
    select.className = "setting-select";

    item.options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (state.settings[item.key] === opt) o.selected = true;
      select.appendChild(o);
    });

    select.addEventListener("change", (e) => {
      updateSetting(item.key, e.target.value);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    list.appendChild(wrapper);
  });

  closeBtn.onclick = () => {
    overlay.hidden = true;
  };

  return overlay;
}
