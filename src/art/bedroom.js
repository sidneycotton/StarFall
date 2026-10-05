import { paintTexture, lin, rad, rgba, glow, poly, ellipse, rng, starShape, line, blob } from './paint.js';
import { C } from './kit.js';

// Bedroom props. The bed is seen from its foot, beneath the oculus: a
// deliberately symmetrical, almost devotional composition for a room where
// nothing devotional has happened in years.

const SHEET = '#9a8cad';
const SHEET_SH = '#5a4a68';
const DUVET = '#2b1233';
const DUVET_HI = '#6a3a7c';
const SKIN = '#9a7484';
const SKIN_SH = '#3c2532';

function duvetFolds(ctx, x0, x1, y0, y1, seed) {
  const r = rng(seed);
  ctx.save();
  for (let i = 0; i < 9; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    const len = 40 + r() * 120;
    ctx.strokeStyle = rgba(DUVET_HI, 0.25 + r() * 0.35);
    ctx.lineWidth = 1 + r() * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.5, y - 10 + r() * 20, x + len, y + (r() - 0.5) * 30);
    ctx.stroke();
  }
  ctx.restore();
}

// Hair spread across a pillow: a soft mass with tapered locks spilling out of it.
function hairMass(ctx, cx, cy, rx, ry, dark, mid, hi, seed) {
  const r = rng(seed);
  ctx.fillStyle = lin(ctx, 0, cy - ry, 0, cy + ry, [[0, mid], [1, dark]]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.05 + r() * 0.9) * (r() < 0.5 ? 1 : -1) + (r() < 0.5 ? 0 : Math.PI);
    const x0 = cx + Math.cos(a) * rx * 0.6;
    const y0 = cy + Math.sin(a) * ry * 0.6;
    const len = rx * (0.5 + r() * 0.6);
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len * 0.45 + 6;
    const wdt = 5 + r() * 7;
    ctx.fillStyle = r() < 0.5 ? dark : mid;
    ctx.beginPath();
    ctx.moveTo(x0 - wdt, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 6, x1, y1);
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 6, x0 + wdt, y0);
    ctx.fill();
  }
  ctx.strokeStyle = hi;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const x = cx - rx * 0.6 + r() * rx * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, cy - ry * 0.7);
    ctx.bezierCurveTo(x + 10, cy - ry * 0.2, x - 8, cy + ry * 0.2, x + 6, cy + ry * 0.7);
    ctx.stroke();
  }
}

export function registerBedroom(scene) {
  // 900×520, origin bottom-centre. Headboard centre (450, 290).
  paintTexture(scene, 'bed', 900, 520, (ctx, w, h) => {
    const cx = w / 2;
    // Headboard: upholstered half-disc with sunburst channels.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, 300, 290, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, cx, 300, 290, [[0, '#2a1432'], [0.7, '#1f0e27'], [1, '#14091a']]);
    ctx.fill();
    ctx.clip();
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI + (i / 18) * Math.PI;
      line(ctx, cx, 300, cx + Math.cos(a) * 300, 300 + Math.sin(a) * 300, rgba('#000', 0.45), 3);
      line(ctx, cx + 3, 300, cx + 3 + Math.cos(a) * 300, 300 + Math.sin(a) * 300, rgba(C.uv, 0.07), 1);
    }
    ctx.restore();
    ctx.strokeStyle = rgba(C.gold, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, 300, 290, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = rgba(C.gold, 0.18);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, 300, 60, Math.PI, 0); ctx.stroke();

    // Mattress top (perspective trapezoid): back y=280, front y=440.
    const back = 270; const front = 440;
    poly(ctx, [[cx - 330, back], [cx + 330, back], [cx + 395, front], [cx - 395, front]], SHEET);
    ctx.fillStyle = lin(ctx, 0, back, 0, front, [[0, rgba('#000', 0.35)], [1, rgba('#000', 0)]]);
    ctx.fill();

    // Pillows: four, rumpled, along the back.
    [[-230, 0.98], [-90, 1.05], [90, 1.0], [235, 0.95]].forEach(([dx, s], i) => {
      ctx.save();
      ctx.translate(cx + dx, back + 18);
      ctx.rotate((i % 2 ? 1 : -1) * 0.04);
      ctx.fillStyle = lin(ctx, 0, -30, 0, 30, [[0, '#bcaecc'], [0.6, '#857598'], [1, '#3e3050']]);
      blob(ctx, [[-75 * s, -12], [0, -30 * s], [75 * s, -14], [80 * s, 16], [0, 24 * s], [-80 * s, 18]]);
      ctx.fill();
      ctx.restore();
    });

    // Duvet: deep plum satin pulled into the middle, spilling over the foot.
    ctx.fillStyle = lin(ctx, 0, back + 40, 0, front + 60, [[0, '#3a1844'], [0.5, DUVET], [1, '#180a1e']]);
    ctx.beginPath();
    ctx.moveTo(cx - 380, front - 10);
    ctx.quadraticCurveTo(cx - 360, back + 70, cx - 240, back + 66);
    ctx.quadraticCurveTo(cx - 40, back + 40, cx + 120, back + 70);
    ctx.quadraticCurveTo(cx + 330, back + 60, cx + 385, front - 6);
    ctx.lineTo(cx + 395, front + 52);
    ctx.quadraticCurveTo(cx + 200, front + 70, cx + 40, front + 48);
    ctx.quadraticCurveTo(cx - 160, front + 74, cx - 395, front + 50);
    ctx.closePath();
    ctx.fill();
    duvetFolds(ctx, cx - 340, cx + 300, back + 80, front + 20, 3);

    // Front face of the bed and its plinth.
    ctx.fillStyle = lin(ctx, 0, front + 40, 0, h, [[0, '#120816'], [1, '#050307']]);
    ctx.fillRect(cx - 405, front + 44, 810, h - front - 44);
    ctx.fillStyle = rgba(C.gold, 0.45);
    ctx.fillRect(cx - 405, h - 34, 810, 1.5);
    ctx.fillStyle = '#030204';
    ctx.fillRect(cx - 380, h - 32, 760, 32);
  });

  // Parallax asleep, face down, turned away; the arm is a separate sprite.
  // Painted at 2× because the opening frames it in close-up.
  paintTexture(scene, 'px_lying', 380, 220, (ctx, w, h) => {
    // Duvet hump over the body, its ridge following the spine.
    ctx.fillStyle = lin(ctx, 0, 80, 0, h, [[0, '#4a2258'], [0.35, DUVET], [1, '#12061a']]);
    ctx.beginPath();
    ctx.moveTo(10, h);
    ctx.bezierCurveTo(30, 120, 120, 104, 200, 108);
    ctx.bezierCurveTo(290, 110, 350, 130, 372, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#9a6ab8', 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(40, 150); ctx.bezierCurveTo(110, 112, 220, 110, 330, 138); ctx.stroke();
    duvetFolds(ctx, 40, 320, 140, 200, 9);
    // Bare upper back in violet half-light.
    ctx.fillStyle = lin(ctx, 0, 52, 0, 126, [[0, '#7a5872'], [0.45, '#4a2e44'], [1, '#22121e']]);
    ctx.beginPath();
    ctx.moveTo(78, 118);
    ctx.bezierCurveTo(78, 84, 110, 64, 160, 62);
    ctx.bezierCurveTo(210, 60, 260, 66, 286, 92);
    ctx.bezierCurveTo(296, 104, 292, 116, 284, 122);
    ctx.bezierCurveTo(220, 112, 140, 112, 78, 118);
    ctx.fill();
    // Rim light along the top of the shoulders.
    ctx.strokeStyle = rgba('#d6b4e6', 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(84, 96); ctx.bezierCurveTo(110, 70, 150, 63, 190, 62); ctx.stroke();
    // The groove of the spine, barely there.
    line(ctx, 188, 68, 190, 112, rgba('#1a0c16', 0.35), 1.2);
    // The scar: small, pale, four-rayed. Never mentioned.
    line(ctx, 228, 80, 240, 92, rgba('#e9dbe6', 0.45), 1);
    line(ctx, 240, 80, 228, 92, rgba('#e9dbe6', 0.3), 0.8);
    line(ctx, 234, 76, 234, 96, rgba('#e9dbe6', 0.2), 0.7);
    // Head turned into the pillow: only dark hair shows.
    hairMass(ctx, 194, 40, 50, 26, '#0a070d', '#1e1628', rgba('#a77bff', 0.28), 4);
    // A fold of pillow pushed up against the face.
    ctx.fillStyle = lin(ctx, 0, 40, 0, 80, [[0, '#b8aac8'], [1, '#4a3a58']]);
    blob(ctx, [[236, 40], [290, 34], [320, 52], [300, 72], [246, 70]]);
    ctx.fill();
  }, { scale: 2 });

  // The hanging arm: pivot at the shoulder (top), hand at the bottom.
  paintTexture(scene, 'px_arm_hang', 60, 200, (ctx) => {
    ctx.fillStyle = lin(ctx, 10, 0, 50, 0, [[0, '#2a1626'], [0.6, '#5a3a52'], [1, '#7a5872']]);
    ctx.beginPath();
    ctx.moveTo(14, 2);
    ctx.bezierCurveTo(30, -2, 44, 4, 42, 22);
    ctx.lineTo(38, 92);
    ctx.quadraticCurveTo(40, 100, 37, 108);
    ctx.lineTo(33, 160);
    ctx.lineTo(25, 160);
    ctx.lineTo(22, 108);
    ctx.quadraticCurveTo(18, 98, 19, 90);
    ctx.lineTo(12, 22);
    ctx.closePath();
    ctx.fill();
    // Hand, relaxed, fingers together.
    ctx.fillStyle = lin(ctx, 0, 156, 0, 196, [[0, '#5a3a52'], [1, '#2a1626']]);
    ctx.beginPath();
    ctx.moveTo(24, 156);
    ctx.lineTo(35, 156);
    ctx.quadraticCurveTo(41, 172, 37, 192);
    ctx.quadraticCurveTo(31, 198, 27, 192);
    ctx.quadraticCurveTo(21, 176, 24, 156);
    ctx.fill();
    line(ctx, 30, 176, 31, 192, rgba('#1a0c16', 0.5), 0.8);
    // Rim light down the lit edge.
    ctx.strokeStyle = rgba('#d6b4e6', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(42, 22); ctx.lineTo(38, 92); ctx.lineTo(34, 158); ctx.stroke();
    // A thin dark ring.
    line(ctx, 26, 182, 36, 182, '#0b0710', 1.6);
  }, { scale: 2 });

  // The other woman: asleep on her side, facing away, wine-dark hair across the pillow.
  paintTexture(scene, 'sleeper', 380, 220, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 80, 0, h, [[0, '#4a2258'], [0.35, DUVET], [1, '#12061a']]);
    ctx.beginPath();
    ctx.moveTo(10, h);
    ctx.bezierCurveTo(20, 130, 120, 100, 210, 104);
    ctx.bezierCurveTo(300, 108, 360, 140, 372, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#9a6ab8', 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(60, 150); ctx.bezierCurveTo(150, 104, 250, 106, 350, 150); ctx.stroke();
    duvetFolds(ctx, 40, 330, 130, 200, 21);
    // Hair spread over the pillow.
    hairMass(ctx, 160, 40, 84, 30, '#1e0810', '#4a1a2a', rgba('#c46a7a', 0.3), 12);
    // Shoulder, bare, catching the lamp.
    ctx.fillStyle = lin(ctx, 0, 60, 0, 120, [[0, '#9a7488'], [1, '#3a2232']]);
    ctx.beginPath();
    ctx.moveTo(176, 112);
    ctx.bezierCurveTo(180, 80, 220, 66, 262, 74);
    ctx.bezierCurveTo(296, 80, 306, 102, 300, 116);
    ctx.bezierCurveTo(260, 106, 210, 106, 176, 112);
    ctx.fill();
    ctx.strokeStyle = rgba('#f0d0dc', 0.45);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(196, 86); ctx.bezierCurveTo(220, 72, 250, 70, 276, 76); ctx.stroke();
    // An arm thrown over the pillow; a gold bracelet.
    ctx.fillStyle = lin(ctx, 0, 30, 0, 64, [[0, '#a07a8c'], [1, '#4a3040']]);
    blob(ctx, [[262, 40], [330, 30], [352, 42], [326, 56], [270, 62]]);
    ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(320, 44, 2.5, 8, 0.2, 0, Math.PI * 2); ctx.stroke();
  }, { scale: 2 });

  // Awake, sitting up, sheet held close, watching the window.
  paintTexture(scene, 'sleeper_sit', 260, 300, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 60, 0, 220, [[0, '#a07f90'], [1, '#3a2230']]);
    blob(ctx, [[80, 90], [170, 86], [200, 150], [190, 230], [70, 230], [60, 150]]);
    ctx.fill();
    // Head in profile toward the window (right), hair falling down the back.
    ellipse(ctx, 150, 52, 30, 36, '#8a6474');
    ctx.fillStyle = '#3a121c';
    blob(ctx, [[110, 20], [160, 10], [182, 36], [160, 52], [130, 110], [96, 140], [92, 70]]);
    ctx.fill();
    ctx.fillStyle = rgba('#e0b0b8', 0.35);
    ctx.fillRect(178, 44, 2, 18);
    // Sheet pulled up.
    ctx.fillStyle = lin(ctx, 0, 140, 0, h, [[0, '#e6dcef'], [1, '#6a5878']]);
    ctx.beginPath();
    ctx.moveTo(30, h);
    ctx.quadraticCurveTo(50, 170, 120, 150);
    ctx.quadraticCurveTo(200, 140, 214, 180);
    ctx.quadraticCurveTo(240, 240, 250, h);
    ctx.closePath();
    ctx.fill();
  });

  // Nightstand: black glass on slim gold legs. Eclipse hairpin on Parallax's side.
  // Top surface at y≈40 of 110.
  paintTexture(scene, 'nightstand', 180, 110, (ctx, w, h) => {
    ctx.fillStyle = rgba(C.gold, 0.7);
    [30, 150].forEach((x) => ctx.fillRect(x - 1.5, 50, 3, h - 50));
    ctx.fillRect(28, h - 26, 124, 2);
    poly(ctx, [[10, 40], [170, 40], [178, 52], [2, 52]], '#08050b', rgba(C.uv, 0.3));
    ctx.fillStyle = rgba(C.uv, 0.25);
    ctx.fillRect(12, 41, 150, 1);
    // Hairpin: a small dark crescent on a thin silver bar.
    line(ctx, 118, 38, 146, 35, rgba('#cfc8dc', 0.8), 1.4);
    ctx.fillStyle = '#cfc8dc';
    ctx.beginPath(); ctx.arc(148, 35, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#08050b';
    ctx.beginPath(); ctx.arc(149.5, 34.2, 3.6, 0, Math.PI * 2); ctx.fill();
  });

  // The relay that carries the Seer alarm into the bedroom: a small obsidian slab.
  paintTexture(scene, 'relay', 44, 30, (ctx) => {
    poly(ctx, [[4, 28], [10, 4], [34, 4], [40, 28]], '#0a070d', rgba('#a9a4b6', 0.3));
    ctx.fillStyle = rgba('#a9a4b6', 0.2);
    ctx.beginPath(); ctx.arc(22, 15, 6, 0, Math.PI * 2); ctx.fill();
  });

  paintTexture(scene, 'glass', 28, 44, (ctx, w, h) => {
    ctx.fillStyle = rgba('#e8e0ff', 0.12);
    ctx.beginPath();
    ctx.moveTo(4, 2); ctx.lineTo(24, 2); ctx.lineTo(21, h - 3); ctx.lineTo(7, h - 3); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#efe8ff', 0.55);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    line(ctx, 8, 6, 9, h - 8, rgba('#ffffff', 0.6), 1);
    ctx.fillStyle = rgba('#d9b46a', 0.35);
    ctx.fillRect(8, h - 10, 12, 6);
  });

  // Party dress, sequins catching light, and a pair of heels.
  paintTexture(scene, 'dress', 260, 70, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#6b5534'], [0.5, '#a88a52'], [1, '#4a3a22']]);
    blob(ctx, [[10, 50], [60, 26], [130, 34], [200, 18], [250, 42], [220, 62], [120, 64], [40, 66]]);
    ctx.fill();
    const r = rng(8);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = rgba('#fff2d0', 0.2 + r() * 0.6);
      ctx.fillRect(20 + r() * 220, 28 + r() * 32, 1.5, 1.5);
    }
  });

  paintTexture(scene, 'heels', 120, 40, (ctx) => {
    ['#1a0b14', '#120810'].forEach((c, i) => {
      ctx.save();
      ctx.translate(30 + i * 52, 26 - i * 4);
      ctx.rotate(i ? 0.5 : -0.12);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-26, 6); ctx.quadraticCurveTo(-10, -10, 14, -4); ctx.lineTo(24, -12); ctx.lineTo(26, 8); ctx.closePath();
      ctx.fill();
      line(ctx, 22, -10, 24, 12, rgba(C.gold, 0.8), 1.5);
      ctx.restore();
    });
  });

  // Gilded sunburst party mask — someone came dressed as the Aureate.
  paintTexture(scene, 'mask_sun', 110, 70, (ctx, w, h) => {
    ctx.save();
    ctx.translate(w / 2, h / 2 + 6);
    ctx.rotate(-0.2);
    for (let i = 0; i < 14; i++) {
      const a = Math.PI + (i / 13) * Math.PI;
      poly(ctx, [[Math.cos(a - 0.08) * 20, Math.sin(a - 0.08) * 20], [Math.cos(a) * 46, Math.sin(a) * 40], [Math.cos(a + 0.08) * 20, Math.sin(a + 0.08) * 20]], rgba(C.gold, 0.85));
    }
    ctx.fillStyle = lin(ctx, -30, -10, 30, 10, [[0, '#e8cf8a'], [1, '#7a5a26']]);
    ctx.beginPath(); ctx.ellipse(0, 0, 32, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a060c';
    ctx.beginPath(); ctx.ellipse(-13, -2, 8, 4.5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(13, -2, 8, 4.5, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Deco floor lamp with a frosted globe (glow added separately).
  paintTexture(scene, 'floor_lamp', 90, 440, (ctx, w, h) => {
    ctx.fillStyle = rgba(C.gold, 0.6);
    ctx.fillRect(w / 2 - 1.5, 80, 3, h - 90);
    poly(ctx, [[w / 2 - 26, h], [w / 2 + 26, h], [w / 2 + 14, h - 10], [w / 2 - 14, h - 10]], '#120a16', rgba(C.gold, 0.4));
    ctx.fillStyle = rad(ctx, w / 2 - 10, 44, 46, [[0, '#f6ecff'], [0.4, '#c7a6ff'], [1, '#5b3696']]);
    ctx.beginPath(); ctx.arc(w / 2, 50, 38, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.6);
    ctx.beginPath(); ctx.ellipse(w / 2, 50, 38, 6, 0, 0, Math.PI * 2); ctx.stroke();
  });

  // String of tiny party bulbs, sagging in a catenary. Some burnt out.
  paintTexture(scene, 'garland', 1100, 160, (ctx, w, h) => {
    const r = rng(14);
    ctx.strokeStyle = rgba('#a9a4b6', 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 10) {
      const t = x / w;
      const y = 10 + Math.sin(t * Math.PI) * 120 + Math.sin(t * Math.PI * 3) * 12;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    for (let x = 20; x < w; x += 46) {
      const t = x / w;
      const y = 10 + Math.sin(t * Math.PI) * 120 + Math.sin(t * Math.PI * 3) * 12;
      const on = r() > 0.3;
      if (on) glow(ctx, x, y + 6, 14, '#c9a2ff', 0.5);
      ellipse(ctx, x, y + 6, 3, 4, on ? '#f2e6ff' : '#2a2032');
    }
  });

  paintTexture(scene, 'rug', 1100, 150, (ctx, w, h) => {
    ctx.fillStyle = rad(ctx, w / 2, h / 2, w / 2, [[0, '#2a1230'], [0.85, '#1b0a20'], [1, 'rgba(20,8,24,0)']]);
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 4, h / 2 - 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 30, h / 2 - 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba(C.gold, 0.15);
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 44, h / 2 - 20, 0, 0, Math.PI * 2); ctx.stroke();
  });

  paintTexture(scene, 'ice_bucket', 90, 130, (ctx, w, h) => {
    poly(ctx, [[14, 50], [76, 50], [70, h - 4], [20, h - 4]], lin(ctx, 0, 0, w, 0, [[0, '#4a3c2a'], [0.4, '#c8a868'], [1, '#3a2c1a']]));
    // Bottle neck tipped in it.
    ctx.save();
    ctx.translate(44, 54); ctx.rotate(0.35);
    ctx.fillStyle = '#0c1a12';
    ctx.fillRect(-7, -50, 14, 56);
    ctx.fillStyle = rgba(C.gold, 0.85);
    ctx.fillRect(-7, -52, 14, 12);
    ctx.restore();
  });

  // Tuxedo jacket slung over the arm of a chair.
  paintTexture(scene, 'chair_jacket', 220, 260, (ctx, w, h) => {
    // Chair: slim deco lounge chair.
    poly(ctx, [[20, 120], [60, 30], [100, 30], [80, 150], [190, 150], [200, 200], [20, 200]], '#1c0f22', rgba(C.uv, 0.25));
    ctx.fillStyle = rgba(C.gold, 0.6);
    ctx.fillRect(30, 200, 2, 56); ctx.fillRect(186, 200, 2, 56);
    // Jacket.
    ctx.fillStyle = lin(ctx, 0, 40, 0, 230, [[0, '#0e0a12'], [1, '#050307']]);
    blob(ctx, [[60, 40], [110, 36], [170, 140], [190, 230], [130, 236], [100, 160], [70, 120]]);
    ctx.fill();
    line(ctx, 96, 44, 140, 150, rgba('#a9a4b6', 0.3), 1.2);
    ctx.fillStyle = rgba('#e6e0ee', 0.5);
    ctx.fillRect(112, 60, 6, 3);
  });
}
