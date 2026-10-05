// Canvas painting toolkit. All of STARFALL's "temporary production art" is
// painted at runtime into canvases and handed to Phaser as textures, which
// gives us real gradients, soft shadows and blur that Phaser's vector
// Graphics can't do.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const ctx = c.getContext('2d');
  return { c, ctx, w: c.width, h: c.height };
}

// Paint into a canvas and register it as a texture. `scale` paints at a lower
// resolution (soft background layers) — sprites using it should setScale(1/scale).
export function paintTexture(scene, key, w, h, painter, { scale = 1 } = {}) {
  if (scene.textures.exists(key)) return key;
  const { c, ctx } = makeCanvas(w * scale, h * scale);
  ctx.save();
  ctx.scale(scale, scale);
  painter(ctx, w, h);
  ctx.restore();
  const tex = scene.textures.addCanvas(key, c);
  tex.customData.paintScale = scale;
  return key;
}

// Add an image at design size regardless of the resolution it was painted at.
export function addPainted(scene, x, y, key, originX = 0.5, originY = 0.5) {
  const img = scene.add.image(x, y, key).setOrigin(originX, originY);
  const s = scene.textures.get(key).customData?.paintScale || 1;
  if (s !== 1) img.setScale(1 / s);
  return img;
}

export function paintScaleOf(scene, key) {
  return scene.textures.get(key).customData?.paintScale || 1;
}

// Deterministic randomness so the art is identical every launch.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, a = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function hexNum(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

export function lin(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}

export function rad(ctx, x, y, r, stops, x0 = x, y0 = y, r0 = 0) {
  const g = ctx.createRadialGradient(x0, y0, r0, x, y, r);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}

export function glow(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = rad(ctx, x, y, r, [[0, color], [0.35, rgba(color, 0.35)], [1, rgba(color, 0)]]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

export function poly(ctx, pts, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

export function ellipse(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

export function roundRect(ctx, x, y, w, h, r, fill, stroke, lw = 1) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

export function line(ctx, x0, y0, x1, y1, color, w = 1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

// Per-pixel film grain baked into a texture (subtle; the shader adds live grain).
export function bakeGrain(ctx, w, h, amount = 10, seed = 7) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (r() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

// Clip subsequent drawing to the given path builder; restore when done.
export function clipTo(ctx, build, fn) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

// Art-deco sunburst: thin rays from a centre, limited to an angle range.
export function sunburst(ctx, x, y, r0, r1, count, a0, a1, color, width = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  for (let i = 0; i <= count; i++) {
    const a = a0 + (a1 - a0) * (i / count);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();
}

// Four-pointed star — the emblem shared (and inverted) by Star and the Umbral.
export function starShape(ctx, x, y, r, inner = 0.18, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

// Paint a smooth closed blob through points using quadratic midpoints.
export function blob(ctx, pts) {
  ctx.beginPath();
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}

// Soft blur fallback that works everywhere: draw a canvas down and back up.
export function softened(source, factor = 4) {
  const small = makeCanvas(source.width / factor, source.height / factor);
  small.ctx.imageSmoothingQuality = 'high';
  small.ctx.drawImage(source, 0, 0, small.w, small.h);
  const out = makeCanvas(source.width, source.height);
  out.ctx.imageSmoothingQuality = 'high';
  out.ctx.drawImage(small.c, 0, 0, out.w, out.h);
  return out.c;
}
