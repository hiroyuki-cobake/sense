// server/worker/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    // Stripe endpoints will be wired later.
    // Keep dark-embed flow on client; this worker will eventually:
    // - create PaymentIntent
    // - receive webhook and grant entitlements
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  },
};
