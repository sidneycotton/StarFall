import { paintTexture, rng, lin, rad, rgba, glow, poly, ellipse } from './paint.js';
import { halo } from './city.js';

// Above the cloud over Vesper: a moonlit floor of cloud, the tip of the
// Aureate Spire breaking through it, and nothing else for miles.

function cloudBank(ctx, r, w, h, { top, color, lit, puff = 1 }) {
  for (let i = 0; i < 70; i++) {
    const x = r() * w;
    const y = top + r() * (h - top) * 0.5;
    const rr = (50 + r() * 120) * puff;
    ctx.fillStyle = rad(ctx, x, y, rr, [[0, rgba(color, 0.9)], [0.7, rgba(color, 0.6)], [1, rgba(color, 0)]]);
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    // Moonlit top edges.
    ctx.fillStyle = rad(ctx, x - rr * 0.2, y - rr * 0.5, rr * 0.7, [[0, rgba(lit, 0.25)], [1, rgba(lit, 0)]]);
    ctx.beginPath(); ctx.arc(x, y, rr, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.fillRect(0, top + (h - top) * 0.45, w, h);
}

export function registerSky(scene) {
  paintTexture(scene, 'sk_sky', 1600, 900, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#020308'], [0.5, '#0a1024'], [0.85, '#1c2440'], [1, '#2a2e48']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(41);
    for (let i = 0; i < 420; i++) {
      const y = r() * h * 0.7;
      ctx.fillStyle = rgba('#eef0ff', (0.2 + r() * 0.6) * (1 - y / (h * 0.75)));
      const s = r() < 0.05 ? 2 : 1;
      ctx.fillRect(r() * w, y, s, s);
    }
    // The moon, full and enormous up here.
    glow(ctx, 360, 210, 260, '#9aa8ff', 0.18);
    ctx.fillStyle = rad(ctx, 345, 195, 70, [[0, '#ffffff'], [0.8, '#dfe2f4'], [1, '#b8bcd8']]);
    ctx.beginPath(); ctx.arc(360, 210, 70, 0, Math.PI * 2); ctx.fill();
  }, { scale: 0.5 });

  paintTexture(scene, 'sk_cloud_far', 2400, 500, (ctx, w, h) => cloudBank(ctx, rng(7), w, h, { top: 150, color: '#252a44', lit: '#c8d0ff', puff: 0.8 }), { scale: 0.5 });
  paintTexture(scene, 'sk_cloud_near', 2400, 500, (ctx, w, h) => cloudBank(ctx, rng(13), w, h, { top: 120, color: '#1a1d32', lit: '#e0e4ff', puff: 1.3 }), { scale: 0.5 });
  // A loose wisp for flying through.
  paintTexture(scene, 'sk_wisp', 600, 180, (ctx, w, h) => {
    const r = rng(3);
    for (let i = 0; i < 26; i++) {
      const x = 60 + r() * (w - 120);
      const y = h / 2 + (r() - 0.5) * 50;
      const rr = 30 + r() * 60;
      ctx.fillStyle = rad(ctx, x, y, rr, [[0, 'rgba(200,210,255,0.22)'], [1, 'rgba(200,210,255,0)']]);
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    }
  }, { scale: 0.5 });

  // The tip of the Aureate Spire breaking the cloud floor.
  paintTexture(scene, 'sk_spire', 220, 700, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = lin(ctx, cx - 30, 0, cx + 30, 0, [[0, '#14101c'], [0.6, '#3a3044'], [1, '#14101c']]);
    poly(ctx, [[cx - 34, h], [cx - 14, 160], [cx, 10], [cx + 14, 160], [cx + 34, h]], ctx.fillStyle);
    [120, 210, 300].forEach((y, i) => halo(ctx, cx, y, 60 - i * 8, '#f0d080', 0.75));
    glow(ctx, cx, 12, 40, '#fff0c0', 0.7);
    ellipse(ctx, cx, 12, 3, 5, '#ffffff');
  });
}
