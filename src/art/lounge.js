import { paintTexture, lin, rad, rgba, glow, poly, ellipse, rng, starShape, line, blob, roundRect } from './paint.js';
import { C } from './kit.js';

// Lounge and gallery: the party's remains, and the past shoved into a crate.

function bottle(ctx, x, base, h, w, glassCol, label, tilt = 0) {
  ctx.save();
  ctx.translate(x, base);
  ctx.rotate(tilt);
  ctx.fillStyle = lin(ctx, -w / 2, 0, w / 2, 0, [[0, glassCol], [0.3, rgba('#ffffff', 0.25)], [0.4, glassCol], [1, '#020103']]);
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(-w / 2, -h * 0.6);
  ctx.quadraticCurveTo(-w / 2, -h * 0.75, -w * 0.16, -h * 0.82);
  ctx.lineTo(-w * 0.16, -h);
  ctx.lineTo(w * 0.16, -h);
  ctx.lineTo(w * 0.16, -h * 0.82);
  ctx.quadraticCurveTo(w / 2, -h * 0.75, w / 2, -h * 0.6);
  ctx.lineTo(w / 2, 0);
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.fillStyle = label;
    ctx.fillRect(-w / 2 + 2, -h * 0.45, w - 4, h * 0.2);
    ctx.fillStyle = rgba('#000', 0.4);
    ctx.fillRect(-w / 2 + 2, -h * 0.3, w - 4, 1);
  }
  ctx.restore();
}

export function registerLounge(scene) {
  // Long curved velvet sofa.
  paintTexture(scene, 'sofa', 620, 230, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 20, 0, 140, [[0, '#3a1846'], [1, '#1a0a20']]);
    ctx.beginPath();
    ctx.moveTo(20, 160);
    ctx.quadraticCurveTo(10, 30, 120, 26);
    ctx.lineTo(w - 120, 26);
    ctx.quadraticCurveTo(w - 10, 30, w - 20, 160);
    ctx.closePath();
    ctx.fill();
    // Channel tufting.
    for (let x = 80; x < w - 70; x += 38) line(ctx, x, 36, x, 140, rgba('#000', 0.35), 2);
    ctx.fillStyle = rgba(C.uv, 0.18);
    ctx.fillRect(110, 27, w - 220, 1.5);
    // Seat.
    ctx.fillStyle = lin(ctx, 0, 130, 0, 190, [[0, '#4a2258'], [1, '#1c0b22']]);
    roundRect(ctx, 10, 130, w - 20, 60, 24, ctx.fillStyle);
    ctx.fillStyle = '#0a050c';
    ctx.fillRect(30, 190, w - 60, 24);
    ctx.fillStyle = rgba(C.gold, 0.5);
    ctx.fillRect(30, 212, w - 60, 1.5);
    [40, w - 42].forEach((x) => ctx.fillRect(x, 214, 2, 16));
    // A cushion knocked askew.
    ctx.save();
    ctx.translate(470, 118); ctx.rotate(0.3);
    ctx.fillStyle = lin(ctx, 0, -20, 0, 20, [[0, '#b89a5c'], [1, '#4a3820']]);
    roundRect(ctx, -34, -24, 68, 48, 12, ctx.fillStyle);
    ctx.restore();
  });

  // A guest came dressed as Parallax. The cape is shiny and wrong.
  paintTexture(scene, 'cape_replica', 260, 210, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, h, [[0, '#6a3aa8'], [0.4, '#3b1d6a'], [0.7, '#7a4ac0'], [1, '#2a1250']]);
    ctx.beginPath();
    ctx.moveTo(10, 30);
    ctx.quadraticCurveTo(120, 4, 230, 26);
    ctx.quadraticCurveTo(250, 120, 220, h - 6);
    ctx.quadraticCurveTo(170, h - 20, 140, h);
    ctx.quadraticCurveTo(100, h - 26, 60, h - 4);
    ctx.quadraticCurveTo(20, 120, 10, 30);
    ctx.fill();
    // Cheap sheen: too bright, too regular.
    for (let i = 0; i < 4; i++) line(ctx, 50 + i * 45, 30, 40 + i * 50, h - 20, rgba('#d9c2ff', 0.25), 3);
    ctx.fillStyle = '#c0c0c8';
    ctx.beginPath(); ctx.arc(40, 30, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a8a94';
    ctx.beginPath(); ctx.arc(42, 28, 4, 0, Math.PI * 2); ctx.fill();
  });

  paintTexture(scene, 'helmet_replica', 90, 80, (ctx, w, h) => {
    ctx.save();
    ctx.translate(45, 44); ctx.rotate(1.2);
    ctx.fillStyle = lin(ctx, -30, -30, 30, 30, [[0, '#5a3a8a'], [1, '#1a0a30']]);
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2); ctx.fill();
    // The visor is horizontal and red — they always get it wrong.
    ctx.fillStyle = '#c02040';
    ctx.fillRect(-18, -6, 36, 5);
    ctx.fillStyle = rgba('#ffffff', 0.35);
    ctx.fillRect(-12, -22, 10, 3);
    ctx.restore();
  });

  // Low table: gilded tiered tray, half-eaten, glasses, a burnt-down candle.
  paintTexture(scene, 'low_table', 420, 170, (ctx, w, h) => {
    poly(ctx, [[20, 96], [400, 96], [416, 110], [4, 110]], '#0a060c', rgba(C.uv, 0.35));
    ctx.fillStyle = rgba(C.gold, 0.55);
    ctx.fillRect(40, 110, 3, 56); ctx.fillRect(w - 44, 110, 3, 56);
    // Tiered tray.
    ctx.fillStyle = rgba(C.gold, 0.8);
    ctx.fillRect(149, 20, 2, 76);
    [[96, 60], [62, 40], [36, 20]].forEach(([rw, y]) => {
      ctx.fillStyle = lin(ctx, 150 - rw / 2, 0, 150 + rw / 2, 0, [[0, '#6b4e1f'], [0.5, '#e6c98a'], [1, '#6b4e1f']]);
      ctx.beginPath(); ctx.ellipse(150, y + 40, rw / 2, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
    // Pastries, gold-leafed, some bitten.
    const r = rng(3);
    [[118, 94], [140, 94], [176, 94], [134, 74], [160, 74], [150, 54]].forEach(([x, y], i) => {
      ellipse(ctx, x, y - 6, 9, 6, i % 3 === 0 ? '#3a1822' : '#6a3a2c');
      ctx.fillStyle = rgba('#ffe7a0', 0.6);
      ctx.fillRect(x - 3 + r() * 4, y - 10, 3, 2);
      if (i === 2) ellipse(ctx, x + 5, y - 9, 4, 4, '#0a060c');
    });
    // Glasses: one standing, one on its side, one with a lipstick mark.
    const glassPath = (x, y, tilt) => {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(tilt);
      ctx.strokeStyle = rgba('#efe8ff', 0.6);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-9, -40); ctx.quadraticCurveTo(-9, -18, 0, -16); ctx.quadraticCurveTo(9, -18, 9, -40);
      ctx.moveTo(0, -16); ctx.lineTo(0, 0); ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
      ctx.stroke();
      ctx.restore();
    };
    glassPath(250, 96, 0);
    ctx.fillStyle = rgba('#b0405a', 0.8);
    ctx.fillRect(244, 57, 4, 2);
    glassPath(300, 92, 1.45);
    glassPath(330, 96, 0);
    ctx.fillStyle = rgba('#d9b46a', 0.4);
    ctx.fillRect(323, 66, 14, 8);
    // Candle burnt to a stub, wax pooled.
    ellipse(ctx, 380, 94, 14, 3, '#cfc3da');
    ctx.fillStyle = '#cfc3da';
    ctx.fillRect(376, 82, 8, 12);
    line(ctx, 380, 82, 381, 76, '#1a1a1a', 1);
    // Oyster shells.
    ellipse(ctx, 60, 92, 14, 4, '#8a8098');
    ellipse(ctx, 84, 94, 12, 3.5, '#6a6078');
  });

  // Bar cart crowded with bottles — expensive, mostly empty.
  paintTexture(scene, 'bar', 380, 300, (ctx, w, h) => {
    ctx.strokeStyle = rgba(C.gold, 0.7);
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 130, w - 40, 140);
    ctx.fillStyle = rgba('#08050b', 0.9);
    ctx.fillRect(22, 126, w - 44, 8);
    ctx.fillRect(22, 266, w - 44, 8);
    ctx.fillStyle = rgba(C.uv, 0.3);
    ctx.fillRect(22, 126, w - 44, 1);
    ctx.strokeStyle = rgba(C.gold, 0.7);
    ctx.beginPath(); ctx.arc(40, 284, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w - 40, 284, 14, 0, Math.PI * 2); ctx.stroke();
    bottle(ctx, 50, 126, 110, 26, '#0e2418', '#d9c79a');
    bottle(ctx, 86, 126, 90, 30, '#2a0e14', '#1a1a1a');
    bottle(ctx, 120, 126, 120, 22, '#141018', '#b8955a');
    bottle(ctx, 158, 126, 80, 34, rgba('#d9b46a', 0.5), null);
    bottle(ctx, 236, 126, 100, 28, '#1a0a20', '#e8e0f0');
    bottle(ctx, 270, 126, 70, 40, rgba('#9fc5d0', 0.35), null);
    bottle(ctx, 314, 126, 115, 24, '#0e2418', '#d9c79a');
    // Lower shelf: a row of identical, untouched cases.
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = lin(ctx, 0, 220, 0, 266, [[0, '#2a1a12'], [1, '#120a06']]);
      ctx.fillRect(40 + i * 76, 222, 66, 44);
      ctx.fillStyle = rgba(C.gold, 0.5);
      ctx.fillRect(40 + i * 76, 236, 66, 1);
    }
  });

  // The bottle Parallax will regret. Tipped on its side.
  paintTexture(scene, 'bottle_empty', 130, 50, (ctx) => {
    bottle(ctx, 18, 32, 110, 30, '#173022', '#e2d2a0', -Math.PI / 2 + 0.02);
  });

  ['gold', 'black', 'violet'].forEach((kind) => {
    paintTexture(scene, `balloon_${kind}`, 90, 220, (ctx, w, h) => {
      const col = { gold: ['#d8b870', '#4a3410'], black: ['#3a3040', '#050307'], violet: ['#9a72d8', '#24104a'] }[kind];
      line(ctx, 45, 104, 50, h, rgba('#cfc8dc', 0.35), 1);
      ctx.fillStyle = rad(ctx, 34, 36, 70, [[0, col[0]], [1, col[1]]]);
      // Slightly deflated: not a perfect oval.
      blob(ctx, [[45, 6], [76, 22], [82, 60], [62, 96], [45, 104], [26, 92], [10, 56], [16, 20]]);
      ctx.fill();
      ctx.fillStyle = rgba('#ffffff', kind === 'black' ? 0.18 : 0.35);
      ellipse(ctx, 30, 30, 8, 14, ctx.fillStyle, -0.4);
    });
  });

  // Crescent chandelier: a broken halo turned on its side.
  paintTexture(scene, 'chandelier', 420, 300, (ctx, w, h) => {
    line(ctx, w / 2, 0, w / 2, 110, rgba('#a9a4b6', 0.4), 1.5);
    ctx.strokeStyle = rgba(C.gold, 0.75);
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(w / 2, 170, 180, 48, 0, 0.1, Math.PI * 1.15); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(w / 2, 170, 164, 40, 0, 0.1, Math.PI * 1.15); ctx.stroke();
    for (let i = 0; i < 13; i++) {
      const a = 0.15 + (i / 12) * (Math.PI * 0.98);
      const x = w / 2 + Math.cos(a) * 172;
      const y = 170 + Math.sin(a) * 44;
      line(ctx, x, y, x, y + 26 + (i % 3) * 10, rgba('#e6dcff', 0.4), 1);
      ellipse(ctx, x, y + 30 + (i % 3) * 10, 3, 6, rgba('#efe6ff', 0.75));
    }
  });

  // Tall freestanding display; the news is drawn live over it.
  paintTexture(scene, 'news_frame', 340, 520, (ctx, w, h) => {
    ctx.fillStyle = '#050407';
    ctx.fillRect(10, 0, w - 20, 440);
    ctx.strokeStyle = rgba(C.gold, 0.4);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10.5, 0.5, w - 21, 439);
    ctx.fillStyle = '#020203';
    ctx.fillRect(24, 14, w - 48, 412);
    // Screen asleep: a faint diagonal reflection of the room, a standby light.
    ctx.fillStyle = lin(ctx, 24, 14, w - 24, 426, [[0, 'rgba(160,140,210,0.10)'], [0.35, 'rgba(160,140,210,0.02)'], [0.5, 'rgba(160,140,210,0.07)'], [0.56, 'rgba(160,140,210,0)']]);
    ctx.fillRect(24, 14, w - 48, 412);
    ctx.fillStyle = rgba('#a77bff', 0.8);
    ctx.fillRect(w / 2 - 1, 432, 2, 2);
    ctx.fillStyle = rgba(C.gold, 0.6);
    ctx.fillRect(w / 2 - 2, 440, 4, h - 450);
    poly(ctx, [[w / 2 - 60, h], [w / 2 + 60, h], [w / 2 + 40, h - 10], [w / 2 - 40, h - 10]], '#0b070e', rgba(C.gold, 0.4));
  });

  paintTexture(scene, 'speaker', 110, 330, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 20, 0, w - 20, 0, [[0, '#060408'], [0.35, '#1a1020'], [1, '#040205']]);
    ctx.fillRect(28, 30, w - 56, h - 40);
    for (let y = 60; y < h - 30; y += 7) line(ctx, 34, y, w - 34, y, rgba(C.gold, 0.08), 1);
    ctx.strokeStyle = rgba(C.gold, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(w / 2, 30, 26, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#0a060c';
    ctx.beginPath(); ctx.arc(w / 2, 30, 26, Math.PI, 0); ctx.fill();
    ctx.fillStyle = rgba(C.gold, 0.5);
    ctx.fillRect(24, h - 12, w - 48, 2);
    ctx.fillStyle = rgba('#a77bff', 0.9);
    ctx.beginPath(); ctx.arc(w / 2, 48, 2.2, 0, Math.PI * 2); ctx.fill();
  });

  paintTexture(scene, 'confetti', 700, 80, (ctx, w, h) => {
    const r = rng(12);
    for (let i = 0; i < 160; i++) {
      const x = r() * w; const y = 10 + r() * (h - 20);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r() * Math.PI);
      ctx.fillStyle = r() < 0.6 ? rgba('#e6c98a', 0.35 + r() * 0.5) : rgba('#c9b2ff', 0.25 + r() * 0.4);
      ctx.fillRect(-2, -1, 4, 2);
      ctx.restore();
    }
  });

  // --- Gallery ---------------------------------------------------------------

  paintTexture(scene, 'console_table', 300, 200, (ctx, w, h) => {
    poly(ctx, [[0, 70], [w, 70], [w - 10, 84], [10, 84]], '#120a16', rgba(C.uv, 0.35));
    ctx.fillStyle = rgba(C.gold, 0.6);
    ctx.fillRect(20, 84, 3, h - 84); ctx.fillRect(w - 23, 84, 3, h - 84);
    ctx.fillRect(20, h - 30, w - 40, 2);
    // A shallow bowl of keys nobody uses.
    ellipse(ctx, 240, 66, 30, 7, '#3a2e1c');
    ellipse(ctx, 240, 63, 26, 5, '#0a060c');
  });

  // Unopened correspondence, stamped with official seals. Years of it.
  paintTexture(scene, 'letters', 170, 90, (ctx, w, h) => {
    const r = rng(41);
    for (let i = 0; i < 14; i++) {
      ctx.save();
      ctx.translate(70 + (r() - 0.5) * 30, h - 8 - i * 4.2);
      ctx.rotate((r() - 0.5) * 0.25);
      ctx.fillStyle = i % 4 === 0 ? '#d8cfc0' : (i % 3 === 0 ? '#a8a2b0' : '#c4bcd0');
      ctx.fillRect(-56, -5, 112, 8);
      ctx.fillStyle = rgba('#000', 0.2);
      ctx.fillRect(-56, 2, 112, 1);
      if (i % 2 === 0) {
        ctx.fillStyle = i % 4 === 0 ? '#8a1a24' : '#2a4a58';
        ctx.beginPath(); ctx.arc(28, -1, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    // The topmost: heavy cream envelope with a ruled Meridian seal.
    ctx.save();
    ctx.translate(76, h - 72); ctx.rotate(-0.06);
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(-60, -10, 120, 16);
    ctx.fillStyle = '#5d6a73';
    ctx.fillRect(18, -8, 12, 12);
    ctx.strokeStyle = '#efe6d2';
    ctx.lineWidth = 1;
    line(ctx, 24, -8, 24, 4, '#efe6d2', 1);
    line(ctx, 18, -2, 30, -2, '#efe6d2', 1);
    ctx.restore();
  });

  // A crate of honours, shoved against the wall. Lid leaning beside it.
  paintTexture(scene, 'crate', 360, 220, (ctx, w, h) => {
    // Contents poking out: plaques, statuettes, a sash, medals.
    ctx.fillStyle = '#5a4420';
    poly(ctx, [[60, 70], [110, 30], [130, 44], [84, 84]], lin(ctx, 60, 30, 130, 84, [[0, '#c8a868'], [1, '#4a3418']]));
    ctx.fillStyle = '#d9c79a';
    ctx.fillRect(150, 20, 10, 70);
    ellipse(ctx, 155, 18, 12, 12, '#e6d29a');
    ctx.fillStyle = '#2a4a58';
    ctx.fillRect(196, 40, 70, 50);
    ctx.fillStyle = rgba('#8fb7bf', 0.6);
    ctx.fillRect(202, 46, 58, 2);
    // Medal ribbons hanging over the edge.
    [[90, '#8a1a24'], [250, '#2a3a8a'], [290, '#d9b46a']].forEach(([x, c]) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, 70, 10, 60);
      ctx.fillStyle = '#d9b46a';
      ctx.beginPath(); ctx.arc(x + 5, 136, 8, 0, Math.PI * 2); ctx.fill();
    });
    // The crate itself: black lacquer, functional.
    ctx.fillStyle = lin(ctx, 0, 80, 0, h, [[0, '#1a1018'], [1, '#08050a']]);
    ctx.fillRect(20, 84, w - 40, h - 84);
    ctx.strokeStyle = rgba(C.gold, 0.2);
    ctx.strokeRect(30.5, 94.5, w - 61, h - 106);
    ctx.fillStyle = rgba('#ffffff', 0.06);
    ctx.fillRect(20, 84, w - 40, 2);
    // Stencil on the side.
    ctx.fillStyle = rgba('#a9a4b6', 0.25);
    ctx.font = '600 13px Jost, sans-serif';
    ctx.fillText('MISC.', 52, 150);
  });

  // An Aureate commendation — a sunburst on a stand — used as a mask hook.
  paintTexture(scene, 'trophy', 150, 230, (ctx, w, h) => {
    const cx = w / 2;
    poly(ctx, [[cx - 40, h], [cx + 40, h], [cx + 28, h - 20], [cx - 28, h - 20]], '#2a1e10', rgba(C.gold, 0.6));
    ctx.fillStyle = lin(ctx, cx - 6, 0, cx + 6, 0, [[0, '#6b4e1f'], [0.5, '#f0d89a'], [1, '#6b4e1f']]);
    ctx.fillRect(cx - 5, 110, 10, h - 130);
    // Sunburst disc with Star's emblem in negative.
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      poly(ctx, [[cx + Math.cos(a - 0.06) * 30, 70 + Math.sin(a - 0.06) * 30], [cx + Math.cos(a) * 58, 70 + Math.sin(a) * 58], [cx + Math.cos(a + 0.06) * 30, 70 + Math.sin(a + 0.06) * 30]], rgba('#e6c98a', 0.85));
    }
    ctx.fillStyle = rad(ctx, cx - 10, 60, 40, [[0, '#fff0c0'], [0.6, '#d9b46a'], [1, '#6b4e1f']]);
    ctx.beginPath(); ctx.arc(cx, 70, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2810';
    starShape(ctx, cx, 70, 20, 0.22);
    ctx.fill();
    // A black velvet party mask hung carelessly over one ray.
    ctx.save();
    ctx.translate(cx + 30, 52); ctx.rotate(0.5);
    ctx.fillStyle = '#0a060c';
    ctx.beginPath(); ctx.ellipse(0, 0, 24, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2810';
    ctx.beginPath(); ctx.ellipse(-9, -1, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, -1, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    line(ctx, -22, 4, -30, 40, rgba('#5a2a6a', 0.9), 1.5);
    ctx.restore();
  });

  // A cheap plastic figurine of Star. Faded paint, one arm snapped off.
  paintTexture(scene, 'figurine', 60, 46, (ctx, w, h) => {
    ctx.save();
    ctx.translate(30, 34);
    ctx.rotate(-1.35); // lying on its side
    ctx.fillStyle = '#7a6a4a';
    ellipse(ctx, 0, 10, 12, 4, '#4a3a2a');
    ctx.fillStyle = '#c8b27a';
    poly(ctx, [[-6, 8], [6, 8], [5, -10], [-5, -10]], '#c8b27a');
    // Cape: faded red-gold plastic.
    poly(ctx, [[-5, -10], [-12, 8], [-6, 8]], '#9a5a3a');
    ellipse(ctx, 0, -15, 4.5, 5, '#d8b898');
    // Emblem: a tiny star, paint mostly gone.
    ctx.fillStyle = rgba('#f4e2a8', 0.7);
    starShape(ctx, 0, -2, 3, 0.3);
    ctx.fill();
    // Raised arm (the other one is gone).
    poly(ctx, [[4, -9], [6, -10], [10, -20], [8, -21]], '#c8b27a');
    ctx.restore();
    // Snapped arm lying beside it.
    line(ctx, 46, 40, 54, 38, '#c8b27a', 2);
  });

  // A large painting leaned against the wall, turned to face it.
  paintTexture(scene, 'portrait_back', 300, 420, (ctx, w, h) => {
    ctx.save();
    ctx.translate(0, 0);
    ctx.fillStyle = '#2a2018';
    poly(ctx, [[40, 0], [w - 10, 10], [w - 30, h], [10, h - 6]], lin(ctx, 0, 0, w, 0, [[0, '#22180f'], [1, '#0e0906']]));
    // Stretcher bars.
    ctx.strokeStyle = '#2e2216';
    ctx.lineWidth = 10;
    ctx.strokeRect(46, 18, w - 70, h - 40);
    line(ctx, (w - 10) / 2 + 10, 20, (w - 10) / 2 + 2, h - 20, '#2e2216', 8);
    line(ctx, 46, h / 2, w - 26, h / 2, '#2e2216', 8);
    // A gallery sticker, peeling, unreadable.
    ctx.fillStyle = rgba('#d8cfc0', 0.6);
    ctx.fillRect(70, h - 90, 60, 24);
    ctx.fillStyle = rgba('#2a2018', 0.6);
    ctx.fillRect(76, h - 82, 40, 2); ctx.fillRect(76, h - 76, 30, 2);
    ctx.restore();
  });
}
