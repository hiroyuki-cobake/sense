// public/js/main.js
import { loadState } from "./state.js";
import { initLegalIcons } from "./start/legal_icons.js";
import { initGearJitter } from "./start/gear_jitter.js";
import { initSettingsUI, openSettings, closeSettings } from "./settings/settings_ui.js";
import { initExperience } from "./experience/progression.js";
import { initBillingUI } from "./billing/billing_ui.js";

function boot() {
  loadState();

  initLegalIcons({ dockEl: document.getElementById("legalDock") });
  initGearJitter({ gearEl: document.getElementById("gearBtn") });

  initSettingsUI();
  closeSettings();

  initBillingUI();
  initExperience();

  document.getElementById("gearBtn").addEventListener("click", () => {
    openSettings();
  });

  // 初回の音解放用（iOS/WebAudio）
  const unlock = () => {
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("touchstart", unlock, true);
    window.dispatchEvent(new Event("sense-unlock-audio"));
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("touchstart", unlock, true);
}

boot();
