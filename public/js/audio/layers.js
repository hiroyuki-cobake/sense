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
