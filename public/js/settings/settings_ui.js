// public/js/settings/settings_ui.js
import { state, setSetting, saveSettings, hasItem, DEV_UNLOCK } from "../state.js";
import { openBilling } from "../billing/stripe_client.js";

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

      const isHandItem = item.key === "hand";
      const isFootItem = item.key === "foot";
      const isNone = opt === "none";

      let isOwned = true;

      if (!DEV_UNLOCK && !isNone) {
        if (isHandItem) {
          isOwned = hasItem("hand", opt);
        } else if (isFootItem) {
          isOwned = hasItem("foot", opt);
        }
      }

      if (!isOwned) {
        o.disabled = true;
      }

      if (state.settings[item.key] === opt) o.selected = true;
      select.appendChild(o);
    }

    select.addEventListener("change", (e) => {
      const value = e.target.value;

      const showLockedPopup = () => {
        let popup = document.getElementById("lockedPopup");

        if (!popup) {
          popup = document.createElement("div");
          popup.id = "lockedPopup";
          popup.style.position = "fixed";
          popup.style.top = "50%";
          popup.style.left = "50%";
          popup.style.transform = "translate(-50%, -50%)";
          popup.style.padding = "18px 28px";
          popup.style.background = "rgba(0,0,0,.92)";
          popup.style.border = "1px solid rgba(255,0,0,.4)";
          popup.style.borderRadius = "12px";
          popup.style.color = "rgba(255,80,80,.9)";
          popup.style.fontSize = "14px";
          popup.style.letterSpacing = ".18em";
          popup.style.zIndex = "99999";
          popup.style.backdropFilter = "blur(8px)";
          popup.style.textAlign = "center";
          popup.style.pointerEvents = "none";
          document.body.appendChild(popup);
        }

        popup.textContent = "購入していないので使えません";

        popup.style.opacity = "1";

        setTimeout(() => {
          popup.style.opacity = "0";
        }, 1400);
      };

      if (!DEV_UNLOCK && item.key === "hand" && value !== "none") {
        if (!hasItem("hand", value)) {
          showLockedPopup();
          select.value = state.settings[item.key];
          openBilling(value);
          return;
        }
      }

      if (!DEV_UNLOCK && item.key === "foot" && value !== "none") {
        if (!hasItem("foot", value)) {
          showLockedPopup();
          select.value = state.settings[item.key];
          openBilling(value);
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
