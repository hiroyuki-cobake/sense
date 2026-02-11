// public/js/experience/input.js
export function initInput({
  canvas,
  onAnyInput,
  onRoam,
  onStep,
  onHoldWalk,
  onTouch,
  onPinch,
  onTapSpot,
}) {
  let lastTapAt = 0;
  let tapCount = 0;
  let holdTimer = 0;
  let holding = false;

  let roamActive = false;
  let lastX = 0;

  // pinch
  let pinchActive = false;
  let pinchStartDist = 0;

  const now = () => performance.now();

  const pointerDown = (e) => {
    onAnyInput?.();

    const touches = e.touches ? [...e.touches] : null;

    if (touches && touches.length === 2) {
      pinchActive = true;
      pinchStartDist = dist(touches[0], touches[1]);
      return;
    }

    roamActive = true;
    lastX = getPointX(e);

    // hold for walk (continuous)
    holding = false;
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      holding = true;
      onHoldWalk?.(true);
    }, 320);
  };

  const pointerMove = (e) => {
    if (e.touches && e.touches.length === 2) {
      onAnyInput?.();
      pinchActive = true;
      const d = dist(e.touches[0], e.touches[1]);
      const delta = d - pinchStartDist;
      pinchStartDist = d;
      onPinch?.(delta);
      return;
    }

    if (!roamActive) return;
    onAnyInput?.();

    const x = getPointX(e);
    const dx = x - lastX;
    lastX = x;
    onRoam?.(dx);
  };

  const pointerUp = (e) => {
    if (pinchActive) {
      if (!e.touches || e.touches.length < 2) pinchActive = false;
      return;
    }

    roamActive = false;
    clearTimeout(holdTimer);

    if (holding) {
      holding = false;
      onHoldWalk?.(false);
      return;
    }

    // tap clustering: double/triple
    const t = now();
    if (t - lastTapAt < 320) {
      tapCount += 1;
    } else {
      tapCount = 1;
    }
    lastTapAt = t;

    const x = getPointX(e);
    const y = getPointY(e);
    onTapSpot?.(x, y);

    // interpret after short delay
    window.setTimeout(() => {
      if (now() - lastTapAt > 280) {
        if (tapCount === 2) onStep?.(+1);
        else if (tapCount >= 3) onStep?.(-1);
        else onTouch?.(); // single tap = touch/take
        tapCount = 0;
      }
    }, 300);
  };

  canvas.addEventListener("touchstart", pointerDown, { passive: true });
  canvas.addEventListener("touchmove", pointerMove, { passive: true });
  canvas.addEventListener("touchend", pointerUp, { passive: true });
  canvas.addEventListener("mousedown", pointerDown);
  window.addEventListener("mousemove", pointerMove);
  window.addEventListener("mouseup", pointerUp);
}

function getPointX(e) {
  if (e.touches && e.touches[0]) return e.touches[0].clientX;
  return e.clientX ?? 0;
}
function getPointY(e) {
  if (e.touches && e.touches[0]) return e.touches[0].clientY;
  return e.clientY ?? 0;
}
function dist(a, b) {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
