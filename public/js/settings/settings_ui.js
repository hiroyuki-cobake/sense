// public/js/settings/settings_ui.js
import { state, setSetting, saveSettings } from "../state.js";

  const SETTINGS_CONFIG = [
    { key: "sound", label: "sound field", options: ["spatial", "mono", "none"] },
    { key: "light", label: "light", options: ["off", "low"] },
    { key: "pulse", label: "pulse", options: ["low", "normal", "high"] },
    { key: "hand", label: "bring what you have (hand)", options: ["none", "stick", "light", "glove"] },
    { key: "foot", label: "bring what you have (foot)", options: ["none", "shoes", "leather", "heel", "zori"] },
    { key: "__operation__", label: "operation", action: "open_operation" }
  ];

export function initSettingsUI() {
  const overlay = document.getElementById("settingsOverlay");
  const list = document.getElementById("settingsList");
  const closeBtn = document.getElementById("settingsClose");

  list.innerHTML = "";

  const shuffled = [...SETTINGS_CONFIG]
    .map(v => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(x => x.v);

  for (const item of shuffled) {
          if (item.action === "open_operation") {
        const row = document.createElement("div");
        row.className = "setting-item";

        const label = document.createElement("span");
        label.textContent = item.label;

        const btn = document.createElement("button");
        btn.className = "setting-select";
        btn.textContent = "view";
        btn.addEventListener("click", () => {
          const op = document.getElementById("operationOverlay");
          op.hidden = false;
        });

        row.appendChild(label);
        row.appendChild(btn);
        list.appendChild(row);
        continue;
      }

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
      const value = e.target.value;

      if (item.key === "hand" && value !== "none") {
        if (!state.owned.hand.includes(value)) {
          alert("You need to purchase this item before using it.");
          select.value = state.settings[item.key];
          return;
        }
      }

      if (item.key === "foot" && value !== "none") {
        if (!state.owned.foot.includes(value)) {
          alert("You need to purchase this item before using it.");
          select.value = state.settings[item.key];
          return;
        }
      }

      setSetting(item.key, value);
      saveSettings();
    });

    row.appendChild(label);
    row.appendChild(select);
    list.appendChild(row);
  }

  closeBtn.onclick = () => { overlay.hidden = true; };
    const op = document.getElementById("operationOverlay");
  if (op) {
    op.addEventListener("pointerdown", () => {
      op.hidden = true;
    });
  }

  // 外側タップで閉じる（パネル内は閉じない）
  overlay.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".settings-panel")) overlay.hidden = true;
  });
}

export function openSettings() {
  initSettingsUI();
  const overlay = document.getElementById("settingsOverlay");
  overlay.hidden = false;
}

export function closeSettings() {
  const overlay = document.getElementById("settingsOverlay");
  overlay.hidden = true;
}
