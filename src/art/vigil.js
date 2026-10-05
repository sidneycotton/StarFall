import { paintTexture, rng, lin, rad, rgba, glow, poly, ellipse, blob, roundRect } from './paint.js';
import { building, halo, paintStarStatue } from './city.js';

// Vesper Plaza on the seventh anniversary. The colossal statue of Star, a
// civic screen the size of a building, and thousands of small candles.

export const VIGIL_W = 2600;

function mourner(ctx, r, w, h, { coat, gold = false, child = false, candle = true }) {
  const cx = w / 2;
  const s = child ? 0.66 : 1;
  const H = h * s;
  const top = h - H;
  ctx.fillStyle = lin(ctx, cx - 16, 0, cx + 16, 0, [[0, coat[0]], [0.55, coat[1]], [1, coat[0]]]);
  blob(ctx, [[cx - 11 * s, top + H * 0.18], [cx + 11 * s, top + H * 0.18], [cx + 16 * s, top + H * 0.5], [cx + 14 * s, h], [cx - 14 * s, h], [cx - 16 * s, top + H * 0.5]]);
  ctx.fill();
  if (gold) {
    // Dressed as her: a gold-painted mantle and a paper star.
    poly(ctx, [[cx - 12 * s, top + H * 0.2], [cx + 12 * s, top + H * 0.2], [cx + 15 * s, top + H * 0.3], [cx - 15 * s, top + H * 0.3]], rgba('#d9b46a', 0.8));
  }
  ellipse(ctx, cx, top + H * 0.1, 8.5 * s, 10 * s, '#3a2a2c');
  if (gold) ellipse(ctx, cx + 3 * s, top + H * 0.09, 6 * s, 2 * s, rgba('#e8c47a', 0.9));
  if (candle) {
    // Candle held at the chest; the face catches its light from below.
    const cy = top + H * 0.36;
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(cx + 4 * s, cy, 3, 10 * s);
    glow(ctx, cx + 5.5 * s, cy - 3, 26 * s, '#ffcc80', 0.55);
    ellipse(ctx, cx + 5.5 * s, cy - 3, 1.6, 3, '#fff0c8');
    ctx.fillStyle = rad(ctx, cx + 3, top + H * 0.14, 12 * s, [[0, rgba('#ffc880', 0.5)], [1, rgba('#ffc880', 0)]]);
    ctx.beginPath(); ctx.arc(cx + 3, top + H * 0.13, 10 * s, 0, Math.PI); ctx.fill();
  }
  void r;
}

export function registerVigil(scene) {
  paintTexture(scene, 'vg_sky', 1600, 900, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#04030a'], [0.5, '#0e0a1a'], [0.85, '#22142a'], [1, '#2a1828']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(17);
    for (let i = 0; i < 180; i++) {
      const y = r() * h * 0.6;
      ctx.fillStyle = rgba('#e8e2ff', 0.12 + r() * 0.5 * (1 - y / (h * 0.6)));
      ctx.fillRect(r() * w, y, 1, 1);
    }
  }, { scale: 0.5 });

  paintTexture(scene, 'vg_city', 3000, 900, (ctx, w, h) => {
    const r = rng(29);
    const base = 700;
    let x = -20;
    while (x < w) {
      const bw = 40 + r() * 90;
      const top = 200 + r() * 260;
      const style = ['slab', 'stepped', 'slab', 'cathedral', 'spire'][Math.floor(r() * 5)];
      building(ctx, r, x, bw, top, base, style, '#110b18', '#22142a', { density: 0.16, warm: '#f0c080', cool: '#a8d0d8' });
      if (style === 'stepped' && r() < 0.5) halo(ctx, x + bw / 2, top - 8, bw * 0.5, '#e8c47a', 0.4);
      x += bw + r() * 22;
    }
    ctx.fillStyle = '#0a0710';
    ctx.fillRect(0, base, w, h - base);
  }, { scale: 0.5 });

  // The statue, colossal, floodlit; seen from the plaza.
  paintTexture(scene, 'vg_statue', 700, 1000, (ctx, w, h) => {
    paintStarStatue(ctx, w / 2, h - 10, 4.6, { fill: '#100a16', light: '#e2bc72', lightAlpha: 0.7 });
  });

  // Plaza floor: wet stone, candles in the cracks.
  paintTexture(scene, 'vg_floor', 1024, 260, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#1a1220'], [1, '#08060a']]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba('#000', 0.4);
    for (let y = 18; y < h; y += 18 + y * 0.15) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    const r = rng(8);
    for (let i = 0; i < 70; i++) {
      const x = r() * w;
      const y = 6 + r() * 60;
      glow(ctx, x, y, 10 + r() * 10, '#ffbe70', 0.35);
      ctx.fillStyle = '#efe2c4';
      ctx.fillRect(x - 1, y, 2.5, 5);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = rgba('#ffc880', 0.05 + r() * 0.08);
      ctx.fillRect(r() * w, 60 + r() * (h - 60), 2, 20 + r() * 40);
    }
  });

  // Mourners: six variants; two dressed as her, one child.
  const coats = [['#1c1a24', '#2e2a3a'], ['#2a1a20', '#40282e'], ['#1a2224', '#2a3638'], ['#24201a', '#3a3428'], ['#1e1a28', '#30283e'], ['#18181c', '#2a2a30']];
  coats.forEach((coat, i) => {
    paintTexture(scene, `vg_mourner${i}`, 44, 130, (ctx, w, h) => mourner(ctx, rng(i), w, h, { coat, gold: i === 1 || i === 4, candle: i !== 5 }));
  });
  paintTexture(scene, 'vg_child', 44, 130, (ctx, w, h) => mourner(ctx, rng(9), w, h, { coat: ['#2a2234', '#463a58'], child: true, gold: true }));

  // The civic screen's frame (contents are live).
  paintTexture(scene, 'vg_screen', 900, 520, (ctx, w, h) => {
    roundRect(ctx, 0, 0, w, h, 6, '#0a080c', '#2a2430', 6);
    ctx.fillStyle = '#020203';
    ctx.fillRect(18, 18, w - 36, h - 36);
    // Pylons.
    ctx.fillStyle = '#0a080c';
    ctx.fillRect(w * 0.2, h - 2, 20, 2);
  });
}
