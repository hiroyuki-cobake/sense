// public/js/audio/layers.js
import { audio } from "./audio_engine.js";

export const layers = (() => {
  let ambience = null;
  let ambienceGain = null;
  let tone = null;
  let toneGain = null;

  function boot() {
    if (!audio.ac) return;
    stop();

    ambience = audio.createNoise();
    ambienceGain = audio.ac.createGain();
    ambienceGain.gain.value = 0.0;
    ambience.connect(ambienceGain);
    ambienceGain.connect(audio.master);
    ambience.start();

    tone = audio.createSine(145);
    toneGain = audio.ac.createGain();
    toneGain.gain.value = 0.0;
    tone.connect(toneGain);
    toneGain.connect(audio.master);
    tone.start();

    startPreset();
  }

  function startPreset() {
    const r = Math.floor(Math.random() * 8);

    switch (r) {
      case 0: // low ambience
        setAmbience(0.02);
        break;

      case 1: // heavier ambience
        setAmbience(0.06);
        break;

      case 2: // low tone faint
        setTone(0.015, 130);
        break;

      case 3: // higher faint tone
        setTone(0.02, 165);
        break;

      case 4: // mixed light ambience
        setAmbience(0.03);
        setTone(0.01, 150);
        break;

      case 5:
        setAmbience(0.08);
        break;

      case 6:
        setTone(0.025, 120);
        break;

      case 7:
        setAmbience(0.01);
        setTone(0.03, 180);
        break;
    }
  }

  function stop() {
    try { ambience?.stop(); } catch {}
    try { tone?.stop(); } catch {}
    ambience = null; ambienceGain = null;
    tone = null; toneGain = null;
  }

  function setAmbience(v) {
    if (!ambienceGain) return;
    ambienceGain.gain.setTargetAtTime(v, audio.now(), 0.08);
  }

  function setTone(v, freq = null) {
    if (!toneGain) return;
    if (freq && tone) tone.frequency.setTargetAtTime(freq, audio.now(), 0.08);
    toneGain.gain.setTargetAtTime(v, audio.now(), 0.08);
  }

  return { boot, stop, setAmbience, setTone };
})();
