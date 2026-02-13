// public/js/main.js
import { loadState } from "./state.js";
import { initLegalIcons } from "./start/legal_icons.js";
import { initGearJitter } from "./start/gear_jitter.js";
import {
  initSettingsUI,
  openSettings,
  closeSettings,
} from "./settings/settings_ui.js";
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

  // 初回の音解放用（iOS/WebAudio）
  const unlock = () => {
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("touchstart", unlock, true);
    window.dispatchEvent(new Event("sense-unlock-audio"));
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("touchstart", unlock, true);

  // ===== START CONTROL =====
  const app = document.getElementById("app");
  const logoWrap = document.querySelector(".logo-wrap");

  let started = false;

  function startExperience() {
    if (started) return;
    started = true;

    app.classList.remove("start");

    // 体験初期化は「開始時」に行う
    initExperience();

    // 念のため開始時にも音解放イベントを投げる
    window.dispatchEvent(new Event("sense-unlock-audio"));
  }

  // ---- Robust double-tap / double-click detection (pointer-based) ----
  // ここでCSSがpointer-events: noneでも拾える確率を上げる（最小限の上書き）

  let lastPointerUpAt = 0;
  const DOUBLE_TAP_MS = 320;

  const onLogoPointerUp = (e) => {
    // ロゴ以外から来たら無視
    if (!e.target || !e.target.closest(".logo-wrap")) return;

    const now = performance.now();
    const dt = now - lastPointerUpAt;
    lastPointerUpAt = now;

    if (dt > 0 && dt < DOUBLE_TAP_MS) {
      startExperience();
    }
  };

  // logoWrapに直接付ける（基本）
  if (logoWrap) {
    logoWrap.addEventListener("pointerup", onLogoPointerUp, { passive: true });
  }

  // さらに保険：もしlogoWrapがクリックを受け取れないCSS状態でも
  // ルート(app)側で拾えるようにする（イベントが来る場合のみ有効）
  app.addEventListener("pointerup", onLogoPointerUp, { passive: true });
}

boot();
