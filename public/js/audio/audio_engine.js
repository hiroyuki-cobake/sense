// public/js/audio/audio_engine.js
export const audio = (() => {
  let ac = null;
  let master = null;
  let started = false;

  let mode = "spatial"; // spatial | mono
  let panner = null;

  function ensureStarted(nextMode = "spatial") {
    if (started) {
      setMode(nextMode);
      return;
    }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0.65;
    master.connect(ac.destination);

    panner = ac.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1;
    panner.maxDistance = 12;
    panner.rolloffFactor = 1.1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;

    setMode(nextMode);
    started = true;
  }

  function setMode(nextMode) {
    mode = nextMode;
    if (!master) return;

    if (mode === "none") {
      master.gain.value = 0;
    } else {
      master.gain.value = 0.65;
    }
  }

  function now() {
    return ac ? ac.currentTime : 0;
  }

  function createNoise() {
    const bufferSize = 2 * (ac?.sampleRate || 48000);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const out = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) out[i] = (Math.random() * 2 - 1) * 0.25;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  function createSine(freq = 180) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    return osc;
  }

  function connectSpatial(node, x, y, z) {
    if (!ac) return;
    if (mode === "mono") {
      node.connect(master);
    } else {
      const g = ac.createGain();
      g.gain.value = 1;
      node.connect(g);
      const pn = ac.createPanner();
      pn.panningModel = "HRTF";
      pn.distanceModel = "inverse";
      pn.refDistance = 1;
      pn.maxDistance = 12;
      pn.rolloffFactor = 1.1;
      pn.positionX.value = x;
      pn.positionY.value = y;
      pn.positionZ.value = z;
      g.connect(pn);
      pn.connect(master);
      return { gain: g, panner: pn };
    }
  }

  function setListenerAngle(angle) {
    if (!ac) return;
    const lx = Math.sin(angle);
    const lz = -Math.cos(angle);
    const listener = ac.listener;
    if (listener.forwardX) {
      listener.forwardX.value = lx;
      listener.forwardY.value = 0;
      listener.forwardZ.value = lz;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      listener.setOrientation(lx, 0, lz, 0, 1, 0);
    }
  }

  return {
    ensureStarted,
    setMode,
    now,
    createNoise,
    createSine,
    connectSpatial,
    setListenerAngle,
    get ac() { return ac; },
    get started() { return started; },
    get mode() { return mode; },
    get master() { return master; },
  };
})();
