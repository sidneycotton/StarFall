import { paintTexture, lin, rad, rgba, glow, poly, ellipse, blob, starShape } from './paint.js';

// Star, as cut-out parts for the shared character rig (part names and pivots
// match the rig's expectations). Ivory and gold, a bare head, a gold mask,
// dark hair tied back. Where Parallax's halo is a dark ring, hers burns.

const SUIT = { base: '#b9a888', mid: '#e3d8bf', sheen: '#fbf6ea', rim: '#d9b46a' };
const GOLD = { base: '#8a6526', mid: '#d9b46a', sheen: '#f6e2a8' };
const SKIN = { base: '#c99a82', shadow: '#7a5446' };
const HAIR = ['#2a1d2c', '#0c080f'];

function limb(ctx, w, h, topW, botW, { foot = false, hand = false, cuff = false } = {}) {
  const cx = w / 2;
  ctx.fillStyle = lin(ctx, cx - topW / 2, 0, cx + topW / 2, 0, [[0, SUIT.base], [0.35, SUIT.mid], [0.6, SUIT.sheen], [0.85, SUIT.mid], [1, SUIT.base]]);
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, 4);
  ctx.quadraticCurveTo(cx, -4, cx + topW / 2, 4);
  ctx.lineTo(cx + botW / 2, h - 6);
  ctx.quadraticCurveTo(cx, h + 2, cx - botW / 2, h - 6);
  ctx.closePath();
  ctx.fill();
  // A gold piping line down the lit edge.
  ctx.fillStyle = rgba(GOLD.mid, 0.8);
  ctx.fillRect(cx + topW / 2 - 2.4, 6, 1.2, h - 16);
  if (cuff) {
    ctx.fillStyle = lin(ctx, 0, h - 32, 0, h - 22, [[0, GOLD.sheen], [1, GOLD.base]]);
    ctx.fillRect(cx - botW / 2 - 0.5, h - 32, botW + 1, 6);
  }
  if (foot) {
    // Gold boot, rig-standard foot.
    ctx.fillStyle = lin(ctx, 0, h - 16, 0, h + 6, [[0, GOLD.sheen], [0.5, GOLD.mid], [1, GOLD.base]]);
    ctx.beginPath();
    ctx.moveTo(cx - botW / 2, h - 18);
    ctx.lineTo(cx + botW / 2, h - 18);
    ctx.quadraticCurveTo(cx + botW / 2 + 22, h - 4, cx + botW / 2 + 26, h + 4);
    ctx.lineTo(cx - botW / 2 - 2, h + 4);
    ctx.closePath();
    ctx.fill();
  }
  if (hand) {
    ctx.fillStyle = lin(ctx, 0, h - 4, 0, h + 20, [[0, GOLD.sheen], [1, GOLD.base]]);
    blob(ctx, [[cx - botW / 2, h - 6], [cx + botW / 2 + 1, h - 6], [cx + botW / 2 + 3, h + 10], [cx + 2, h + 20], [cx - botW / 2 - 1, h + 12]]);
    ctx.fill();
  }
}

export function registerStar(scene) {
  paintTexture(scene, 'st_thigh', 40, 84, (ctx, w, h) => limb(ctx, w, h, 28, 20));
  paintTexture(scene, 'st_shin', 70, 96, (ctx) => limb(ctx, 40, 82, 20, 15, { foot: true }));
  paintTexture(scene, 'st_upper', 34, 66, (ctx, w, h) => limb(ctx, w, h, 20, 15));
  paintTexture(scene, 'st_fore', 34, 84, (ctx) => limb(ctx, 34, 62, 15, 12, { hand: true, cuff: true }));

  // Torso, origin at the hip (45, 118) — rig-standard pivot.
  paintTexture(scene, 'st_torso', 100, 130, (ctx, w) => {
    const cx = w / 2 - 5;
    ctx.fillStyle = lin(ctx, cx - 30, 0, cx + 30, 0, [[0, SUIT.base], [0.4, SUIT.mid], [0.62, SUIT.sheen], [1, SUIT.base]]);
    ctx.beginPath();
    ctx.moveTo(cx - 18, 118);
    ctx.lineTo(cx + 18, 118);
    ctx.quadraticCurveTo(cx + 14, 92, cx + 16, 78);
    ctx.quadraticCurveTo(cx + 26, 50, cx + 28, 30);
    ctx.lineTo(cx - 24, 30);
    ctx.quadraticCurveTo(cx - 22, 50, cx - 14, 78);
    ctx.quadraticCurveTo(cx - 12, 92, cx - 18, 118);
    ctx.closePath();
    ctx.fill();
    // Gold belt.
    ctx.fillStyle = lin(ctx, 0, 82, 0, 88, [[0, GOLD.sheen], [1, GOLD.base]]);
    ctx.fillRect(cx - 16, 82, 32, 5);
    // Emblem: the four-pointed star, worn over the heart.
    ctx.fillStyle = lin(ctx, cx, 44, cx + 16, 70, [[0, GOLD.sheen], [1, GOLD.mid]]);
    starShape(ctx, cx + 8, 58, 13, 0.24);
    ctx.fill();
    glow(ctx, cx + 8, 58, 18, '#fff1c8', 0.35);
    // Mantle: sculpted yoke, in gold.
    ctx.fillStyle = lin(ctx, 0, 6, 0, 50, [[0, GOLD.sheen], [0.45, GOLD.mid], [1, GOLD.base]]);
    ctx.beginPath();
    ctx.moveTo(cx - 40, 34);
    ctx.lineTo(cx - 30, 14);
    ctx.quadraticCurveTo(cx, 2, cx + 32, 12);
    ctx.lineTo(cx + 44, 30);
    ctx.lineTo(cx + 30, 46);
    ctx.quadraticCurveTo(cx, 38, cx - 30, 48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#fff8e2', 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 30, 14); ctx.quadraticCurveTo(cx, 2, cx + 32, 12); ctx.stroke();
    // Collar.
    poly(ctx, [[cx - 22, 16], [cx - 18, -4], [cx - 4, -1], [cx - 2, 14]], GOLD.base, rgba(GOLD.sheen, 0.6));
  });

  // Head in profile. Wider than Parallax's so the hair can trail behind;
  // the neck sits at (52, 68), i.e. Parallax's (22, 62) shifted by (30, 6).
  paintTexture(scene, 'st_head', 90, 80, (ctx) => {
    ctx.translate(30, 6);
    // Neck.
    ctx.fillStyle = lin(ctx, 16, 0, 30, 0, [[0, SKIN.shadow], [1, SKIN.base]]);
    ctx.fillRect(17, 42, 12, 26);
    // Skull and face.
    ellipse(ctx, 28, 28, 15, 19, SKIN.base);
    ctx.fillStyle = SKIN.base;
    poly(ctx, [[20, 40], [36, 48], [41, 45], [43, 37], [38, 30]], SKIN.base);
    poly(ctx, [[41, 26], [47, 33], [42, 35]], SKIN.base); // nose
    ctx.fillStyle = rgba(SKIN.shadow, 0.5);
    poly(ctx, [[14, 30], [22, 46], [18, 48], [12, 36]], ctx.fillStyle);
    // Lips: a single darker stroke.
    ctx.strokeStyle = rgba('#6a3a34', 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(41, 40); ctx.lineTo(37, 40.5); ctx.stroke();
    // Hair: dark, pulled back hard from the face, tied, trailing.
    ctx.fillStyle = lin(ctx, 0, 4, 0, 50, HAIR.map((c, i) => [i, c]));
    ctx.beginPath();
    ctx.moveTo(42, 18);
    ctx.quadraticCurveTo(38, 6, 26, 7);
    ctx.quadraticCurveTo(12, 9, 11, 24);
    ctx.quadraticCurveTo(10, 36, 17, 44);
    ctx.lineTo(19, 34);
    ctx.quadraticCurveTo(24, 22, 34, 18);
    ctx.closePath();
    ctx.fill();
    // The tie, and the tail falling behind.
    ellipse(ctx, 11, 22, 3.2, 3.6, '#c79a48');
    ctx.fillStyle = lin(ctx, -28, 0, 12, 0, [[0, HAIR[1]], [1, HAIR[0]]]);
    ctx.beginPath();
    ctx.moveTo(10, 18);
    ctx.quadraticCurveTo(-8, 18, -20, 34);
    ctx.quadraticCurveTo(-26, 46, -28, 60);
    ctx.quadraticCurveTo(-18, 46, -10, 40);
    ctx.quadraticCurveTo(0, 32, 10, 27);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#7b5c8a', 0.35);
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(14, 12); ctx.quadraticCurveTo(28, 8, 40, 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, 22); ctx.quadraticCurveTo(-12, 26, -22, 46); ctx.stroke();
    // The mask: a gold band across the eyes, swept back to a point.
    ctx.fillStyle = lin(ctx, 20, 20, 48, 32, [[0, GOLD.base], [0.5, GOLD.mid], [1, GOLD.sheen]]);
    ctx.beginPath();
    ctx.moveTo(18, 21);
    ctx.lineTo(46, 22);
    ctx.lineTo(47, 27);
    ctx.lineTo(43, 31);
    ctx.lineTo(30, 30);
    ctx.lineTo(22, 27);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1006';
    ctx.fillRect(38, 25.5, 6, 1.6);
    // Warm rim down the profile.
    ctx.strokeStyle = rgba('#ffe7b0', 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(43, 33); ctx.lineTo(47, 33); ctx.lineTo(42, 36); ctx.lineTo(43, 44); ctx.lineTo(37, 48); ctx.stroke();
  });

  // Her halo: a bright ring nearly edge-on, with a corona. White; tinted in-rig.
  paintTexture(scene, 'st_halo', 80, 140, (ctx, w, h) => {
    glow(ctx, w / 2, h / 2, 46, '#ffffff', 0.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, 10, h / 2 - 18, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, 11, h / 2 - 17, 0, 0, Math.PI * 2); ctx.stroke();
  });

  // Her cape, alone, falling: a long ivory sheet with a gold lining.
  paintTexture(scene, 'st_cape', 220, 320, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, h, [[0, '#f3ead6'], [0.6, '#cfc2a4'], [1, '#8e8068']]);
    ctx.beginPath();
    ctx.moveTo(70, 10);
    ctx.lineTo(150, 14);
    ctx.bezierCurveTo(190, 90, 214, 200, 200, 300);
    ctx.quadraticCurveTo(150, 280, 110, 312);
    ctx.quadraticCurveTo(60, 286, 20, 304);
    ctx.bezierCurveTo(10, 200, 30, 90, 70, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#c79a48', 0.85);
    ctx.beginPath();
    ctx.moveTo(150, 14);
    ctx.bezierCurveTo(190, 90, 214, 200, 200, 300);
    ctx.lineTo(192, 298);
    ctx.bezierCurveTo(200, 200, 180, 92, 144, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#8e8068', 0.5);
    ctx.lineWidth = 2;
    [[90, 30, 70, 290], [120, 24, 120, 300], [140, 30, 160, 290]].forEach(([x0, y0, x1, y1]) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 - 12, (y0 + y1) / 2, x1, y1); ctx.stroke();
    });
    // Torn edge where it came away from the mantle.
    poly(ctx, [[70, 10], [150, 14], [140, 22], [124, 16], [108, 24], [92, 15], [78, 22]], '#6b4e1f');
  });

  // A gold spark (hits, landings).
  paintTexture(scene, 'spark', 64, 64, (ctx, w) => {
    ctx.fillStyle = rad(ctx, w / 2, w / 2, w / 2, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
    starShape(ctx, w / 2, w / 2, w / 2, 0.12);
    ctx.fill();
  });
}
