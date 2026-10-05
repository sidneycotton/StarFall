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

export function registerBedroom(scene) {
  // The bed, side-on along the wall beneath the oculus. 900×520, origin bottom-centre
  // (world = local + (3400, 270)). Mattress top: back edge y=385, front edge y=420.
  paintTexture(scene, 'bed', 900, 520, (ctx, w, h) => {
    const cx = 455;
    // Headboard: an upholstered half-disc with sunburst channels, behind the long side.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, 400, 300, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, cx, 400, 300, [[0, '#2a1432'], [0.7, '#1f0e27'], [1, '#14091a']]);
    ctx.fill();
    ctx.clip();
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI + (i / 18) * Math.PI;
      line(ctx, cx, 400, cx + Math.cos(a) * 310, 400 + Math.sin(a) * 310, rgba('#000', 0.45), 3);
      line(ctx, cx + 3, 400, cx + 3 + Math.cos(a) * 310, 400 + Math.sin(a) * 310, rgba(C.uv, 0.07), 1);
    }
    ctx.restore();
    ctx.strokeStyle = rgba(C.gold, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, 400, 300, Math.PI, 0); ctx.stroke();

    const L0 = 110; const R0 = 800; const back = 385; const front = 420;
    // Mattress top: pale sheet, darker toward the wall.
    poly(ctx, [[L0 + 14, back], [R0 + 10, back], [R0, front], [L0, front]], lin(ctx, 0, back, 0, front, [[0, '#6a5c80'], [1, SHEET]]));
    // Side face: the sheet drawn tight over the mattress edge.
    ctx.fillStyle = lin(ctx, 0, front, 0, front + 38, [[0, '#7a6c8e'], [1, '#3a2e4c']]);
    ctx.fillRect(L0, front, R0 - L0, 38);
    line(ctx, L0, front, R0, front, rgba('#e0d4ee', 0.35), 1.2);
    // Plinth: recessed, a single gold line.
    ctx.fillStyle = lin(ctx, 0, front + 38, 0, h, [[0, '#0e0612'], [1, '#040205']]);
    ctx.fillRect(L0 + 24, front + 38, R0 - L0 - 48, h - front - 38);
    ctx.fillStyle = rgba(C.gold, 0.45);
    ctx.fillRect(L0 + 24, front + 40, R0 - L0 - 48, 1.2);
    // Pillows at the head end: one for each of them.
    [[220, back + 4, 92, 20, '#9a8cb0'], [196, back + 26, 98, 21, '#b4a6c8']].forEach(([x, y, rx, ry, top]) => {
      ctx.fillStyle = lin(ctx, 0, y - ry, 0, y + ry, [[0, top], [1, '#4a3c5e']]);
      blob(ctx, [[x - rx, y + 4], [x - rx * 0.6, y - ry], [x + rx * 0.5, y - ry * 0.9], [x + rx, y + 2], [x + rx * 0.4, y + ry], [x - rx * 0.6, y + ry * 0.9]]);
      ctx.fill();
    });
    // The duvet, kicked down to the foot and spilling to the floor.
    ctx.fillStyle = lin(ctx, 0, back - 30, 0, h, [[0, '#4a2258'], [0.4, DUVET], [1, '#12061a']]);
    ctx.beginPath();
    ctx.moveTo(640, front + 4);
    ctx.bezierCurveTo(660, back - 28, 740, back - 30, 790, back - 6);
    ctx.bezierCurveTo(830, back + 10, 838, front + 40, 852, h - 20);
    ctx.quadraticCurveTo(800, h - 8, 740, h - 18);
    ctx.bezierCurveTo(720, front + 70, 680, front + 60, 640, front + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#9a6ab8', 0.4);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(660, back - 4); ctx.bezierCurveTo(700, back - 26, 760, back - 24, 800, back + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(812, back + 30); ctx.quadraticCurveTo(828, front + 60, 836, h - 30); ctx.stroke();
  });

  // Parallax, face down along the front of the mattress, head turned to the wall.
  // The whole back bare; the sheet from the waist down. Local (0,0) = world (3545, 592).
  paintTexture(scene, 'px_lying', 540, 130, (ctx) => {
    const S = { hi: '#a888a8', mid: '#644460', sh: '#2c1828', rim: '#e0c4f0' };
    const base = 99;
    // Back: one continuous contour from nape to waist.
    ctx.fillStyle = lin(ctx, 0, 34, 0, base, [[0, S.hi], [0.35, S.mid], [1, S.sh]]);
    ctx.beginPath();
    ctx.moveTo(78, base);
    ctx.lineTo(80, 62);
    ctx.bezierCurveTo(90, 50, 104, 38, 124, 36);   // nape to the near shoulder
    ctx.bezierCurveTo(148, 34, 166, 40, 182, 40);  // across the shoulder blades
    ctx.bezierCurveTo(206, 41, 228, 50, 256, 54);  // spine settling toward the waist
    ctx.lineTo(292, 56);
    ctx.lineTo(292, base);
    ctx.closePath();
    ctx.fill();
    // Rim light along the top of the back.
    ctx.strokeStyle = rgba(S.rim, 0.55);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(90, 50); ctx.bezierCurveTo(104, 38, 124, 34, 150, 36); ctx.bezierCurveTo(176, 38, 210, 44, 250, 53);
    ctx.stroke();
    // Shoulder blades and the spine, as shadow only.
    ctx.fillStyle = lin(ctx, 0, 42, 0, 66, [[0, rgba(S.sh, 0)], [1, rgba(S.sh, 0.25)]]);
    blob(ctx, [[146, 48], [190, 46], [196, 62], [150, 64]]);
    ctx.fill();
    ctx.strokeStyle = rgba(S.sh, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(126, 50); ctx.bezierCurveTo(170, 52, 220, 58, 288, 64); ctx.stroke();
    // The scar: small, pale, four-rayed. Never mentioned.
    line(ctx, 168, 49, 173, 54, rgba('#f0e2f0', 0.3), 0.7);
    line(ctx, 173, 49, 168, 54, rgba('#f0e2f0', 0.2), 0.6);
    // Near shoulder rolling over the mattress edge, where the arm hangs down.
    ctx.fillStyle = lin(ctx, 0, 60, 0, base + 4, [[0, S.mid], [1, S.sh]]);
    blob(ctx, [[100, 70], [128, 62], [142, 80], [136, base + 4], [104, base + 4]]);
    ctx.fill();
    // Head on the pillow, turned to the wall: an elongated dark head of hair.
    ctx.save();
    ctx.translate(52, 66);
    ctx.rotate(-0.18);
    ctx.fillStyle = lin(ctx, 0, -22, 0, 22, [[0, '#2a2036'], [1, '#0c0810']]);
    ctx.beginPath();
    ctx.moveTo(30, 6);
    ctx.bezierCurveTo(30, -16, 12, -22, -6, -21);
    ctx.bezierCurveTo(-26, -20, -36, -6, -32, 8);
    ctx.bezierCurveTo(-28, 18, -14, 22, 0, 20);
    ctx.lineTo(6, 14); ctx.lineTo(12, 22); ctx.lineTo(18, 14); ctx.lineTo(26, 18);
    ctx.closePath();
    ctx.fill();
    // Hair falls with the head, not from a point.
    ctx.strokeStyle = rgba('#a77bff', 0.28);
    ctx.lineWidth = 1;
    [[-24, -12, -4, -6, 14, 10], [-14, -18, 6, -10, 24, 4], [-28, 0, -10, 6, 4, 16]].forEach(([x0, y0, x1, y1, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x1, y1, x2, y2); ctx.stroke();
    });
    ctx.strokeStyle = rgba('#d8c0ff', 0.4);
    ctx.beginPath(); ctx.moveTo(-28, -8); ctx.bezierCurveTo(-20, -20, 0, -23, 18, -16); ctx.stroke();
    ctx.restore();
    // The sheet over hips and legs, draped off the front edge.
    ctx.fillStyle = lin(ctx, 0, 34, 0, 128, [[0, '#b6a8c8'], [0.45, '#857598'], [1, '#3e3052']]);
    ctx.beginPath();
    ctx.moveTo(262, 128);
    ctx.lineTo(262, 60);
    ctx.bezierCurveTo(280, 50, 300, 40, 330, 40);   // over the hips
    ctx.bezierCurveTo(370, 40, 400, 52, 440, 56);   // thighs
    ctx.bezierCurveTo(480, 58, 510, 60, 534, 66);   // calves to the feet
    ctx.lineTo(536, 128);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#5a4a70', 0.5);
    ctx.lineWidth = 1.4;
    [[284, 62, 300, 124], [350, 50, 360, 126], [430, 60, 452, 126], [270, 70, 262, 120]].forEach(([x0, y0, x1, y1]) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + 8, (y0 + y1) / 2, x1, y1); ctx.stroke();
    });
    ctx.strokeStyle = rgba('#f4ecff', 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(266, 58); ctx.bezierCurveTo(290, 46, 310, 40, 336, 40); ctx.bezierCurveTo(380, 42, 420, 52, 470, 56); ctx.stroke();
  }, { scale: 2 });

  // The near arm, hanging off the mattress edge to the floor. Pivot at the shoulder.
  paintTexture(scene, 'px_arm_hang', 60, 160, (ctx) => {
    ctx.fillStyle = lin(ctx, 12, 0, 46, 0, [[0, '#2c1828'], [0.6, '#644460'], [1, '#9a7a9c']]);
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(44, 0);
    ctx.quadraticCurveTo(44, 50, 38, 88);
    ctx.lineTo(34, 124); ctx.lineTo(24, 124); ctx.lineTo(20, 88);
    ctx.quadraticCurveTo(14, 50, 14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lin(ctx, 0, 120, 0, 158, [[0, '#644460'], [1, '#2c1828']]);
    ctx.beginPath();
    ctx.moveTo(23, 120); ctx.lineTo(35, 120);
    ctx.quadraticCurveTo(42, 136, 37, 154);
    ctx.quadraticCurveTo(30, 160, 26, 154);
    ctx.quadraticCurveTo(19, 138, 23, 120);
    ctx.fill();
    ctx.strokeStyle = rgba('#e0c4f0', 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(44, 4); ctx.quadraticCurveTo(44, 50, 38, 88); ctx.lineTo(34, 122); ctx.stroke();
    line(ctx, 26, 146, 36, 146, '#0b0710', 1.6);
  }, { scale: 2 });

  // The other woman, on her side facing the wall: her back to him, and to us.
  // Shoulder, the dip of the waist, the hip under the sheet. Local (0,0) = world (3560, 548).
  paintTexture(scene, 'sleeper', 540, 130, (ctx) => {
    const S = { hi: '#d4acc0', mid: '#8c6478', sh: '#3a2232', rim: '#f6dcea' };
    const base = 124;
    // Hair first — long and loose, spilling across the pillow and over its edge.
    ctx.fillStyle = lin(ctx, 0, 30, 0, 124, [[0, '#6a2a3a'], [0.5, '#3e1220'], [1, '#1e070e']]);
    ctx.beginPath();
    ctx.moveTo(100, 64);
    ctx.bezierCurveTo(98, 40, 80, 32, 60, 36);
    ctx.bezierCurveTo(40, 40, 32, 54, 34, 66);
    ctx.bezierCurveTo(16, 70, 4, 86, 2, 104);
    ctx.bezierCurveTo(14, 96, 24, 94, 34, 96);
    ctx.bezierCurveTo(26, 108, 30, 120, 40, 124);
    ctx.bezierCurveTo(46, 110, 58, 102, 72, 100);
    ctx.bezierCurveTo(78, 112, 90, 118, 100, 116);
    ctx.bezierCurveTo(94, 100, 100, 86, 108, 80);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#e08a9a', 0.35);
    ctx.lineWidth = 1;
    [[92, 44, 56, 56, 8, 100], [96, 58, 60, 74, 38, 120], [100, 70, 84, 92, 92, 114], [78, 38, 50, 46, 36, 64]].forEach(([x0, y0, x1, y1, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x1, y1, x2, y2); ctx.stroke();
    });
    // Back: neck, round shoulder, the long dip to the waist.
    ctx.fillStyle = lin(ctx, 0, 40, 0, base, [[0, S.hi], [0.4, S.mid], [1, S.sh]]);
    ctx.beginPath();
    ctx.moveTo(96, base);
    ctx.lineTo(98, 66);
    ctx.bezierCurveTo(104, 54, 116, 46, 132, 46);   // shoulder
    ctx.bezierCurveTo(156, 46, 176, 56, 200, 70);   // down the back
    ctx.bezierCurveTo(216, 80, 232, 84, 250, 82);   // the waist
    ctx.lineTo(262, 80);
    ctx.lineTo(262, base);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(S.rim, 0.55);
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(102, 58); ctx.bezierCurveTo(112, 48, 126, 45, 144, 47); ctx.bezierCurveTo(170, 52, 200, 68, 246, 82); ctx.stroke();
    // The curve of her spine and one shoulder blade.
    ctx.strokeStyle = rgba(S.sh, 0.45);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(118, 62); ctx.bezierCurveTo(160, 70, 200, 88, 252, 96); ctx.stroke();
    // Sheet from the waist: over the hip, along the thighs, knees drawn up a little.
    ctx.fillStyle = lin(ctx, 0, 40, 0, base + 4, [[0, '#ae9ec2'], [0.5, '#7e6e94'], [1, '#3e3052']]);
    ctx.beginPath();
    ctx.moveTo(240, base + 4);
    ctx.lineTo(240, 84);
    ctx.bezierCurveTo(262, 60, 296, 40, 330, 42);   // up over the hip
    ctx.bezierCurveTo(362, 44, 392, 62, 430, 66);   // thigh
    ctx.bezierCurveTo(470, 68, 500, 58, 530, 74);   // knees, shins
    ctx.lineTo(534, base + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#f4ecff', 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(244, 80); ctx.bezierCurveTo(266, 58, 298, 42, 330, 43); ctx.bezierCurveTo(364, 46, 394, 62, 430, 66); ctx.stroke();
    ctx.strokeStyle = rgba('#5a4a70', 0.45);
    ctx.lineWidth = 1.3;
    [[262, 90, 280, 122], [340, 54, 350, 120], [420, 70, 440, 120]].forEach(([x0, y0, x1, y1]) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1); ctx.stroke();
    });
    // A gold bracelet on the wrist tucked under her cheek.
    ctx.strokeStyle = rgba(C.gold, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(104, 88, 5, 2.4, 0.3, 0, Math.PI * 2); ctx.stroke();
  }, { scale: 2 });

  // The sheet, drawn up over her shoulders.
  paintTexture(scene, 'sheet_pull', 200, 80, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 6, 0, h, [[0, '#d0c2e0'], [0.5, '#9a8ab0'], [1, '#5a4a70']]);
    ctx.beginPath();
    ctx.moveTo(4, h);
    ctx.bezierCurveTo(8, 20, 30, 6, 56, 8);
    ctx.bezierCurveTo(100, 12, 150, 34, 196, 44);
    ctx.lineTo(196, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#f4ecff', 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(10, 30); ctx.bezierCurveTo(24, 10, 50, 7, 70, 9); ctx.bezierCurveTo(110, 14, 150, 34, 192, 44); ctx.stroke();
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
