import { paintTexture, lin, rad, rgba, glow, poly, ellipse, line, rng, starShape, blob } from './paint.js';
import { paintFigure } from './vision.js';

// The private chamber: immaculate where the bedroom is not. Nobody else comes
// here. Years of decadence outside; years of preparation in here.

export const CHAMBER_W = 2400;

function rule(ctx, x0, y0, x1, y1, a = 0.25) {
  line(ctx, x0, y0, x1, y1, rgba('#a9a4b6', a), 1);
}

export function registerChamber(scene) {
  // Back wall: black lacquer panels, a single cold light from above.
  paintTexture(scene, 'ch_wall', CHAMBER_W, 900, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#020203'], [0.5, '#0a090e'], [0.78, '#0d0b12'], [0.8, '#050407'], [1, '#020203']]);
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 160) {
      rule(ctx, x, 60, x, 700, 0.06);
    }
    rule(ctx, 0, 60, w, 60, 0.12);
    rule(ctx, 0, 700, w, 700, 0.18);
    // Overhead light pools on the wall.
    [380, 900, 1700].forEach((x) => {
      ctx.fillStyle = rad(ctx, x, 40, 520, [[0, 'rgba(200,190,230,0.10)'], [1, 'rgba(200,190,230,0)']]);
      ctx.fillRect(x - 520, 0, 1040, 700);
    });

    // Weapons, hung precisely: blades, a spear, a long rifle, a strange glaive.
    const rack = (x) => {
      rule(ctx, x - 120, 200, x + 120, 200, 0.2);
      [[-90, 380, 6], [-50, 420, 4], [-10, 460, 3], [30, 340, 8], [70, 400, 5]].forEach(([dx, len, wd], i) => {
        ctx.save();
        ctx.translate(x + dx, 220);
        ctx.fillStyle = lin(ctx, -wd, 0, wd, 0, [[0, '#1a1822'], [0.5, '#5a566a'], [1, '#121018']]);
        if (i === 3) {
          poly(ctx, [[-wd, 0], [wd, 0], [wd, len - 60], [0, len], [-wd, len - 60]], ctx.fillStyle);
          ctx.fillStyle = '#2a1640';
          ctx.fillRect(-wd - 6, 90, wd * 2 + 12, 6);
        } else {
          poly(ctx, [[-wd / 2, 0], [wd / 2, 0], [wd / 2, len - 30], [0, len], [-wd / 2, len - 30]], ctx.fillStyle);
          ctx.fillStyle = '#0a0a0e';
          ctx.fillRect(-wd, 70, wd * 2, 4);
        }
        ctx.restore();
      });
    };
    rack(330);

    // Flush file drawers with tiny labels.
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const x = 560 + c * 70; const y = 420 + r * 64;
        ctx.fillStyle = '#0c0b10';
        ctx.fillRect(x, y, 64, 58);
        rule(ctx, x, y, x + 64, y, 0.18);
        ctx.fillStyle = rgba('#a9a4b6', 0.35);
        ctx.fillRect(x + 22, y + 26, 20, 3);
      }
    }

    // Maps under glass, pinned with thin threads between places.
    ctx.fillStyle = '#0e0c12';
    ctx.fillRect(560, 120, 340, 250);
    rule(ctx, 560, 120, 900, 120, 0.3);
    ctx.save();
    ctx.beginPath(); ctx.rect(566, 126, 328, 238); ctx.clip();
    ctx.fillStyle = '#16141c';
    ctx.fillRect(566, 126, 328, 238);
    const r = rng(9);
    ctx.strokeStyle = rgba('#a9a4b6', 0.22);
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      let x = 566; let y = 140 + i * 26;
      ctx.moveTo(x, y);
      while (x < 900) { x += 20; y += (r() - 0.5) * 12; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    // A large empty region at lower right — the Sere — circled once.
    ctx.fillStyle = rgba('#c8b48e', 0.12);
    blob(ctx, [[760, 280], [860, 270], [890, 340], [800, 360], [740, 330]]);
    ctx.fill();
    ctx.strokeStyle = rgba('#a77bff', 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(815, 318, 70, 38, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // The classification wall frame (content is drawn live).
    ctx.fillStyle = '#030305';
    ctx.fillRect(1180, 70, 1120, 610);
    ctx.strokeStyle = rgba('#a9a4b6', 0.3);
    ctx.strokeRect(1180.5, 70.5, 1120, 610);
  });

  // Sealed equipment cases, stacked.
  paintTexture(scene, 'ch_cases', 300, 260, (ctx, w, h) => {
    [[0, 160, 300, 100], [20, 70, 260, 90], [60, 0, 180, 70]].forEach(([x, y, cw, ch], i) => {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + ch, [[0, '#1a1820'], [1, '#08070a']]);
      ctx.fillRect(x, y, cw, ch);
      rule(ctx, x, y, x + cw, y, 0.4);
      ctx.fillStyle = rgba('#a9a4b6', 0.5);
      ctx.fillRect(x + 12, y + ch / 2 - 1, 16, 2);
      ctx.fillRect(x + cw - 28, y + ch / 2 - 1, 16, 2);
      // Eclipse seal.
      ctx.strokeStyle = rgba('#a77bff', 0.5);
      ctx.beginPath(); ctx.arc(x + cw / 2, y + ch / 2, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#08070a';
      ctx.beginPath(); ctx.arc(x + cw / 2 + 2.5, y + ch / 2 - 1, 8, 0, Math.PI * 2); ctx.fill();
      void i;
    });
  });

  // Polished floor.
  paintTexture(scene, 'ch_floor', 16, 220, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#0e0d12'], [0.1, '#151320'], [0.5, '#07060a'], [1, '#020203']]);
    ctx.fillRect(0, 0, w, h);
  });

  // Ceiling light fixture: a thin bar.
  paintTexture(scene, 'ch_lightbar', 300, 12, (ctx, w, h) => {
    ctx.fillStyle = '#e6e2f2';
    ctx.fillRect(0, 4, w, 3);
    ctx.fillStyle = rgba('#e6e2f2', 0.3);
    ctx.fillRect(0, 2, w, 7);
  });

  // Tiles for the classification wall.
  paintTexture(scene, 'tile', 64, 80, (ctx, w, h) => {
    ctx.fillStyle = '#0c0b10';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba('#a9a4b6', 0.25);
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ellipse(ctx, w / 2, 30, 11, 13, '#16141c');
    poly(ctx, [[w / 2 - 20, 70], [w / 2 + 20, 70], [w / 2 + 14, 48], [w / 2 - 14, 48]], '#16141c');
  });

  // Star's own tile, top tier: gold, an emblem, a single word.
  paintTexture(scene, 'tile_star', 120, 150, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#2a200e'], [1, '#100c06']]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba('#e2c27e', 0.7);
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctx.fillStyle = rgba('#f0d498', 0.95);
    ctx.beginPath(); ctx.arc(w / 2, 58, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a200e';
    starShape(ctx, w / 2, 58, 22, 0.2);
    ctx.fill();
  });

  // Parallax's own tile: the same emblem, inverted.
  paintTexture(scene, 'tile_parallax', 120, 150, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#140c20'], [1, '#07040c']]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba('#a77bff', 0.7);
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctx.fillStyle = '#05030a';
    ctx.beginPath(); ctx.arc(w / 2, 58, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba('#cbb8ee', 0.8);
    ctx.beginPath(); ctx.arc(w / 2, 58, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = rgba('#cbb8ee', 0.9);
    starShape(ctx, w / 2, 58, 22, 0.2);
    ctx.fill();
  });

  // Portrait silhouettes of the five — the same stances as in the vision.
  ['dowser', 'paperweight', 'humdrum', 'lukewarm', 'wallflower'].forEach((kind) => {
    paintTexture(scene, `hero_${kind}`, 240, 260, (ctx, w, h) => {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#14121c'], [1, '#0a090e']]);
      ctx.fillRect(0, 0, w, h);
      // A faint registry grid behind them.
      for (let x = 0; x < w; x += 20) rule(ctx, x, 0, x, h, 0.05);
      for (let y = 0; y < h; y += 20) rule(ctx, 0, y, w, y, 0.05);
      glow(ctx, w / 2, 90, 130, '#cfc6e6', 0.12);
      const faint = kind === 'wallflower';
      paintFigure(ctx, kind, w / 2, h + 40, 260, faint ? '#16141e' : '#040306');
      // Rim light on one side.
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = lin(ctx, w / 2 - 60, 0, w / 2 + 70, 0, [[0, 'rgba(0,0,0,0)'], [0.85, 'rgba(0,0,0,0)'], [1, rgba('#cfc6e6', faint ? 0.05 : 0.25)]]);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = rgba('#a9a4b6', 0.3);
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    });
  });

  // Footage frame pieces: a child's party, painted flat.
  paintTexture(scene, 'party_bg', 240, 260, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#4a4060'], [1, '#2a2436']]);
    ctx.fillRect(0, 0, w, h);
    // Bunting.
    for (let i = 0; i < 9; i++) {
      poly(ctx, [[i * 30, 20], [i * 30 + 26, 20], [i * 30 + 13, 40]], ['#c88a8a', '#c8c08a', '#8ab8c8'][i % 3]);
    }
    line(ctx, 0, 20, w, 20, rgba('#ffffff', 0.4), 1);
    // A table with a cake.
    ctx.fillStyle = '#6a5a72';
    ctx.fillRect(20, 190, 200, 10);
    ctx.fillStyle = '#e8d8e0';
    ctx.fillRect(90, 160, 60, 30);
    ctx.fillStyle = '#c88a9a';
    ctx.fillRect(90, 160, 60, 6);
  });

  paintTexture(scene, 'party_kid', 40, 70, (ctx) => {
    ellipse(ctx, 20, 18, 10, 11, '#1a1622');
    blob(ctx, [[8, 30], [32, 30], [34, 66], [6, 66]]);
    ctx.fillStyle = '#1a1622';
    ctx.fill();
    poly(ctx, [[12, 10], [28, 10], [20, -6]], '#c8c08a');
  });

  paintTexture(scene, 'party_slice', 30, 24, (ctx) => {
    poly(ctx, [[2, 20], [28, 20], [28, 6]], '#e8d8e0');
    poly(ctx, [[20, 9], [28, 6], [28, 10]], '#c88a9a');
  });

  paintTexture(scene, 'party_balloon', 24, 60, (ctx) => {
    ctx.fillStyle = '#d88a9a';
    blob(ctx, [[12, 2], [22, 12], [20, 28], [12, 34], [4, 28], [2, 12]]);
    ctx.fill();
    line(ctx, 12, 34, 14, 60, rgba('#ffffff', 0.5), 1);
  });
}
