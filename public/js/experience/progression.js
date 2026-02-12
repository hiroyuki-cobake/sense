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
      light.tapSpot(x, y, state.settings.light, state.settings.hand);
      audioEvents.lightTap(state.settings.light);
    },
  });

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
  const g = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.7);
  g.addColorStop(0, "rgb(5,5,5)");
  g.addColorStop(1, "rgb(0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const n = 0.02 + Math.min(0.05, idleMs / 25000 * 0.05);
  ctx.fillStyle = `rgba(255,255,255,${n})`;
  for (let i = 0; i < 18; i++) {
    const x = (Math.sin((angle + i) * 1.7) * 0.5 + 0.5) * w;
    const y = (Math.cos((angle * 0.7 + i) * 1.3) * 0.5 + 0.5) * h;
    ctx.fillRect(x, y, 1, 1);
  }

  light.draw(ctx, w, h);

  if (light?.spot?.a >= 0.01 && light?.spot?.r > 0) {
    const sx = light.spot.x;
    const sy = light.spot.y;
    const r = light.spot.r;

    const a = angle;
    const kx = Math.sin(a) * 18;
    const ky = Math.cos(a * 0.7) * 12;

    ctx.save();
    ctx.globalAlpha = Math.min(0.38, 0.18 + light.spot.a * 1.2);
    ctx.lineWidth = 1;

    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.ellipse(sx + kx, sy + r * 0.42 + ky, r * 0.55, r * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.55 + kx, sy - r * 0.25 + ky);
    ctx.lineTo(sx - r * 0.25 + kx, sy + r * 0.55 + ky);
    ctx.moveTo(sx + r * 0.55 + kx, sy - r * 0.25 + ky);
    ctx.lineTo(sx + r * 0.25 + kx, sy + r * 0.55 + ky);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    for (let i = 0; i < 5; i++) {
      const ox = sx + (Math.sin(a * 1.3 + i * 2.1) * 0.5) * (r * 0.62) + kx * 0.4;
      const oy = sy + (Math.cos(a * 0.9 + i * 1.7) * 0.5) * (r * 0.46) + ky * 0.4;
      const bw = 6 + ((i * 7) % 9);
      const bh = 4 + ((i * 5) % 7);
      ctx.fillRect(ox - bw * 0.5, oy - bh * 0.5, bw, bh);
    }

    const vg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = vg;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);

    ctx.restore();
  }

  // scene: visible only when light spot is active
  if (light?.spot?.a >= 0.01 && light?.spot?.r > 0) {
    const sx = light.spot.x;
    const sy = light.spot.y;
    const r = light.spot.r;

    // deterministic "stage" around the spot (no external assets)
    // angle affects layout slightly (so sliding feels like changing facing)
    const a = angle;
    const kx = Math.sin(a) * 18;
    const ky = Math.cos(a * 0.7) * 12;

    ctx.save();
    ctx.globalAlpha = Math.min(0.38, 0.18 + light.spot.a * 1.2);
    ctx.lineWidth = 1;

    // draw a few “planes” (floor/wall hints) near the lit area
    // floor arc
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.ellipse(sx + kx, sy + r * 0.42 + ky, r * 0.55, r * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // wall edge lines
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.55 + kx, sy - r * 0.25 + ky);
    ctx.lineTo(sx - r * 0.25 + kx, sy + r * 0.55 + ky);
    ctx.moveTo(sx + r * 0.55 + kx, sy - r * 0.25 + ky);
    ctx.lineTo(sx + r * 0.25 + kx, sy + r * 0.55 + ky);
    ctx.stroke();

    // small “objects” (blocks) inside lit region
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    for (let i = 0; i < 5; i++) {
      const ox = sx + (Math.sin(a * 1.3 + i * 2.1) * 0.5) * (r * 0.62) + kx * 0.4;
      const oy = sy + (Math.cos(a * 0.9 + i * 1.7) * 0.5) * (r * 0.46) + ky * 0.4;
      const bw = 6 + ((i * 7) % 9);
      const bh = 4 + ((i * 5) % 7);
      ctx.fillRect(ox - bw * 0.5, oy - bh * 0.5, bw, bh);
    }

    // vignette (keep scene subtle)
    const vg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = vg;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);

    ctx.restore();
  }
}
