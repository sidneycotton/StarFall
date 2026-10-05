import { paintTexture, rng, lin, rad, rgba, glow, poly, ellipse, blob, roundRect, line } from './paint.js';
import { head, shadeHex } from './tram.js';

// The centre span after the tram stops: the same passengers on their feet,
// two figures seen from far too close, and the driver's own arms.
// Standing figures face left in profile, like the seated ones.

// --- people on their feet --------------------------------------------------------
// 300×700 is 1.75 m of adult. `phase` swings the legs for a two-frame walk.
function standing(ctx, w, h, o) {
  const { coat, coat2 = shadeHex(coat, 0.18), legs = '#1e1a22', shoes = '#120e12', skin, hair, hairStyle = 'short', s = 1, phase = 0, lean = 0, arms = 'swing', long = 0 } = o;
  ctx.save();
  ctx.translate(w * 0.5, h - 4);
  ctx.scale(s, s);
  const hipY = -360;
  const st = phase === 0 ? 0 : (phase > 0 ? 1 : -1);
  ctx.fillStyle = rgba('#000', 0.35);
  ctx.beginPath(); ctx.ellipse(0, 0, 70, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Legs: back leg darker.
  const leg = (dx, col) => {
    const fx = dx * 70;
    ctx.fillStyle = lin(ctx, 0, hipY, 0, 0, [[0, shadeHex(col, 0.1)], [1, col]]);
    blob(ctx, [[-30, hipY], [26, hipY], [fx + 20, -40], [fx + 16, -10], [fx - 16, -10], [fx - 22, -40]]);
    ctx.fill();
    ctx.fillStyle = shoes;
    blob(ctx, [[fx - 38, 0], [fx - 36, -16], [fx + 18, -22], [fx + 20, 0]]);
    ctx.fill();
  };
  leg(st * 0.8, shadeHex(legs, -0.3));
  leg(-st * 0.8, legs);
  ctx.save();
  ctx.translate(0, hipY + 20);
  ctx.rotate(lean);
  // Coat, with a hem that can run long.
  ctx.fillStyle = lin(ctx, -70, 0, 70, 0, [[0, coat2], [0.45, coat], [1, shadeHex(coat, -0.35)]]);
  blob(ctx, [[-56, 40 + long], [-58, -110], [-44, -206], [40, -210], [58, -120], [60, 44 + long], [0, 52 + long]]);
  ctx.fill();
  ctx.strokeStyle = rgba('#000', 0.3);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-34, -200); ctx.quadraticCurveTo(-30, -100, -40, 40 + long); ctx.stroke();
  ctx.fillStyle = rgba('#e8d0b0', 0.1);
  blob(ctx, [[-48, -170], [-36, -206], [36, -208], [46, -180], [0, -186]]);
  ctx.fill();
  o.torso?.(ctx);
  // Arm.
  ctx.fillStyle = lin(ctx, 0, -200, 0, 0, [[0, coat2], [1, coat]]);
  if (arms === 'swing') {
    const ax = -st * 38;
    blob(ctx, [[-22, -200], [18, -200], [ax + 14, -70], [ax - 14, -64]]);
    ctx.fill();
    ellipse(ctx, ax, -58, 13, 15, skin);
  } else if (arms === 'reach') {
    blob(ctx, [[-22, -200], [18, -196], [-110, -150], [-120, -170]]);
    ctx.fill();
    ellipse(ctx, -126, -164, 14, 12, skin);
  } else if (arms === 'hug') {
    blob(ctx, [[-22, -200], [18, -200], [-30, -110], [-72, -120], [-40, -170]]);
    ctx.fill();
    ellipse(ctx, -70, -118, 13, 12, skin);
  }
  ctx.restore();
  const hx = Math.sin(lean) * 240 - 6;
  const hy = hipY + 20 - Math.cos(lean) * 240 - 34;
  head(ctx, hx, hy, 42, { skin, hair, style: hairStyle, face: -1 });
  o.front?.(ctx, hx, hy);
  ctx.restore();
}

function registerPeople(scene) {
  const W = 300, H = 700;
  const two = (key, o) => {
    paintTexture(scene, `${key}_a`, W, H, (ctx, w, h) => standing(ctx, w, h, { ...o, phase: 1 }));
    paintTexture(scene, `${key}_b`, W, H, (ctx, w, h) => standing(ctx, w, h, { ...o, phase: -1 }));
  };
  // Mara: scrubs under the long coat, the lanyard, the bun coming down after a double shift.
  two('sp_mara', {
    coat: '#3a3638', skin: '#c08a6a', hair: '#2a1a16', hairStyle: 'bun', legs: '#3e6a68', long: 60,
    torso: (c) => {
      poly(c, [[-30, -206], [-6, -206], [-2, -40], [-34, -40]], '#4e8480');
      blob(c, [[-30, -206], [-18, -160], [-6, -206]]);
      c.fillStyle = '#3a6a66'; c.fill();
      line(c, -26, -204, -20, -128, '#c8c0a0', 2);
      line(c, -10, -204, -20, -128, '#c8c0a0', 2);
      roundRect(c, -28, -130, 16, 20, 2, '#e8e4dc');
    },
    front: (c, hx, hy) => {
      ellipse(c, hx + 34, hy - 26, 22, 19, '#2a1a16');
      c.fillStyle = '#2a1a16';
      blob(c, [[hx + 24, hy - 14], [hx + 40, hy - 12], [hx + 34, hy + 46], [hx + 22, hy + 40]]);
      c.fill();
      line(c, hx - 18, hy - 30, hx - 26, hy + 14, '#2a1a16', 3);
    },
  });
  two('sp_nell', { coat: '#6a2a34', skin: '#d6a48a', hair: '#6a3a22', hairStyle: 'long', legs: '#22202a', long: 40 });
  two('sp_sami', { coat: '#2a3446', skin: '#8a5a44', hair: '#141012', legs: '#2a2a30' });
  two('sp_sleeper', {
    coat: '#3a3a30', skin: '#a07058', hair: '#4a4a3e', hairStyle: 'hood', legs: '#2a2a26', lean: 0.06,
    torso: (c) => { c.fillStyle = rgba('#e0a020', 0.85); c.fillRect(-56, -130, 114, 10); },
  });
  const teo = { coat: '#d8b030', coat2: '#f2d050', legs: '#3a3a52', shoes: '#a82a2a', skin: '#c89474', hair: '#3a2418', s: 0.66, long: -20 };
  two('sp_teo', teo);
  paintTexture(scene, 'sp_teo_reach', W, H, (ctx, w, h) => standing(ctx, w, h, { ...teo, arms: 'reach', lean: -0.12, phase: 1 }));
  // Teo hanging by one arm: the arm straight up, legs loose.
  paintTexture(scene, 'sp_teo_hang', 200, 420, (ctx, w, h) => {
    ctx.save();
    ctx.translate(w / 2, 0);
    ctx.fillStyle = '#e8c040';
    blob(ctx, [[-10, 0], [12, 0], [16, 120], [-8, 124]]);
    ctx.fill();
    ellipse(ctx, 0, 8, 12, 13, '#c89474');
    ctx.fillStyle = lin(ctx, -50, 0, 50, 0, [[0, '#f2d050'], [0.5, '#d8b030'], [1, '#8a6a18']]);
    blob(ctx, [[-44, 140], [-20, 116], [30, 118], [46, 150], [40, 280], [-40, 284]]);
    ctx.fill();
    head(ctx, -22, 132, 30, { skin: '#c89474', hair: '#3a2418', face: 1, tilt: 0.5 });
    ctx.fillStyle = '#3a3a52';
    blob(ctx, [[-34, 276], [36, 276], [30, 380], [12, 390], [6, 300], [-6, 300], [-14, 394], [-34, 388]]);
    ctx.fill();
    ellipse(ctx, -24, 396, 16, 10, '#a82a2a');
    ellipse(ctx, 22, 392, 16, 10, '#a82a2a', 0.4);
    [190, 220, 250].forEach((y) => roundRect(ctx, -10, y, 12, 5, 2, '#5a4220'));
    ctx.restore();
  });
  // Aurelio, sitting on a bollard with the lilies, his cane across his knees.
  paintTexture(scene, 'sp_aurelio_sit', 320, 520, (ctx, w, h) => {
    ctx.save();
    ctx.translate(w * 0.58, h);
    roundRect(ctx, -40, -150, 90, 150, 10, '#2a2230');
    ctx.fillStyle = rgba('#5a4a5a', 0.4);
    ctx.fillRect(-40, -150, 90, 8);
    ctx.fillStyle = '#2e2c2a';
    blob(ctx, [[30, -190], [-90, -176], [-96, -146], [-104, -30], [-80, -30], [-70, -140], [20, -140]]);
    ctx.fill();
    ellipse(ctx, -100, -18, 24, 12, '#3a2418');
    ctx.fillStyle = lin(ctx, -70, 0, 70, 0, [[0, '#6a665e'], [0.45, '#5a5650'], [1, '#3a3834']]);
    blob(ctx, [[-62, -150], [-60, -280], [-40, -350], [40, -354], [62, -280], [64, -140], [0, -130]]);
    ctx.fill();
    line(ctx, -150, -150, 40, -170, '#3a2418', 7);
    head(ctx, -6, -394, 44, { skin: '#c49478', hair: '#d8d4cc', style: 'cap', face: -1, tilt: 0.12 });
    // The lilies, held upright against his chest.
    ctx.save();
    ctx.translate(-40, -250);
    ctx.rotate(-1.2);
    poly(ctx, [[-70, -12], [50, -36], [60, 26], [-70, 12]], '#4e7a4a');
    for (let i = 0; i < 5; i++) {
      const fx = 56 + (i % 2) * 14, fy = -26 + i * 12;
      ctx.fillStyle = '#f6f2e8';
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2 + i;
        ellipse(ctx, fx + Math.cos(a) * 9, fy + Math.sin(a) * 9, 9, 4, '#f6f2e8', a);
      }
      ellipse(ctx, fx, fy, 3, 3, '#d8b048');
    }
    ctx.restore();
    ellipse(ctx, -64, -236, 15, 13, '#c49478');
    ctx.restore();
  });
}

// --- the two of them ------------------------------------------------------------
const IVORY = { base: '#b9a888', mid: '#e3d8bf', sheen: '#fbf6ea' };
const GOLD = { base: '#8a6526', mid: '#d9b46a', sheen: '#f6e2a8' };

function starBody(ctx, w, h, { reach = false } = {}) {
  const cx = w / 2;
  glow(ctx, cx, h * 0.42, w * 0.55, '#ffe6a8', 0.35);
  // Cape, wide behind her, catching the wind from below.
  ctx.fillStyle = lin(ctx, 0, 140, 0, h, [[0, '#f3ead6'], [0.6, '#cfc2a4'], [1, rgba('#8e8068', 0.6)]]);
  blob(ctx, [[cx - 70, 170], [cx + 70, 170], [cx + 170, 520], [cx + 120, 820], [cx + 30, 760], [cx - 60, 840], [cx - 150, 740], [cx - 160, 480]]);
  ctx.fill();
  ctx.strokeStyle = rgba(GOLD.mid, 0.7);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx + 70, 170); ctx.quadraticCurveTo(cx + 180, 480, cx + 120, 820); ctx.stroke();
  // Legs together, toes down: she isn't standing on anything.
  ctx.fillStyle = lin(ctx, cx - 40, 0, cx + 40, 0, [[0, IVORY.base], [0.4, IVORY.mid], [0.6, IVORY.sheen], [1, IVORY.base]]);
  blob(ctx, [[cx - 40, 470], [cx + 40, 470], [cx + 30, 700], [cx + 14, 840], [cx - 2, 846], [cx - 6, 700], [cx - 16, 700], [cx - 22, 836], [cx - 36, 832], [cx - 38, 700]]);
  ctx.fill();
  ctx.fillStyle = lin(ctx, 0, 760, 0, 860, [[0, GOLD.sheen], [1, GOLD.base]]);
  blob(ctx, [[cx - 2, 770], [cx + 30, 770], [cx + 12, 870], [cx + 2, 866]]); ctx.fill();
  blob(ctx, [[cx - 38, 766], [cx - 8, 766], [cx - 22, 866], [cx - 32, 862]]); ctx.fill();
  // Torso.
  ctx.fillStyle = lin(ctx, cx - 70, 0, cx + 70, 0, [[0, IVORY.base], [0.35, IVORY.mid], [0.55, IVORY.sheen], [1, IVORY.base]]);
  blob(ctx, [[cx - 70, 200], [cx + 70, 200], [cx + 56, 330], [cx + 44, 480], [cx - 44, 480], [cx - 56, 330]]);
  ctx.fill();
  ctx.fillStyle = lin(ctx, 0, 440, 0, 470, [[0, GOLD.sheen], [1, GOLD.base]]);
  ctx.fillRect(cx - 46, 446, 92, 16);
  poly(ctx, [[cx - 60, 200], [cx + 60, 200], [cx + 30, 236], [cx, 300], [cx - 30, 236]], GOLD.mid);
  // Arms.
  ctx.fillStyle = lin(ctx, 0, 200, 0, 460, [[0, IVORY.mid], [1, IVORY.base]]);
  blob(ctx, [[cx - 70, 206], [cx - 48, 220], [cx - 74, 360], [cx - 92, 452], [cx - 112, 446], [cx - 96, 340]]);
  ctx.fill();
  ellipse(ctx, cx - 102, 458, 13, 16, GOLD.mid);
  if (reach) {
    blob(ctx, [[cx + 70, 206], [cx + 48, 222], [cx + 110, 440], [cx + 130, 600], [cx + 150, 596], [cx + 134, 420]]);
    ctx.fill();
    ellipse(ctx, cx + 140, 612, 15, 18, GOLD.mid);
  } else {
    blob(ctx, [[cx + 70, 206], [cx + 48, 220], [cx + 74, 360], [cx + 92, 452], [cx + 112, 446], [cx + 96, 340]]);
    ctx.fill();
    ellipse(ctx, cx + 102, 458, 13, 16, GOLD.mid);
  }
  // Head: dark hair tied back, a gold mask across the eyes.
  ctx.fillStyle = '#c99a82';
  ctx.fillRect(cx - 14, 168, 28, 40);
  ctx.fillStyle = rad(ctx, cx - 8, 110, 70, [[0, '#d8ac92'], [1, '#8a5e4c']]);
  ctx.beginPath(); ctx.ellipse(cx, 130, 40, 50, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1d2c';
  blob(ctx, [[cx - 44, 140], [cx - 42, 96], [cx - 10, 76], [cx + 30, 80], [cx + 44, 110], [cx + 42, 140], [cx + 30, 104], [cx - 30, 104]]);
  ctx.fill();
  ellipse(ctx, cx + 4, 72, 18, 12, '#2a1d2c');
  ctx.fillStyle = GOLD.sheen;
  ctx.fillRect(cx - 4, 74, 10, 6);
  poly(ctx, [[cx - 46, 120], [cx + 46, 120], [cx + 54, 112], [cx + 40, 146], [cx - 40, 146], [cx - 54, 112]], GOLD.mid, rgba(GOLD.sheen, 0.8), 1.5);
  ctx.fillStyle = rgba('#fff8e0', 0.95);
  ctx.fillRect(cx - 26, 128, 16, 4);
  ctx.fillRect(cx + 10, 128, 16, 4);
  glow(ctx, cx, 130, 60, '#fff2c8', 0.25);
}

function registerGods(scene) {
  paintTexture(scene, 'sp_star', 400, 900, (ctx, w, h) => starBody(ctx, w, h));
  paintTexture(scene, 'sp_star_reach', 400, 900, (ctx, w, h) => starBody(ctx, w, h, { reach: true }));

  // Parallax: taller, still, a dark ring behind a smooth helmet; one vertical
  // line of light where a face would be.
  paintTexture(scene, 'sp_px', 420, 960, (ctx, w, h) => {
    const cx = w / 2;
    ctx.strokeStyle = rgba('#7b5cc0', 0.5);
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, 120, 96, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba('#000', 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, 120, 104, 0, Math.PI * 2); ctx.stroke();
    // Robe falling to a point.
    ctx.fillStyle = lin(ctx, 0, 220, 0, h, [[0, '#2a1238'], [0.5, '#120818'], [1, rgba('#05030a', 0.2)]]);
    blob(ctx, [[cx - 120, 250], [cx + 120, 250], [cx + 150, 600], [cx + 90, 940], [cx, 900], [cx - 90, 950], [cx - 150, 620]]);
    ctx.fill();
    ctx.fillStyle = lin(ctx, cx - 90, 0, cx + 90, 0, [[0, '#0a0610'], [0.4, '#1c1228'], [0.6, '#3a2656'], [1, '#0a0610']]);
    blob(ctx, [[cx - 100, 232], [cx + 100, 232], [cx + 70, 520], [cx - 70, 520]]);
    ctx.fill();
    ctx.strokeStyle = rgba('#a9a4b6', 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 100, 232); ctx.quadraticCurveTo(cx, 210, cx + 100, 232); ctx.stroke();
    // Arms hang long.
    ctx.fillStyle = '#0e0814';
    blob(ctx, [[cx - 100, 236], [cx - 76, 250], [cx - 104, 470], [cx - 126, 560], [cx - 140, 552], [cx - 128, 450]]);
    ctx.fill();
    blob(ctx, [[cx + 100, 236], [cx + 76, 250], [cx + 104, 470], [cx + 126, 560], [cx + 140, 552], [cx + 128, 450]]);
    ctx.fill();
    // Helmet.
    ctx.fillStyle = rad(ctx, cx - 16, 90, 90, [[0, '#2e2044'], [0.5, '#130b1e'], [1, '#030205']]);
    ctx.beginPath();
    ctx.moveTo(cx - 40, 214);
    ctx.quadraticCurveTo(cx - 56, 120, cx - 38, 72);
    ctx.quadraticCurveTo(cx, 30, cx + 38, 72);
    ctx.quadraticCurveTo(cx + 56, 120, cx + 40, 214);
    ctx.quadraticCurveTo(cx, 226, cx - 40, 214);
    ctx.fill();
    ctx.strokeStyle = rgba('#d8c8ff', 0.25);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx - 8, 116, 30, 54, 0, Math.PI * 1.08, Math.PI * 1.45); ctx.stroke();
    glow(ctx, cx, 130, 30, '#cbb8ff', 0.5);
    ctx.fillStyle = lin(ctx, 0, 70, 0, 200, [[0, 'rgba(240,232,255,0)'], [0.3, '#f4eeff'], [0.7, '#f4eeff'], [1, 'rgba(240,232,255,0)']]);
    ctx.fillRect(cx - 2, 70, 4, 130);
  });
}

// --- her own arms ---------------------------------------------------------------
const SLEEVE = ['#2a3048', '#141828'];

function glove(ctx, x, y, s, rot, open = false) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = lin(ctx, -60, -40, 60, 40, [[0, '#4a3a34'], [1, '#2a201c']]);
  blob(ctx, [[-62, 30], [-70, -20], [-40, -52], [30, -56], [66, -30], [60, 30], [0, 44]]);
  ctx.fill();
  if (open) {
    for (let i = 0; i < 4; i++) {
      const a = -0.5 + i * 0.32;
      const fx = -30 + i * 22;
      ctx.save(); ctx.translate(fx, -50); ctx.rotate(a);
      roundRect(ctx, -10, -64, 20, 70, 10, '#c89a7a');
      ctx.restore();
    }
    ctx.save(); ctx.translate(64, -10); ctx.rotate(0.9);
    roundRect(ctx, -10, -50, 20, 56, 10, '#c89a7a');
    ctx.restore();
  } else {
    for (let i = 0; i < 4; i++) ellipse(ctx, -36 + i * 24, -54, 11, 13, '#c89a7a');
  }
  ctx.restore();
}

function registerHands(scene) {
  // Reaching out and down: the whole arm, as far as it goes.
  paintTexture(scene, 'sp_reach', 900, 560, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, h * 0.2, 0, h, [[0, SLEEVE[0]], [1, SLEEVE[1]]]);
    blob(ctx, [[w * 0.62, h], [w * 0.56, h * 0.7], [w * 0.5, h * 0.36], [w * 0.47, h * 0.22], [w * 0.57, h * 0.2], [w * 0.64, h * 0.42], [w * 0.8, h * 0.8], [w * 0.86, h]]);
    ctx.fill();
    ctx.fillStyle = rgba('#d8c8a0', 0.4);
    ctx.fillRect(w * 0.47, h * 0.24, w * 0.1, 8);
    glove(ctx, w * 0.5, h * 0.16, 1.05, -0.15, true);
  });
  // Carrying him: his shoulder and the back of his head against her, her
  // left arm under him.
  paintTexture(scene, 'sp_carry', 900, 600, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 200, 0, h, [[0, '#f2d050'], [0.5, '#d8b030'], [1, '#8a6a18']]);
    blob(ctx, [[0, h], [0, 260], [120, 200], [300, 210], [420, 300], [470, h]]);
    ctx.fill();
    ctx.strokeStyle = rgba('#000', 0.25);
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(260, 230); ctx.quadraticCurveTo(300, 400, 260, h); ctx.stroke();
    // Hood bunched at the neck, then his hair.
    ctx.fillStyle = '#c09a24';
    blob(ctx, [[100, 220], [200, 160], [300, 190], [320, 240], [200, 250]]);
    ctx.fill();
    ctx.fillStyle = rad(ctx, 200, 90, 120, [[0, '#4a3020'], [1, '#2a1810']]);
    ctx.beginPath(); ctx.ellipse(210, 110, 110, 104, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba('#000', 0.3);
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(150 + i * 14, 30); ctx.quadraticCurveTo(170 + i * 12, 100, 140 + i * 16, 190); ctx.stroke(); }
    // Her arm across his back.
    ctx.fillStyle = lin(ctx, 0, 300, 0, h, [[0, SLEEVE[0]], [1, SLEEVE[1]]]);
    blob(ctx, [[w, h], [w, 380], [700, 330], [420, 330], [300, 380], [380, 460], [700, 470], [760, h]]);
    ctx.fill();
    glove(ctx, 330, 360, 0.9, -1.6);
  });
}

// The cloud they went into, seen from underneath. Painted pale so a tint
// can light it from inside; its belly is the heavy part.
function registerCloud(scene) {
  [3, 11, 29].forEach((seed, n) => {
    paintTexture(scene, `sp_cloud${n}`, 640, 360, (ctx, w, h) => {
      const r = rng(seed);
      for (let i = 0; i < 34; i++) {
        const x = w * (0.18 + r() * 0.64);
        const y = h * (0.3 + r() * 0.45);
        const rr = 50 + r() * 90;
        ctx.fillStyle = rad(ctx, x, y, rr, [[0, rgba('#ffffff', 0.5)], [0.6, rgba('#e4e4ee', 0.3)], [1, rgba('#d8d8e8', 0)]]);
        ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
      }
      // The underside, darker where it is thickest.
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, rgba('#ffffff', 0)], [0.55, rgba('#9a9aae', 0.25)], [1, rgba('#6a6a80', 0.5)]]);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }, { scale: 0.5 });
  });
}

export function registerSpan(scene) {
  registerPeople(scene);
  registerGods(scene);
  registerHands(scene);
  registerCloud(scene);
}
