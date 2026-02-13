// public/js/audio/events.js
import { audio } from "./audio_engine.js";
import { layers } from "./layers.js";
import { state } from "../state.js";

export const audioEvents = (() => {
  let armed = false;
  let hold = false;
  let pinchAcc = 0;
  let footstepPhase = 0;

    let lastBeatAt = 0;

  function playHeartBeat() {
    if (!audio.ac) return;

    const ac = audio.ac;
    const t = ac.currentTime;

    const osc = ac.createOscillator();
    const g = ac.createGain();
    const f = ac.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.09);

    f.type = "lowpass";
    f.frequency.setValueAtTime(180, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.028, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(f);
    f.connect(g);
    g.connect(audio.master);

    osc.start(t);
    osc.stop(t + 0.24);
  }

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
      const pulse = (Math.sin(performance.now() / 140) + 1) * 0.5;
      layers.setTone(Math.max(t, 0.01 + pulse * 0.01), 140);
    }

    // === HEARTBEAT (action-based, idle only) ===
    if (idleMs > 650) {
      const { actionCount } = state.runtime;
      const bpm = 60 + Math.min(35, actionCount * 0.4);
      const interval = 60000 / bpm;
      const nowMs = performance.now();

      if (!lastBeatAt || nowMs - lastBeatAt > interval) {
        lastBeatAt = nowMs;
        playHeartBeat();
      }
    }

    pinchAcc *= 0.96;
  }

  function step(dir, foot) {
    if (!armed) return;

    const ac = audio.ac;
    if (!ac) return;

    const t = ac.currentTime;
    const base = footGain(foot);

    // pseudo spatial: steps orbit slightly with angle (and pinch)
    const px = Math.sin((footstepPhase += 0.6) + pinchAcc) * 0.6;
    const pz = -0.8 - (dir < 0 ? 0.15 : 0);

    // base noise layer (common)
    const n = audio.createNoise();
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0, t);
    ng.gain.linearRampToValueAtTime(base * 0.85, t + 0.008);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    n.connect(ng);
    audio.connectSpatial(ng, px, 0, pz);
    n.start();
    setTimeout(() => { try { n.stop(); } catch {} }, 140);

    // timbre add-on
    if (foot === "heel") {
      // sharper click
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.06);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(base * 0.55, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g);
      audio.connectSpatial(g, px * 0.6, 0, pz);
      o.start(t);
      o.stop(t + 0.09);
    }

    if (foot === "zori") {
      // soft “scrape” (bandlimited noise pulse)
      const nz = audio.createNoise();
      const f = ac.createBiquadFilter();
      const g = ac.createGain();
      f.type = "bandpass";
      f.frequency.setValueAtTime(520, t);
      f.Q.setValueAtTime(1.2, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(base * 0.7, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      nz.connect(f);
      f.connect(g);
      audio.connectSpatial(g, px * 0.7, 0, pz);
      nz.start();
      setTimeout(() => { try { nz.stop(); } catch {} }, 200);
    }

    if (dir < 0) layers.setAmbience(0.07);
  }

  function touch(hand) {
    if (!armed) return;

    const ac = audio.ac;
    if (!ac) return;

    const t = ac.currentTime;
    const base = handGain(hand);

    if (hand === "stick") {
      // “kon-kon” (wood-like short resonant knock)
      const o = ac.createOscillator();
      const f = ac.createBiquadFilter();
      const g = ac.createGain();

      o.type = "square";
      o.frequency.setValueAtTime(520, t);
      o.frequency.exponentialRampToValueAtTime(260, t + 0.08);

      f.type = "lowpass";
      f.frequency.setValueAtTime(1200, t);
      f.Q.setValueAtTime(0.9, t);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(base, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

      o.connect(f);
      f.connect(g);
      audio.connectSpatial(g, 0.15, 0, -0.72);

      o.start(t);
      o.stop(t + 0.12);
      return;
    }

    // default touch (thin noise tick)
    const n = audio.createNoise();
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(base, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    n.connect(g);
    audio.connectSpatial(g, 0.2, 0, -0.7);
    n.start();
    setTimeout(() => { try { n.stop(); } catch {} }, 80);
  }

  function footGain(foot) {
    switch (foot) {
      case "heel": return 0.09;
      case "leather": return 0.06;
      case "shoes": return 0.05;
      case "zori": return 0.055;
      default: return 0.03; // none/bare
    }
  }

  function handGain(hand) {
    switch (hand) {
      case "glove": return 0.04;
      case "stick": return 0.07;
      case "light": return 0.03;
      default: return 0.03;
    }
  }

  function pinch(delta = 0) {
    if (!armed) return;
    if (typeof delta !== "number") return;
    pinchAcc += delta * 0.002;
    pinchAcc = Math.max(-2.0, Math.min(2.0, pinchAcc));
  }

  function holdStart() { hold = true; }
  function holdEnd() { hold = false; }

  function lightTap(lightSetting) {
    if (!armed) return;
    if (lightSetting !== "low") return;
    layers.setAmbience(0.01);
  }

  function tripleTap() {
    if (!armed) return;
    layers.setAmbience(0.01);
    layers.setTone(0.02, 130);
  }

  return { boot, update, step, touch, pinch, holdStart, holdEnd, onUserAction, lightTap, tripleTap };
})();
