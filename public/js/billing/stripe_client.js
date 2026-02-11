// public/js/billing/stripe_client.js
import { state, saveOwned } from "../state.js";
import { grantEntitlement } from "./entitlements.js";

let mounted = false;

export function openBilling(itemId = "light") {
  const overlay = document.getElementById("billingOverlay");
  overlay.hidden = false;
  mountStripeUI(itemId);
}

export function closeBilling() {
  const overlay = document.getElementById("billingOverlay");
  overlay.hidden = true;
}

export async function mountStripeUI(itemId) {
  const body = document.getElementById("billingBody");
  body.innerHTML = "";

  // If Stripe not configured yet, show minimal placeholder button to simulate purchase.
  const pk = (window.__STRIPE_PUBLISHABLE_KEY__ || "").trim();
  if (!pk) {
    const p = document.createElement("div");
    p.style.opacity = "0.7";
    p.style.letterSpacing = ".12em";
    p.style.fontSize = "12px";
    p.textContent = "…";
    const btn = document.createElement("button");
    btn.className = "billing-btn";
    btn.style.marginTop = "16px";
    btn.textContent = "confirm";
    btn.onclick = () => {
      // simulate purchase
      grantEntitlement(itemId);
      closeBilling();
    };
    body.appendChild(p);
    body.appendChild(btn);
    return;
  }

  // Real Stripe embed will be added later (Payment Element)
  const p = document.createElement("div");
  p.style.opacity = "0.7";
  p.style.letterSpacing = ".12em";
  p.style.fontSize = "12px";
  p.textContent = "…";
  body.appendChild(p);
}
