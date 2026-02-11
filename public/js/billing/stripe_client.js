// public/js/billing/stripe_client.js
import { grantEntitlement } from "./entitlements.js";

let stripe = null;
let elements = null;

function $(id) {
  return document.getElementById(id);
}

function setStatus(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "rgba(255,80,80,.9)" : "rgba(255,255,255,.62)";
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

function getBasePathForApi() {
  // dev: "/" / Pages: "/sense/"
  const hasBuiltAssetsScript = Array.from(document.scripts).some((s) => {
    const src = s && s.src ? s.src : "";
    return src.includes("/assets/");
  });

  const path = window.location.pathname;
  const idx = path.indexOf("/sense/");

  return hasBuiltAssetsScript && idx >= 0
    ? path.slice(0, idx + "/sense/".length)
    : "/";
}

async function createPaymentIntent(itemId) {
  // Cloudflare Workers 等で用意する endpoint（同一オリジン想定）
  // window.__STRIPE_PI_ENDPOINT__ が未設定なら既存の疑似購入にフォールバック
  const endpoint = (window.__STRIPE_PI_ENDPOINT__ || "").trim();
  if (!endpoint) return { clientSecret: "" };

  const base = getBasePathForApi();
  const url = new URL(endpoint, window.location.origin + base).toString();

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ itemId }),
  });

  if (!res.ok) throw new Error(`pi_endpoint_${res.status}`);
  const data = await res.json();
  return { clientSecret: (data && data.clientSecret) ? String(data.clientSecret) : "" };
}

export function openBilling(itemId = "light") {
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
  // stripe は保持でOK（再利用）
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

  // PK も endpoint も未設定なら、従来通りの疑似購入のみ
  const endpoint = (window.__STRIPE_PI_ENDPOINT__ || "").trim();
  if (!pk || !endpoint) {
    setStatus(status, "…", false);

    const btn = document.createElement("button");
    btn.className = "billing-btn";
    btn.style.marginTop = "16px";
    btn.textContent = "confirm";
    btn.onclick = () => {
      grantEntitlement(itemId);
      closeBilling();
    };
    body.appendChild(btn);
    return;
  }

  try {
    setStatus(status, "…", false);

    await loadStripeJs();

    if (!stripe) {
      stripe = window.Stripe(pk);
    }

    const { clientSecret } = await createPaymentIntent(itemId);
    if (!clientSecret) throw new Error("missing_client_secret");

    const appearance = {
      theme: "night",
      variables: {
        colorPrimary: "rgba(255,255,255,.74)",
        colorBackground: "rgba(0,0,0,0)",
        colorText: "rgba(255,255,255,.82)",
        colorDanger: "rgba(255,80,80,.9)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
        spacingUnit: "4px",
        borderRadius: "10px",
      },
      rules: {
        ".Input": {
          backgroundColor: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.10)",
        },
        ".Label": {
          color: "rgba(255,255,255,.55)",
        },
      },
    };

    elements = stripe.elements({ clientSecret, appearance });

    const mount = document.createElement("div");
    mount.id = "stripePaymentElement";
    mount.style.padding = "2px 0 10px";
    body.appendChild(mount);

    const paymentElement = elements.create("payment");
    paymentElement.mount("#stripePaymentElement");

    const btn = document.createElement("button");
    btn.className = "billing-btn";
    btn.style.marginTop = "14px";
    btn.textContent = "confirm";
    body.appendChild(btn);

    setStatus(status, " ", false);

    btn.onclick = async () => {
      if (!stripe || !elements) return;

      btn.disabled = true;
      setStatus(status, "…", false);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        setStatus(status, error.message || "payment_failed", true);
        btn.disabled = false;
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        grantEntitlement(itemId);
        closeBilling();
        return;
      }

      // succeeded 以外は一旦エラー扱い（曖昧な状態を許容しない）
      setStatus(status, "payment_not_completed", true);
      btn.disabled = false;
    };
  } catch (e) {
    setStatus(status, "payment_unavailable", true);

    const btn = document.createElement("button");
    btn.className = "billing-btn";
    btn.style.marginTop = "16px";
    btn.textContent = "back";
    btn.onclick = () => closeBilling();
    body.appendChild(btn);
  }
}
