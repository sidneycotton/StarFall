import { paintTexture, lin, rad, rgba, glow, poly, ellipse, line, rng, starShape } from './paint.js';
import { C } from './kit.js';

// The sanctum at the end of the penthouse: the one ceremonial thing Parallax
// kept. Old stone, a black mirror, three discs. Technology grown around ritual.

function archPath(ctx, x, y, w, h) {
  const r = w / 2;
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

export function registerSanctum(scene) {
  paintTexture(scene, 'sanctum_wall', 1200, 700, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#040306'], [0.4, '#0e0a12'], [0.85, '#151019'], [1, '#060408']]);
    ctx.fillRect(0, 0, w, h);
    // Stone coursing.
    const r = rng(77);
    for (let y = 40; y < 600; y += 48) {
      line(ctx, 0, y, w, y, rgba('#000', 0.35), 1.5);
      for (let x = (y / 48) % 2 ? 0 : 60; x < w; x += 120 + r() * 40) line(ctx, x, y, x, y + 48, rgba('#000', 0.25), 1);
    }
    // Concentric relief: three rings, deliberately not concentric.
    const cx = 640; const cy = 300;
    [[300, 0, 0, C.gold, 0.12], [250, -18, 10, '#8fb7bf', 0.1], [210, 16, 20, '#a77bff', 0.16]].forEach(([R, dx, dy, col, a]) => {
      ctx.strokeStyle = rgba(col, a);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = rgba('#000', 0.6);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy + 3, R, 0, Math.PI * 2); ctx.stroke();
    });
    // The Glass: a black mirror in a tall arch.
    ctx.fillStyle = '#020103';
    ctx.beginPath(); archPath(ctx, cx - 132, 96, 264, 420); ctx.fill();
    ctx.save();
    ctx.beginPath(); archPath(ctx, cx - 120, 108, 240, 404); ctx.clip();
    ctx.fillStyle = lin(ctx, cx - 120, 108, cx + 120, 512, [[0, '#0a0810'], [0.5, '#030205'], [1, '#08060c']]);
    ctx.fillRect(cx - 120, 108, 240, 404);
    ctx.fillStyle = lin(ctx, cx - 120, 108, cx + 40, 400, [[0, 'rgba(180,160,220,0.07)'], [0.4, 'rgba(180,160,220,0.0)']]);
    ctx.fillRect(cx - 120, 108, 240, 404);
    ctx.restore();
    ctx.strokeStyle = rgba('#a9a4b6', 0.4);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); archPath(ctx, cx - 132, 96, 264, 420); ctx.stroke();
    ctx.strokeStyle = rgba('#a9a4b6', 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath(); archPath(ctx, cx - 120, 108, 240, 404); ctx.stroke();
    // Inscription band, an old script nobody reads anymore.
    ctx.fillStyle = rgba('#a9a4b6', 0.18);
    for (let i = 0; i < 46; i++) {
      const x = cx - 230 + i * 10;
      const tall = r() < 0.5;
      ctx.fillRect(x, 548, 2, tall ? 10 : 6);
      if (r() < 0.4) ctx.fillRect(x - 2, 552, 6, 1.5);
    }
    // Vestry niche (left): where the suit waits.
    const nx = 20; const ny = 150;
    ctx.fillStyle = lin(ctx, 0, ny, 0, 600, [[0, '#000000'], [1, '#09060c']]);
    ctx.beginPath(); archPath(ctx, nx, ny, 210, 450); ctx.fill();
    ctx.strokeStyle = rgba('#a9a4b6', 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath(); archPath(ctx, nx, ny, 210, 450); ctx.stroke();
    glow(ctx, nx + 105, ny + 30, 120, '#7b4bc4', 0.08);
    // Floor shadow line.
    ctx.fillStyle = '#030204';
    ctx.fillRect(0, 640, w, 60);
  }, { scale: 0.75 });

  // The altar-console: a low obsidian slab with three inlaid discs in a triangle.
  paintTexture(scene, 'altar', 420, 210, (ctx, w, h) => {
    // Top face in perspective.
    poly(ctx, [[40, 60], [w - 40, 60], [w - 10, 104], [10, 104]], lin(ctx, 0, 60, 0, 104, [[0, '#0e0a14'], [1, '#1c1424']]));
    ctx.strokeStyle = rgba('#a9a4b6', 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, 104); ctx.lineTo(40, 60); ctx.lineTo(w - 40, 60); ctx.lineTo(w - 10, 104); ctx.stroke();
    // Front face.
    ctx.fillStyle = lin(ctx, 0, 104, 0, h, [[0, '#0a070e'], [1, '#020103']]);
    ctx.fillRect(10, 104, w - 20, h - 104);
    ctx.fillStyle = rgba('#a9a4b6', 0.25);
    ctx.fillRect(10, 104, w - 20, 1);
    // Engraved triangle on the front face.
    ctx.strokeStyle = rgba('#a9a4b6', 0.18);
    ctx.beginPath(); ctx.moveTo(w / 2, 124); ctx.lineTo(w / 2 + 40, 186); ctx.lineTo(w / 2 - 40, 186); ctx.closePath(); ctx.stroke();
    // Discs (dark until lit).
    [[w / 2 - 70, 74, '#6b4e1f'], [w / 2 + 70, 74, '#24303a'], [w / 2, 94, '#2a1640']].forEach(([x, y, col]) => {
      ctx.fillStyle = rad(ctx, x - 3, y - 2, 16, [[0, rgba('#ffffff', 0.15)], [0.4, col], [1, '#050308']]);
      ctx.beginPath(); ctx.ellipse(x, y, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba('#a9a4b6', 0.35);
      ctx.stroke();
    });
  });

  // High-backed chair, seen side-on: a tall slab back crowned by a dark disc.
  // Seat top at y≈206 so a seated rig's hip lines up when placed on the floor line.
  paintTexture(scene, 'chair', 170, 300, (ctx, w, h) => {
    const bx = 40;
    // Back: slightly reclined slab.
    poly(ctx, [[bx - 12, 214], [bx - 2, 214], [bx + 8, 60], [bx - 4, 58]], lin(ctx, bx - 12, 0, bx + 8, 0, [[0, '#050307'], [1, '#1a1222']]), rgba('#a9a4b6', 0.25));
    // The eclipse disc at the top of the back.
    ctx.fillStyle = '#07050b';
    ctx.beginPath(); ctx.arc(bx + 2, 52, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba('#cbb8ee', 0.55);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(bx + 2, 52, 30, Math.PI * 0.6, Math.PI * 1.3); ctx.stroke();
    // Seat.
    poly(ctx, [[bx - 14, 204], [bx + 96, 204], [bx + 100, 218], [bx - 16, 218]], lin(ctx, 0, 204, 0, 218, [[0, '#2a1c34'], [1, '#0a070d']]), rgba('#a9a4b6', 0.3));
    // Legs: slim, silver.
    ctx.fillStyle = rgba('#a9a4b6', 0.5);
    ctx.fillRect(bx - 10, 218, 2.5, h - 218);
    ctx.fillRect(bx + 92, 218, 2.5, h - 218);
    ctx.fillRect(bx - 10, h - 3, 105, 3);
  });

  // Three small lights on the Glass, one per Seer.
  paintTexture(scene, 'seer_point', 48, 48, (ctx) => {
    ctx.fillStyle = rad(ctx, 24, 24, 24, [[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,255,255,0.9)'], [0.3, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, 48, 48);
  });

  // Floor inlay: concentric ellipses in perspective.
  paintTexture(scene, 'floor_rings', 900, 140, (ctx, w, h) => {
    [[0.48, '#d9b46a', 0.2], [0.4, '#8fb7bf', 0.14], [0.32, '#a77bff', 0.22]].forEach(([k, col, a], i) => {
      ctx.strokeStyle = rgba(col, a);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(w / 2 + (i - 1) * 12, h / 2, w * k, h * k * 0.9, 0, 0, Math.PI * 2); ctx.stroke();
    });
  });

  // The vault-like entrance to the chamber (end of the Spine).
  paintTexture(scene, 'spine_screen', 130, 300, (ctx, w, h) => {
    ctx.fillStyle = '#050407';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba('#a9a4b6', 0.25);
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctx.fillStyle = '#010102';
    ctx.fillRect(8, 8, w - 16, h - 16);
  });

  paintTexture(scene, 'emblem_star', 64, 64, (ctx) => {
    ctx.fillStyle = '#ffffff';
    starShape(ctx, 32, 32, 28, 0.2);
    ctx.fill();
  });
}
