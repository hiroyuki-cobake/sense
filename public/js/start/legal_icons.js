// public/js/start/legal_icons.js
const LEGAL_ITEMS = [
  { id: "legal-1", label: "transactions", href: "legal/transactions.html", icon: "doc" },
  { id: "legal-2", label: "service", href: "legal/terms_of_service.html", icon: "link" },
  { id: "legal-3", label: "privacy", href: "legal/privacy_policy.html", icon: "shield" },
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function footerPositions(count) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const bandTop = h * 0.82;
  const bandBottom = h * 0.94;

  const margin = 40;
  const usable = w - margin * 2;
  const gap = usable / count;

  const positions = [];

  for (let i = 0; i < count; i++) {
    const x = margin + gap * i + gap * 0.5;
    const y = bandTop + Math.random() * (bandBottom - bandTop);

    positions.push({
      x: clamp(x, margin, w - margin),
      y: clamp(y, bandTop, bandBottom)
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

  frame.src = resolvePath(url);
  modal.hidden = false;
}

export function initLegalIcons({ dockEl }) {
  if (!dockEl) return;

  dockEl.innerHTML = "";

  const positions = footerPositions(LEGAL_ITEMS.length);

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
}
