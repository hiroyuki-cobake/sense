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

  document.getElementById("gearBtn").addEventListener("click", () => {
    openSettings();
  });

  // ===== START CONTROL =====
  const app = document.getElementById("app");
  const logoWrap = document.querySelector(".logo-wrap");

  let started = false;

  function startExperience() {
    if (started) return;
    started = true;

    app.classList.remove("start");

    initExperience();

    window.dispatchEvent(new Event("sense-unlock-audio"));
  }

  // PCダブルクリック
  logoWrap.addEventListener("dblclick", startExperience);

  // モバイルダブルタップ
  let lastTap = 0;
  logoWrap.addEventListener("touchend", (e) => {
    const now = new Date().getTime();
    if (now - lastTap < 300) {
      startExperience();
    }
    lastTap = now;
  });

  // 初回の音解放用（保険）
  const unlock = () => {
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("touchstart", unlock, true);
    window.dispatchEvent(new Event("sense-unlock-audio"));
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("touchstart", unlock, true);
}

boot();
