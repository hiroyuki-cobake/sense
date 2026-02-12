// public/js/experience/light.js
import { state, hasItem } from "../state.js";

export function initLight(canvas) {
  const light = {
    spot: { x: canvas.clientWidth * 0.5, y: canvas.clientHeight * 0.55, r: 0, a: 0 },

    activeUntil: 0,
    dyingUntil: 0,
    wasActive: false,

    tapSpot(x, y, lightSetting, handSetting) {
      // allow spot only when light setting is low AND user selected hand=light AND owned light
      const ok = lightSetting === "low" && handSetting === "light" && hasItem("hand", "light");
      if (!ok) return;

      const now = performance.now();

      // 追従は常に更新（ただしバッテリー時間は延長しない）
      light.spot.x = x;
      light.spot.y = y;

      // まだ点いている間は位置更新のみ
      if (now < light.activeUntil) return;

      // 2.8秒バッテリー開始
      light.activeUntil = now + 2800;
      light.wasActive = true;

      light.spot.r = 110;
      light.spot.a = 0.22;
    },

    update(t, idleMs) {
      // idle makes the world slightly more visible, but not informative
      const idleGlow = Math.min(0.06, idleMs / 40000 * 0.06);
      light._idleGlow = idleGlow;

      // active
      if (t < light.activeUntil) {
        // 点灯中は安定（追従のみ）
        light.spot.a = 0.22;
        light.spot.r = 110;
        return;
      }

      // just expired -> "ジジジッ" を鳴らすトリガ（音側は別で受ける）
      if (light.wasActive) {
        light.wasActive = false;
        light.dyingUntil = t + 220; // 余韻（ジジジッの間）
        window.dispatchEvent(new Event("sense-light-die"));
      }

      // dying flicker (visual)
      if (t < light.dyingUntil) {
        const phase = (t % 18) / 18;
        const flick = phase < 0.5 ? 1 : 0.35;
        light.spot.a = 0.10 * flick;
        light.spot.r = 92;
        return;
      }

      // off
      light.spot.a = 0;
      light.spot.r = 0;
    },

    draw(ctx, w, h) {
      // tiny ambient lift
      if (light._idleGlow > 0) {
        ctx.fillStyle = `rgba(255,255,255,${light._idleGlow})`;
        ctx.fillRect(0, 0, w, h);
      }

      // spot
      if (light.spot.a < 0.01) return;

      const grd = ctx.createRadialGradient(
        light.spot.x,
        light.spot.y,
        0,
        light.spot.x,
        light.spot.y,
        light.spot.r
      );
      grd.addColorStop(0, `rgba(255,255,255,${light.spot.a})`);
      grd.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    },
  };

  return light;
}
