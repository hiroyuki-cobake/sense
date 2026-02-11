// public/js/start/legal_icons.js
const LEGAL_ITEMS = [
  { id: "legal-1", label: "transactions", href: "legal/transactions.html", icon: "doc" },
  { id: "legal-2", label: "service", href: "legal/terms_of_service.html", icon: "link" },
  { id: "legal-3", label: "privacy", href: "legal/privacy_policy.html", icon: "shield" },
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function footerPositionsWithinDock(dockEl, count) {
  const rect = dockEl.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const marginX = 24;
  const marginYTop = 10;
  const marginYBottom = 10;

  const usableW = Math.max(1, w - marginX * 2);
  const gap = usableW / count;

  const yMin = marginYTop;
  const yMax = Math.max(yMin, h - marginYBottom);

  const positions = [];
  for (let i = 0; i < count; i++) {
    const x = marginX + gap * i + gap * 0.5;
    const y = yMin + Math.random() * (yMax - yMin);

    positions.push({
      x: clamp(x, marginX, w - marginX),
      y: clamp(y, yMin, yMax),
    });
  }
  return positions;
}

function resolvePath(path) {
  return new URL(path, window.location.origin).toString();
}

function openLegalModal(url) {
  const modal = document.getElementById("legalModal");
  const frame = document.getElementById("legalFrame");

  if (!modal || !frame) return;

  frame.src = resolvePath(url);
  modal.hidden = false;
}

export function initLegalIcons({ dockEl }) {
  if (!dockEl) return;

  dockEl.innerHTML = "";

  const render = () => {
    dockEl.innerHTML = "";
    const positions = footerPositionsWithinDock(dockEl, LEGAL_ITEMS.length);

    LEGAL_ITEMS.forEach((item, i) => {
      const a = document.createElement("a");
      a.className = "legal-item is-visible";
      a.href = "#";
      a.innerHTML = `<span class="legal-label">${item.label}</span>`;

      a.style.left = `${positions[i].x}px`;
      a.style.top = `${positions[i].y}px`;

      a.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLegalModal(item.href);
      });

      dockEl.appendChild(a);
    });
  };

  window.addEventListener("resize", render, { passive: true });
  render();
}
