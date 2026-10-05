import { paintTexture, rng, lin, rad, rgba, glow, poly, ellipse, blob, roundRect } from './paint.js';
import { building, halo } from './city.js';

// The Lantern Bridge, seven years ago. A deco suspension bridge over the
// river Vesper, its deck lined with paper-gold lanterns. The eastern districts
// burn behind it. Everything is painted a little cold: this is footage.

const IRON = '#1a1420';
const IRON_HI = '#3a3040';
const LANTERN = '#f2c070';

function civilian(ctx, r, w, h, { coat, skin = '#6a5048', bag = false, arm = 0 }) {
  const cx = w / 2;
  // Legs mid-stride.
  ctx.fillStyle = '#16121c';
  poly(ctx, [[cx - 7, h * 0.6], [cx - 1, h * 0.6], [cx - 9 + arm * 4, h - 2], [cx - 15 + arm * 4, h - 2]], '#16121c');
  poly(ctx, [[cx + 1, h * 0.6], [cx + 7, h * 0.6], [cx + 13 - arm * 4, h - 2], [cx + 7 - arm * 4, h - 2]], '#1e1924');
  // Coat.
  ctx.fillStyle = lin(ctx, cx - 14, 0, cx + 14, 0, [[0, coat[0]], [0.6, coat[1]], [1, coat[0]]]);
  blob(ctx, [[cx - 10, h * 0.2], [cx + 10, h * 0.2], [cx + 14, h * 0.45], [cx + 12, h * 0.68], [cx - 12, h * 0.68], [cx - 14, h * 0.45]]);
  ctx.fill();
  // Arm.
  poly(ctx, [[cx + 6, h * 0.24], [cx + 12, h * 0.26], [cx + 14 + arm * 6, h * 0.55], [cx + 8 + arm * 6, h * 0.56]], coat[0]);
  if (bag) roundRect(ctx, cx + 8, h * 0.5, 12, 14, 2, '#2a2230');
  // Head.
  ellipse(ctx, cx + 1, h * 0.12, 8, 9.5, skin);
  ctx.fillStyle = rgba('#000', 0.35);
  ctx.beginPath(); ctx.ellipse(cx - 2, h * 0.1, 7, 8, 0, Math.PI * 0.6, Math.PI * 1.6); ctx.fill();
  // Lantern light catching one side.
  ctx.fillStyle = rgba(LANTERN, 0.18 + r() * 0.1);
  ctx.fillRect(cx + 9, h * 0.22, 3, h * 0.42);
}

export function registerBridge(scene) {
  // Sky: night, with the eastern horizon burning orange through smoke.
  paintTexture(scene, 'br_sky', 1600, 900, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#05040a'], [0.45, '#120a18'], [0.75, '#2a1420'], [1, '#3a1a18']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rad(ctx, w * 0.92, h * 0.95, w * 0.7, [[0, 'rgba(230,110,40,0.55)'], [0.4, 'rgba(160,60,40,0.25)'], [1, 'rgba(60,20,30,0)']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 90; i++) {
      const y = r() * h * 0.4;
      ctx.fillStyle = rgba('#e8e2ff', 0.1 + r() * 0.35);
      ctx.fillRect(r() * w * 0.6, y, 1, 1);
    }
    // Smoke columns leaning west.
    for (let i = 0; i < 9; i++) {
      const x = w * (0.55 + r() * 0.45);
      for (let k = 0; k < 14; k++) {
        const t = k / 14;
        ctx.fillStyle = rgba(k < 3 ? '#4a2420' : '#1a1016', 0.12 * (1 - t));
        ctx.beginPath();
        ctx.arc(x - t * 260 - r() * 30, h * 0.8 - t * h * 0.75, 40 + t * 110, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, { scale: 0.5 });

  // Far city: west calm, east on fire. The Aureate Spire stands in the middle.
  paintTexture(scene, 'br_far', 2600, 900, (ctx, w, h) => {
    const r = rng(77);
    const base = 760;
    let x = -20;
    while (x < w) {
      const bw = 20 + r() * 50;
      const top = 380 + r() * 260;
      const style = ['slab', 'spire', 'stepped', 'slab', 'cathedral'][Math.floor(r() * 5)];
      const east = x / w;
      building(ctx, r, x, bw, top, base, style, '#1e1426', east > 0.55 ? '#5a2a26' : '#2e1a34', { density: 0.1 * (1 - east * 0.6), warm: '#e8b878', cool: '#9fc5d0' });
      if (style === 'spire' && r() < 0.4 && east < 0.5) halo(ctx, x + bw / 2, top - bw * 0.6, bw * 0.9, '#d9b46a', 0.3);
      if (east > 0.6 && r() < 0.45) {
        // Fire on the roofline.
        glow(ctx, x + bw / 2, top + 10, 40 + r() * 50, '#ff8a3a', 0.5);
        ctx.fillStyle = rgba('#ffc070', 0.7);
        ctx.fillRect(x + bw * 0.3, top + 2, bw * 0.4, 4);
      }
      x += bw + r() * 12;
    }
    // The Aureate Spire: a needle crowned with three halos.
    const sx = 1180;
    poly(ctx, [[sx - 30, base], [sx - 14, 260], [sx, 90], [sx + 14, 260], [sx + 30, base]], '#1a1222');
    [140, 190, 240].forEach((y, i) => halo(ctx, sx, y, 36 - i * 6, '#e8c47a', 0.55));
    glow(ctx, sx, 90, 60, '#ffe2a0', 0.4);
    // Haze and fire-glow along the waterline.
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(40,20,50,0.4)'], [0.55, 'rgba(90,40,50,0.4)'], [1, 'rgba(200,90,40,0.55)']]);
    ctx.fillRect(0, 600, w, base - 600 + 4);
    ctx.fillStyle = '#0b0710';
    ctx.fillRect(0, base, w, h - base);
  }, { scale: 0.5 });

  // River: dark water with broken reflections of fire and lanterns.
  paintTexture(scene, 'br_water', 1024, 400, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#120c16'], [1, '#040306']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 180; i++) {
      const y = r() * h;
      const warm = r() < 0.5;
      ctx.fillStyle = rgba(warm ? '#f2a060' : '#8a7ab0', (0.05 + r() * 0.12) * (1 - y / h));
      ctx.fillRect(r() * w, y, 10 + r() * 60, 1.5);
    }
  }, { scale: 0.5 });

  // Tower: twin deco pylons joined by arches; a crown lantern on top.
  paintTexture(scene, 'br_tower', 260, 1100, (ctx, w, h) => {
    const cx = w / 2;
    const leg = (x0) => {
      ctx.fillStyle = lin(ctx, x0, 0, x0 + 40, 0, [[0, IRON], [0.6, IRON_HI], [1, IRON]]);
      ctx.beginPath();
      ctx.moveTo(x0 + 6, 80); ctx.lineTo(x0 + 34, 80); ctx.lineTo(x0 + 40, h); ctx.lineTo(x0, h);
      ctx.closePath(); ctx.fill();
      // Stepped ribs.
      for (let y = 140; y < h; y += 90) {
        ctx.fillStyle = rgba('#000', 0.35);
        ctx.fillRect(x0, y, 40, 4);
        ctx.fillStyle = rgba(LANTERN, 0.1);
        ctx.fillRect(x0 + 34, y - 30, 2, 26);
      }
    };
    leg(cx - 96);
    leg(cx + 56);
    // Cross arches.
    [[150, 26], [420, 20], [690, 18]].forEach(([y, t]) => {
      ctx.strokeStyle = IRON;
      ctx.lineWidth = t;
      ctx.beginPath();
      ctx.moveTo(cx - 60, y + 50);
      ctx.quadraticCurveTo(cx, y - 20, cx + 60, y + 50);
      ctx.stroke();
    });
    // Crown: a stepped cap and the lantern.
    poly(ctx, [[cx - 104, 84], [cx - 88, 50], [cx - 40, 40], [cx, 0], [cx + 40, 40], [cx + 88, 50], [cx + 104, 84]], IRON);
    glow(ctx, cx, 36, 50, LANTERN, 0.6);
    ellipse(ctx, cx, 36, 7, 10, '#ffe6b0');
  });

  // Deck tile (repeats): roadbed, tram rails, the lantern railing.
  paintTexture(scene, 'br_deck', 256, 150, (ctx, w, h) => {
    // Railing top bar & balusters (behind the walkway, at y 0..46).
    ctx.fillStyle = IRON_HI;
    ctx.fillRect(0, 0, w, 4);
    for (let x = 8; x < w; x += 16) ctx.fillRect(x, 4, 3, 42);
    ctx.fillRect(0, 44, w, 3);
    // Walkway surface.
    ctx.fillStyle = lin(ctx, 0, 47, 0, 64, [[0, '#2a2230'], [1, '#18121c']]);
    ctx.fillRect(0, 47, w, 17);
    // Deck girder face.
    ctx.fillStyle = lin(ctx, 0, 64, 0, h, [[0, '#120e16'], [1, '#07050a']]);
    ctx.fillRect(0, 64, w, h - 64);
    ctx.fillStyle = rgba('#000', 0.5);
    for (let x = 0; x < w; x += 64) {
      poly(ctx, [[x, 70], [x + 32, h - 10], [x + 36, h - 10], [x + 4, 70]], rgba('#000', 0.35));
      poly(ctx, [[x + 64, 70], [x + 32, h - 10], [x + 28, h - 10], [x + 60, 70]], rgba('#000', 0.35));
    }
    ctx.fillStyle = rgba(LANTERN, 0.18);
    ctx.fillRect(0, 64, w, 2);
  });

  // Lantern post: tall, slender, a paper-gold lamp.
  paintTexture(scene, 'br_lantern', 40, 190, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = IRON_HI;
    ctx.fillRect(cx - 2, 40, 4, h - 40);
    ctx.fillRect(cx - 8, h - 8, 16, 8);
    poly(ctx, [[cx - 12, 14], [cx + 12, 14], [cx + 8, 4], [cx - 8, 4]], IRON);
    ctx.fillStyle = lin(ctx, 0, 14, 0, 44, [[0, '#ffe6b0'], [1, '#e0a050']]);
    roundRect(ctx, cx - 9, 14, 18, 28, 4, ctx.fillStyle);
    ctx.fillStyle = rgba('#7a4a20', 0.5);
    ctx.fillRect(cx - 9, 26, 18, 1.5);
  });
  paintTexture(scene, 'br_lantern_off', 40, 190, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = IRON_HI;
    ctx.fillRect(cx - 2, 40, 4, h - 40);
    ctx.fillRect(cx - 8, h - 8, 16, 8);
    poly(ctx, [[cx - 12, 14], [cx + 12, 14], [cx + 8, 4], [cx - 8, 4]], IRON);
    roundRect(ctx, cx - 9, 14, 18, 28, 4, '#2a2028');
  });

  // Tram 6: an old cream-and-maroon tram, windows lit.
  const tram = (key, crushed) => paintTexture(scene, key, 380, 170, (ctx, w, h) => {
    const top = crushed ? 30 : 16;
    ctx.save();
    if (crushed) { ctx.translate(w / 2, h / 2); ctx.rotate(0.03); ctx.translate(-w / 2, -h / 2); }
    // Body.
    ctx.fillStyle = lin(ctx, 0, top, 0, h - 20, [[0, '#d8c8a8'], [0.45, '#b8a688'], [0.46, '#6a2228'], [1, '#3a1418']]);
    ctx.beginPath();
    ctx.moveTo(14, h - 22);
    ctx.lineTo(10, top + 22);
    ctx.quadraticCurveTo(14, top, 40, top);
    if (crushed) { ctx.lineTo(160, top); ctx.lineTo(196, top + 34); ctx.lineTo(236, top + 4); }
    ctx.lineTo(w - 40, top);
    ctx.quadraticCurveTo(w - 14, top, w - 10, top + 22);
    ctx.lineTo(w - 14, h - 22);
    ctx.closePath();
    ctx.fill();
    // Windows.
    for (let i = 0; i < 7; i++) {
      const x = 30 + i * 46;
      const sag = crushed && i >= 3 && i <= 4 ? 22 : 0;
      ctx.fillStyle = lin(ctx, 0, top + 18, 0, top + 62, [[0, '#ffe2a8'], [1, '#c89058']]);
      ctx.globalAlpha = crushed ? 0.65 : 0.9;
      ctx.fillRect(x, top + 18 + sag, 34, 44 - sag);
      ctx.globalAlpha = 1;
      ctx.fillStyle = rgba('#000', 0.45);
      ctx.beginPath(); ctx.ellipse(x + 17, top + 56, 8, 12, 0, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = '#e8d8b0';
    ctx.font = '600 14px sans-serif';
    ctx.fillText('6', w - 34, top + 82);
    // Bogies.
    [60, w - 60].forEach((x) => {
      ctx.fillStyle = '#100c12';
      ctx.fillRect(x - 36, h - 24, 72, 12);
      ellipse(ctx, x - 20, h - 10, 10, 10, '#08060a');
      ellipse(ctx, x + 20, h - 10, 10, 10, '#08060a');
    });
    // Pantograph.
    ctx.strokeStyle = IRON_HI;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w / 2 - 30, top); ctx.lineTo(w / 2, top - 14); ctx.lineTo(w / 2 + 30, top); ctx.stroke();
    ctx.restore();
  });
  tram('br_tram', false);
  tram('br_tram_crushed', true);

  // The fallen signal gantry: a lattice beam.
  paintTexture(scene, 'br_gantry', 460, 46, (ctx, w, h) => {
    ctx.strokeStyle = '#2e2632';
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.lineWidth = 3;
    for (let x = 6; x < w - 20; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x + 30, h - 4); ctx.stroke();
    }
    ctx.fillStyle = '#c84a3a';
    ellipse(ctx, 40, h / 2, 6, 6, '#c84a3a');
    ellipse(ctx, 80, h / 2, 6, 6, '#3a1a18');
  });

  // Civilians: a handful of variants, tinted cool by the footage.
  const coats = [['#2a2a3a', '#3e3e52'], ['#3a2228', '#56343a'], ['#24302e', '#364a46'], ['#3a3226', '#54483a'], ['#2e2438', '#463a52'], ['#1e1e24', '#34343c']];
  coats.forEach((coat, i) => {
    paintTexture(scene, `br_civ${i}`, 44, 120, (ctx, w, h) => civilian(ctx, rng(i + 3), w, h, { coat, bag: i % 2 === 0, arm: (i % 3) - 1 }));
  });
  // The boy who goes over the rail: small, a yellow raincoat.
  paintTexture(scene, 'br_boy', 36, 80, (ctx, w, h) => civilian(ctx, rng(19), w, h, { coat: ['#a88a2a', '#d8b848'], skin: '#8a6a58' }));

  // Ember/ash flake.
  paintTexture(scene, 'ember', 8, 8, (ctx) => {
    ctx.fillStyle = rad(ctx, 4, 4, 4, [[0, 'rgba(255,220,160,1)'], [1, 'rgba(255,120,40,0)']]);
    ctx.fillRect(0, 0, 8, 8);
  });
}
