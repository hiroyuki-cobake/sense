// public/js/billing/billing_ui.js
import { openBilling, closeBilling, mountStripeUI } from "./stripe_client.js";

export function initBillingUI() {
  const overlay = document.getElementById("billingOverlay");
  const cancel = document.getElementById("billingCancel");
  cancel.addEventListener("click", () => closeBilling());
  overlay.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".billing-panel")) closeBilling();
  });
}
