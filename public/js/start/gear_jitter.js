// gear_jitter.js
// 日本語コメント：歯車は「常に目に入るが、わずかにズレる」
// 毎フレーム動かさない。時々、理由なくスッ…と動く。

const JITTER_MIN = 6;
const JITTER_MAX = 14;

// たまに動く（ms）
const DRIFT_MIN = 9000;
const DRIFT_MAX = 22000;

// 画面端からの最低余白（押せない事故防止）
const SAFE_PAD = 8;

export function initGearJitter({ gearEl }) {
  if (!gearEl) return;

  // 初期ズレ
  applyJitter(gearEl, true);

  // たまにズレる
  scheduleDrift(gearEl);

  // リサイズで補正
  window.addEventListener(
    "resize",
    () => {
      applyJitter(gearEl, false);
    },
    { passive: true }
  );
}

function scheduleDrift(gearEl) {
  const tick = () => {
    // ぬるっと移動（短い）
    gearEl.style.transition = "transform 120ms ease";
    applyJitter(gearEl, false);

    // transition戻す
    setTimeout(() => {
      gearEl.style.transition = "";
    }, 180);

    setTimeout(tick, randInt(DRIFT_MIN, DRIFT_MAX));
  };

  setTimeout(tick, randInt(DRIFT_MIN, DRIFT_MAX));
}

function applyJitter(gearEl, first) {
  const dx = randSigned(JITTER_MIN, JITTER_MAX);
  const dy = randSigned(JITTER_MIN, JITTER_MAX);

  // 端に出ないように（transformのみなので、気持ちだけ補正）
  // 実際のクリック範囲はボタン自体（大きい）なので、見た目が端に寄りすぎないように。
  const rect = gearEl.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;

  let fixX = dx;
  let fixY = dy;

  if (rect.right + dx > w - SAFE_PAD) fixX = -Math.abs(dx);
  if (rect.left + dx < SAFE_PAD) fixX = Math.abs(dx);
  if (rect.bottom + dy > h - SAFE_PAD) fixY = -Math.abs(dy);
  if (rect.top + dy < SAFE_PAD) fixY = Math.abs(dy);

  gearEl.style.transform = `translate3d(${fixX}px, ${fixY}px, 0)`;

  if (first) {
    // 初回は少しだけ不気味に遅らせる（感じ取れる程度）
    gearEl.style.opacity = "0.33";
  }
}

function randSigned(min, max) {
  const v = randInt(min, max);
  return Math.random() < 0.5 ? -v : v;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
