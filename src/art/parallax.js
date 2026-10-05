import { paintTexture, lin, rad, rgba, glow, poly, ellipse, line, blob } from './paint.js';

// Parallax, built as cut-out parts for a procedural rig. Silhouette over
// surface detail: black-violet, one luminous vertical visor, a dark halo ring.

const SUIT = { base: '#0a0610', mid: '#1c1228', sheen: '#3a2656', rim: '#7b5cc0', silver: '#a9a4b6' };
const ROBE = { base: '#120818', mid: '#2a1238', sheen: '#5a2e74', rim: '#9a6ad8' };
const SKIN = { base: '#7a5a68', shadow: '#3a2632' };

// A limb hanging down from its joint at (w/2, 0), length h.
function limb(ctx, w, h, topW, botW, mat, { foot = false, hand = false, skinFoot = false, cuff = false } = {}) {
  const cx = w / 2;
  ctx.fillStyle = lin(ctx, cx - topW / 2, 0, cx + topW / 2, 0, [[0, mat.base], [0.35, mat.mid], [0.55, mat.sheen], [0.8, mat.mid], [1, mat.base]]);
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, 4);
  ctx.quadraticCurveTo(cx, -4, cx + topW / 2, 4);
  ctx.lineTo(cx + botW / 2, h - 6);
  ctx.quadraticCurveTo(cx, h + 2, cx - botW / 2, h - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(mat.rim, 0.55);
  ctx.fillRect(cx + topW / 2 - 2, 6, 1.2, h - 16);
  if (cuff) {
    ctx.fillStyle = rgba(SUIT.silver, 0.5);
    ctx.fillRect(cx - botW / 2, h - 30, botW, 1.5);
  }
  if (foot) {
    // Boot: a long, pointed, elegant foot extending forward (+x).
    const col = skinFoot ? SKIN.base : mat.base;
    ctx.fillStyle = lin(ctx, 0, h - 14, 0, h + 8, [[0, skinFoot ? SKIN.base : mat.mid], [1, skinFoot ? SKIN.shadow : '#000']]);
    ctx.beginPath();
    ctx.moveTo(cx - botW / 2, h - 14);
    ctx.lineTo(cx + botW / 2, h - 14);
    ctx.quadraticCurveTo(cx + botW / 2 + 22, h - 4, cx + botW / 2 + 26, h + 4);
    ctx.lineTo(cx - botW / 2 - 2, h + 4);
    ctx.closePath();
    ctx.fill();
    if (!skinFoot) {
      ctx.fillStyle = rgba(SUIT.silver, 0.35);
      ctx.fillRect(cx - botW / 2, h + 3, botW + 26, 1);
    }
    void col;
  }
  if (hand) {
    const handCol = mat === ROBE ? SKIN : { base: SUIT.base, shadow: '#000' };
    ctx.fillStyle = lin(ctx, 0, h - 4, 0, h + 20, [[0, handCol.base], [1, handCol.shadow]]);
    blob(ctx, [[cx - botW / 2, h - 6], [cx + botW / 2 + 1, h - 6], [cx + botW / 2 + 3, h + 10], [cx + 2, h + 20], [cx - botW / 2 - 1, h + 12]]);
    ctx.fill();
  }
}

export function registerParallax(scene) {
  // ----- Suit
  paintTexture(scene, 'px_thigh', 40, 84, (ctx, w, h) => limb(ctx, w, h, 28, 20, SUIT));
  paintTexture(scene, 'px_shin', 70, 96, (ctx) => limb(ctx, 40, 82, 20, 15, SUIT, { foot: true, cuff: true }));
  paintTexture(scene, 'px_upper', 34, 66, (ctx, w, h) => limb(ctx, w, h, 20, 15, SUIT));
  paintTexture(scene, 'px_fore', 34, 84, (ctx) => limb(ctx, 34, 62, 15, 12, SUIT, { hand: true, cuff: true }));

  // Torso in three-quarter view, origin at the hip (45, 118).
  // Narrow waist; the mantle builds the shoulders.
  paintTexture(scene, 'px_torso', 100, 130, (ctx, w) => {
    const cx = w / 2 - 5;
    ctx.fillStyle = lin(ctx, cx - 30, 0, cx + 30, 0, [[0, SUIT.base], [0.4, SUIT.mid], [0.6, SUIT.sheen], [1, SUIT.base]]);
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
    // Belt: one muted silver line.
    ctx.fillStyle = rgba(SUIT.silver, 0.45);
    ctx.fillRect(cx - 16, 84, 32, 1.5);
    // A single violet seam from sternum to belt — the visor's echo.
    ctx.fillStyle = rgba(SUIT.rim, 0.5);
    ctx.fillRect(cx + 5, 36, 1, 48);
    // Mantle: a sculpted collar-yoke that squares the shoulders.
    ctx.fillStyle = lin(ctx, 0, 10, 0, 52, [[0, '#2a1a3e'], [0.5, SUIT.base], [1, '#050308']]);
    ctx.beginPath();
    ctx.moveTo(cx - 40, 34);
    ctx.lineTo(cx - 30, 14);
    ctx.quadraticCurveTo(cx, 2, cx + 32, 12);
    ctx.lineTo(cx + 44, 30);
    ctx.lineTo(cx + 30, 48);
    ctx.quadraticCurveTo(cx, 40, cx - 30, 50);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(SUIT.silver, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 40, 34); ctx.lineTo(cx - 30, 14); ctx.quadraticCurveTo(cx, 2, cx + 32, 12); ctx.lineTo(cx + 44, 30); ctx.stroke();
    // High collar rising at the back of the neck.
    poly(ctx, [[cx - 22, 16], [cx - 18, -6], [cx - 4, -2], [cx - 2, 14]], '#0d0814', rgba(SUIT.rim, 0.3));
  });

  // Helmet, side/three-quarter. Origin: neck (22, 62).
  paintTexture(scene, 'px_helmet', 60, 74, (ctx) => {
    ctx.fillStyle = rad(ctx, 24, 18, 46, [[0, '#2e1f44'], [0.45, '#140c1f'], [1, '#040207']]);
    ctx.beginPath();
    ctx.moveTo(10, 62);
    ctx.quadraticCurveTo(2, 36, 8, 18);
    ctx.quadraticCurveTo(18, -2, 34, 2);
    ctx.quadraticCurveTo(50, 8, 48, 30);
    ctx.quadraticCurveTo(47, 50, 40, 58);
    ctx.lineTo(34, 64);
    ctx.lineTo(14, 66);
    ctx.closePath();
    ctx.fill();
    // Specular arc across the crown.
    ctx.strokeStyle = rgba('#d8c8ff', 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(28, 28, 20, Math.PI * 1.15, Math.PI * 1.6); ctx.stroke();
    // The faceplate seam where the visor sits.
    ctx.strokeStyle = rgba('#000', 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(44, 12); ctx.quadraticCurveTo(48, 34, 41, 56); ctx.stroke();
  });

  // Visor: a narrow vertical luminous line (white, tinted/added in-scene).
  paintTexture(scene, 'px_visor', 16, 52, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,255,255,1)'], [0.8, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(w / 2 - 1, 0, 2, h);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(w / 2 - 3, 6, 6, h - 12);
  });

  // The halo ring behind the head, nearly edge-on in profile.
  paintTexture(scene, 'px_halo', 40, 110, (ctx, w, h) => {
    ctx.strokeStyle = rgba('#b9a8d8', 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, 9, h / 2 - 3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba('#000', 0.9);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, 9, h / 2 - 3, 0, -0.9, 0.9); ctx.stroke();
  });

  // ----- Unhelmeted: hair falls forward over a lowered face.
  paintTexture(scene, 'px_head_hair', 60, 74, (ctx) => {
    // Neck.
    ctx.fillStyle = lin(ctx, 18, 0, 34, 0, [[0, SKIN.shadow], [1, SKIN.base]]);
    ctx.fillRect(16, 46, 13, 22);
    ellipse(ctx, 28, 30, 17, 20, SKIN.shadow);
    // Hair: dark, grown out, falling forward in pointed locks over a lowered face.
    ctx.fillStyle = lin(ctx, 0, 4, 0, 66, [[0, '#221830'], [1, '#07050a']]);
    ctx.beginPath();
    ctx.moveTo(8, 34);
    ctx.quadraticCurveTo(6, 8, 30, 4);
    ctx.quadraticCurveTo(50, 4, 53, 24);
    ctx.lineTo(56, 40);
    ctx.lineTo(50, 36);
    ctx.lineTo(52, 58);
    ctx.lineTo(45, 46);
    ctx.lineTo(43, 66);
    ctx.lineTo(37, 50);
    ctx.lineTo(33, 62);
    ctx.lineTo(30, 44);
    ctx.lineTo(20, 52);
    ctx.lineTo(18, 42);
    ctx.lineTo(10, 46);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(ROBE.rim, 0.35);
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(16 + i * 7, 7 + i);
      ctx.quadraticCurveTo(30 + i * 5, 18, 34 + i * 4, 40 + (i % 2) * 8);
      ctx.stroke();
    }
  });

  // ----- Robe (the silk dressing gown Parallax wakes in)
  paintTexture(scene, 'robe_torso', 100, 130, (ctx, w) => {
    const cx = w / 2 - 5;
    ctx.fillStyle = lin(ctx, cx - 30, 0, cx + 30, 0, [[0, ROBE.base], [0.45, ROBE.mid], [0.62, ROBE.sheen], [1, ROBE.base]]);
    ctx.beginPath();
    ctx.moveTo(cx - 22, 120);
    ctx.lineTo(cx + 22, 120);
    ctx.quadraticCurveTo(cx + 18, 92, cx + 20, 76);
    ctx.quadraticCurveTo(cx + 28, 44, cx + 24, 22);
    ctx.quadraticCurveTo(cx, 12, cx - 24, 22);
    ctx.quadraticCurveTo(cx - 26, 50, cx - 18, 78);
    ctx.quadraticCurveTo(cx - 16, 94, cx - 22, 120);
    ctx.closePath();
    ctx.fill();
    // Lapel and a sash, loosely tied.
    ctx.strokeStyle = rgba(ROBE.rim, 0.45);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 8, 20); ctx.quadraticCurveTo(cx + 12, 50, cx + 6, 86); ctx.stroke();
    ctx.fillStyle = '#0a0410';
    ctx.fillRect(cx - 19, 84, 40, 6);
    line(ctx, cx + 10, 90, cx + 16, 112, '#0a0410', 3);
    // A glimpse of skin at the collar.
    ctx.fillStyle = rgba(SKIN.base, 0.7);
    poly(ctx, [[cx - 6, 20], [cx + 6, 20], [cx + 2, 34]], ctx.fillStyle);
  });
  paintTexture(scene, 'robe_upper', 34, 66, (ctx, w, h) => limb(ctx, w, h, 24, 22, ROBE));
  paintTexture(scene, 'robe_fore', 40, 84, (ctx) => limb(ctx, 40, 60, 24, 14, ROBE, { hand: true }));
  paintTexture(scene, 'robe_thigh', 40, 84, (ctx, w, h) => limb(ctx, w, h, 26, 18, { base: '#07040a', mid: '#120a18', sheen: '#1e1228', rim: '#3a2a50' }));
  paintTexture(scene, 'robe_shin', 70, 96, (ctx) => limb(ctx, 40, 82, 16, 12, { base: '#07040a', mid: '#120a18', sheen: '#1e1228', rim: '#3a2a50' }, { foot: true, skinFoot: true }));

  // ----- Props tied to the costume.
  // The real helmet, resting. Front three-quarter, visor dark until worn.
  paintTexture(scene, 'helmet_item', 70, 84, (ctx) => {
    ctx.fillStyle = rad(ctx, 28, 24, 52, [[0, '#2e1f44'], [0.5, '#120a1c'], [1, '#030205']]);
    ctx.beginPath();
    ctx.moveTo(14, 78);
    ctx.quadraticCurveTo(4, 40, 14, 18);
    ctx.quadraticCurveTo(34, -2, 54, 16);
    ctx.quadraticCurveTo(66, 40, 56, 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#7b5cc0', 0.35);
    ctx.fillRect(41, 18, 1.5, 52);
    ctx.strokeStyle = rgba('#d8c8ff', 0.3);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(34, 34, 22, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
  });

  paintTexture(scene, 'pedestal', 90, 230, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#050306'], [0.4, '#18101e'], [1, '#040205']]);
    poly(ctx, [[30, 10], [60, 10], [56, h - 20], [34, h - 20]], ctx.fillStyle);
    poly(ctx, [[14, h], [76, h], [66, h - 22], [24, h - 22]], '#0a060c', rgba('#a9a4b6', 0.3));
    poly(ctx, [[18, 14], [72, 14], [64, 0], [26, 0]], '#0a060c', rgba('#a9a4b6', 0.4));
  });

  // The empty suit on its form inside the vestry niche (cape hanging).
  paintTexture(scene, 'suit_form', 170, 330, (ctx, w, h) => {
    const cx = w / 2;
    // Cape hanging behind, wider than the body, to the floor.
    ctx.fillStyle = lin(ctx, 0, 40, 0, h, [[0, '#120a1c'], [1, '#040206']]);
    ctx.beginPath();
    ctx.moveTo(cx - 50, 44);
    ctx.bezierCurveTo(cx - 74, 140, cx - 78, 240, cx - 70, h - 8);
    ctx.lineTo(cx + 70, h - 8);
    ctx.bezierCurveTo(cx + 78, 240, cx + 74, 140, cx + 50, 44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#7b5cc0', 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 50, 44); ctx.bezierCurveTo(cx - 74, 140, cx - 78, 240, cx - 70, h - 8); ctx.stroke();
    // Torso: mantle shoulders, narrow waist.
    ctx.fillStyle = lin(ctx, cx - 40, 0, cx + 40, 0, [[0, SUIT.base], [0.45, SUIT.sheen], [0.6, SUIT.mid], [1, SUIT.base]]);
    ctx.beginPath();
    ctx.moveTo(cx - 54, 52);
    ctx.lineTo(cx - 40, 36);
    ctx.quadraticCurveTo(cx, 26, cx + 40, 36);
    ctx.lineTo(cx + 54, 52);
    ctx.lineTo(cx + 34, 70);
    ctx.quadraticCurveTo(cx + 20, 110, cx + 16, 150);
    ctx.lineTo(cx + 20, 172);
    ctx.lineTo(cx - 20, 172);
    ctx.lineTo(cx - 16, 150);
    ctx.quadraticCurveTo(cx - 20, 110, cx - 34, 70);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(SUIT.silver, 0.35);
    ctx.beginPath(); ctx.moveTo(cx - 54, 52); ctx.lineTo(cx - 40, 36); ctx.quadraticCurveTo(cx, 26, cx + 40, 36); ctx.lineTo(cx + 54, 52); ctx.stroke();
    ctx.fillStyle = rgba(SUIT.silver, 0.4);
    ctx.fillRect(cx - 17, 150, 34, 1.5);
    ctx.fillStyle = rgba(SUIT.rim, 0.5);
    ctx.fillRect(cx, 44, 1, 104);
    // Stand pole and base.
    ctx.fillStyle = '#16101c';
    ctx.fillRect(cx - 2, 172, 4, h - 182);
    poly(ctx, [[cx - 30, h], [cx + 30, h], [cx + 20, h - 10], [cx - 20, h - 10]], '#0a060c');
    // Collar stub.
    poly(ctx, [[cx - 16, 34], [cx - 12, 14], [cx + 12, 14], [cx + 16, 34]], '#0a060c', rgba(SUIT.rim, 0.3));
  });

  paintTexture(scene, 'form_empty', 170, 330, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = '#100a16';
    poly(ctx, [[cx - 30, 56], [cx + 30, 56], [cx + 18, 130], [cx + 12, 168], [cx - 12, 168], [cx - 18, 130]], '#100a16', rgba('#a9a4b6', 0.15));
    ctx.fillStyle = '#16101c';
    ctx.fillRect(cx - 2, 168, 4, h - 178);
    poly(ctx, [[cx - 30, h], [cx + 30, h], [cx + 20, h - 10], [cx - 20, h - 10]], '#0a060c');
    ctx.fillRect(cx - 5, 40, 10, 18);
  });

  // Robe, dropped in a heap.
  paintTexture(scene, 'robe_heap', 160, 50, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, ROBE.sheen], [0.4, ROBE.mid], [1, ROBE.base]]);
    blob(ctx, [[10, 44], [30, 18], [70, 8], [110, 16], [150, 36], [140, 48], [60, 50]]);
    ctx.fill();
    ctx.strokeStyle = rgba(ROBE.rim, 0.35);
    ctx.beginPath(); ctx.moveTo(40, 30); ctx.quadraticCurveTo(80, 14, 120, 30); ctx.stroke();
  });

  // Front-facing Parallax for their own channel in the call.
  paintTexture(scene, 'px_front', 420, 420, (ctx, w, h) => {
    const cx = w / 2;
    // Mantle & shoulders.
    ctx.fillStyle = lin(ctx, 0, 230, 0, h, [[0, '#1e1430'], [0.3, '#0c0714'], [1, '#030205']]);
    ctx.beginPath();
    ctx.moveTo(cx - 190, h);
    ctx.lineTo(cx - 170, 300);
    ctx.quadraticCurveTo(cx - 120, 250, cx - 50, 246);
    ctx.lineTo(cx + 50, 246);
    ctx.quadraticCurveTo(cx + 120, 250, cx + 170, 300);
    ctx.lineTo(cx + 190, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(SUIT.silver, 0.3);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 170, 300); ctx.quadraticCurveTo(cx - 120, 250, cx - 50, 246); ctx.lineTo(cx + 50, 246); ctx.quadraticCurveTo(cx + 120, 250, cx + 170, 300); ctx.stroke();
    // Collar.
    poly(ctx, [[cx - 62, 250], [cx - 50, 200], [cx + 50, 200], [cx + 62, 250]], '#08050d', rgba('#7b5cc0', 0.25));
    // Helmet: tall smooth ovoid.
    ctx.fillStyle = rad(ctx, cx - 26, 110, 130, [[0, '#2e2044'], [0.45, '#130b1e'], [1, '#030205']]);
    ctx.beginPath();
    ctx.moveTo(cx - 54, 222);
    ctx.quadraticCurveTo(cx - 74, 120, cx - 50, 64);
    ctx.quadraticCurveTo(cx, 18, cx + 50, 64);
    ctx.quadraticCurveTo(cx + 74, 120, cx + 54, 222);
    ctx.quadraticCurveTo(cx, 236, cx - 54, 222);
    ctx.fill();
    ctx.strokeStyle = rgba('#d8c8ff', 0.28);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx - 10, 110, 46, 70, 0, Math.PI * 1.08, Math.PI * 1.45); ctx.stroke();
    // Seam down the faceplate.
    ctx.strokeStyle = rgba('#000', 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 50); ctx.lineTo(cx, 226); ctx.stroke();
  });

  paintTexture(scene, 'px_front_visor', 40, 200, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, 'rgba(255,255,255,0)'], [0.25, 'rgba(255,255,255,1)'], [0.75, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(w / 2 - 1.5, 0, 3, h);
    glow(ctx, w / 2, h / 2, 20, '#ffffff', 0.25);
  });
}
