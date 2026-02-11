import { initLegalIcons } from "./start/legal_icons.js";
import { initGearJitter } from "./start/gear_jitter.js";
import { initSettingsUI } from "./settings/settings_ui.js";

function boot() {
  initLegalIcons({
    dockEl: document.getElementById("legalDock"),
  });

  initGearJitter({
    gearEl: document.getElementById("gearBtn"),
  });

const overlay = initSettingsUI();
overlay.hidden = true; // ← 追加：起動時は必ず閉じる

document.getElementById("gearBtn").addEventListener("click", () => {
  overlay.hidden = false;
});
}

boot();
