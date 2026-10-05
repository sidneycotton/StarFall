import { paintTexture, rng, lin, rad, rgba, glow, poly, ellipse, blob, roundRect, line } from './paint.js';
import { shadeHex } from './tram.js';

// Chapter Three's people, square on: the four, Lodestar, a crowd, and
// Parallax from a few metres away. First person needs faces and backs, not
// profiles, so these face the camera (or turn away from it).
//
// 300×700 is 1.75 m of adult; feet at the bottom, centred.

const W = 300;
const H = 700;

// --- heads -------------------------------------------------------------------------------------
function headFront(ctx, x, y, r, o) {
  const { skin, hair, style = 'short', back = false, tilt = 0, beard, brows = 1, look = 0 } = o;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  // Neck.
  ctx.fillStyle = shadeHex(skin, -0.12);
  ctx.fillRect(-r * 0.34, r * 0.6, r * 0.68, r * 0.8);
  ctx.fillStyle = rgba('#000', 0.25);
  ctx.fillRect(-r * 0.34, r * 0.6, r * 0.68, r * 0.3);
  // Hair that falls behind the head.
  ctx.fillStyle = hair;
  if (style === 'long') {
    blob(ctx, [[-r * 1.08, r * 1.9], [-r * 1.1, -r * 0.4], [0, -r * 1.16], [r * 1.1, -r * 0.4], [r * 1.08, r * 1.9], [0, r * 2.05]]);
    ctx.fill();
  }
  if (style === 'braids') {
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 6; k++) ellipse(ctx, sx * r * 0.82, r * (0.3 + k * 0.32), r * 0.17, r * 0.2, shadeHex(hair, k % 2 ? 0.06 : 0));
    }
  }
  if (style === 'hood') {
    ctx.fillStyle = lin(ctx, 0, -r * 1.3, 0, r * 1.4, [[0, shadeHex(hair, 0.15)], [1, hair]]);
    blob(ctx, [[-r * 1.35, r * 1.5], [-r * 1.3, -r * 0.5], [0, -r * 1.42], [r * 1.3, -r * 0.5], [r * 1.35, r * 1.5]]);
    ctx.fill();
  }
  // Ears.
  ellipse(ctx, -r * 0.86, r * 0.08, r * 0.15, r * 0.24, shadeHex(skin, -0.2));
  ellipse(ctx, r * 0.86, r * 0.08, r * 0.15, r * 0.24, shadeHex(skin, -0.2));
  // Head.
  ctx.fillStyle = back
    ? rad(ctx, 0, -r * 0.3, r * 1.3, [[0, shadeHex(skin, -0.2)], [1, shadeHex(skin, -0.45)]])
    : rad(ctx, -r * 0.2, -r * 0.35, r * 1.35, [[0, skin], [0.7, shadeHex(skin, -0.18)], [1, shadeHex(skin, -0.42)]]);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.84, r, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!back) {
    // A face in five marks: brows, eyes, the shadow of a nose, a mouth.
    const lx = look * r * 0.12;
    ctx.fillStyle = rgba('#1a1014', 0.8);
    for (const sx of [-1, 1]) {
      ctx.fillRect(sx * r * 0.34 - r * 0.11 + lx, -r * 0.06, r * 0.22, r * 0.08);
      ctx.fillStyle = rgba(shadeHex(hair, -0.2), 0.7 * brows);
      ctx.fillRect(sx * r * 0.34 - r * 0.16, -r * 0.26, r * 0.32, r * 0.06);
      ctx.fillStyle = rgba('#1a1014', 0.8);
    }
    poly(ctx, [[0, -r * 0.02], [r * 0.12, r * 0.34], [-r * 0.06, r * 0.36]], rgba(shadeHex(skin, -0.4), 0.55));
    ctx.fillStyle = rgba('#5a2a2a', 0.45);
    ctx.fillRect(-r * 0.2, r * 0.55, r * 0.4, r * 0.06);
    if (beard) {
      ctx.fillStyle = beard;
      blob(ctx, [[-r * 0.8, r * 0.1], [-r * 0.5, r * 0.85], [0, r * 1.05], [r * 0.5, r * 0.85], [r * 0.8, r * 0.1], [r * 0.4, r * 0.5], [r * 0.3, r * 0.68], [-r * 0.3, r * 0.68], [-r * 0.4, r * 0.5]]);
      ctx.fill();
      ctx.fillStyle = rgba('#5a2a2a', 0.5);
      ctx.fillRect(-r * 0.18, r * 0.56, r * 0.36, r * 0.05);
    }
  }
  // Hair on top.
  ctx.fillStyle = hair;
  const cap = (low) => {
    blob(ctx, [[-r * 0.9, low], [-r * 0.92, -r * 0.5], [-r * 0.3, -r * 1.1], [r * 0.4, -r * 1.08], [r * 0.92, -r * 0.5], [r * 0.9, low], [r * 0.6, -r * 0.5], [-r * 0.2, -r * 0.62], [-r * 0.7, -r * 0.4]]);
    ctx.fill();
  };
  if (back) {
    if (style === 'crop') {
      ctx.fillStyle = rgba(hair, 0.6);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.84, r * 0.95, 0, 0, Math.PI * 2); ctx.fill();
    } else if (style !== 'hood') {
      blob(ctx, [[-r * 0.92, r * 0.5], [-r * 0.95, -r * 0.5], [0, -r * 1.08], [r * 0.95, -r * 0.5], [r * 0.92, r * 0.5], [0, r * 0.8]]);
      ctx.fill();
    }
    if (style === 'bun') ellipse(ctx, 0, -r * 0.7, r * 0.42, r * 0.38, shadeHex(hair, 0.08));
    if (style === 'braids') {
      for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) ellipse(ctx, sx * r * 0.4, r * (0.6 + k * 0.32), r * 0.17, r * 0.2, shadeHex(hair, k % 2 ? 0.06 : 0));
    }
  } else if (style === 'short') {
    cap(-r * 0.1);
  } else if (style === 'crop') {
    ctx.fillStyle = rgba(hair, 0.55);
    blob(ctx, [[-r * 0.86, -r * 0.1], [-r * 0.8, -r * 0.7], [0, -r * 1.02], [r * 0.8, -r * 0.7], [r * 0.86, -r * 0.1], [r * 0.5, -r * 0.55], [-r * 0.5, -r * 0.55]]);
    ctx.fill();
  } else if (style === 'bun') {
    cap(r * 0.1);
    ellipse(ctx, r * 0.1, -r * 1.12, r * 0.42, r * 0.34, hair);
    line(ctx, r * 0.6, -r * 0.5, r * 0.72, r * 0.3, hair, 2);
  } else if (style === 'long') {
    blob(ctx, [[-r * 0.95, r * 0.6], [-r * 0.95, -r * 0.5], [-r * 0.2, -r * 1.12], [r * 0.6, -r * 1.0], [r * 0.95, -r * 0.4], [r * 0.95, r * 0.6], [r * 0.7, -r * 0.4], [-r * 0.1, -r * 0.7], [-r * 0.7, -r * 0.3]]);
    ctx.fill();
  } else if (style === 'braids') {
    blob(ctx, [[-r * 0.9, r * 0.1], [-r * 0.9, -r * 0.6], [0, -r * 1.1], [r * 0.9, -r * 0.6], [r * 0.9, r * 0.1], [r * 0.5, -r * 0.6], [-r * 0.5, -r * 0.6]]);
    ctx.fill();
    ctx.strokeStyle = rgba('#000', 0.3);
    ctx.lineWidth = 1.5;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * r * 0.3, -r * 1.0); ctx.lineTo(k * r * 0.4, -r * 0.6); ctx.stroke(); }
  }
  ctx.restore();
}

// --- bodies ------------------------------------------------------------------------------------
// pose: 'stand', 'hurt' (holding a broken hand), 'brace' (arms up under a
// weight), 'held' (one arm pinned out to the side), 'run' (from behind),
// 'sit' (a hospital chair).
function person(ctx, w, h, o) {
  const {
    coat, coat2 = shadeHex(coat, 0.16), legs = '#22202a', shoes = '#141014', skin, hair, style = 'short',
    s = 1, broad = 1, long = 0, pose = 'stand', back = false, beard, look = 0,
  } = o;
  ctx.save();
  ctx.translate(w / 2, h - 4);
  ctx.scale(s, s);
  const crouch = pose === 'hurt' ? 26 : pose === 'brace' ? 40 : 0;
  const sit = pose === 'sit';
  const hipY = sit ? -250 : -360 + crouch;
  const shY = hipY - 210 + (sit ? 10 : 0);
  const sw = 62 * broad;
  const sh = (c, a) => shadeHex(c, a);

  ctx.fillStyle = rgba('#000', 0.35);
  ctx.beginPath(); ctx.ellipse(0, 0, 76 * broad, 10, 0, 0, Math.PI * 2); ctx.fill();

  // Legs.
  const leg = (sx, col, fx = sx * 30, knee = 0) => {
    ctx.fillStyle = lin(ctx, 0, hipY, 0, 0, [[0, sh(col, 0.08)], [1, col]]);
    if (sit) {
      // Thighs toward us, shins down.
      blob(ctx, [[sx * 8, hipY - 10], [sx * 50, hipY - 10], [sx * 52, hipY + 40], [sx * 46, -20], [sx * 18, -20], [sx * 10, hipY + 40]]);
    } else {
      const kx = (sx * 24 + fx) / 2 + knee;
      poly(ctx, [[sx * 2, hipY - 6], [sx * 48, hipY - 6], [kx + sx * 22, hipY * 0.48], [fx + sx * 18, -16], [fx - sx * 16, -16], [kx - sx * 18, hipY * 0.48]]);
    }
    ctx.fill();
    ctx.fillStyle = shoes;
    const sx2 = sit ? sx * 32 : fx;
    blob(ctx, [[sx2 - 24, 0], [sx2 - 22, -18], [sx2 + 22, -18], [sx2 + 24, 0]]);
    ctx.fill();
  };
  if (pose === 'run') {
    leg(-1, sh(legs, -0.25), -60, -10);
    leg(1, legs, 34, 6);
  } else if (pose === 'brace' || pose === 'hurt') {
    leg(-1, sh(legs, back ? -0.2 : 0), -44, -12);
    leg(1, legs, 44, 12);
  } else {
    leg(-1, sh(legs, back ? -0.2 : 0));
    leg(1, legs);
  }

  // Torso: a coat, open or closed, with a hem that can run long.
  const hem = hipY + 40 + long;
  ctx.fillStyle = lin(ctx, -sw, 0, sw, 0, [[0, sh(coat, -0.3)], [0.35, coat2], [0.6, coat], [1, sh(coat, -0.38)]]);
  blob(ctx, [[-sw * 0.96, shY + 14], [-sw * 0.5, shY - 6], [sw * 0.5, shY - 6], [sw * 0.96, shY + 14], [sw * 0.92, hipY - 60], [sw * 0.98, hem], [0, hem + 8], [-sw * 0.98, hem], [-sw * 0.92, hipY - 60]]);
  ctx.fill();
  if (!back) {
    ctx.strokeStyle = rgba('#000', 0.28);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, shY + 20); ctx.lineTo(2, hem); ctx.stroke();
    o.torso?.(ctx, { shY, hipY, sw, hem });
  } else {
    ctx.strokeStyle = rgba('#000', 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-sw * 0.5, shY + 30); ctx.quadraticCurveTo(0, shY + 46, sw * 0.5, shY + 30); ctx.stroke();
    o.backTorso?.(ctx, { shY, hipY, sw, hem });
  }
  // Collar.
  ctx.fillStyle = sh(coat, -0.2);
  blob(ctx, [[-sw * 0.42, shY - 4], [0, shY + (back ? 6 : 34)], [sw * 0.42, shY - 4], [sw * 0.2, shY - 14], [-sw * 0.2, shY - 14]]);
  ctx.fill();

  // Arms. (sx is screen side; from behind the same shapes read as the other arm.)
  const sleeve = (pts, hand, col = coat) => {
    ctx.fillStyle = lin(ctx, 0, shY, 0, shY + 220, [[0, sh(col, 0.06)], [1, sh(col, -0.15)]]);
    blob(ctx, pts);
    ctx.fill();
    if (hand) ellipse(ctx, hand[0], hand[1], 14, 16, back ? sh(skin, -0.25) : skin);
  };
  const down = (sx) => sleeve([[sx * sw * 0.8, shY + 4], [sx * (sw + 14), shY + 30], [sx * (sw + 18), hipY + 10], [sx * (sw + 2), hipY + 14], [sx * (sw - 12), shY + 60]], [sx * (sw + 10), hipY + 30]);
  if (pose === 'stand' || pose === 'sit') {
    if (sit) {
      // Hands in the lap.
      for (const sx of [-1, 1]) sleeve([[sx * sw * 0.8, shY + 4], [sx * (sw + 12), shY + 40], [sx * (sw + 6), hipY - 20], [sx * 24, hipY + 4], [sx * 30, hipY - 30], [sx * (sw - 14), shY + 70]], [sx * 22, hipY + 4]);
    } else {
      down(-1);
      down(1);
    }
  } else if (pose === 'hurt') {
    // One hand held against the chest, cupped in the other.
    sleeve([[-sw * 0.8, shY + 4], [-(sw + 14), shY + 30], [-(sw + 4), shY + 150], [-10, shY + 120], [-12, shY + 96], [-(sw - 20), shY + 100]], null);
    sleeve([[sw * 0.8, shY + 4], [sw + 14, shY + 30], [sw, shY + 160], [6, shY + 140], [8, shY + 116], [sw - 20, shY + 110]], [4, shY + 132]);
    ellipse(ctx, -14, shY + 116, 16, 13, back ? sh(skin, -0.25) : '#b86a5a');
  } else if (pose === 'brace') {
    // Both arms up over the head, palms flat on whatever is coming down.
    for (const sx of [-1, 1]) sleeve([[sx * sw * 0.9, shY + 30], [sx * (sw + 14), shY - 6], [sx * (sw * 0.8 + 10), shY - 90], [sx * (sw * 0.6 + 30), shY - 140], [sx * (sw * 0.6 + 2), shY - 144], [sx * (sw * 0.8 - 26), shY - 90], [sx * sw * 0.5, shY + 10]], [sx * (sw * 0.6 + 16), shY - 152]);
  } else if (pose === 'held') {
    down(-1);
    // Pinned out to the side, at shoulder height, wrist turned.
    sleeve([[sw * 0.8, shY + 4], [sw + 10, shY - 4], [sw + 62, shY - 14], [sw + 66, shY + 12], [sw + 6, shY + 50]], [sw + 74, shY - 2]);
  } else if (pose === 'run') {
    // From behind: elbows out, one forward, one back.
    sleeve([[-sw * 0.8, shY + 4], [-(sw + 16), shY + 26], [-(sw + 40), shY + 110], [-(sw + 10), shY + 170], [-(sw - 8), shY + 150], [-(sw + 10), shY + 104], [-(sw - 12), shY + 60]], [-(sw - 6), shY + 172]);
    sleeve([[sw * 0.8, shY + 4], [sw + 16, shY + 26], [sw + 30, shY + 90], [sw + 20, shY + 60], [sw + 6, shY + 50]], null);
  }
  o.over?.(ctx, { shY, hipY, sw, hem });

  // Head.
  const r = 40 * (o.headScale || 1);
  const hy = shY - r * 1.2 + (pose === 'hurt' ? 8 : pose === 'brace' ? 16 : 0);
  const hx = pose === 'hurt' ? -6 : 0;
  headFront(ctx, hx, hy, r, { skin, hair, style, back, beard, look, tilt: pose === 'hurt' ? -0.12 : pose === 'held' ? -0.2 : 0 });
  o.head?.(ctx, hx, hy, r, back);
  ctx.restore();
}

// --- the cast ------------------------------------------------------------------------------------
// Matched to their Chapter One stances: Dowser's braids and rod, Paperweight's
// raised hand, Humdrum's headphones, Lukewarm's mug and bun.
export const LOOKS = {
  dowser: {
    coat: '#2a3a4e', coat2: '#3a4e66', legs: '#26303e', skin: '#6a4430', hair: '#141012', style: 'braids', broad: 1.02,
    // Co-op overalls under the jacket, a reflective band, a hazel rod in the pocket.
    torso: (c, { shY, hipY, hem }) => {
      poly(c, [[-30, shY + 24], [30, shY + 24], [34, hem - 10], [-34, hem - 10]], '#3a4a5e');
      c.fillStyle = rgba('#e8a030', 0.9);
      c.fillRect(-58, hipY - 40, 116, 9);
      line(c, 40, hipY - 120, 66, hipY - 230, '#6a4a2a', 4);
      line(c, 66, hipY - 230, 74, hipY - 256, '#6a4a2a', 3);
      line(c, 66, hipY - 230, 58, hipY - 258, '#6a4a2a', 3);
    },
    backTorso: (c, { hipY }) => {
      c.fillStyle = rgba('#e8a030', 0.9);
      c.fillRect(-60, hipY - 40, 120, 9);
      c.fillStyle = rgba('#e8e0c8', 0.7);
      c.font = 'bold 11px sans-serif';
      c.textAlign = 'center';
      c.fillText('VESPER WATER', 0, hipY - 130);
      c.fillText('CO-OP', 0, hipY - 116);
    },
  },
  paperweight: {
    coat: '#2e5a5a', coat2: '#3e7470', legs: '#2a2230', skin: '#e0b49a', hair: '#b0582e', style: 'long', broad: 0.86, long: 50,
    // A yellow scarf; a party-trick pebble on a string round the neck.
    torso: (c, { shY }) => {
      c.fillStyle = '#d8b040';
      blob(c, [[-34, shY - 4], [34, shY - 4], [30, shY + 30], [10, shY + 120], [-6, shY + 116], [0, shY + 30], [-30, shY + 26]]);
      c.fill();
      line(c, -16, shY + 20, -4, shY + 70, rgba('#e8e0d0', 0.6), 1.5);
      ellipse(c, -4, shY + 76, 6, 5, '#8a8a90');
    },
  },
  humdrum: {
    coat: '#55555e', coat2: '#6a6a74', legs: '#2a2a32', skin: '#b07a5a', hair: '#8a8278', style: 'crop', broad: 1.22, beard: '#6a625a',
    // A big grey jumper; the headphones he always has round his neck.
    torso: (c, { shY, hipY }) => {
      c.strokeStyle = rgba('#000', 0.15);
      c.lineWidth = 2;
      for (let y = shY + 40; y < hipY + 20; y += 18) { c.beginPath(); c.moveTo(-60, y); c.lineTo(60, y + 2); c.stroke(); }
    },
    head: (c, hx, hy, r) => {
      c.strokeStyle = '#141216';
      c.lineWidth = 6;
      c.beginPath(); c.arc(hx, hy + r * 1.3, r * 0.95, Math.PI * 0.05, Math.PI * 0.95); c.stroke();
      ellipse(c, hx - r * 0.95, hy + r * 1.42, 12, 15, '#1a181e');
      ellipse(c, hx + r * 0.95, hy + r * 1.42, 12, 15, '#1a181e');
    },
  },
  lukewarm: {
    coat: '#9a5a4a', coat2: '#b4705c', legs: '#3a3240', skin: '#d8a88a', hair: '#3a2418', style: 'bun', s: 0.92, broad: 0.96,
    // A long cardigan over an apron; the mug.
    torso: (c, { shY, hem }) => {
      poly(c, [[-26, shY + 30], [26, shY + 30], [30, hem - 30], [-30, hem - 30]], '#e0d6c4');
      line(c, -26, shY + 34, -40, shY + 6, '#e0d6c4', 3);
      line(c, 26, shY + 34, 40, shY + 6, '#e0d6c4', 3);
    },
    mug: true,
  },
  lodestar: {
    coat: '#9a7a58', coat2: '#b8946a', legs: '#2a2630', skin: '#e8c0a0', hair: '#d8d0c0', style: 'short', s: 1.04, long: 90,
    // The long camel coat; a hero's pin she still wears off duty.
    torso: (c, { shY }) => {
      poly(c, [[-22, shY + 20], [22, shY + 20], [10, shY + 110], [-10, shY + 110]], '#3a3440');
      c.fillStyle = '#e8c878';
      c.beginPath(); c.arc(-36, shY + 50, 7, 0, Math.PI * 2); c.fill();
    },
  },
};

function mugOver(c, { shY }) {
  // Both hands round a mug at the chest.
  roundRect(c, -18, shY + 92, 36, 40, 5, '#3a6a8a');
  c.fillStyle = rgba('#000', 0.3);
  c.fillRect(-18, shY + 92, 36, 5);
  ellipse(c, -22, shY + 112, 13, 14, '#d8a88a');
  ellipse(c, 22, shY + 112, 13, 14, '#d8a88a');
}

// A crowd: the same build, other lives.
const CROWD = [
  { coat: '#3a3a44', skin: '#c89a7a', hair: '#2a1e18', style: 'short' },
  { coat: '#5a2a30', skin: '#e0b8a0', hair: '#c8a060', style: 'long', broad: 0.88, long: 40 },
  { coat: '#2a4030', skin: '#8a5a40', hair: '#141012', style: 'crop', broad: 1.1 },
  { coat: '#4a4038', skin: '#d0a080', hair: '#5a3a28', style: 'bun', broad: 0.9, s: 0.94 },
  { coat: '#262a3a', skin: '#a8785a', hair: '#1a1416', style: 'hood', broad: 1.04 },
  { coat: '#6a5a40', skin: '#e8c8b0', hair: '#8a8a88', style: 'short', broad: 1.06, beard: '#9a9890' },
  { coat: '#3a2a40', skin: '#704830', hair: '#0e0a0c', style: 'braids', broad: 0.92 },
  { coat: '#2e3a3a', skin: '#c08868', hair: '#3a2a20', style: 'long', broad: 0.9, s: 0.9, long: 20 },
];

// --- Parallax, near --------------------------------------------------------------------------------
// From a few metres: a smooth helmet with a single seam of light, a long
// dark coat cut like a uniform nobody else wears, gloves. Nothing that says
// anything about who is inside.
function parallaxNear(ctx, w, h, { back = false, reach = false } = {}) {
  const cx = w / 2;
  const R = rng(31);
  // The light she gives off, low, as if from below.
  glow(ctx, cx, h * 0.55, w * 0.55, '#7b5cc0', 0.12);
  // Coat.
  const coat = lin(ctx, cx - 150, 0, cx + 150, 0, [[0, '#06040a'], [0.35, '#1a1226'], [0.55, '#2a1c3c'], [0.75, '#140c1e'], [1, '#05030a']]);
  ctx.fillStyle = coat;
  blob(ctx, [[cx - 118, 290], [cx - 70, 262], [cx + 70, 262], [cx + 118, 290], [cx + 128, 560], [cx + 150, 1010], [cx + 40, 1040], [cx, 1020], [cx - 40, 1040], [cx - 150, 1010], [cx - 128, 560]]);
  ctx.fill();
  // Seams and a belt, so the cloth reads at close range.
  ctx.strokeStyle = rgba('#a98ce0', 0.18);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, 300); ctx.lineTo(cx + (back ? 0 : 6), 1020); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const x = cx - 100 + i * 66 + R() * 10;
    ctx.beginPath(); ctx.moveTo(x, 600); ctx.quadraticCurveTo(x + 10, 820, x - 6 + R() * 12, 1010); ctx.stroke();
  }
  ctx.fillStyle = '#0a0610';
  ctx.fillRect(cx - 120, 560, 240, 22);
  ctx.strokeStyle = rgba('#cbb8ee', 0.3);
  ctx.strokeRect(cx - 14, 562, 28, 18);
  // Shoulders: a hard yoke.
  ctx.fillStyle = lin(ctx, 0, 250, 0, 330, [[0, '#2e2242'], [1, '#100a18']]);
  blob(ctx, [[cx - 124, 300], [cx - 80, 256], [cx + 80, 256], [cx + 124, 300], [cx + 90, 330], [cx - 90, 330]]);
  ctx.fill();
  // Arms and gloves.
  const arm = (sx, out) => {
    ctx.fillStyle = lin(ctx, 0, 280, 0, 640, [[0, '#1a1226'], [1, '#08050c']]);
    if (out) {
      blob(ctx, [[cx + sx * 110, 290], [cx + sx * 134, 320], [cx + sx * 200, 420], [cx + sx * 208, 470], [cx + sx * 180, 470], [cx + sx * 112, 380]]);
      ctx.fill();
      ellipse(ctx, cx + sx * 202, 490, 20, 26, '#0c0810');
    } else {
      blob(ctx, [[cx + sx * 112, 290], [cx + sx * 134, 320], [cx + sx * 146, 600], [cx + sx * 140, 650], [cx + sx * 112, 646], [cx + sx * 100, 420]]);
      ctx.fill();
      ellipse(ctx, cx + sx * 128, 676, 20, 30, '#0c0810');
      ctx.strokeStyle = rgba('#cbb8ee', 0.2);
      ctx.beginPath(); ctx.moveTo(cx + sx * 112, 648); ctx.lineTo(cx + sx * 142, 650); ctx.stroke();
    }
  };
  arm(-1, false);
  arm(1, reach);
  // Helmet: smooth, darker than the room, one seam of light where a face would be.
  ctx.fillStyle = rad(ctx, cx - 20, 120, 120, [[0, back ? '#1a1226' : '#33244a'], [0.5, '#140c20'], [1, '#030205']]);
  ctx.beginPath();
  ctx.moveTo(cx - 54, 262);
  ctx.quadraticCurveTo(cx - 74, 140, cx - 50, 80);
  ctx.quadraticCurveTo(cx, 28, cx + 50, 80);
  ctx.quadraticCurveTo(cx + 74, 140, cx + 54, 262);
  ctx.quadraticCurveTo(cx, 278, cx - 54, 262);
  ctx.fill();
  ctx.strokeStyle = rgba('#d8c8ff', back ? 0.12 : 0.28);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx - 12, 140, 38, 70, 0, Math.PI * 1.08, Math.PI * 1.45); ctx.stroke();
  // The ring behind the head.
  ctx.strokeStyle = rgba('#7b5cc0', 0.45);
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, 150, 112, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke();
  if (!back) {
    glow(ctx, cx, 156, 40, '#cbb8ff', 0.45);
    ctx.fillStyle = lin(ctx, 0, 84, 0, 240, [[0, 'rgba(240,232,255,0)'], [0.3, '#f4eeff'], [0.7, '#f4eeff'], [1, 'rgba(240,232,255,0)']]);
    ctx.fillRect(cx - 2.5, 84, 5, 156);
  } else {
    // From behind: a seam down the back of the helmet, the same light, fainter.
    ctx.fillStyle = rgba('#cbb8ff', 0.18);
    ctx.fillRect(cx - 1.5, 70, 3, 190);
  }
  // Motes of the violet light drifting off her.
  for (let i = 0; i < 40; i++) {
    const x = cx + (R() - 0.5) * 300;
    const y = 200 + R() * 820;
    ctx.fillStyle = rgba('#b8a0ff', 0.08 + R() * 0.25);
    ctx.fillRect(x, y, 2, 2);
  }
}

// --- registration ---------------------------------------------------------------------------------------
export function registerFive(scene) {
  for (const [id, look] of Object.entries(LOOKS)) {
    const o = { ...look, over: look.mug ? mugOver : undefined };
    paintTexture(scene, `f_${id}`, W, H, (ctx, w, h) => person(ctx, w, h, o));
    paintTexture(scene, `f_${id}_back`, W, H, (ctx, w, h) => person(ctx, w, h, { ...o, back: true, over: undefined }));
    paintTexture(scene, `f_${id}_sit`, W, H, (ctx, w, h) => person(ctx, w, h, { ...o, pose: 'sit', over: undefined }));
  }
  const L = LOOKS;
  paintTexture(scene, 'f_humdrum_hurt', W, H, (ctx, w, h) => person(ctx, w, h, { ...L.humdrum, pose: 'hurt' }));
  paintTexture(scene, 'f_dowser_run', W, H, (ctx, w, h) => person(ctx, w, h, { ...L.dowser, pose: 'run', back: true }));
  paintTexture(scene, 'f_paperweight_brace', W, H, (ctx, w, h) => person(ctx, w, h, { ...L.paperweight, pose: 'brace' }));
  paintTexture(scene, 'f_lukewarm_held', W, H, (ctx, w, h) => person(ctx, w, h, { ...L.lukewarm, pose: 'held' }));
  paintTexture(scene, 'f_lukewarm_hurt', W, H, (ctx, w, h) => person(ctx, w, h, { ...L.lukewarm, pose: 'hurt' }));
  CROWD.forEach((c, i) => {
    paintTexture(scene, `f_crowd${i}`, W, H, (ctx, w, h) => person(ctx, w, h, c));
    paintTexture(scene, `f_crowd${i}_back`, W, H, (ctx, w, h) => person(ctx, w, h, { ...c, back: true }));
  });
  // A girl of about seven, painted to the same scale as everyone else.
  const kid = { coat: '#c8a040', coat2: '#d8b458', legs: '#3a3a5a', skin: '#e0b090', hair: '#4a2a18', style: 'braids', s: 0.62, broad: 0.9 };
  paintTexture(scene, 'f_child', W, H, (ctx, w, h) => person(ctx, w, h, kid));
  paintTexture(scene, 'f_child_back', W, H, (ctx, w, h) => person(ctx, w, h, { ...kid, back: true }));
  paintTexture(scene, 'f_child_hurt', W, H, (ctx, w, h) => person(ctx, w, h, { ...kid, pose: 'hurt' }));
  paintTexture(scene, 'f_px', 420, 1060, (ctx, w, h) => parallaxNear(ctx, w, h));
  paintTexture(scene, 'f_px_back', 420, 1060, (ctx, w, h) => parallaxNear(ctx, w, h, { back: true }));
  paintTexture(scene, 'f_px_reach', 420, 1060, (ctx, w, h) => parallaxNear(ctx, w, h, { reach: true }));
}

export const CROWD_COUNT = CROWD.length;
