// public/js/experience/light.js
import { state, hasItem } from "../state.js";

export function initLight(canvas) {
  const light = {
    spot: { x: canvas.clientWidth * 0.5, y: canvas.clientHeight * 0.55, r: 0, a: 0 },
    lastTapAt: 0,

    tapSpot(x, y, lightSetting, handSetting) {
      // allow spot only when light setting is low AND user selected hand=light AND owned light
      const ok = lightSetting === "low" && handSetting === "light" && hasItem("hand", "light");
      if (!ok) return;
      light.spot.x = x;
      light.spot.y = y;
      light.spot.r = 110;
      light.spot.a = 0.22;
      light.lastTapAt = performance.now();
    },

    update(t, idleMs) {
      const dt = t - light.lastTapAt;
      if (dt > 1200) {
        light.spot.a *= 0.92;
        light.spot.r *= 0.985;
      }
      // idle makes the world slightly more visible, but not informative
      const idleGlow = Math.min(0.06, idleMs / 40000 * 0.06);
      // keep as baseline darkness; used in draw
      light._idleGlow = idleGlow;
    },

    draw(ctx, w, h) {
      // tiny ambient lift
      if (light._idleGlow > 0) {
        ctx.fillStyle = `rgba(255,255,255,${light._idleGlow})`;
        ctx.fillRect(0, 0, w, h);
      }

      // spot
      if (light.spot.a < 0.01) return;

      const grd = ctx.createRadialGradient(light.spot.x, light.spot.y, 0, light.spot.x, light.spot.y, light.spot.r);
      grd.addColorStop(0, `rgba(255,255,255,${light.spot.a})`);
      grd.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    },
  };

  return light;
}
