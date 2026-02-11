// public/js/start/legal_icons.js
const LEGAL_ITEMS = [
  { id: "legal-1", label: "transactions", href: "legal/transactions.html", icon: "doc" },
  { id: "legal-2", label: "service", href: "legal/terms_of_service.html", icon: "link" },
  { id: "legal-3", label: "privacy", href: "legal/privacy_policy.html", icon: "shield" },
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
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

function resolveFromSenseRoot(relativePath) {
  const origin = window.location.origin;

  const hasBuiltAssetsScript = Array.from(document.scripts).some((s) => {
    const src = s && s.src ? s.src : "";
    return src.includes("/assets/");
  });

  const path = window.location.pathname;
  const idx = path.indexOf("/sense/");

  const basePath = hasBuiltAssetsScript && idx >= 0
    ? path.slice(0, idx + "/sense/".length)
    : "/";

  return new URL(relativePath, `${origin}${basePath}`).toString();
}

function ensureModalBindings() {
  const modal = document.getElementById("legalModal");
  const frame = document.getElementById("legalFrame");
  const closeBtn = document.getElementById("legalModalClose");

  if (!modal || !frame || !closeBtn) return null;

  if (modal.dataset.bound === "1") return { modal, frame, closeBtn };

  const close = () => {
    modal.hidden = true;
    frame.removeAttribute("src");
  };

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  closeBtn.addEventListener("click", () => close());

  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") close();
  });

  modal.dataset.bound = "1";
  return { modal, frame, closeBtn };
}

function openLegalModal(url) {
  const refs = ensureModalBindings();
  if (!refs) {
    window.location.href = url;
    return;
  }

  refs.frame.setAttribute("src", url);
  refs.modal.hidden = false;
}

function createLegalEl(item) {
  const a = document.createElement("a");
  a.className = "legal-item is-visible";

  const absUrl = resolveFromSenseRoot(item.href);
  a.href = absUrl;

  a.target = "_self";
  a.rel = "noopener noreferrer";
  a.dataset.id = item.id;

  a.innerHTML = `<span class="legal-icon">${iconSvg(item.icon)}</span><span class="legal-label">${item.label}</span>`;

  a.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openLegalModal(absUrl);
  });

  return a;
}

function layoutFixedCenter(dockEl, els) {
  const rect = dockEl.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const y = h * 0.5;

  const gap = 168;
  const center = w * 0.5;

  const xs = [
    center - gap,
    center,
    center + gap,
  ];

  els.forEach((el, i) => {
    const x = clamp(xs[i], 24, Math.max(24, w - 24));
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = "translate(-50%, -50%)";
  });
}

export function initLegalIcons({ dockEl }) {
  if (!dockEl) return;

  dockEl.innerHTML = "";

  const els = LEGAL_ITEMS.map((item) => {
    const el = createLegalEl(item);
    dockEl.appendChild(el);
    return el;
  });

  const apply = () => layoutFixedCenter(dockEl, els);

  window.addEventListener("resize", apply, { passive: true });
  apply();
}
