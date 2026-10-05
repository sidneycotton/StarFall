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

    // Duvet: deep plum satin, pulled up to the shoulders. Broad soft folds only.
    ctx.fillStyle = lin(ctx, 0, back + 60, 0, front + 60, [[0, '#3a1844'], [0.5, DUVET], [1, '#160a1c']]);
    ctx.beginPath();
    ctx.moveTo(cx - 372, front - 10);
    ctx.lineTo(cx - 356, back + 68);
    ctx.lineTo(cx + 356, back + 68);
    ctx.lineTo(cx + 380, front - 6);
    ctx.lineTo(cx + 395, front + 52);
    ctx.quadraticCurveTo(cx + 200, front + 66, cx + 40, front + 50);
    ctx.quadraticCurveTo(cx - 160, front + 68, cx - 395, front + 50);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    // Satin catches the lamp in long, slow highlights running toward the foot.
    [[cx - 300, 0.10], [cx - 20, 0.07], [cx + 280, 0.09]].forEach(([x, a]) => {
      ctx.fillStyle = lin(ctx, x - 50, 0, x + 50, 0, [[0, rgba(DUVET_HI, 0)], [0.5, rgba('#9a6ab8', a)], [1, rgba(DUVET_HI, 0)]]);
      ctx.beginPath();
      ctx.moveTo(x - 20, back + 70); ctx.lineTo(x + 20, back + 70); ctx.lineTo(x * 1.0 + (x - cx) * 0.18 + 40, front + 60); ctx.lineTo(x + (x - cx) * 0.18 - 40, front + 60);
      ctx.closePath();
      ctx.fill();
    });
    // The duvet spilling over the foot edge.
    ctx.fillStyle = lin(ctx, 0, front - 4, 0, front + 50, [[0, rgba('#8a5aa8', 0.22)], [0.3, rgba('#000', 0)], [1, rgba('#000', 0.35)]]);
    ctx.fillRect(cx - 400, front - 4, 800, 60);
    ctx.restore();

    // Front face of the bed and its plinth.
    ctx.fillStyle = lin(ctx, 0, front + 40, 0, h, [[0, '#120816'], [1, '#050307']]);
    ctx.fillRect(cx - 405, front + 44, 810, h - front - 44);
    ctx.fillStyle = rgba(C.gold, 0.45);
    ctx.fillRect(cx - 405, h - 34, 810, 1.5);
    ctx.fillStyle = '#030204';
    ctx.fillRect(cx - 380, h - 32, 760, 32);
  });

  // The turned-down sheet across both sleepers, drawn above them so their
  // shoulders disappear under it. Same frame as the bed.
  paintTexture(scene, 'bed_fold', 900, 520, (ctx) => {
    const cx = 450; const y0 = 336; const y1 = 354;
    const edge = (x) => y0 + Math.sin(x / 37) * 2 + Math.sin(x / 13) * 0.8;
    ctx.fillStyle = lin(ctx, 0, y1, 0, y1 + 16, [[0, rgba('#000', 0.45)], [1, rgba('#000', 0)]]);
    ctx.fillRect(cx - 360, y1, 720, 16);
    ctx.fillStyle = lin(ctx, 0, y0 - 2, 0, y1, [[0, '#d2c4e0'], [0.4, '#a898bc'], [1, '#5e4e72']]);
    ctx.beginPath();
    ctx.moveTo(cx - 357, edge(cx - 357));
    for (let x = cx - 357; x <= cx + 357; x += 6) ctx.lineTo(x, edge(x));
    ctx.lineTo(cx + 360, y1);
    ctx.lineTo(cx - 360, y1);
    ctx.closePath();
    ctx.fill();
    // Two soft rucks where the sleepers' shoulders push the sheet up.
    [[cx - 245, 1], [cx + 195, 0.8]].forEach(([x, k]) => {
      ctx.fillStyle = lin(ctx, 0, y0 - 8, 0, y0 + 6, [[0, '#d8cae6'], [1, '#a898bc']]);
      ctx.beginPath();
      ctx.ellipse(x, y0 + 2, 70 * k, 7, 0, Math.PI, 0);
      ctx.fill();
    });
  }, { scale: 2 });

  // Parallax asleep: face down, head turned away, bare shoulders above the sheet.
  // Local frame: (0,0) = bed (20, 230). The sheet's fold sits at y≈108.
  paintTexture(scene, 'px_lying', 380, 220, (ctx) => {
    const S = { hi: '#a07ea0', mid: '#5e3e58', sh: '#2a1626', rim: '#d6b4e6' };
    // The body's length under the duvet: a low ridge running toward the foot.
    ctx.fillStyle = lin(ctx, 120, 0, 260, 0, [[0, rgba('#000', 0)], [0.35, rgba('#000', 0.28)], [0.5, rgba('#9a6ab8', 0.16)], [0.75, rgba('#000', 0)]]);
    ctx.beginPath();
    ctx.moveTo(110, 116); ctx.lineTo(300, 116); ctx.lineTo(270, 220); ctx.lineTo(60, 220);
    ctx.closePath();
    ctx.fill();
    // Near arm: from the shoulder out to the mattress edge (the rest hangs over it).
    ctx.fillStyle = lin(ctx, 0, 90, 0, 122, [[0, S.hi], [0.5, S.mid], [1, S.sh]]);
    ctx.beginPath();
    ctx.moveTo(126, 92);
    ctx.quadraticCurveTo(96, 94, 66, 102);
    ctx.lineTo(64, 124);
    ctx.quadraticCurveTo(98, 118, 130, 118);
    ctx.closePath();
    ctx.fill();
    // Shoulders and upper back, top-lit by the lamps.
    ctx.fillStyle = lin(ctx, 0, 74, 0, 120, [[0, S.hi], [0.45, S.mid], [1, S.sh]]);
    ctx.beginPath();
    ctx.moveTo(112, 120);
    ctx.bezierCurveTo(112, 96, 140, 84, 178, 80);
    ctx.quadraticCurveTo(206, 76, 236, 80);
    ctx.bezierCurveTo(276, 84, 302, 96, 304, 120);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(S.rim, 0.5);
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(116, 104); ctx.bezierCurveTo(132, 88, 156, 82, 186, 79); ctx.stroke();
    // Spine and blades, barely.
    ctx.fillStyle = lin(ctx, 196, 0, 220, 0, [[0, rgba(S.sh, 0)], [0.5, rgba(S.sh, 0.45)], [1, rgba(S.sh, 0)]]);
    ctx.fillRect(196, 84, 24, 36);
    // The scar: small, pale, four-rayed. Never mentioned.
    line(ctx, 152, 98, 162, 108, rgba('#eadcea', 0.4), 0.9);
    line(ctx, 162, 98, 152, 108, rgba('#eadcea', 0.28), 0.8);
    line(ctx, 157, 95, 157, 111, rgba('#eadcea', 0.18), 0.6);
    // Neck.
    ctx.fillStyle = lin(ctx, 0, 62, 0, 86, [[0, S.sh], [1, S.mid]]);
    ctx.fillRect(196, 62, 26, 22);
    // Head, turned away into the pillow: the back of a dark head of hair.
    ctx.fillStyle = lin(ctx, 0, 24, 0, 80, [[0, '#2a2036'], [1, '#0c0810']]);
    ctx.beginPath();
    ctx.moveTo(176, 66);
    ctx.bezierCurveTo(168, 40, 186, 24, 212, 24);
    ctx.bezierCurveTo(240, 24, 254, 42, 248, 64);
    ctx.lineTo(240, 74); ctx.lineTo(234, 66); ctx.lineTo(226, 78); ctx.lineTo(218, 68);
    ctx.lineTo(208, 80); ctx.lineTo(200, 68); ctx.lineTo(190, 76); ctx.lineTo(186, 66);
    ctx.closePath();
    ctx.fill();
    // Strands follow the skull from the crown.
    ctx.strokeStyle = rgba('#a77bff', 0.3);
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const x = 186 + i * 11;
      ctx.beginPath();
      ctx.moveTo(214, 30);
      ctx.quadraticCurveTo(x - 4 + (i - 2.5) * 4, 42, x, 66);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba('#d8c0ff', 0.35);
    ctx.beginPath(); ctx.arc(212, 48, 26, Math.PI * 1.15, Math.PI * 1.55); ctx.stroke();
  }, { scale: 2 });

  // The forearm and hand hanging off the side of the mattress. Pivot at the top.
  paintTexture(scene, 'px_arm_hang', 60, 200, (ctx) => {
    ctx.fillStyle = lin(ctx, 12, 0, 46, 0, [[0, '#2a1626'], [0.6, '#5e3e58'], [1, '#8a6888']]);
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(42, 0);
    ctx.quadraticCurveTo(44, 60, 38, 110);
    ctx.lineTo(34, 158);
    ctx.lineTo(24, 158);
    ctx.lineTo(20, 110);
    ctx.quadraticCurveTo(14, 60, 16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lin(ctx, 0, 154, 0, 196, [[0, '#5e3e58'], [1, '#2a1626']]);
    ctx.beginPath();
    ctx.moveTo(23, 154);
    ctx.lineTo(35, 154);
    ctx.quadraticCurveTo(42, 172, 37, 192);
    ctx.quadraticCurveTo(30, 199, 26, 192);
    ctx.quadraticCurveTo(19, 175, 23, 154);
    ctx.fill();
    ctx.strokeStyle = rgba('#d6b4e6', 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(42, 4); ctx.quadraticCurveTo(43, 60, 37, 110); ctx.lineTo(34, 156); ctx.stroke();
    line(ctx, 26, 182, 36, 182, '#0b0710', 1.6);
  }, { scale: 2 });

  // The other woman: on her side, turned away; long hair across the pillow,
  // one bare shoulder, an arm thrown over the pillow. Local (0,0) = bed (450, 230).
  paintTexture(scene, 'sleeper', 380, 220, (ctx) => {
    const S = { hi: '#c49aae', mid: '#7a5466', sh: '#3a2232', rim: '#f2d4e2' };
    // Her curled body under the duvet, hip toward the foot of the bed.
    ctx.fillStyle = lin(ctx, 150, 0, 330, 0, [[0, rgba('#000', 0)], [0.4, rgba('#9a6ab8', 0.16)], [0.65, rgba('#000', 0.3)], [1, rgba('#000', 0)]]);
    ctx.beginPath();
    ctx.moveTo(150, 116); ctx.lineTo(300, 116); ctx.lineTo(350, 220); ctx.lineTo(170, 220);
    ctx.closePath();
    ctx.fill();
    // Arm over the pillow, a gold bracelet.
    ctx.fillStyle = lin(ctx, 0, 34, 0, 70, [[0, S.hi], [1, S.sh]]);
    ctx.beginPath();
    ctx.moveTo(214, 86);
    ctx.bezierCurveTo(240, 54, 290, 40, 330, 38);
    ctx.quadraticCurveTo(344, 42, 336, 52);
    ctx.bezierCurveTo(296, 56, 256, 72, 236, 96);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(316, 44, 2.5, 7, 0.4, 0, Math.PI * 2); ctx.stroke();
    // Shoulder and the top of her back, rounded, catching the lamp.
    ctx.fillStyle = lin(ctx, 0, 70, 0, 118, [[0, S.hi], [0.5, S.mid], [1, S.sh]]);
    ctx.beginPath();
    ctx.moveTo(140, 120);
    ctx.bezierCurveTo(142, 96, 164, 80, 196, 78);
    ctx.bezierCurveTo(228, 76, 252, 92, 256, 120);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(S.rim, 0.5);
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(150, 98); ctx.bezierCurveTo(166, 84, 188, 79, 214, 80); ctx.stroke();
    // Head, mostly hair; long tresses spilling across the pillow toward him.
    ctx.fillStyle = lin(ctx, 0, 20, 0, 84, [[0, '#5a2232'], [1, '#22080f']]);
    ctx.beginPath();
    ctx.moveTo(196, 82);
    ctx.bezierCurveTo(206, 54, 194, 28, 166, 26);
    ctx.bezierCurveTo(140, 24, 122, 40, 118, 58);
    // The spill: waves running left and down over the pillow.
    ctx.bezierCurveTo(96, 50, 70, 64, 40, 58);
    ctx.bezierCurveTo(62, 70, 84, 68, 104, 74);
    ctx.bezierCurveTo(84, 82, 62, 92, 48, 108);
    ctx.bezierCurveTo(78, 98, 110, 88, 132, 90);
    ctx.bezierCurveTo(150, 92, 176, 96, 196, 82);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#d47a8a', 0.32);
    ctx.lineWidth = 1;
    [[180, 36, 120, 60, 50, 60], [176, 50, 110, 72, 60, 100], [188, 70, 140, 84, 100, 84], [160, 32, 130, 44, 90, 58]].forEach(([x0, y0, x1, y1, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x1, y1, x2, y2); ctx.stroke();
    });
  }, { scale: 2 });

  // A fold of duvet drawn up over her shoulder.
  paintTexture(scene, 'sheet_pull', 160, 70, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 6, 0, h, [[0, '#5a2c6a'], [0.4, DUVET], [1, rgba(DUVET, 0)]]);
    ctx.beginPath();
    ctx.moveTo(8, h);
    ctx.bezierCurveTo(14, 26, 50, 8, 84, 8);
    ctx.bezierCurveTo(120, 8, 150, 28, 154, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#b88ad0', 0.45);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(18, 40); ctx.bezierCurveTo(36, 16, 70, 9, 100, 11); ctx.stroke();
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
