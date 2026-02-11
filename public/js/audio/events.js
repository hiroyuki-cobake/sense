// public/js/audio/events.js
import { audio } from "./audio_engine.js";
import { layers } from "./layers.js";

export const audioEvents = (() => {
  let armed = false;
  let hold = false;
  let pinchAcc = 0;
  let footstepPhase = 0;

  function boot() {
    if (!audio.started) return;
    layers.boot();
    armed = true;
  }

  function onUserAction() {
    // any action slightly collapses ambience (so idle matters)
    if (!armed) return;
    layers.setAmbience(0.015);
    layers.setTone(0.0);
  }

  function update(idleMs, angle, mode) {
    if (!armed) return;

    audio.setMode(mode);
    audio.setListenerAngle(angle);

    // idle lifts ambience + subtle fluorescent “about to die” tone
    const idle = Math.min(1, idleMs / 12000);
    const amb = 0.02 + idle * 0.08;
    layers.setAmbience(amb);

    // occasional near-silent tone appears with idle, then disappears
    const flicker = (Math.sin((performance.now() / 1000) * 0.6) + 1) * 0.5;
    const t = idle * 0.035 * (flicker > 0.92 ? 1 : 0);
    layers.setTone(t, 150 + Math.sin(performance.now() / 1500) * 8);

    if (hold) {
      // hold-walk creates gentle rhythm that can be mistaken as “distance”
      const pulse = (Math.sin(performance.now() / 140) + 1) * 0.5;
      layers.setTone(Math.max(t, 0.01 + pulse * 0.01), 140);
    }

    // pinch shifts “distance feeling” (not actual)
    pinchAcc *= 0.96;
  }

  function step(dir, foot) {
    if (!armed) return;

    // simple synthesized step: short noise burst
    const ac = audio.ac;
    if (!ac) return;
    const n = audio.createNoise();
    const g = ac.createGain();
    const t = ac.currentTime;
    const base = footGain(foot);

    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(base, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    n.connect(g);

    // pseudo spatial: steps orbit slightly with angle (and pinch)
    const px = Math.sin((footstepPhase += 0.6) + pinchAcc) * 0.6;
    const pz = -0.8 - (dir < 0 ? 0.15 : 0);
    const conn = audio.connectSpatial(g, px, 0, pz);
    n.start();
    setTimeout(() => { try { n.stop(); } catch {} }, 140);

    // back step subtly increases ambience (uneasy comfort)
    if (dir < 0) layers.setAmbience(0.07);
  }

  function touch(hand) {
    if (!armed) return;
    // touch = thin noise tick
    const ac = audio.ac;
    if (!ac) return;
    const n = audio.createNoise();
    const g = ac.createGain();
    const t = ac.currentTime;

    const base = handGain(hand);
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(base, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    n.connect(g);
    audio.connectSpatial(g, 0.2, 0, -0.7);
    n.start();
    setTimeout(() => { try { n.stop(); } catch {} }, 80);
  }

  function pinch(delta) {
    pinchAcc += delta * 0.002;
    pinchAcc = Math.max(-2.0, Math.min(2.0, pinchAcc));
  }

  function holdStart() { hold = true; }
  function holdEnd() { hold = false; }

  function lightTap(lightSetting) {
    if (!armed) return;
    if (lightSetting !== "low") return;
    // light tap makes ambience briefly thinner
    layers.setAmbience(0.01);
  }

  function footGain(foot) {
    switch (foot) {
      case "heel": return 0.08;
      case "leather": return 0.06;
      case "shoes": return 0.045;
      case "zori": return 0.05;
      default: return 0.028; // none/bare
    }
  }

  function handGain(hand) {
    switch (hand) {
      case "glove": return 0.045;
      case "stick": return 0.06;
      case "light": return 0.03;
      default: return 0.03;
    }
  }

  return { boot, update, step, touch, pinch, holdStart, holdEnd, onUserAction, lightTap };
})();
