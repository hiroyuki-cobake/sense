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

let scene = null;
let sceneImg = null;
let sceneReady = false;

let sceneLayer = null;
let sceneCtx = null;

async function loadScene() {
  try {
    const res = await fetch("./scenes/scene_001/scene.json", { cache: "no-store" });
    if (!res.ok) return;

    const json = await res.json();
    scene = json;

    const img = new Image();
    img.decoding = "async";
    img.src = json.assets.albedo;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    sceneImg = img;
    sceneReady = true;
  } catch {
    scene = null;
    sceneImg = null;
    sceneReady = false;
  }
}

function ensureSceneLayerSize(w, h) {
  if (!sceneLayer) {
    sceneLayer = document.createElement("canvas");
    sceneCtx = sceneLayer.getContext("2d");
  }
  if (sceneLayer.width !== w || sceneLayer.height !== h) {
    sceneLayer.width = w;
    sceneLayer.height = h;
  }
}

export function initExperience() {
  canvas = document.getElementById("senseCanvas");
  ctx = canvas.getContext("2d", { alpha: false });

  loadScene();

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ensureSceneLayerSize(canvas.width, canvas.height);
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
    onTripleTap: () => {
      audioEvents.tripleTap();
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
  const g = ctx.createRadialGradient(
    w * 0.5,
    h * 0.55,
    0,
    w * 0.5,
    h * 0.55,
    Math.max(w, h) * 0.7
  );
  g.addColorStop(0, "rgb(5,5,5)");
  g.addColorStop(1, "rgb(0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const n = 0.02 + Math.min(0.05, (idleMs / 25000) * 0.05);
  ctx.fillStyle = `rgba(255,255,255,${n})`;
  for (let i = 0; i < 18; i++) {
    const x = (Math.sin((angle + i) * 1.7) * 0.5 + 0.5) * w;
    const y = (Math.cos((angle * 0.7 + i) * 1.3) * 0.5 + 0.5) * h;
    ctx.fillRect(x, y, 1, 1);
  }

  light.draw(ctx, w, h);

  if (sceneReady && scene && sceneImg && light?.spot?.a >= 0.01 && light?.spot?.r > 0) {
    const sx = light.spot.x;
    const sy = light.spot.y;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.floor(w * dpr);
    const ch = Math.floor(h * dpr);

    ensureSceneLayerSize(cw, ch);

    const yawPx = (scene?.view?.yaw_to_u_px ?? 18) * angle;
    const imgW = sceneImg.naturalWidth || 1;
    const imgH = sceneImg.naturalHeight || 1;

    const scale = Math.max(cw / imgW, ch / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    let ox = (-yawPx % drawW);
    if (ox > 0) ox -= drawW;

    sceneCtx.setTransform(1, 0, 0, 1, 0, 0);
    sceneCtx.globalCompositeOperation = "source-over";
    sceneCtx.clearRect(0, 0, cw, ch);

    sceneCtx.globalAlpha = 1;
    sceneCtx.drawImage(sceneImg, ox, 0, drawW, drawH);
    sceneCtx.drawImage(sceneImg, ox + drawW, 0, drawW, drawH);

    sceneCtx.globalCompositeOperation = "destination-in";
    const lr = (scene?.light?.spot_radius_px ?? 220) * dpr;
    const la = (scene?.light?.spot_alpha ?? 0.28);

    const gx = sx * dpr;
    const gy = sy * dpr;

    const mask = sceneCtx.createRadialGradient(gx, gy, 0, gx, gy, lr);
    mask.addColorStop(0, `rgba(255,255,255,${la})`);
    mask.addColorStop(1, "rgba(255,255,255,0)");
    sceneCtx.fillStyle = mask;
    sceneCtx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(sceneLayer, 0, 0, w, h);
    ctx.restore();
  }
}
