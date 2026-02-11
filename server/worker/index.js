// server/worker/index.js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({ ok: true }, 200);
    }

    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    // POST /api/create-payment-intent
    if (url.pathname === "/api/create-payment-intent") {
      if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

      const body = await readJson(request);
      if (!body || !body.priceId) return json({ ok: false, error: "missing_priceId" }, 400);

      const sk = (env.STRIPE_SECRET_KEY || "").trim();
      if (!sk) return json({ ok: false, error: "missing_STRIPE_SECRET_KEY" }, 500);

      const stripeVersion = (env.STRIPE_API_VERSION || "2023-10-16").trim();

      const params = new URLSearchParams();
      params.set("amount", "0"); // will be overridden by priceId
      params.set("currency", "jpy");
      params.set("automatic_payment_methods[enabled]", "true");

      // Attach price reference (for webhook reconciliation later)
      params.set("metadata[priceId]", String(body.priceId));

      // Use Price to derive amount by creating an InvoiceItem is more complex;
      // simplest approach: lookup Price then set amount manually is not allowed without Product data.
      // Instead we create PaymentIntent with "amount" provided by client? NO.
      // => Here we require mapping on server by priceId.
      // For MVP: accept priceId mapping here.
      const PRICE_AMOUNT_MAP = {
        "price_1SzgNWRWYCAtIMldnlWLcivD": 380, // hand_stick
        "price_1SzgNuRWYCAtIMldlk9IwMCf": 680, // hand_light
        "price_1SzgOERWYCAtIMldJPLLEXl4": 980, // hand_glove
        "price_1SzgOZRWYCAtIMldTJsu2enS": 380, // foot_shoes
        "price_1SzgOwRWYCAtIMld8OIm4qaW": 680, // foot_leather
        "price_1SzgPARWYCAtIMldN2SHuAh5": 880, // foot_heel
        "price_1SzgPQRWYCAtIMld912CkYWW": 980, // foot_zori
      };

      const amount = PRICE_AMOUNT_MAP[String(body.priceId)];
      if (!amount) return json({ ok: false, error: "unknown_priceId" }, 400);

      params.set("amount", String(amount));

      const res = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          "authorization": `Bearer ${sk}`,
          "content-type": "application/x-www-form-urlencoded",
          "stripe-version": stripeVersion,
        },
        body: params.toString(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return json({ ok: false, error: "stripe_error", detail: data }, 502);
      }

      return json({ ok: true, clientSecret: data.client_secret }, 200);
    }

    // fallback for other /api/*
    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "not_implemented" }, 200);
    }

    return new Response("not found", { status: 404 });
  },
};
