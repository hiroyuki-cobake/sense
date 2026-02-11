// public/js/start/gear_jitter.js
const JITTER_MIN = 6;
const JITTER_MAX = 14;
const DRIFT_MIN = 9000;
const DRIFT_MAX = 22000;
const SAFE_PAD = 8;

export function initGearJitter({ gearEl }) {
  if (!gearEl) return;
  applyJitter(gearEl);

  const tick = () => {
    gearEl.style.transition = "transform 120ms ease";
    applyJitter(gearEl);
    setTimeout(() => (gearEl.style.transition = ""), 220);
    setTimeout(tick, randInt(DRIFT_MIN, DRIFT_MAX));
  };
  setTimeout(tick, randInt(DRIFT_MIN, DRIFT_MAX));

  window.addEventListener("resize", () => applyJitter(gearEl), { passive: true });
}

function applyJitter(gearEl) {
  const dx = randSigned(JITTER_MIN, JITTER_MAX);
  const dy = randSigned(JITTER_MIN, JITTER_MAX);

  const rect = gearEl.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;

  let fx = dx, fy = dy;
  if (rect.right + dx > w - SAFE_PAD) fx = -Math.abs(dx);
  if (rect.left + dx < SAFE_PAD) fx = Math.abs(dx);
  if (rect.bottom + dy > h - SAFE_PAD) fy = -Math.abs(dy);
  if (rect.top + dy < SAFE_PAD) fy = Math.abs(dy);

  gearEl.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
}

function randSigned(min, max) {
  const v = randInt(min, max);
  return Math.random() < 0.5 ? -v : v;
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
