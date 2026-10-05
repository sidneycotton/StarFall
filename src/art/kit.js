import { paintTexture, lin, rad, rgba, glow, poly, rng, ellipse, sunburst, starShape, line } from './paint.js';

// Modular architecture for the penthouse. Walls are assembled from pieces in
// "wall space" (a slower parallax plane), so window openings are real holes
// that the city layers show through.

export const C = {
  wallTop: '#07050b',
  wall: '#170d20',
  wallLow: '#1e1129',
  wallBase: '#0d0814',
  gold: '#b8955a',
  goldDim: '#6d5634',
  violet: '#7b4bc4',
  uv: '#a77bff',
  plum: '#3a1840',
  ink: '#07050b',
  stone: '#141019',
};

export const WALL_H = 700;

function wallMaterial(ctx, w, h, { top = C.wallTop, mid = C.wall, low = C.wallLow, rail = true } = {}) {
  ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, top], [0.32, mid], [0.82, low], [0.86, C.wallBase], [1, '#050308']]);
  ctx.fillRect(0, 0, w, h);
  if (rail) {
    // Chair rail and a hairline of gold: restraint, not ornament.
    ctx.fillStyle = rgba('#000', 0.35);
    ctx.fillRect(0, 598, w, 6);
    ctx.fillStyle = rgba(C.gold, 0.28);
    ctx.fillRect(0, 597, w, 1);
    ctx.fillStyle = rgba(C.uv, 0.05);
    ctx.fillRect(0, 604, w, 1);
  }
}

function cutHole(ctx, build) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  build(ctx);
  ctx.fill();
  ctx.restore();
}

function archPath(ctx, x, y, w, h) {
  const r = w / 2;
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

// Faint reflections on glass so windows read as glass, not holes.
function glassSheen(ctx, x, y, w, h, alpha = 0.06) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = lin(ctx, x, y, x + w, y + h, [[0, 'rgba(200,170,255,0.0)'], [0.45, 'rgba(200,170,255,0.9)'], [0.5, 'rgba(200,170,255,0.0)'], [0.62, 'rgba(200,170,255,0.5)'], [0.66, 'rgba(200,170,255,0)']]);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

export function registerKit(scene) {
  paintTexture(scene, 'wall_panel', 32, WALL_H, (ctx, w, h) => wallMaterial(ctx, w, h));
  paintTexture(scene, 'wall_panel_plain', 32, WALL_H, (ctx, w, h) => wallMaterial(ctx, w, h, { top: '#050407', mid: '#110c16', low: '#141019', rail: false }));

  // Fluted art-deco pilaster with a stepped capital.
  paintTexture(scene, 'pilaster', 100, WALL_H, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#0b0710'], [0.15, '#22142c'], [0.55, '#140c1a'], [1, '#08050b']]);
    ctx.fillRect(10, 0, w - 20, h);
    for (let i = 0; i < 5; i++) {
      const x = 22 + i * 14;
      ctx.fillStyle = lin(ctx, x, 0, x + 10, 0, [[0, 'rgba(0,0,0,0.5)'], [0.5, rgba(C.uv, 0.07)], [1, 'rgba(0,0,0,0.4)']]);
      ctx.fillRect(x, 120, 10, 470);
    }
    // Capital.
    [[0, 90, w, 12], [5, 102, w - 10, 8], [10, 110, w - 20, 6]].forEach(([x, y, ww, hh], i) => {
      ctx.fillStyle = i === 0 ? '#1b1022' : '#120a17';
      ctx.fillRect(x, y, ww, hh);
      ctx.fillStyle = rgba(C.gold, 0.35 - i * 0.08);
      ctx.fillRect(x, y, ww, 1);
    });
    // Base.
    ctx.fillStyle = '#0a060d';
    ctx.fillRect(4, 600, w - 8, 100);
    ctx.fillStyle = rgba(C.gold, 0.25);
    ctx.fillRect(4, 600, w - 8, 1);
    ctx.fillStyle = rgba(C.uv, 0.18);
    ctx.fillRect(10, 0, 1, h);
  });

  // Round oculus window behind the bed, framed by a sunburst — the solar motif
  // the eclipse disc will slide across.
  paintTexture(scene, 'wall_oculus', 800, WALL_H, (ctx, w, h) => {
    wallMaterial(ctx, w, h);
    const cx = 400; const cy = 300; const R = 250;
    ctx.fillStyle = rad(ctx, cx, cy, R + 70, [[0.75, '#1a0f21'], [0.9, '#251530'], [1, 'rgba(23,13,32,0)']]);
    ctx.beginPath(); ctx.arc(cx, cy, R + 70, 0, Math.PI * 2); ctx.fill();
    sunburst(ctx, cx, cy, R + 8, R + 62, 72, 0, Math.PI * 2, rgba(C.gold, 0.22), 1.2);
    ctx.strokeStyle = rgba(C.gold, 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R + 64, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#0a060d';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, Math.PI * 2); ctx.stroke();
    cutHole(ctx, (c) => c.arc(cx, cy, R, 0, Math.PI * 2));
    // Radial mullions.
    ctx.strokeStyle = '#08050b';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      line(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R, cx - Math.cos(a) * R, cy - Math.sin(a) * R, '#08050b', 3);
    }
    ctx.strokeStyle = '#08050b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.42, 0, Math.PI * 2); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    glassSheen(ctx, cx - R, cy - R, R * 2, R * 2, 0.07);
    ctx.restore();
  });

  // The hanging eclipse disc (sits in front of the oculus at a different depth).
  paintTexture(scene, 'eclipse_disc', 520, 900, (ctx) => {
    const cx = 260; const cy = 560; const R = 210;
    line(ctx, cx, 0, cx, cy - R, rgba('#a9a4b6', 0.35), 1.2);
    ctx.fillStyle = rad(ctx, cx - 40, cy - 60, R, [[0, '#120b18'], [0.8, '#07050b'], [1, '#040306']]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(C.uv, 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R - 1, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
    ctx.strokeStyle = rgba('#a9a4b6', 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2); ctx.stroke();
  });

  // Tall arched window for the lounge.
  paintTexture(scene, 'wall_arch', 420, WALL_H, (ctx, w, h) => {
    wallMaterial(ctx, w, h);
    const x = 60; const y = 70; const ww = 300; const hh = 540;
    // Recessed reveal.
    ctx.fillStyle = '#0a060d';
    ctx.beginPath(); archPath(ctx, x - 16, y - 16, ww + 32, hh + 22); ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.32);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); archPath(ctx, x - 16, y - 16, ww + 32, hh + 22); ctx.stroke();
    // Keystone.
    poly(ctx, [[w / 2 - 14, y - 26], [w / 2 + 14, y - 26], [w / 2 + 9, y + 6], [w / 2 - 9, y + 6]], '#1c1124', rgba(C.gold, 0.4));
    cutHole(ctx, (c) => archPath(c, x, y, ww, hh));
    // Mullions & transom.
    ctx.fillStyle = '#08050b';
    ctx.fillRect(x + ww / 2 - 2, y, 4, hh);
    ctx.fillRect(x, y + 190, ww, 4);
    ctx.fillRect(x + ww / 4 - 1, y + 190, 2, hh - 190);
    ctx.fillRect(x + (ww * 3) / 4 - 1, y + 190, 2, hh - 190);
    ctx.strokeStyle = '#08050b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + ww / 2, y + ww / 2, ww / 2 - 40, Math.PI, 0); ctx.stroke();
    ctx.save();
    ctx.beginPath(); archPath(ctx, x, y, ww, hh); ctx.clip();
    glassSheen(ctx, x, y, ww, hh, 0.07);
    ctx.fillStyle = lin(ctx, 0, y + hh - 80, 0, y + hh, [[0, 'rgba(10,6,13,0)'], [1, 'rgba(10,6,13,0.8)']]);
    ctx.fillRect(x, y + hh - 80, ww, 80);
    ctx.restore();
    // Sill.
    ctx.fillStyle = '#1a1022';
    ctx.fillRect(x - 24, y + hh + 4, ww + 48, 10);
    ctx.fillStyle = rgba(C.gold, 0.3);
    ctx.fillRect(x - 24, y + hh + 4, ww + 48, 1);
  });

  // Louvred shutter that fits the arch opening; scaled from its top to open.
  paintTexture(scene, 'shutter_arch', 300, 540, (ctx, w, h) => {
    ctx.save();
    ctx.beginPath(); archPath(ctx, 0, 0, w, h); ctx.clip();
    ctx.fillStyle = '#0c0811';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 11) {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + 11, [[0, '#1e1328'], [0.5, '#130c19'], [1, '#060408']]);
      ctx.fillRect(0, y, w, 10);
      ctx.fillStyle = rgba(C.uv, 0.08);
      ctx.fillRect(0, y, w, 1);
    }
    // City light leaking through the slats.
    for (let y = 6; y < h; y += 11) {
      ctx.fillStyle = rgba('#d48ab0', 0.05 + (y / h) * 0.05);
      ctx.fillRect(0, y + 4, w, 1);
    }
    ctx.restore();
  });

  // Narrow slit window for the Spine corridor.
  paintTexture(scene, 'wall_slit', 220, WALL_H, (ctx, w, h) => {
    wallMaterial(ctx, w, h, { top: '#050407', mid: '#100b15', low: '#141019', rail: false });
    const x = 80; const y = 60; const ww = 60; const hh = 560;
    ctx.fillStyle = '#060408';
    ctx.fillRect(x - 10, y - 10, ww + 20, hh + 20);
    ctx.fillStyle = rgba('#a9a4b6', 0.18);
    ctx.fillRect(x - 10, y - 10, 1, hh + 20);
    cutHole(ctx, (c) => c.rect(x, y, ww, hh));
    glassSheen(ctx, x, y, ww, hh, 0.08);
  });

  paintTexture(scene, 'shutter_slit', 60, 560, (ctx, w, h) => {
    ctx.fillStyle = '#0b0910';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 28) {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + 28, [[0, '#1a1622'], [1, '#08070b']]);
      ctx.fillRect(0, y, w, 27);
      ctx.fillStyle = rgba('#a9a4b6', 0.12);
      ctx.fillRect(0, y, w, 1);
    }
  });

  // Shallow niche with a sculpture under a dust sheet — years of nothing.
  paintTexture(scene, 'wall_niche', 320, WALL_H, (ctx, w, h) => {
    wallMaterial(ctx, w, h);
    const x = 60; const y = 120; const ww = 200; const hh = 470;
    ctx.fillStyle = lin(ctx, 0, y, 0, y + hh, [[0, '#08050b'], [1, '#120a17']]);
    ctx.beginPath(); archPath(ctx, x, y, ww, hh); ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath(); archPath(ctx, x, y, ww, hh); ctx.stroke();
    // Plinth.
    ctx.fillStyle = '#1a1220';
    ctx.fillRect(x + 50, y + hh - 110, ww - 100, 110);
    // Draped sheet over an unknown shape — pale, ghostly.
    ctx.fillStyle = lin(ctx, x, y + 150, x + ww, y + hh, [[0, '#6e6478'], [0.5, '#3e3548'], [1, '#221b29']]);
    ctx.beginPath();
    ctx.moveTo(x + 40, y + hh - 100);
    ctx.quadraticCurveTo(x + 46, y + 220, x + 92, y + 170);
    ctx.quadraticCurveTo(x + 104, y + 150, x + 116, y + 172);
    ctx.quadraticCurveTo(x + 160, y + 230, x + ww - 38, y + hh - 100);
    ctx.lineTo(x + ww - 30, y + hh - 92);
    ctx.lineTo(x + 34, y + hh - 92);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#000', 0.25);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 70 + i * 22, y + 200 + i * 6);
      ctx.quadraticCurveTo(x + 64 + i * 26, y + 300, x + 60 + i * 30, y + hh - 96);
      ctx.stroke();
    }
    glow(ctx, x + ww / 2, y + 40, 120, '#a77bff', 0.06);
  });

  paintTexture(scene, 'floor_strip', 16, 220, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#120a17'], [0.06, '#1b1022'], [0.25, '#0f0913'], [0.7, '#07050a'], [1, '#030205']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgba(C.uv, 0.08);
    ctx.fillRect(0, 12, w, 1);
  });

  // Massive dark partitions framing each room — near the lens, almost pure silhouette.
  paintTexture(scene, 'partition', 180, 900, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#050307'], [0.1, '#150d1b'], [0.3, '#0b070e'], [0.85, '#060408'], [1, '#020103']]);
    ctx.fillRect(14, 0, w - 28, 810);
    ctx.fillStyle = rgba(C.uv, 0.22);
    ctx.fillRect(14, 0, 1.5, 810);
    ctx.fillStyle = rgba(C.gold, 0.35);
    ctx.fillRect(30, 0, 1, 810);
    ctx.fillRect(w - 31, 0, 1, 810);
    // Stepped base.
    ctx.fillStyle = '#060408';
    ctx.fillRect(4, 760, w - 8, 50);
    ctx.fillRect(0, 790, w, 22);
    ctx.fillStyle = rgba(C.gold, 0.3);
    ctx.fillRect(4, 760, w - 8, 1);
    // Inlaid eclipse/star medallion.
    ctx.strokeStyle = rgba(C.gold, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(w / 2, 300, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#050307';
    ctx.beginPath(); ctx.arc(w / 2 + 6, 297, 22, 0, Math.PI * 2); ctx.fill();
  });

  // Door frame with an eclipse glyph. Leaves are separate sprites so they can open.
  paintTexture(scene, 'door_frame', 360, 900, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#040305'], [0.2, '#120c16'], [0.5, '#0b080e'], [1, '#030204']]);
    ctx.fillRect(0, 0, w, 812);
    cutHole(ctx, (c) => c.rect(80, 230, 200, 580));
    ctx.strokeStyle = rgba('#a9a4b6', 0.3);
    ctx.lineWidth = 1;
    ctx.strokeRect(76.5, 226.5, 207, 584);
    const cx = w / 2; const cy = 140;
    ctx.strokeStyle = rgba('#a9a4b6', 0.45);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#040305';
    ctx.beginPath(); ctx.arc(cx + 10, cy - 4, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(C.uv, 0.5);
    starShape(ctx, cx - 26, cy + 10, 6, 0.2);
    ctx.fill();
    ctx.fillStyle = rgba(C.uv, 0.2);
    ctx.fillRect(0, 0, 1.5, 812);
  });

  paintTexture(scene, 'door_leaf', 100, 580, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#0d0a11'], [0.5, '#17121c'], [1, '#09070c']]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba('#a9a4b6', 0.15);
    ctx.strokeRect(10.5, 10.5, w - 21, h - 21);
    for (let y = 40; y < h - 20; y += 60) {
      ctx.fillStyle = rgba('#a9a4b6', 0.05);
      ctx.fillRect(14, y, w - 28, 1);
    }
  });

  // --- Foreground silhouettes: painted tiny, displayed large = real lens blur.
  paintTexture(scene, 'fg_drape', 320, 900, (ctx, w, h) => {
    ctx.fillStyle = '#040206';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.85, 0);
    ctx.bezierCurveTo(w * 0.6, h * 0.3, w * 0.75, h * 0.6, w * 0.55, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = rgba('#3a1d4a', 0.4);
      ctx.fillRect(w * (0.1 + i * 0.13), 0, w * 0.03, h);
    }
  }, { scale: 0.12 });

  paintTexture(scene, 'fg_plant', 560, 560, (ctx, w, h) => {
    const r = rng(5);
    ctx.fillStyle = '#030204';
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.2;
      const len = 220 + r() * 240;
      const bx = w / 2; const by = h;
      const tx = bx + Math.cos(a) * len; const ty = by + Math.sin(a) * len;
      const nx = -Math.sin(a) * 50; const ny = Math.cos(a) * 50;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo((bx + tx) / 2 + nx, (by + ty) / 2 + ny, tx, ty);
      ctx.quadraticCurveTo((bx + tx) / 2 - nx, (by + ty) / 2 - ny, bx, by);
      ctx.fill();
    }
  }, { scale: 0.15 });

  paintTexture(scene, 'fg_column', 240, 900, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#020103'], [0.7, '#0c0710'], [0.85, '#24133a'], [1, '#050307']]);
    ctx.fillRect(0, 0, w, h);
  }, { scale: 0.12 });

  paintTexture(scene, 'fg_bottles', 360, 300, (ctx, w, h) => {
    ctx.fillStyle = '#040205';
    [[60, 90, 34], [130, 40, 30], [200, 120, 38]].forEach(([x, top, bw]) => {
      ctx.beginPath();
      ctx.moveTo(x - bw / 2, h);
      ctx.lineTo(x - bw / 2, top + 70);
      ctx.quadraticCurveTo(x - bw / 2, top + 40, x - 6, top + 30);
      ctx.lineTo(x - 6, top);
      ctx.lineTo(x + 6, top);
      ctx.lineTo(x + 6, top + 30);
      ctx.quadraticCurveTo(x + bw / 2, top + 40, x + bw / 2, top + 70);
      ctx.lineTo(x + bw / 2, h);
      ctx.fill();
      ctx.fillStyle = rgba('#a77bff', 0.25);
      ctx.fillRect(x - bw / 2 + 4, top + 74, 3, h - top - 80);
      ctx.fillStyle = '#040205';
    });
    ellipse(ctx, 290, 250, 60, 40, '#040205');
  }, { scale: 0.15 });

  paintTexture(scene, 'fg_lamp', 200, 200, (ctx, w, h) => {
    ctx.fillStyle = rad(ctx, w / 2, h / 2, w / 2, [[0, 'rgba(255,230,255,0.9)'], [0.3, 'rgba(190,140,255,0.5)'], [1, 'rgba(120,60,200,0)']]);
    ctx.fillRect(0, 0, w, h);
  }, { scale: 0.2 });
}
