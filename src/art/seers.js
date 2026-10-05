import { paintTexture, lin, rad, rgba, glow, poly, ellipse, line, blob, rng, sunburst, starShape } from './paint.js';

// The two other Seers, painted as illustrated icons: hard light, simple planes.
// CANDLEMAS (Providence, the Aureate) is lit from directly above like a saint
// in a window — and he is sweating, red-eyed, unable to look at the lens.
// ALMANAC (Continuance, the Meridian) is side-lit by practical screen light,
// framed by ruled geometry; calm, measuring.

const C_SKIN = { hi: '#f2d7ae', mid: '#c49a6c', sh: '#6a4226', deep: '#2e1a0c' };
const A_SKIN = { hi: '#a87a5a', mid: '#6a4634', sh: '#2c1a12', deep: '#140a06', rim: '#9fd0d8' };

export function registerSeers(scene) {
  // ---------------------------------------------------------- CANDLEMAS
  paintTexture(scene, 'cand_bg', 440, 440, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#3a2a14'], [0.5, '#5a4220'], [1, '#1a1006']]);
    ctx.fillRect(0, 0, w, h);
    // A great round window of sunlight behind him: the source of his light.
    ctx.fillStyle = rad(ctx, w / 2, 150, 200, [[0, '#fff4d8'], [0.3, '#f0d49a'], [0.65, '#b88a46'], [1, 'rgba(90,60,25,0)']]);
    ctx.fillRect(0, 0, w, h);
    sunburst(ctx, w / 2, 150, 120, 230, 48, 0, Math.PI * 2, rgba('#fff0c8', 0.18), 1);
    ctx.strokeStyle = rgba('#fff0c8', 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w / 2, 150, 118, 0, Math.PI * 2); ctx.stroke();
    // Symmetric columns.
    [70, w - 70].forEach((x) => {
      ctx.fillStyle = lin(ctx, x - 24, 0, x + 24, 0, [[0, '#2a1c0a'], [0.5, '#6a5028'], [1, '#2a1c0a']]);
      ctx.fillRect(x - 22, 0, 44, h);
    });
  });

  paintTexture(scene, 'cand_halo', 300, 300, (ctx, w, h) => {
    ctx.strokeStyle = rgba('#ffe7a8', 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 128, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba('#ffe7a8', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 138, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.fillStyle = rgba('#fff4d0', 0.8);
      ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a) * 133, h / 2 + Math.sin(a) * 133, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  });

  // Vestments: ivory, high collar, gold bands — perfectly symmetrical.
  paintTexture(scene, 'cand_body', 440, 260, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#f6ecd6'], [0.4, '#d8c8a6'], [1, '#6a5838']]);
    ctx.beginPath();
    ctx.moveTo(cx - 210, h);
    ctx.quadraticCurveTo(cx - 200, 70, cx - 90, 40);
    ctx.lineTo(cx + 90, 40);
    ctx.quadraticCurveTo(cx + 200, 70, cx + 210, h);
    ctx.closePath();
    ctx.fill();
    // Shadow under the chin and down the centre seam.
    ctx.fillStyle = lin(ctx, 0, 30, 0, 120, [[0, rgba('#3a2a14', 0.75)], [1, rgba('#3a2a14', 0)]]);
    ctx.fillRect(cx - 80, 30, 160, 100);
    // High collar.
    poly(ctx, [[cx - 62, 50], [cx - 52, 0], [cx + 52, 0], [cx + 62, 50], [cx, 70]], lin(ctx, 0, 0, 0, 70, [[0, '#fff6e2'], [1, '#bfa978']]));
    ctx.strokeStyle = rgba('#b8924a', 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 62, 50); ctx.lineTo(cx, 70); ctx.lineTo(cx + 62, 50); ctx.stroke();
    // Gold stole bands.
    [-1, 1].forEach((s) => {
      ctx.fillStyle = lin(ctx, 0, 60, 0, h, [[0, '#e8c47a'], [1, '#6a4a1a']]);
      poly(ctx, [[cx + s * 30, 66], [cx + s * 54, 60], [cx + s * 70, h], [cx + s * 38, h]], ctx.fillStyle);
      for (let y = 90; y < h; y += 26) {
        ctx.fillStyle = rgba('#fff0c0', 0.6);
        starShape(ctx, cx + s * (44 + (y - 90) * 0.06), y, 4, 0.3);
        ctx.fill();
      }
    });
  });

  // His face: lit from directly above. Deep sockets, a gaunt, white-bearded saint.
  paintTexture(scene, 'cand_head', 220, 280, (ctx, w, h) => {
    const cx = w / 2;
    const S = C_SKIN;
    // Neck.
    poly(ctx, [[cx - 30, 200], [cx + 30, 200], [cx + 34, h], [cx - 34, h]], S.sh);
    // Ears in shadow.
    ellipse(ctx, cx - 64, 128, 10, 20, S.sh);
    ellipse(ctx, cx + 64, 128, 10, 20, S.sh);
    // Face.
    ctx.fillStyle = lin(ctx, 0, 30, 0, 230, [[0, S.hi], [0.35, S.mid], [1, S.sh]]);
    blob(ctx, [[cx, 22], [cx + 52, 40], [cx + 64, 110], [cx + 54, 176], [cx + 26, 222], [cx, 230], [cx - 26, 222], [cx - 54, 176], [cx - 64, 110], [cx - 52, 40]]);
    ctx.fill();
    // Silver hair, receding, close to the skull.
    ctx.fillStyle = lin(ctx, 0, 10, 0, 90, [[0, '#f4efe6'], [1, '#9a9488']]);
    ctx.beginPath();
    ctx.moveTo(cx - 64, 100);
    ctx.quadraticCurveTo(cx - 70, 30, cx - 20, 18);
    ctx.quadraticCurveTo(cx, 30, cx + 20, 18);
    ctx.quadraticCurveTo(cx + 70, 30, cx + 64, 100);
    ctx.quadraticCurveTo(cx + 56, 60, cx + 30, 48);
    ctx.quadraticCurveTo(cx, 58, cx - 30, 48);
    ctx.quadraticCurveTo(cx - 56, 60, cx - 64, 100);
    ctx.fill();
    // Brow ridge highlight, then sockets in hard shadow.
    ctx.fillStyle = rgba(S.hi, 0.8);
    blob(ctx, [[cx - 50, 86], [cx, 78], [cx + 50, 86], [cx, 92]]);
    ctx.fill();
    [-1, 1].forEach((s) => {
      ctx.fillStyle = S.deep;
      blob(ctx, [[cx + s * 10, 96], [cx + s * 30, 92], [cx + s * 50, 100], [cx + s * 48, 118], [cx + s * 28, 124], [cx + s * 12, 116]]);
      ctx.fill();
      // Exhaustion beneath the eyes.
      ctx.fillStyle = rgba('#5a2a2a', 0.55);
      blob(ctx, [[cx + s * 14, 122], [cx + s * 30, 128], [cx + s * 46, 122], [cx + s * 30, 136]]);
      ctx.fill();
      // Bloodshot whites.
      ctx.fillStyle = '#e6c0b4';
      ctx.beginPath();
      ctx.ellipse(cx + s * 30, 110, 13, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba('#b02a2a', 0.55);
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + s * (18 + i), 110 + (i - 1.5) * 1.6);
        ctx.lineTo(cx + s * (24 + i * 1.5), 110 + (i - 1.5) * 0.6);
        ctx.stroke();
      }
      // Heavy upper lid.
      line(ctx, cx + s * 16, 106, cx + s * 44, 106, '#2a1406', 2.4);
      // Cheek hollow.
      ctx.fillStyle = rgba(S.sh, 0.65);
      blob(ctx, [[cx + s * 38, 140], [cx + s * 56, 136], [cx + s * 54, 176], [cx + s * 36, 170]]);
      ctx.fill();
    });
    // Nose: a highlight ridge and a hard shadow beneath.
    line(ctx, cx, 92, cx, 148, rgba(S.hi, 0.9), 3);
    poly(ctx, [[cx - 14, 152], [cx + 14, 152], [cx, 162]], S.deep);
    // White beard, close and symmetric.
    ctx.fillStyle = lin(ctx, 0, 150, 0, 236, [[0, '#d8d2c6'], [1, '#8a8478']]);
    ctx.beginPath();
    ctx.moveTo(cx - 54, 160);
    ctx.quadraticCurveTo(cx - 52, 222, cx, 240);
    ctx.quadraticCurveTo(cx + 52, 222, cx + 54, 160);
    ctx.quadraticCurveTo(cx + 30, 170, cx + 22, 168);
    ctx.quadraticCurveTo(cx, 162, cx - 22, 168);
    ctx.quadraticCurveTo(cx - 30, 170, cx - 54, 160);
    ctx.fill();
    // Mouth: parted for shallow breath.
    ctx.fillStyle = '#2a1006';
    ctx.beginPath(); ctx.ellipse(cx, 186, 15, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    line(ctx, cx - 12, 192, cx + 12, 192, rgba('#f0d0b0', 0.35), 1.5);
    // Sweat sheen.
    [[cx - 34, 62], [cx + 30, 58], [cx + 50, 100], [cx - 52, 96]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 3, 1.6, rgba('#ffffff', 0.55));
    });
  });

  paintTexture(scene, 'cand_iris', 16, 16, (ctx) => {
    ellipse(ctx, 8, 8, 5.2, 5.2, '#5a3a14');
    ellipse(ctx, 8, 8, 2.4, 2.4, '#0a0502');
    ellipse(ctx, 6.5, 6.5, 1.1, 1.1, '#fff4e0');
  });

  paintTexture(scene, 'cand_lid', 32, 14, (ctx) => {
    ellipse(ctx, 16, 7, 15, 7, C_SKIN.mid);
    line(ctx, 2, 12, 30, 12, '#2a1406', 2);
  });

  paintTexture(scene, 'sweat', 8, 14, (ctx) => {
    ctx.fillStyle = rgba('#ffffff', 0.85);
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(8, 9, 4, 13);
    ctx.quadraticCurveTo(0, 9, 4, 0);
    ctx.fill();
  });

  // Clasped hands, fingers interlaced — the fingertips will tremble.
  paintTexture(scene, 'cand_hands', 200, 110, (ctx, w, h) => {
    const S = C_SKIN;
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, S.hi], [1, S.sh]]);
    blob(ctx, [[20, 70], [60, 30], [100, 26], [140, 30], [180, 70], [150, 100], [100, 92], [50, 100]]);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      line(ctx, 64 + i * 22, 34, 70 + i * 20, 72, rgba(S.deep, 0.6), 1.6);
    }
    // A gold signet.
    ctx.fillStyle = '#f0cf8a';
    ctx.fillRect(118, 44, 10, 6);
    ctx.fillStyle = rgba('#ffffff', 0.4);
    ctx.fillRect(98, 30, 30, 2);
  });

  // The pistol: ivory and gold. Beautiful, which is the worst of it.
  paintTexture(scene, 'cand_gun', 200, 150, (ctx, w, h) => {
    const S = C_SKIN;
    // Hand around the grip.
    ctx.fillStyle = lin(ctx, 0, 40, 0, 150, [[0, S.mid], [1, S.sh]]);
    blob(ctx, [[60, 60], [104, 54], [120, 90], [110, 140], [70, 148], [52, 110]]);
    ctx.fill();
    // Slide and barrel, pointed up and inward.
    ctx.fillStyle = lin(ctx, 0, 0, 0, 60, [[0, '#fbf3e2'], [0.5, '#d8ccb0'], [1, '#8a7a58']]);
    poly(ctx, [[70, 62], [178, 20], [186, 34], [82, 78]], ctx.fillStyle);
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(76, 70); ctx.lineTo(182, 27); ctx.stroke();
    ctx.fillStyle = '#d9b46a';
    poly(ctx, [[84, 76], [100, 70], [112, 110], [94, 116]], '#d9b46a');
    line(ctx, 64, 70, 104, 64, rgba(S.deep, 0.7), 2);
  });

  // ---------------------------------------------------------- ALMANAC
  paintTexture(scene, 'alm_bg', 360, 460, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#2a3a44'], [0.6, '#1a242c'], [1, '#0e1418']]);
    ctx.fillRect(0, 0, w, h);
    // Ruled grid: a ledger, a calendar, an instrument.
    for (let x = 0; x < w; x += 30) line(ctx, x, 0, x, h, rgba('#8fb7bf', x % 90 === 0 ? 0.14 : 0.06), 1);
    for (let y = 0; y < h; y += 30) line(ctx, 0, y, w, y, rgba('#8fb7bf', y % 90 === 0 ? 0.14 : 0.06), 1);
    // The screen she is reading, out of frame left, casts a cool slab of light.
    ctx.fillStyle = lin(ctx, 0, 0, w * 0.5, 0, [[0, rgba('#bfe6ee', 0.22)], [1, rgba('#bfe6ee', 0)]]);
    ctx.fillRect(0, 0, w, h);
    // A shelf of identical bound volumes, top right.
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#3a4a54' : '#2a363e';
      ctx.fillRect(220 + i * 14, 40, 11, 70);
      ctx.fillStyle = rgba('#e6eaec', 0.25);
      ctx.fillRect(220 + i * 14, 54, 11, 1);
    }
    line(ctx, 210, 112, w, 112, rgba('#e6eaec', 0.2), 2);
  });

  paintTexture(scene, 'alm_body', 360, 240, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#8a9aa4'], [0.35, '#5d6a73'], [1, '#1a2228']]);
    ctx.beginPath();
    ctx.moveTo(cx - 170, h);
    ctx.lineTo(cx - 150, 70);
    ctx.lineTo(cx - 60, 20);
    ctx.lineTo(cx + 60, 20);
    ctx.lineTo(cx + 150, 70);
    ctx.lineTo(cx + 170, h);
    ctx.closePath();
    ctx.fill();
    // Clean geometric folds: straight lines only.
    [[-90, 60, -110, h], [-40, 30, -50, h], [50, 30, 60, h], [100, 60, 120, h]].forEach(([x0, y0, x1, y1]) => line(ctx, cx + x0, y0, cx + x1, y1, rgba('#0e1418', 0.5), 2));
    // A single cyan clasp: a plumb line.
    line(ctx, cx, 30, cx, 130, rgba('#9fd0d8', 0.8), 1.5);
    ctx.fillStyle = '#9fd0d8';
    poly(ctx, [[cx - 5, 130], [cx + 5, 130], [cx, 142]], '#9fd0d8');
  });

  paintTexture(scene, 'alm_head', 240, 300, (ctx, w, h) => {
    const cx = w / 2;
    const S = A_SKIN;
    // Hood back.
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#7a8a94'], [0.4, '#4a5660'], [1, '#141c22']]);
    ctx.beginPath();
    ctx.moveTo(cx - 100, h);
    ctx.lineTo(cx - 96, 70);
    ctx.lineTo(cx - 40, 12);
    ctx.lineTo(cx + 40, 12);
    ctx.lineTo(cx + 96, 70);
    ctx.lineTo(cx + 100, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0a0f12';
    ctx.beginPath();
    ctx.moveTo(cx - 72, h);
    ctx.lineTo(cx - 70, 80);
    ctx.lineTo(cx - 30, 36);
    ctx.lineTo(cx + 30, 36);
    ctx.lineTo(cx + 70, 80);
    ctx.lineTo(cx + 72, h);
    ctx.closePath();
    ctx.fill();
    // Neck.
    poly(ctx, [[cx - 26, 210], [cx + 26, 210], [cx + 30, h], [cx - 30, h]], S.sh);
    // Face: side-lit from her left (screen left) by cool light.
    ctx.fillStyle = lin(ctx, cx - 56, 0, cx + 56, 0, [[0, S.hi], [0.45, S.mid], [1, S.sh]]);
    blob(ctx, [[cx, 54], [cx + 46, 70], [cx + 56, 130], [cx + 46, 188], [cx + 18, 228], [cx, 232], [cx - 18, 228], [cx - 46, 188], [cx - 56, 130], [cx - 46, 70]]);
    ctx.fill();
    // Cyan rim on the lit edge.
    ctx.strokeStyle = rgba(S.rim, 0.7);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - 48, 74); ctx.quadraticCurveTo(cx - 60, 130, cx - 46, 188); ctx.stroke();
    // Cropped grey hair.
    ctx.fillStyle = lin(ctx, 0, 50, 0, 90, [[0, '#c8ccd0'], [1, '#6a7076']]);
    ctx.beginPath();
    ctx.moveTo(cx - 50, 92);
    ctx.quadraticCurveTo(cx - 50, 50, cx, 48);
    ctx.quadraticCurveTo(cx + 50, 50, cx + 50, 92);
    ctx.quadraticCurveTo(cx, 70, cx - 50, 92);
    ctx.fill();
    // Eyes: level, steady.
    [-1, 1].forEach((s) => {
      ctx.fillStyle = rgba(S.deep, s < 0 ? 0.5 : 0.75);
      blob(ctx, [[cx + s * 10, 118], [cx + s * 26, 112], [cx + s * 42, 118], [cx + s * 26, 128]]);
      ctx.fill();
      ctx.fillStyle = '#d8d4cc';
      ctx.beginPath(); ctx.ellipse(cx + s * 26, 121, 11, 4.2, 0, 0, Math.PI * 2); ctx.fill();
      line(ctx, cx + s * 14, 117, cx + s * 38, 117, '#140a06', 2);
    });
    // Nose and mouth, drawn with the economy she would approve of.
    ctx.fillStyle = rgba(S.deep, 0.6);
    poly(ctx, [[cx + 2, 124], [cx + 12, 160], [cx - 6, 162]], ctx.fillStyle);
    line(ctx, cx - 6, 162, cx + 10, 162, rgba(S.hi, 0.6), 1.2);
    line(ctx, cx - 16, 188, cx + 16, 188, '#1a0c06', 2.2);
    line(ctx, cx - 10, 193, cx + 10, 193, rgba(S.hi, 0.4), 1.2);
    // A thin meridian line tattooed from brow to chin — the mark of her house.
    line(ctx, cx, 64, cx, 100, rgba('#9fd0d8', 0.55), 1);
  });

  paintTexture(scene, 'alm_iris', 14, 14, (ctx) => {
    ellipse(ctx, 7, 7, 4.4, 4.4, '#2a1a10');
    ellipse(ctx, 7, 7, 2, 2, '#050302');
    ellipse(ctx, 5.6, 5.6, 0.9, 0.9, '#dff4f8');
  });

  paintTexture(scene, 'alm_lid', 30, 12, (ctx) => {
    ellipse(ctx, 15, 6, 14, 6, A_SKIN.mid);
    line(ctx, 2, 10, 28, 10, '#140a06', 2);
  });

  // ---------------------------------------------------------- the interface
  // Thin ruled frames; the language of each house, not "UI".
  paintTexture(scene, 'frame_aureate', 500, 500, (ctx, w, h) => {
    const cx = w / 2; const R = 212;
    ctx.strokeStyle = rgba('#e2c27e', 0.85);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cx, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba('#e2c27e', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cx, R + 12, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r0 = R + 12;
      const r1 = R + (i % 6 === 0 ? 26 : 18);
      line(ctx, cx + Math.cos(a) * r0, cx + Math.sin(a) * r0, cx + Math.cos(a) * r1, cx + Math.sin(a) * r1, rgba('#e2c27e', i % 6 === 0 ? 0.7 : 0.3), 1);
    }
  });

  paintTexture(scene, 'frame_meridian', 380, 480, (ctx, w, h) => {
    const x = 25; const y = 30; const ww = 330; const hh = 420;
    ctx.strokeStyle = rgba('#a9cbd2', 0.8);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 0.5, y + 0.5, ww, hh);
    // Ruler ticks along the top and left.
    for (let i = 0; i <= 33; i++) line(ctx, x + i * 10, y - (i % 5 === 0 ? 12 : 6), x + i * 10, y - 2, rgba('#a9cbd2', 0.5), 1);
    for (let i = 0; i <= 42; i++) line(ctx, x - (i % 5 === 0 ? 12 : 6), y + i * 10, x - 2, y + i * 10, rgba('#a9cbd2', 0.5), 1);
    // A plumb line at centre top.
    line(ctx, x + ww / 2, 0, x + ww / 2, y, rgba('#a9cbd2', 0.6), 1);
  });

  paintTexture(scene, 'frame_umbral', 420, 420, (ctx, w, h) => {
    const cx = w / 2; const R = 152;
    // Eclipse: a ring of light around a disc pushed off-centre. Asymmetric.
    ctx.strokeStyle = rgba('#a77bff', 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cx, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba('#d8c8ff', 0.95);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cx, R + 6, Math.PI * 0.62, Math.PI * 1.25); ctx.stroke();
    glow(ctx, cx - R * 0.8, cx + R * 0.25, 70, '#a77bff', 0.18);
    ctx.strokeStyle = rgba('#a4307a', 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx + 14, cx - 8, R + 18, Math.PI * 1.4, Math.PI * 1.9); ctx.stroke();
  });

  paintTexture(scene, 'eclipse_ring', 360, 360, (ctx, w, h) => {
    const cx = w / 2;
    ctx.strokeStyle = rgba('#cbb8ee', 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cx, 110, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#05030a';
    ctx.beginPath(); ctx.arc(cx + 8, cx - 4, 106, 0, Math.PI * 2); ctx.fill();
    glow(ctx, cx - 100, cx + 30, 40, '#a77bff', 0.3);
  });

  // Static: the connection failing.
  paintTexture(scene, 'static', 256, 256, (ctx, w, h) => {
    const r = rng(99);
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r() * 255;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });

  paintTexture(scene, 'scanlines', 4, 4, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 4, 1);
  });
}
