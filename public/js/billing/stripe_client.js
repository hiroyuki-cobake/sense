// public/js/billing/stripe_client.js
import { grantEntitlement } from "./entitlements.js";

let stripe = null;
let elements = null;

const PRICE_MAP = {
  stick: "price_1SzgNWRWYCAtIMldnlWLcivD",
  light: "price_1SzgNuRWYCAtIMldlk9IwMCf",
  glove: "price_1SzgOERWYCAtIMldJPLLEXl4",
  shoes: "price_1SzgOZRWYCAtIMldTJsu2enS",
  leather: "price_1SzgOwRWYCAtIMld8OIm4qaW",
  heel: "price_1SzgPARWYCAtIMldN2SHuAh5",
  zori: "price_1SzgPQRWYCAtIMld912CkYWW",
};

function $(id) {
  return document.getElementById(id);
}

function setStatus(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError
    ? "rgba(255,80,80,.9)"
    : "rgba(255,255,255,.62)";
}

async function loadStripeJs() {
  if (window.Stripe) return;

  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("failed_to_load_stripe_js"));
    document.head.appendChild(s);
  });
}

async function createPaymentIntent(itemId) {
  const endpoint = (window.__STRIPE_PI_ENDPOINT__ || "").trim();
  if (!endpoint) return { clientSecret: "" };

  const priceId = PRICE_MAP[itemId];
  if (!priceId) throw new Error("unknown_price_id");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ priceId }),
  });

  if (!res.ok) throw new Error(`pi_endpoint_${res.status}`);
  const data = await res.json();
  return { clientSecret: data.clientSecret };
}

export function openBilling(itemId) {
  const overlay = $("billingOverlay");
  if (!overlay) return;
  overlay.hidden = false;
  mountStripeUI(itemId);
}

export function closeBilling() {
  const overlay = $("billingOverlay");
  if (overlay) overlay.hidden = true;

  const body = $("billingBody");
  if (body) body.innerHTML = "";

  elements = null;
}

export async function mountStripeUI(itemId) {
  const body = $("billingBody");
  if (!body) return;

  body.innerHTML = "";

  const status = document.createElement("div");
  status.style.opacity = "0.9";
  status.style.letterSpacing = ".14em";
  status.style.fontSize = "12px";
  status.style.marginBottom = "14px";
  setStatus(status, "…");
  body.appendChild(status);

  const pk = (window.__STRIPE_PUBLISHABLE_KEY__ || "").trim();
  const endpoint = (window.__STRIPE_PI_ENDPOINT__ || "").trim();

  if (!pk || !endpoint) {
    setStatus(status, "payment_unavailable", true);
    return;
  }

  try {
    await loadStripeJs();
    if (!stripe) stripe = window.Stripe(pk);

    const { clientSecret } = await createPaymentIntent(itemId);
    if (!clientSecret) throw new Error("missing_client_secret");

    const appearance = {
      theme: "night",
      variables: {
        colorPrimary: "rgba(255,255,255,.74)",
        colorBackground: "rgba(0,0,0,0)",
        colorText: "rgba(255,255,255,.82)",
        colorDanger: "rgba(255,80,80,.9)",
        borderRadius: "10px",
      },
    };

    elements = stripe.elements({ clientSecret, appearance });

    const mount = document.createElement("div");
    mount.id = "stripePaymentElement";
    body.appendChild(mount);

    const paymentElement = elements.create("payment");
    paymentElement.mount("#stripePaymentElement");

    const btn = document.createElement("button");
    btn.className = "billing-btn";
    btn.textContent = "confirm";
    btn.style.marginTop = "14px";
    body.appendChild(btn);

    setStatus(status, " ");

    btn.onclick = async () => {
      btn.disabled = true;

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setStatus(status, error.message, true);
        btn.disabled = false;
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        grantEntitlement(itemId);
        closeBilling();
      } else {
        setStatus(status, "payment_not_completed", true);
        btn.disabled = false;
      }
    };
  } catch (e) {
    setStatus(status, "payment_error", true);
  }
}
