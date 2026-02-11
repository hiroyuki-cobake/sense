// public/js/experience/progression.js
import { state, touchInput, getIdleMs } from "../state.js";
import { initInput } from "./input.js";
import { initRoam } from "./roam.js";
import { initLight } from "./light.js";
import { initHaptics } from "./haptics.js";
import { audio } from "../audio/audio_engine.js";
import { audioEvents } from "../audio/events.js";

let ctx = null;
let canvas = null;
let raf = 0;

export function initExperience() {
  canvas = document.getElementById("senseCanvas");
  ctx = canvas.getContext("2d", { alpha: false });

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const roam = initRoam();
  const light = initLight(canvas);
  const haptics = initHaptics();

  initInput({
    canvas,
    onAnyInput: () => {
      touchInput();
      audioEvents.onUserAction();
    },
    onRoam: (deltaX) => roam.rotateBy(deltaX),
    onStep: (dir) => {
      audioEvents.step(dir, state.settings.foot);
      haptics.step(state.settings.pulse);
    },
    onHoldWalk: (isOn) => {
      if (isOn) audioEvents.holdStart();
      else audioEvents.holdEnd();
    },
    onTouch: () => {
      audioEvents.touch(state.settings.hand);
      haptics.touch(state.settings.pulse);
    },
    onPinch: (d) => {
      audioEvents.pinch(d);
    },
    onTapSpot: (x, y) => {
      // light item: only if selected & owned
      light.tapSpot(x, y, state.settings.light, state.settings.hand);
      audioEvents.lightTap(state.settings.light);
    },
  });

  // Audio unlock hook
  window.addEventListener("sense-unlock-audio", () => {
    audio.ensureStarted(state.settings.sound);
    audioEvents.boot();
  });

  const loop = (t) => {
    const idle = getIdleMs(t);
    audioEvents.update(idle, roam.angle, state.settings.sound);
    light.update(t, idle);

    render(ctx, canvas.clientWidth, canvas.clientHeight, idle, roam.angle, light);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

function render(ctx, w, h, idleMs, angle, light) {
  // near-black field with barely visible gradient
  const g = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.7);
  g.addColorStop(0, "rgb(5,5,5)");
  g.addColorStop(1, "rgb(0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // subtle noise veil
  const n = 0.02 + Math.min(0.05, idleMs / 25000 * 0.05);
  ctx.fillStyle = `rgba(255,255,255,${n})`;
  for (let i = 0; i < 18; i++) {
    const x = (Math.sin((angle + i) * 1.7) * 0.5 + 0.5) * w;
    const y = (Math.cos((angle * 0.7 + i) * 1.3) * 0.5 + 0.5) * h;
    ctx.fillRect(x, y, 1, 1);
  }

  // light spot
  light.draw(ctx, w, h);
}
