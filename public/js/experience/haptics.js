// public/js/experience/haptics.js
export function initHaptics() {
  // iOS web vibration is unreliable; keep noop-safe.
  const vib = (ms) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  return {
    step(level) {
      if (level === "low") vib(6);
      else if (level === "normal") vib(10);
      else if (level === "high") vib(16);
    },
    touch(level) {
      if (level === "low") vib(4);
      else if (level === "normal") vib(8);
      else if (level === "high") vib(12);
    },
  };
}
