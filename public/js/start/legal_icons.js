// public/js/start/legal_icons.js
const LEGAL_ITEMS = [
  { id: "legal-1", label: "特商法", href: "https://puzzle.cobake.co/", icon: "doc" },
  { id: "legal-2", label: "利用規約", href: "https://puzzle.cobake.co/", icon: "link" },
  { id: "legal-3", label: "プライバシー", href: "https://puzzle.cobake.co/", icon: "shield" },
];

const REVEAL_MIN = 7000;
const REVEAL_MAX = 18000;
const HOLD_ALL_MS = 5200;

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function calcWeirdPositions(count) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bandTop = h * 0.82;
  const bandBottom = h * 0.94;
  const minX = 24;
  const maxX = Math.max(minX, w - 24);

  const baseX = rand(minX + 20, maxX - 20);
  const baseY = rand(bandTop, bandBottom);

  const positions = [];
  for (let i = 0; i < count; i++) {
    const dx = rand(-80, 80) + i * rand(34, 62);
    const dy = rand(-18, 18);
    positions.push({
      x: clamp(baseX + dx, minX, maxX),
      y: clamp(baseY + dy, bandTop, bandBottom),
    });
  }
  return positions;
}

function iconSvg(kind) {
  if (kind === "doc") {
    return `<svg viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6V2zm8 1.5V7h3.5L14 3.5zM8 11h8v1.6H8V11zm0 4h8v1.6H8V15z"/></svg>`;
  }
  if (kind === "shield") {
    return `<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5.2-3.4 9.9-8 10-4.6-.1-8-4.8-8-10V6l8-4zm0 2.2L6 7v5c0 4.2 2.6 8 6 8 3.4 0 6-3.8 6-8V7l-6-2.8z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l3-3a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 1-1.4 0zM7 17a4 4 0 0 1 0-5.7l2-2A4 4 0 0 1 14.7 9a1 1 0 1 1-1.4 1.4 2 2 0 0 0-2.8 0l-2 2A2 2 0 1 0 11.3 15a1 1 0 1 1 1.4 1.4A4 4 0 0 1 7 17zm10-10a4 4 0 0 1 0 5.7l-2 2A4 4 0 0 1 9.3 15a1 1 0 1 1 1.4-1.4 2 2 0 0 0 2.8 0l2-2A2 2 0 1 0 12.7 9a1 1 0 1 1-1.4-1.4A4 4 0 0 1 17 7z"/></svg>`;
}

function createLegalEl(item) {
  const a = document.createElement("a");
  a.className = "legal-item";
  a.href = item.href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.dataset.id = item.id;
  a.innerHTML = `<span class="legal-icon">${iconSvg(item.icon)}</span><span class="legal-label">${item.label}</span>`;
  return a;
}

function pickRandomSubset(allItems) {
  const n = randInt(1, 3);
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function initLegalIcons({ dockEl }) {
  if (!dockEl) return;

  dockEl.innerHTML = "";
  const els = new Map();
  for (const item of LEGAL_ITEMS) {
    const el = createLegalEl(item);
    els.set(item.id, el);
    dockEl.appendChild(el);
  }

  let visibleIds = new Set();
  let revealTimer = null;
  let holdAllUntil = 0;

  const applyPositions = () => {
    const vis = [...visibleIds];
    const positions = calcWeirdPositions(vis.length);
    vis.forEach((id, idx) => {
      const el = els.get(id);
      if (!el) return;
      el.style.left = `${positions[idx].x}px`;
      el.style.top = `${positions[idx].y}px`;
    });
  };

  const setVisible = (id, on) => {
    const el = els.get(id);
    if (!el) return;
    el.classList.toggle("is-visible", !!on);
  };

  const showSubset = (subsetIds) => {
    visibleIds = new Set(subsetIds);
    for (const item of LEGAL_ITEMS) setVisible(item.id, visibleIds.has(item.id));
    applyPositions();
  };

  const scheduleRevealMissing = () => {
    if (revealTimer) clearTimeout(revealTimer);

    const tick = () => {
      const now = Date.now();
      if (now < holdAllUntil) {
        revealTimer = setTimeout(tick, 900);
        return;
      }

      const missing = LEGAL_ITEMS.map(x => x.id).filter(id => !visibleIds.has(id));
      if (missing.length === 0) return;

      visibleIds.add(missing[0]);
      setVisible(missing[0], true);
      applyPositions();

      const allNow = LEGAL_ITEMS.every(x => visibleIds.has(x.id));
      if (allNow) holdAllUntil = Date.now() + HOLD_ALL_MS;

      revealTimer = setTimeout(tick, randInt(REVEAL_MIN, REVEAL_MAX));
    };

    revealTimer = setTimeout(tick, randInt(REVEAL_MIN, REVEAL_MAX));
  };

  const randomizeInitial = () => {
    const allIds = LEGAL_ITEMS.map(x => x.id);
    showSubset(allIds);
    holdAllUntil = Date.now() + HOLD_ALL_MS;
    scheduleRevealMissing();
  };

  const resetByInteraction = () => {
    if (Date.now() < holdAllUntil) return;
    randomizeInitial();
  };

  window.addEventListener("pointerdown", resetByInteraction, { passive: true });
  window.addEventListener("pointermove", resetByInteraction, { passive: true });
  window.addEventListener("wheel", resetByInteraction, { passive: true });
  window.addEventListener("resize", applyPositions, { passive: true });

  randomizeInitial();
}
