import { paintTexture, lin, rgba, glow, ellipse, rng, blob, bakeGrain, mix } from './paint.js';

// Fragments of the shared vision. Bone, ash and ochre, with ultraviolet in the
// shadows. Never a clear view of what is coming — scale without a subject.

const SAND = ['#e8dcc4', '#c8b48e', '#8a7656', '#4a3a2a'];
const SKY = ['#f2ece2', '#c8c0b6', '#5a4a5e'];

function dunes(ctx, w, h, horizon, seed, { layers = 5, dark = 0 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < layers; i++) {
    const t = i / Math.max(1, layers - 1);
    const base = horizon + t * (h - horizon) * 0.95;
    const col = SAND[Math.min(3, Math.floor(t * 2.6 + dark))];
    const amp = 18 + t * 60;
    const ph = r() * 10;
    const crest = (x) => base - Math.abs(Math.sin(x / (160 + t * 160) + ph)) * amp - Math.sin(x / 47 + ph) * 3;
    // Lit crest falling into a violet-black trough: low sun, long shadows.
    ctx.fillStyle = lin(ctx, 0, base - amp, 0, base + 90 + t * 60, [[0, col], [0.45, mix(col, '#2a1a2c', 0.45)], [1, '#140a14']]);
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, crest(x));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    // Long shadows: everything below the crest line shifted down-right falls in shade.
    ctx.save();
    ctx.clip();
    ctx.fillStyle = rgba('#1a0e1c', 0.32 + t * 0.18);
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, crest(x - 70) + 16 + t * 14);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = rgba('#fff6e6', 0.32 - t * 0.14);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) (x ? ctx.lineTo(x, crest(x)) : ctx.moveTo(x, crest(x)));
    ctx.stroke();
  }
}

function sky(ctx, w, h, horizon, dark = false) {
  ctx.fillStyle = lin(ctx, 0, 0, 0, horizon, dark
    ? [[0, '#0a0610'], [0.7, '#2a1a2a'], [1, '#6a5246']]
    : [[0, SKY[2]], [0.55, SKY[1]], [1, SKY[0]]]);
  ctx.fillRect(0, 0, w, horizon + 10);
}

// The five, as they stand in the vision. Their order and stance must match
// the profile portraits in the chamber exactly.
export const FIVE = [
  { x: 0.30, h: 1.0, kind: 'dowser' },
  { x: 0.40, h: 1.12, kind: 'paperweight' },
  { x: 0.50, h: 1.06, kind: 'humdrum' },
  { x: 0.60, h: 0.88, kind: 'lukewarm' },
  { x: 0.72, h: 0.98, kind: 'wallflower' },
];

// Silhouette of one of the five, standing, feet at (x, y), height s.
export function paintFigure(ctx, kind, x, y, s, color = '#0e0810') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 100, s / 100);
  ctx.fillStyle = color;
  const body = {
    dowser: () => {
      blob(ctx, [[-14, -62], [14, -62], [16, -10], [10, 0], [-10, 0], [-16, -10]]);
      ctx.fill();
      ellipse(ctx, 0, -74, 8, 9, color);
      // Braids.
      ctx.fillRect(-9, -76, 3, 14); ctx.fillRect(6, -76, 3, 14);
      // Forked rod held forward and low.
      ctx.strokeStyle = color; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(10, -40); ctx.lineTo(30, -46); ctx.moveTo(10, -36); ctx.lineTo(30, -46); ctx.lineTo(42, -50); ctx.stroke();
    },
    paperweight: () => {
      blob(ctx, [[-10, -66], [10, -66], [11, -8], [6, 0], [-6, 0], [-11, -8]]);
      ctx.fill();
      ellipse(ctx, 0, -78, 7, 8.5, color);
      // One arm raised, palm out; a pebble hanging in the air above it.
      ctx.strokeStyle = color; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(8, -60); ctx.lineTo(18, -82); ctx.lineTo(20, -96); ctx.stroke();
      ellipse(ctx, 21, -112, 2.6, 2.4, color);
    },
    humdrum: () => {
      blob(ctx, [[-20, -58], [20, -58], [22, -10], [14, 0], [-14, 0], [-22, -10]]);
      ctx.fill();
      ellipse(ctx, 0, -70, 10, 10, color);
      // Headphones around the neck.
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -60, 12, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      ellipse(ctx, -12, -58, 4, 5, color); ellipse(ctx, 12, -58, 4, 5, color);
    },
    lukewarm: () => {
      blob(ctx, [[-14, -50], [14, -50], [18, -8], [12, 0], [-12, 0], [-18, -8]]);
      ctx.fill();
      ellipse(ctx, 0, -60, 8, 8.5, color);
      ellipse(ctx, 0, -66, 8, 4, color);
      // A mug held in both hands.
      ctx.fillRect(-6, -36, 12, 10);
    },
    wallflower: () => {
      blob(ctx, [[-11, -60], [11, -60], [12, -8], [7, 0], [-7, 0], [-12, -8]]);
      ctx.fill();
      // Hood up, face a void.
      blob(ctx, [[-10, -64], [0, -84], [10, -64], [8, -54], [-8, -54]]);
      ctx.fill();
    },
  };
  body[kind]();
  ctx.restore();
}

export function registerVision(scene) {
  const W = 1600; const H = 900; const opt = { scale: 0.5 };

  // A desert under a black sun.
  paintTexture(scene, 'v_sun', W, H, (ctx, w, h) => {
    const hz = 560;
    sky(ctx, w, h, hz);
    glow(ctx, w * 0.5, 260, 520, '#ffffff', 0.35);
    // Eclipse: a black disc with a thin corona.
    glow(ctx, w * 0.5, 260, 210, '#fff4e0', 0.9);
    ctx.fillStyle = '#050307';
    ctx.beginPath(); ctx.arc(w * 0.5, 260, 128, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba('#fffaf0', 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w * 0.5, 260, 131, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba('#a77bff', 0.35);
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(w * 0.5, 260, 140, Math.PI * 0.1, Math.PI * 0.6); ctx.stroke();
    dunes(ctx, w, h, hz, 3);
    bakeGrain(ctx, w / 2, h / 2, 26, 3);
  }, opt);

  // Buildings half-consumed by dunes — haloed towers, tilted, drowning.
  paintTexture(scene, 'v_city', W, H, (ctx, w, h) => {
    const hz = 520;
    sky(ctx, w, h, 640);
    const r = rng(8);
    for (let i = 0; i < 9; i++) {
      const x = 120 + i * 160 + r() * 60;
      const bw = 50 + r() * 70;
      const top = 200 + r() * 220;
      ctx.save();
      ctx.translate(x, 700);
      ctx.rotate((r() - 0.5) * 0.35);
      ctx.fillStyle = lin(ctx, -bw / 2, 0, bw / 2, 0, [[0, '#5a4a4a'], [0.5, '#7a6a62'], [1, '#2a1e22']]);
      ctx.fillRect(-bw / 2, top - 700, bw, 700 - top + 50);
      for (let y = top - 690; y < 0; y += 16) {
        ctx.fillStyle = rgba('#1a1018', 0.6);
        ctx.fillRect(-bw / 2 + 6, y, bw - 12, 4);
      }
      if (i % 3 === 0) {
        ctx.strokeStyle = rgba('#d9b46a', 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, top - 720, bw * 0.9, bw * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
    dunes(ctx, w, h, 600, 11, { layers: 4 });
    // Sand pouring from a broken tower.
    ctx.fillStyle = lin(ctx, 0, 300, 0, 650, [[0, rgba(SAND[1], 0.0)], [1, rgba(SAND[1], 0.6)]]);
    ctx.fillRect(722, 300, 14, 360);
    bakeGrain(ctx, w / 2, h / 2, 26, 4);
  }, opt);

  // Dunes — with something moving beneath. The ridge is a separate sprite.
  paintTexture(scene, 'v_beneath', W, H, (ctx, w, h) => {
    const hz = 300;
    sky(ctx, w, h, hz);
    dunes(ctx, w, h, hz, 21, { layers: 7 });
    bakeGrain(ctx, w / 2, h / 2, 24, 5);
  }, opt);

  paintTexture(scene, 'v_ridge', 1400, 220, (ctx, w, h) => {
    // A long swell of sand raised from below: lit crest, deep shadow, sand sliding off.
    const top = (x) => h - 20 - Math.sin((x / w) * Math.PI) * 150 * (0.75 + 0.25 * Math.sin((x / w) * 7));
    ctx.fillStyle = lin(ctx, 0, 40, 0, h, [[0, '#f2e6cc'], [0.4, '#a88e6a'], [1, 'rgba(40,24,36,0)']]);
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 10) ctx.lineTo(x, top(x));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = lin(ctx, w * 0.5, 0, w, 0, [[0, 'rgba(26,14,28,0)'], [1, 'rgba(26,14,28,0.75)']]);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.strokeStyle = rgba('#fffaf0', 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 10) (x ? ctx.lineTo(x, top(x)) : ctx.moveTo(x, top(x)));
    ctx.stroke();
  }, opt);

  // Five figures on a dune crest at dusk.
  paintTexture(scene, 'v_five', W, H, (ctx, w, h) => {
    const hz = 640;
    ctx.fillStyle = lin(ctx, 0, 0, 0, hz, [[0, '#1a1020'], [0.6, '#6a4a52'], [1, '#e8c8a0']]);
    ctx.fillRect(0, 0, w, hz + 10);
    glow(ctx, w * 0.5, hz, 600, '#ffd8a0', 0.4);
    // The crest.
    ctx.fillStyle = '#120a12';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, 700);
    ctx.quadraticCurveTo(w * 0.5, 600, w, 700);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    FIVE.forEach((f) => {
      const x = f.x * w;
      const y = 700 - (1 - Math.pow((f.x - 0.5) * 2, 2)) * 50 + 2;
      paintFigure(ctx, f.kind, x, y, 230 * f.h, '#0a060c');
    });
    // Blown sand.
    const r = rng(17);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = rgba('#f0dcc0', r() * 0.25);
      ctx.fillRect(r() * w, 500 + r() * 300, 4 + r() * 22, 1);
    }
    bakeGrain(ctx, w / 2, h / 2, 26, 6);
  }, opt);

  // A cape tearing in violent wind.
  paintTexture(scene, 'v_cape', W, H, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, h, [[0, '#d8ccb8'], [0.6, '#a89880'], [1, '#5a4a4a']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = rgba('#f4ead6', r() * 0.3);
      ctx.fillRect(r() * w, r() * h, 20 + r() * 80, 1.5);
    }
    // The cape: streaming from upper left, tearing into tongues on the right.
    ctx.fillStyle = '#120818';
    ctx.beginPath();
    ctx.moveTo(220, 160);
    ctx.bezierCurveTo(520, 120, 820, 260, 1180, 210);
    const tongues = [[1420, 250], [1240, 300], [1460, 360], [1220, 410], [1400, 470], [1160, 500], [1300, 570]];
    tongues.forEach(([x, y], i) => {
      ctx.quadraticCurveTo(x - 60, y - 20, x, y);
      ctx.quadraticCurveTo(x - 120, y + 10, 1150 - i * 20, y + 26);
    });
    ctx.bezierCurveTo(900, 640, 560, 560, 300, 420);
    ctx.bezierCurveTo(240, 330, 200, 240, 220, 160);
    ctx.closePath();
    ctx.fill();
    // Violet lining caught along the upper edge.
    ctx.strokeStyle = '#4a2468';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(220, 160); ctx.bezierCurveTo(520, 120, 820, 260, 1180, 210); ctx.stroke();
    ctx.strokeStyle = rgba('#000000', 0.5);
    ctx.lineWidth = 3;
    [[400, 220, 520, 520], [640, 230, 760, 560], [880, 250, 980, 560]].forEach(([x0, y0, x1, y1]) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + 40, (y0 + y1) / 2, x1, y1); ctx.stroke();
    });
    // Shreds torn free.
    for (let i = 0; i < 9; i++) {
      ctx.save();
      ctx.translate(1350 + r() * 220, 200 + r() * 420);
      ctx.rotate(r() * 0.6 - 0.3);
      ctx.fillStyle = '#120818';
      ctx.fillRect(0, 0, 30 + r() * 80, 3 + r() * 8);
      ctx.restore();
    }
    bakeGrain(ctx, w / 2, h / 2, 30, 7);
  }, opt);

  // An enormous circular shape rising from the horizon.
  paintTexture(scene, 'v_ring', W, H, (ctx, w, h) => {
    const hz = 640;
    sky(ctx, w, h, hz, true);
    ctx.strokeStyle = '#0a0608';
    ctx.lineWidth = 70;
    ctx.beginPath(); ctx.arc(w * 0.56, hz + 160, 620, Math.PI * 1.05, Math.PI * 1.98); ctx.stroke();
    // Ridged texture along the arc: scale bands, too large to understand.
    ctx.strokeStyle = rgba('#5a4a5a', 0.5);
    ctx.lineWidth = 2;
    for (let a = Math.PI * 1.06; a < Math.PI * 1.97; a += 0.025) {
      const r0 = 590; const r1 = 650;
      ctx.beginPath();
      ctx.moveTo(w * 0.56 + Math.cos(a) * r0, hz + 160 + Math.sin(a) * r0);
      ctx.lineTo(w * 0.56 + Math.cos(a + 0.012) * r1, hz + 160 + Math.sin(a + 0.012) * r1);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba('#d8c0ff', 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w * 0.56, hz + 160, 655, Math.PI * 1.2, Math.PI * 1.5); ctx.stroke();
    dunes(ctx, w, h, hz, 31, { layers: 3, dark: 1 });
    bakeGrain(ctx, w / 2, h / 2, 26, 8);
  }, opt);

  // Scales seen far too close.
  paintTexture(scene, 'v_scales', W, H, (ctx, w, h) => {
    ctx.fillStyle = '#0a060a';
    ctx.fillRect(0, 0, w, h);
    for (let row = -2; row < 14; row++) {
      for (let col = -2; col < 14; col++) {
        const x = col * 150 + (row % 2) * 75 + row * 30;
        const y = row * 80 + Math.sin(col * 0.6) * 30;
        ctx.fillStyle = lin(ctx, x, y - 50, x, y + 60, [[0, '#4a3a42'], [0.5, '#1e141c'], [1, '#050305']]);
        ctx.beginPath();
        ctx.moveTo(x - 80, y);
        ctx.quadraticCurveTo(x, y - 90, x + 80, y);
        ctx.quadraticCurveTo(x, y + 50, x - 80, y);
        ctx.fill();
        ctx.strokeStyle = rgba('#e8dcc4', 0.12);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 70, y - 4); ctx.quadraticCurveTo(x, y - 80, x + 70, y - 4); ctx.stroke();
      }
    }
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, rgba('#c8b48e', 0.25)], [0.5, rgba('#c8b48e', 0)], [1, rgba('#a77bff', 0.15)]]);
    ctx.fillRect(0, 0, w, h);
    bakeGrain(ctx, w / 2, h / 2, 30, 9);
  }, opt);

  // A night sky; the star itself is a sprite, so it can go out.
  paintTexture(scene, 'v_night', W, H, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#020104'], [1, '#0e0814']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(41);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = rgba('#efe8ff', r() * 0.5);
      ctx.fillRect(r() * w, r() * h, 1.2, 1.2);
    }
    dunes(ctx, w, h, 780, 51, { layers: 2, dark: 3 });
  }, opt);
}
