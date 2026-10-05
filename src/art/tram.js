import { paintTexture, rng, lin, rad, rgba, glow, poly, ellipse, blob, roundRect, line } from './paint.js';
import { building, halo } from './city.js';

// Tram 6, the last run across the Lantern Bridge: seen from inside. Painted
// cut-outs for the first-person view — passengers, the driver's hands, the
// dash — and a calm night panorama. The city isn't burning yet.

// The panorama wraps once per full turn of the head: 2π × the view's focal
// length, in design pixels.
export const PANO_W = Math.round(2 * Math.PI * 820);

const IRON = '#1a1420';
const LANTERN = '#f2c070';

// --- people -------------------------------------------------------------------
// Seated passengers face left (toward the aisle from the right-hand bench);
// the view flips them for the left-hand bench. 300×520 is 1.3 m of person.

function shade(ctx, path, top, bottom, x0 = 0, x1 = 0) {
  ctx.fillStyle = x1 ? lin(ctx, x0, 0, x1, 0, [[0, bottom], [0.55, top], [1, bottom]]) : lin(ctx, 0, path[0], 0, path[1], [[0, top], [1, bottom]]);
}

function head(ctx, x, y, r, { skin, hair, style = 'short', tilt = 0, face = -1, eyes = true }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  // Neck.
  ctx.fillStyle = skin;
  ctx.fillRect(-r * 0.32, r * 0.7, r * 0.64, r * 0.7);
  ctx.fillStyle = rgba('#000', 0.25);
  ctx.fillRect(-r * 0.32, r * 0.7, r * 0.64, r * 0.25);
  // Head, lit from the lamps above and the aisle side.
  ctx.fillStyle = rad(ctx, face * r * 0.3, -r * 0.4, r * 1.3, [[0, skin], [1, shadeHex(skin, -0.35)]]);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nose and brow on the facing side.
  poly(ctx, [[face * r * 0.78, -r * 0.1], [face * r * 1.0, r * 0.22], [face * r * 0.76, r * 0.3]], skin);
  if (eyes) {
    ctx.fillStyle = rgba('#1a1014', 0.75);
    ctx.fillRect(face * r * 0.52 - r * 0.1, -r * 0.08, r * 0.2, r * 0.07);
    ctx.fillStyle = rgba('#000', 0.18);
    ctx.fillRect(face * r * 0.3, -r * 0.24, face * r * 0.5, r * 0.06);
  }
  ctx.fillStyle = rgba('#5a2a2a', 0.35);
  ctx.fillRect(face * r * 0.55 - r * 0.12, r * 0.48, r * 0.26, r * 0.05);
  // Ear on the far side of the face.
  ellipse(ctx, -face * r * 0.12, r * 0.05, r * 0.14, r * 0.22, shadeHex(skin, -0.15));
  // Hair.
  ctx.fillStyle = hair;
  if (style === 'short') {
    blob(ctx, [[-r * 0.9, r * 0.1], [-r * 0.95, -r * 0.6], [-r * 0.2, -r * 1.12], [r * 0.6, -r * 0.95], [r * 0.9, -r * 0.4], [face > 0 ? r * 0.3 : -r * 0.2, -r * 0.55], [-r * 0.4, -r * 0.2]]);
    ctx.fill();
  } else if (style === 'bun') {
    blob(ctx, [[-r * 0.92, r * 0.3], [-r * 0.95, -r * 0.6], [-r * 0.1, -r * 1.1], [r * 0.7, -r * 0.85], [r * 0.85, -r * 0.3], [r * 0.2, -r * 0.62], [-r * 0.5, -r * 0.2]]);
    ctx.fill();
    ellipse(ctx, -face * r * 0.75, -r * 0.75, r * 0.38, r * 0.34, hair);
    // Loose strands: a double shift.
    line(ctx, face * r * 0.4, -r * 0.6, face * r * 0.65, r * 0.15, hair, 2);
  } else if (style === 'long') {
    blob(ctx, [[-r * 1.0, r * 1.5], [-r * 1.0, -r * 0.6], [-r * 0.1, -r * 1.12], [r * 0.75, -r * 0.85], [r * 0.95, -r * 0.2], [r * 0.3, -r * 0.6], [-r * 0.3, -r * 0.1], [-r * 0.2, r * 1.5]]);
    ctx.fill();
  } else if (style === 'cap') {
    blob(ctx, [[-r * 0.9, r * 0.2], [-r * 0.9, -r * 0.3], [-r * 0.4, -r * 0.55], [r * 0.5, -r * 0.5], [r * 0.85, -r * 0.2], [-r * 0.2, -r * 0.1]]);
    ctx.fillStyle = rgba('#d8d4cc', 0.9);
    ctx.fill();
    // Flat cap with its brim toward the aisle.
    ctx.fillStyle = lin(ctx, 0, -r * 1.1, 0, -r * 0.4, [[0, '#4a4440'], [1, '#2a2622']]);
    blob(ctx, [[-r * 0.95, -r * 0.4], [-r * 0.85, -r * 0.95], [r * 0.2, -r * 1.12], [r * 0.95, -r * 0.8], [face * r * 1.35, -r * 0.45], [0, -r * 0.42]]);
    ctx.fill();
  } else if (style === 'hood') {
    ctx.fillStyle = lin(ctx, 0, -r * 1.3, 0, r * 1.2, [[0, shadeHex(hair, 0.15)], [1, hair]]);
    blob(ctx, [[-r * 1.15, r * 1.3], [-r * 1.2, -r * 0.5], [-r * 0.3, -r * 1.3], [r * 0.8, -r * 1.05], [face * r * 1.1, -r * 0.2], [face * r * 0.7, r * 0.2], [face * r * 0.55, -r * 0.7], [-r * 0.2, -r * 0.75], [-r * 0.6, r * 1.3]]);
    ctx.fill();
  }
  ctx.restore();
}

function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// A seated figure. Coordinates are for an adult; `s` scales a child.
function seated(ctx, w, h, o) {
  const { coat, coat2 = shadeHex(coat, 0.18), legs = '#1e1a22', shoes = '#120e12', skin, hair, hairStyle = 'short', s = 1, lean = 0, headTilt = 0, arms = 'lap', dangle = false } = o;
  ctx.save();
  ctx.translate(w * 0.58, h);
  ctx.scale(s, s);
  // Origin: floor under the hip. x grows away from the aisle.
  const hipY = -190;
  const knee = [-92, -186];
  const foot = dangle ? [-96, -40] : [-100, -6];
  // Shadow under the seat.
  ctx.fillStyle = rgba('#000', 0.35);
  ctx.beginPath(); ctx.ellipse(-30, -4, 90, 10, 0, 0, Math.PI * 2); ctx.fill();
  // Legs: thigh toward the aisle, shin down.
  ctx.fillStyle = lin(ctx, 0, hipY - 20, 0, foot[1], [[0, shadeHex(legs, 0.12)], [1, legs]]);
  blob(ctx, [[30, hipY - 28], [knee[0] - 14, knee[1] - 26], [knee[0] - 20, knee[1] + 6], [foot[0] - 6, foot[1] - 30], [foot[0] + 22, foot[1] - 30], [knee[0] + 18, knee[1] + 14], [30, hipY + 18]]);
  ctx.fill();
  // Shoes.
  ctx.fillStyle = shoes;
  blob(ctx, [[foot[0] - 30, foot[1]], [foot[0] - 28, foot[1] - 16], [foot[0] + 22, foot[1] - 26], [foot[0] + 26, foot[1]]]);
  ctx.fill();
  // Torso (coat), leaning.
  ctx.save();
  ctx.translate(10, hipY);
  ctx.rotate(lean);
  ctx.fillStyle = lin(ctx, -70, 0, 70, 0, [[0, coat2], [0.45, coat], [1, shadeHex(coat, -0.35)]]);
  blob(ctx, [[-62, 20], [-60, -110], [-40, -180], [40, -184], [62, -120], [64, 30], [0, 44]]);
  ctx.fill();
  // Coat hem over the thighs.
  ctx.fillStyle = coat;
  blob(ctx, [[-60, -6], [-118, 0], [-120, 26], [-40, 34], [40, 30]]);
  ctx.fill();
  // Lapel line.
  ctx.strokeStyle = rgba('#000', 0.3);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-34, -176); ctx.quadraticCurveTo(-30, -90, -46, 10); ctx.stroke();
  // Light from the ceiling lamps across the shoulders.
  ctx.fillStyle = rgba('#ffe2b0', 0.12);
  blob(ctx, [[-50, -150], [-36, -184], [40, -186], [50, -160], [0, -164]]);
  ctx.fill();
  o.torso?.(ctx);
  // Arms.
  ctx.fillStyle = lin(ctx, 0, -170, 0, 0, [[0, coat2], [1, coat]]);
  if (arms === 'lap') {
    blob(ctx, [[-50, -168], [-20, -164], [-36, -70], [-96, -18], [-112, -30], [-70, -84]]);
    ctx.fill();
    ellipse(ctx, -112, -26, 16, 12, skin);
  } else if (arms === 'crossed') {
    blob(ctx, [[-50, -168], [-24, -164], [-30, -100], [-70, -86], [20, -84], [24, -66], [-86, -60], [-74, -110]]);
    ctx.fill();
    ellipse(ctx, 14, -78, 13, 11, skin);
  } else if (arms === 'elbows') {
    blob(ctx, [[-50, -168], [-20, -164], [-50, -60], [-124, -88], [-132, -112], [-80, -118]]);
    ctx.fill();
    ellipse(ctx, -132, -112, 15, 13, skin);
  } else if (arms === 'point') {
    blob(ctx, [[-50, -168], [-24, -176], [-70, -260], [-96, -330], [-112, -326], [-82, -250]]);
    ctx.fill();
    ellipse(ctx, -106, -334, 13, 15, skin);
    poly(ctx, [[-108, -344], [-116, -376], [-110, -378], [-100, -346]], skin);
  }
  ctx.restore();
  // Head on top of the leaning torso.
  const hx = 10 + Math.sin(lean) * 200 - 6;
  const hy = hipY - Math.cos(lean) * 200 - 46;
  head(ctx, hx, hy, 44, { skin, hair, style: hairStyle, tilt: headTilt, face: o.face ?? -1, eyes: o.eyes !== false });
  o.front?.(ctx, hx, hy);
  ctx.restore();
}

function registerPeople(scene) {
  const W = 300, H = 520;
  // Mara: a nurse off a double shift. Scrubs under a long coat; a lanyard.
  paintTexture(scene, 'tr_mara', W, H, (ctx, w, h) => seated(ctx, w, h, {
    coat: '#3a3638', skin: '#c08a6a', hair: '#2a1a16', hairStyle: 'bun', lean: 0.12, headTilt: 0.08, legs: '#3e6a68',
    torso: (c) => {
      c.fillStyle = '#4e8480';
      blob(c, [[-30, -176], [-10, -110], [-26, -176]]); c.fill();
      c.fillStyle = '#5a8e8a';
      poly(c, [[-34, -178], [-18, -178], [-14, -40], [-38, -40]], '#4e8480');
      line(c, -30, -176, -26, -110, '#c8c0a0', 2);
      roundRect(c, -34, -112, 14, 18, 2, '#e8e4dc');
    },
    front: (c) => {
      // Her bag, on the floor against her shin.
      roundRect(c, -170, -96, 66, 90, 10, '#2a2226');
      c.strokeStyle = '#2a2226'; c.lineWidth = 6;
      c.beginPath(); c.arc(-137, -96, 22, Math.PI, 0); c.stroke();
    },
  }));
  const teo = (key, up) => paintTexture(scene, key, W, H, (ctx, w, h) => seated(ctx, w, h, {
    coat: '#d8b030', coat2: '#f2d050', legs: '#3a3a52', shoes: '#a82a2a', skin: '#c89474', hair: '#3a2418', s: 0.62, dangle: true,
    headTilt: up ? -0.75 : 0.05, arms: up ? 'point' : 'lap', lean: up ? -0.08 : 0,
    torso: (c) => {
      // Raincoat hood down, toggles.
      c.fillStyle = '#c09a24';
      blob(c, [[20, -186], [56, -178], [62, -140], [30, -150]]); c.fill();
      [-140, -100, -60].forEach((y) => roundRect(c, -40, y, 14, 6, 2, '#5a4220'));
    },
  }));
  teo('tr_teo', false);
  teo('tr_teo_up', true);
  // Nell: arms crossed, turned to the window.
  paintTexture(scene, 'tr_nell', W, H, (ctx, w, h) => seated(ctx, w, h, {
    coat: '#6a2a34', skin: '#d6a48a', hair: '#6a3a22', hairStyle: 'long', arms: 'crossed', face: 1, lean: -0.04, legs: '#22202a',
  }));
  // Sami: elbows on his knees, looking at the floor.
  paintTexture(scene, 'tr_sami', W, H, (ctx, w, h) => seated(ctx, w, h, {
    coat: '#2a3446', skin: '#8a5a44', hair: '#141012', arms: 'elbows', lean: -0.32, headTilt: 0.35, legs: '#2a2a30',
  }));
  // Aurelio: overcoat, flat cap, a cone of white lilies across his lap.
  paintTexture(scene, 'tr_aurelio', W, H, (ctx, w, h) => seated(ctx, w, h, {
    coat: '#5a5650', skin: '#c49478', hair: '#d8d4cc', hairStyle: 'cap', lean: 0.04, legs: '#2e2c2a', shoes: '#3a2418',
    front: (c, hx, hy) => {
      // Cane against the bench.
      line(c, 30, -20, -10, hy + 160, '#3a2418', 7);
      c.save();
      c.translate(-60, -205);
      c.rotate(-0.35);
      // Paper cone.
      poly(c, [[-80, -12], [60, -40], [70, 30], [-80, 12]], '#4e7a4a');
      poly(c, [[-80, -12], [60, -40], [40, -10]], '#6a9a62');
      const r = rng(41);
      for (let i = 0; i < 6; i++) {
        const fx = 60 + r() * 30, fy = -30 + i * 11;
        line(c, 40, fy * 0.6, fx, fy, '#5a8a4a', 3);
        c.fillStyle = '#f4f0e6';
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2 + r();
          ellipse(c, fx + Math.cos(a) * 9, fy + Math.sin(a) * 9, 9, 4, '#f6f2e8', a);
        }
        ellipse(c, fx, fy, 3, 3, '#d8b048');
      }
      c.restore();
    },
  }));
  // A night-shift worker asleep against the window, hood up.
  paintTexture(scene, 'tr_sleeper', W, H, (ctx, w, h) => seated(ctx, w, h, {
    coat: '#3a3a30', skin: '#a07058', hair: '#4a4a3e', hairStyle: 'hood', lean: 0.2, headTilt: 0.5, face: -1, eyes: false, legs: '#2a2a26',
    torso: (c) => {
      c.fillStyle = rgba('#e0a020', 0.85);
      c.fillRect(-48, -120, 96, 10);
      c.fillStyle = rgba('#d8d8c8', 0.6);
      c.fillRect(-48, -110, 96, 4);
    },
  }));
}

// --- the cab --------------------------------------------------------------------

function registerCab(scene) {
  // Dashboard face, seen from the driver's position.
  paintTexture(scene, 'tr_dash', 1000, 220, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#3a2418'], [0.12, '#5a3a24'], [1, '#1e140e']]);
    roundRect(ctx, 0, 10, w, h - 10, 14, ctx.fillStyle);
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#8a6a3a'], [0.5, '#e0c080'], [1, '#8a6a3a']]);
    ctx.fillRect(10, 10, w - 20, 6);
    // Gauges.
    const dial = (x, y, r, label, needle) => {
      ellipse(ctx, x, y, r + 6, r + 6, '#b8944e');
      ctx.fillStyle = rad(ctx, x, y - r * 0.3, r * 1.2, [[0, '#f4ead0'], [1, '#c8b890']]);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * 0.8 + (i / 10) * Math.PI * 1.4;
        line(ctx, x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92, '#3a2a1a', i % 5 ? 1.5 : 3);
      }
      const a = Math.PI * 0.8 + needle * Math.PI * 1.4;
      line(ctx, x, y, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, '#8a1a1a', 3);
      ellipse(ctx, x, y, 5, 5, '#2a1a10');
      ctx.fillStyle = '#3a2a1a';
      ctx.font = `600 ${Math.round(r * 0.22)}px Jost, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + r * 0.5);
      glow(ctx, x, y, r * 1.4, '#ffd890', 0.12);
    };
    dial(330, 112, 62, 'AMPERES', 0.18);
    dial(670, 112, 62, 'BRAKE AIR', 0.62);
    // Route card in its brass frame.
    roundRect(ctx, 430, 60, 140, 100, 6, '#b8944e');
    roundRect(ctx, 438, 68, 124, 84, 4, '#efe4c8');
    ctx.fillStyle = '#6a2228';
    ctx.font = '600 44px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('6', 500, 110);
    ctx.fillStyle = '#3a2a1a';
    ctx.font = '400 11px Jost, sans-serif';
    ctx.fillText('HOLLIN YARD', 500, 128);
    ctx.fillText('— CINDER ST —', 500, 142);
    // A photograph tucked into the bezel: a child on someone's shoulders.
    ctx.save();
    ctx.translate(752, 62);
    ctx.rotate(0.12);
    roundRect(ctx, 0, 0, 62, 76, 2, '#f2ecdc');
    ctx.fillStyle = lin(ctx, 0, 6, 0, 60, [[0, '#8aa4b0'], [1, '#c8b890']]);
    ctx.fillRect(5, 5, 52, 56);
    ellipse(ctx, 31, 40, 10, 16, '#3a3036');
    ellipse(ctx, 31, 22, 6, 6, '#c08a6a');
    ellipse(ctx, 31, 12, 4.5, 4.5, '#c89474');
    ctx.fillStyle = '#d8b030';
    ctx.fillRect(26, 15, 10, 5);
    ctx.restore();
    // Bell push and lamps.
    ellipse(ctx, 150, 120, 26, 26, '#8a6a3a');
    ellipse(ctx, 150, 116, 18, 18, '#d8b878');
    ctx.fillStyle = '#3a2a1a';
    ctx.font = '500 12px Jost, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BELL', 150, 170);
    [[860, '#7ad08a'], [900, '#e0a040']].forEach(([x, c]) => {
      ellipse(ctx, x, 110, 11, 11, '#1a120e');
      ellipse(ctx, x, 110, 7, 7, c);
      glow(ctx, x, 110, 26, c, 0.5);
    });
  });

  // The driver's hands: left on the controller crank, right on the brake.
  paintTexture(scene, 'tr_hands', 1200, 460, (ctx, w, h) => {
    const sleeve = (pts) => {
      ctx.fillStyle = lin(ctx, 0, h * 0.4, 0, h, [[0, '#2a3048'], [1, '#141828']]);
      blob(ctx, pts); ctx.fill();
    };
    const glove = (x, y, s, rot) => {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
      // Fingerless wool glove, knuckles over the handle.
      ctx.fillStyle = lin(ctx, -60, -40, 60, 40, [[0, '#4a3a34'], [1, '#2a201c']]);
      blob(ctx, [[-62, 30], [-70, -20], [-40, -52], [30, -56], [66, -30], [60, 30], [0, 44]]);
      ctx.fill();
      // Fingertips.
      for (let i = 0; i < 4; i++) ellipse(ctx, -36 + i * 24, -54, 11, 13, '#c89a7a');
      ellipse(ctx, 66, -8, 12, 16, '#c89a7a', 0.6);
      ctx.strokeStyle = rgba('#000', 0.3); ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-24 + i * 24, -50); ctx.lineTo(-22 + i * 24, -30); ctx.stroke(); }
      ctx.restore();
    };
    // Controller: a tall brass-capped drum; the crank arm across the top.
    ctx.fillStyle = lin(ctx, 260, 0, 520, 0, [[0, '#1a120e'], [0.4, '#3a2a1e'], [1, '#120c08']]);
    roundRect(ctx, 270, 250, 240, 260, 16, ctx.fillStyle);
    ctx.fillStyle = lin(ctx, 260, 0, 520, 0, [[0, '#6a4a22'], [0.45, '#e8c480'], [1, '#6a4a22']]);
    ctx.beginPath(); ctx.ellipse(390, 252, 124, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a1a10';
    ctx.font = '600 14px Jost, sans-serif';
    ctx.textAlign = 'center';
    ['OFF', '1', '2', '3', '4'].forEach((t, i) => {
      const a = Math.PI * 1.1 + i * 0.22;
      ctx.fillText(t, 390 + Math.cos(a) * 96, 256 + Math.sin(a) * 22);
    });
    line(ctx, 390, 250, 470, 214, '#c8a060', 16);
    ellipse(ctx, 478, 208, 22, 18, '#2a1a10');
    sleeve([[0, h], [0, 330], [120, 260], [300, 230], [360, 270], [260, 380], [160, h]]);
    glove(440, 214, 1, -0.2);
    // Brake: a wheel to the right.
    ctx.strokeStyle = lin(ctx, 760, 0, 1000, 0, [[0, '#6a4a22'], [0.5, '#d8b070'], [1, '#6a4a22']]);
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.ellipse(870, 300, 130, 46, 0, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
    line(ctx, 870, 300, 870, h, '#1a120e', 34);
    sleeve([[w, h], [w, 300], [1100, 250], [940, 230], [880, 280], [960, 360], [1040, h]]);
    glove(920, 252, 0.95, 0.3);
    // Lamp light catching the brass.
    glow(ctx, 390, 240, 90, '#ffe0a0', 0.18);
  });

  // Right hand with a ticket punch, for walking the aisle.
  paintTexture(scene, 'tr_punch', 520, 460, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 200, 0, h, [[0, '#2a3048'], [1, '#141828']]);
    blob(ctx, [[w, h], [w, 300], [420, 230], [300, 250], [250, 320], [330, 400], [380, h]]);
    ctx.fill();
    // Punch: two steel arms and a jaw.
    ctx.save();
    ctx.translate(250, 190);
    ctx.rotate(-0.5);
    ctx.fillStyle = lin(ctx, -10, 0, 10, 0, [[0, '#6a6a72'], [0.5, '#d8d8e0'], [1, '#5a5a62']]);
    roundRect(ctx, -12, 0, 24, 170, 8, ctx.fillStyle);
    roundRect(ctx, 22, 20, 22, 150, 8, ctx.fillStyle);
    roundRect(ctx, -20, -40, 64, 48, 10, '#9a9aa4');
    ellipse(ctx, 12, -18, 9, 9, '#2a2a30');
    ctx.restore();
    // Tickets fanned in the fingers.
    ['#e8d8a8', '#d8c890', '#efe4c0'].forEach((c, i) => {
      ctx.save();
      ctx.translate(330 + i * 6, 210 - i * 4);
      ctx.rotate(-0.9 + i * 0.12);
      roundRect(ctx, 0, 0, 90, 38, 2, c);
      ctx.fillStyle = rgba('#6a2228', 0.6);
      ctx.fillRect(8, 8, 26, 3);
      ctx.restore();
    });
    ctx.fillStyle = lin(ctx, 260, 200, 380, 330, [[0, '#4a3a34'], [1, '#2a201c']]);
    blob(ctx, [[250, 300], [260, 230], [320, 200], [390, 230], [400, 300], [330, 340]]);
    ctx.fill();
    for (let i = 0; i < 4; i++) ellipse(ctx, 270 + i * 26, 214 + i * 4, 12, 13, '#c89a7a');
  });

  // Fittings.
  paintTexture(scene, 'tr_pole', 16, 512, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, '#5a5048'], [0.35, '#f0e4c8'], [0.6, '#a89878'], [1, '#3a3028']]);
    ctx.fillRect(2, 0, w - 4, h);
  });
  paintTexture(scene, 'tr_lamp', 160, 50, (ctx, w, h) => {
    roundRect(ctx, 10, 0, w - 20, 12, 4, '#8a6a3a');
    ctx.fillStyle = rad(ctx, w / 2, 14, w * 0.5, [[0, '#fff6dc'], [0.6, '#f2dca0'], [1, '#c8a060']]);
    ctx.beginPath(); ctx.ellipse(w / 2, 14, w * 0.4, 30, 0, 0, Math.PI); ctx.fill();
  });
}

// --- outside --------------------------------------------------------------------

function registerOutside(scene) {
  // Sky gradient by elevation: city-glow at the horizon, black at the top.
  paintTexture(scene, 'tr_skygrad', 8, 1024, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#03020a'], [0.55, '#080714'], [0.85, '#1a1424'], [1, '#3a2630']]);
    ctx.fillRect(0, 0, w, h);
  });

  // Panorama of the far banks. Ahead (the middle of the texture) is the east
  // city and the Aureate Spire; behind, the depot and the west hills.
  paintTexture(scene, 'tr_far', PANO_W, 560, (ctx, w, h) => {
    const r = rng(311);
    const base = 520;
    const mid = w / 2;
    // West hills behind, soft.
    ctx.fillStyle = '#0e0b14';
    ctx.beginPath(); ctx.moveTo(0, base);
    for (let x = 0; x <= w; x += 40) {
      const behind = Math.min(Math.abs(x - 0), Math.abs(x - w)) / (w * 0.3);
      ctx.lineTo(x, base - 40 - Math.max(0, 1 - behind) * (60 + Math.sin(x * 0.004) * 30));
    }
    ctx.lineTo(w, base); ctx.closePath(); ctx.fill();
    // City across the water, densest dead ahead.
    let x = mid - 1700;
    while (x < mid + 1700) {
      const d = Math.abs(x - mid) / 1700;
      const bw = 16 + r() * 40;
      const top = base - (60 + (1 - d) * (90 + r() * 170));
      const style = ['slab', 'spire', 'stepped', 'slab', 'cathedral'][Math.floor(r() * 5)];
      building(ctx, r, x, bw, top, base, style, '#141020', '#2a1e30', { density: 0.18, warm: '#e8c088', cool: '#a8c8d4' });
      x += bw + r() * 10;
    }
    // The Aureate Spire, right of dead ahead.
    const sx = mid + 420;
    poly(ctx, [[sx - 22, base], [sx - 10, base - 260], [sx, base - 420], [sx + 10, base - 260], [sx + 22, base]], '#120c1a');
    [base - 330, base - 290, base - 250].forEach((y, i) => halo(ctx, sx, y, 30 - i * 5, '#e8c47a', 0.6));
    glow(ctx, sx, base - 420, 50, '#ffe2a0', 0.45);
    // The depot behind: a long low shed and its yard lamps.
    const dx = 120;
    ctx.fillStyle = '#100c14';
    ctx.fillRect(dx - 80, base - 46, 220, 46);
    for (let i = 0; i < 5; i++) glow(ctx, dx - 60 + i * 44, base - 52, 16, '#e8c088', 0.6);
    // Harbour lights along the waterline.
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = rgba(r() < 0.8 ? '#f2c888' : '#a8c8d4', 0.3 + r() * 0.5);
      ctx.fillRect(r() * w, base - 3 - r() * 4, 2, 2);
    }
    ctx.fillStyle = lin(ctx, 0, base - 120, 0, base, [[0, 'rgba(60,40,60,0)'], [1, 'rgba(60,40,60,0.45)']]);
    ctx.fillRect(0, base - 120, w, 120);
    ctx.fillStyle = '#0a0810';
    ctx.fillRect(0, base, w, h - base);
  }, { scale: 0.25 });

  // The river far below: calm, with long smeared reflections.
  paintTexture(scene, 'tr_water', PANO_W, 600, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#1a1220'], [0.2, '#0c0912'], [1, '#040306']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 700; i++) {
      const y = Math.pow(r(), 1.6) * h;
      const ahead = 1 - Math.min(1, Math.abs(r() * w - w / 2) / (w * 0.4));
      ctx.fillStyle = rgba(r() < 0.7 ? '#f2b878' : '#8a7ab0', (0.04 + r() * 0.14) * (1 - y / h) * (0.4 + ahead));
      ctx.fillRect(r() * w, y, 20 + r() * 90, 2);
    }
  }, { scale: 0.25 });

  // Midspan stop: a small deco shelter with its name on a lit sign.
  paintTexture(scene, 'tr_kiosk', 420, 560, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, IRON], [0.5, '#2a2230'], [1, IRON]]);
    ctx.fillRect(30, 120, 12, h - 120);
    ctx.fillRect(w - 42, 120, 12, h - 120);
    poly(ctx, [[10, 130], [cx, 70], [w - 10, 130], [w - 10, 146], [10, 146]], IRON);
    // Sign.
    roundRect(ctx, cx - 150, 150, 300, 56, 6, '#1a1218');
    ctx.fillStyle = lin(ctx, 0, 156, 0, 200, [[0, '#ffe6b0'], [1, '#e0a050']]);
    roundRect(ctx, cx - 142, 156, 284, 44, 4, ctx.fillStyle);
    ctx.fillStyle = '#3a1a10';
    ctx.font = '500 26px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('LANTERN  MIDSPAN', cx, 187);
    glow(ctx, cx, 178, 200, LANTERN, 0.25);
    // Glass panel and bench.
    ctx.fillStyle = rgba('#9ab0c0', 0.12);
    ctx.fillRect(48, 230, w - 96, 220);
    roundRect(ctx, 60, 440, w - 120, 16, 4, '#3a2a20');
    ctx.fillRect(80, 456, 8, 60); ctx.fillRect(w - 88, 456, 8, 60);
    // Timetable frame.
    roundRect(ctx, w - 120, 250, 50, 70, 3, '#d8ccb0');
  });

  // A lamplighter's ladder, left leaning against a lantern post.
  paintTexture(scene, 'tr_ladder', 120, 600, (ctx, w, h) => {
    ctx.save();
    ctx.translate(w / 2, h);
    ctx.rotate(-0.12);
    ctx.fillStyle = '#5a3a24';
    ctx.fillRect(-26, -h + 20, 7, h - 20);
    ctx.fillRect(19, -h + 20, 7, h - 20);
    for (let y = -40; y > -h + 30; y -= 46) ctx.fillRect(-22, y, 44, 6);
    ctx.fillStyle = rgba(LANTERN, 0.3);
    ctx.fillRect(19, -h + 20, 2, h - 20);
    ctx.restore();
  });

  // The hole in the stars: nothing, with the faintest edge.
  paintTexture(scene, 'tr_hole', 256, 256, (ctx, w, h) => {
    const c = w / 2;
    ctx.fillStyle = rad(ctx, c, c, c, [[0, 'rgba(0,0,0,1)'], [0.62, 'rgba(0,0,0,1)'], [0.7, 'rgba(60,30,90,0.55)'], [0.76, 'rgba(10,6,16,0.6)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(0, 0, w, h);
  });
}

export function registerTram(scene) {
  registerPeople(scene);
  registerCab(scene);
  registerOutside(scene);
}
