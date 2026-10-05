import { paintTexture, rng, lin, rad, rgba, glow, poly, starShape, ellipse } from './paint.js';

// The city of Vesper, seen through glass. Mythology grown into architecture:
// Aureate towers wear gold halos, Meridian slabs are ruled grids, and the
// skyline is dominated by a colossal statue of Star.

function building(ctx, r, x, w, top, base, style, fill, haze, lights) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (style === 'spire') {
    ctx.moveTo(x, base);
    ctx.lineTo(x, top + w * 1.2);
    ctx.lineTo(x + w * 0.5, top - w * 2.2);
    ctx.lineTo(x + w, top + w * 1.2);
    ctx.lineTo(x + w, base);
  } else if (style === 'stepped') {
    const s = w * 0.16;
    ctx.moveTo(x, base);
    ctx.lineTo(x, top + s * 3);
    ctx.lineTo(x + s, top + s * 3);
    ctx.lineTo(x + s, top + s * 1.5);
    ctx.lineTo(x + s * 2, top + s * 1.5);
    ctx.lineTo(x + s * 2, top);
    ctx.lineTo(x + w - s * 2, top);
    ctx.lineTo(x + w - s * 2, top + s * 1.5);
    ctx.lineTo(x + w - s, top + s * 1.5);
    ctx.lineTo(x + w - s, top + s * 3);
    ctx.lineTo(x + w, top + s * 3);
    ctx.lineTo(x + w, base);
    // antenna
    ctx.moveTo(x + w / 2 - 1, top);
    ctx.lineTo(x + w / 2 - 1, top - w * 0.9);
    ctx.lineTo(x + w / 2 + 1, top - w * 0.9);
    ctx.lineTo(x + w / 2 + 1, top);
  } else if (style === 'cathedral') {
    ctx.moveTo(x, base);
    ctx.lineTo(x, top + w * 0.6);
    ctx.quadraticCurveTo(x + w * 0.5, top - w * 0.4, x + w, top + w * 0.6);
    ctx.lineTo(x + w, base);
  } else {
    ctx.rect(x, top, w, base - top);
  }
  ctx.closePath();
  ctx.fill();

  // Lit windows: sparse, irregular, mostly dim — a city that never fully sleeps.
  if (lights) {
    const cell = Math.max(3, Math.round(w / 9));
    for (let yy = top + cell * 2; yy < base - cell; yy += cell * 1.6) {
      for (let xx = x + cell * 0.6; xx < x + w - cell; xx += cell * 1.3) {
        const p = r();
        if (p < lights.density) {
          ctx.fillStyle = rgba(r() < 0.75 ? lights.warm : lights.cool, 0.25 + r() * 0.55);
          ctx.fillRect(xx, yy, cell * 0.55, cell * 0.7);
        }
      }
    }
  }
  // Atmospheric haze toward the base.
  ctx.fillStyle = lin(ctx, 0, top, 0, base, [[0, rgba(haze, 0)], [1, rgba(haze, 0.75)]]);
  ctx.fillRect(x - 1, top - w * 2.5, w + 2, base - top + w * 2.5);
}

function halo(ctx, cx, cy, r, color, alpha) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  glow(ctx, cx, cy, r * 2.2, color, alpha * 0.35);
}

// The colossal statue of Star: cape, raised arm, a star held high.
export function paintStarStatue(ctx, x, base, scale, { fill = '#120a18', light = '#d9b46a', lightAlpha = 0.5 } = {}) {
  const s = scale;
  ctx.save();
  ctx.translate(x, base);
  // Floodlight from below.
  ctx.fillStyle = rad(ctx, 0, -40 * s, 140 * s, [[0, rgba(light, lightAlpha * 0.5)], [1, rgba(light, 0)]]);
  ctx.fillRect(-160 * s, -220 * s, 320 * s, 240 * s);
  // Plinth.
  poly(ctx, [[-34 * s, 0], [-26 * s, -40 * s], [26 * s, -40 * s], [34 * s, 0]], fill);
  // Cape sweeping to the left.
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-6 * s, -128 * s);
  ctx.quadraticCurveTo(-40 * s, -100 * s, -58 * s, -40 * s);
  ctx.lineTo(-20 * s, -44 * s);
  ctx.quadraticCurveTo(-8 * s, -80 * s, 6 * s, -120 * s);
  ctx.closePath();
  ctx.fill();
  // Body.
  poly(ctx, [[-9 * s, -132 * s], [9 * s, -132 * s], [12 * s, -96 * s], [8 * s, -42 * s], [-10 * s, -42 * s], [-12 * s, -96 * s]], fill);
  ellipse(ctx, 0, -140 * s, 6.5 * s, 8 * s, fill);
  // Raised arm holding a star.
  poly(ctx, [[5 * s, -128 * s], [12 * s, -132 * s], [22 * s, -176 * s], [16 * s, -178 * s]], fill);
  ctx.fillStyle = rgba(light, Math.min(1, lightAlpha * 1.6));
  starShape(ctx, 20 * s, -188 * s, 10 * s, 0.22);
  ctx.fill();
  glow(ctx, 20 * s, -188 * s, 26 * s, light, lightAlpha);
  // Rim light down the lit side.
  ctx.strokeStyle = rgba(light, lightAlpha * 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(9 * s, -132 * s); ctx.lineTo(12 * s, -96 * s); ctx.lineTo(8 * s, -42 * s);
  ctx.stroke();
  ctx.restore();
}

export function registerCity(scene) {
  paintTexture(scene, 'city_sky', 1600, 900, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
      [0, '#040309'], [0.35, '#0c0716'], [0.62, '#1f0f2c'], [0.78, '#3a1838'], [0.9, '#4a2230'], [1, '#2a1420'],
    ]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(11);
    for (let i = 0; i < 160; i++) {
      const y = r() * h * 0.55;
      ctx.fillStyle = rgba('#e8e2ff', 0.15 + r() * 0.5 * (1 - y / (h * 0.55)));
      const s = r() < 0.08 ? 2 : 1;
      ctx.fillRect(r() * w, y, s, s);
    }
    // Thin crescent moon, half eclipsed.
    ellipse(ctx, 1210, 150, 26, 26, rgba('#efe6ff', 0.9));
    ellipse(ctx, 1220, 146, 25, 25, '#08050f');
    glow(ctx, 1210, 150, 90, '#b9a6ff', 0.12);
  }, { scale: 0.5 });

  paintTexture(scene, 'city_far', 2000, 900, (ctx, w, h) => {
    const r = rng(21);
    const base = 760;
    let x = -20;
    while (x < w) {
      const bw = 18 + r() * 46;
      const top = 330 + r() * 260;
      const style = ['slab', 'spire', 'stepped', 'slab', 'cathedral'][Math.floor(r() * 5)];
      building(ctx, r, x, bw, top, base, style, '#2a1834', '#3e2040', { density: 0.12, warm: '#e8b878', cool: '#9fc5d0' });
      if (style === 'spire' && r() < 0.5) halo(ctx, x + bw / 2, top - bw * 0.6, bw * 0.9, '#d9b46a', 0.35);
      x += bw + r() * 14;
    }
    // Horizon glow — the city's own light pollution.
    ctx.fillStyle = lin(ctx, 0, 520, 0, h, [[0, 'rgba(120,50,90,0)'], [0.6, 'rgba(140,60,90,0.35)'], [1, 'rgba(60,20,40,0.6)']]);
    ctx.fillRect(0, 520, w, h - 520);
  }, { scale: 0.5 });

  paintTexture(scene, 'city_mid', 2400, 900, (ctx, w, h) => {
    const r = rng(37);
    const base = 820;
    let x = -30;
    while (x < w) {
      const bw = 40 + r() * 90;
      // Keep a clearing around the statue so it reads as a silhouette.
      if (x + bw > 1150 && x < 1350) { x = 1350; continue; }
      const top = 380 + r() * 300;
      const style = ['slab', 'stepped', 'slab', 'cathedral', 'spire'][Math.floor(r() * 5)];
      building(ctx, r, x, bw, top, base, style, '#120a19', '#24112a', { density: 0.2, warm: '#f0c080', cool: '#a8d0d8' });
      if (style === 'stepped' && r() < 0.6) halo(ctx, x + bw / 2, top - 8, bw * 0.55, '#e8c47a', 0.5);
      // Meridian ruled facades: thin horizontal lines.
      if (style === 'slab' && r() < 0.35) {
        ctx.strokeStyle = rgba('#8fb7bf', 0.12);
        for (let yy = top + 6; yy < base; yy += 9) {
          ctx.beginPath(); ctx.moveTo(x + 2, yy); ctx.lineTo(x + bw - 2, yy); ctx.stroke();
        }
      }
      x += bw + r() * 26;
    }
    paintStarStatue(ctx, 1250, 640, 1.6, { fill: '#0e0814', light: '#d9b46a', lightAlpha: 0.55 });
    // Tower the statue stands on.
    poly(ctx, [[1190, base], [1206, 640], [1294, 640], [1310, base]], '#0e0814');
    ctx.fillStyle = lin(ctx, 0, 600, 0, base, [[0, 'rgba(36,17,42,0)'], [1, 'rgba(36,17,42,0.8)']]);
    ctx.fillRect(0, 560, w, base - 560);
    ctx.fillStyle = '#0a0610';
    ctx.fillRect(0, base, w, h - base);
  }, { scale: 0.5 });

  // A pale full moon seen through the oculus — the light the eclipse disc covers.
  paintTexture(scene, 'moon', 360, 360, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = rad(ctx, cx - 30, cx - 30, 150, [[0, '#f6f2fb'], [0.7, '#d9d0ea'], [1, '#a99cc4']]);
    ctx.beginPath(); ctx.arc(cx, cx, 140, 0, Math.PI * 2); ctx.fill();
    [[-40, -20, 34], [30, 40, 22], [50, -50, 16], [-20, 60, 14]].forEach(([dx, dy, r]) => {
      ctx.fillStyle = rgba('#8a7ca8', 0.18);
      ctx.beginPath(); ctx.arc(cx + dx, cx + dy, r, 0, Math.PI * 2); ctx.fill();
    });
  });

  // A single flying vehicle light; tinted at spawn.
  paintTexture(scene, 'vehicle', 48, 12, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(255,255,255,0)'], [0.8, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,1)']]);
    ctx.fillRect(0, h / 2 - 1.5, w, 3);
    ctx.fillStyle = rad(ctx, w - 4, h / 2, 6, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(w - 12, 0, 12, h);
  });
}
