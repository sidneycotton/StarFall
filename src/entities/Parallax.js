import Phaser from 'phaser';

// Parallax as a procedural cut-out rig. No sprite sheets: posture, gait,
// breath and the cape are all computed, so the same body can be hungover in
// a silk robe and, seconds later, precise inside the helmet.
//
// Coordinates are local to a container whose origin is between the feet.
// The rig is authored facing right; the container's scaleX flips it.

const THIGH = 78;
const SHIN = 80;
const UPPER = 60;
const FORE = 60;
const TORSO = 108;

const PRESETS = {
  // Sitting on the edge of the bed, elbows on knees, head hanging.
  sitBed: { hipY: -86, hipX: -6, lean: 0.55, head: 0.5, thighF: -1.45, shinF: 1.25, thighB: -1.35, shinB: 1.4, upperF: -0.55, foreF: -2.1, upperB: -0.45, foreB: -2.0 },
  // Upright in the eclipse chair, one hand on the altar.
  sitChair: { hipY: -98, hipX: 0, lean: -0.04, head: 0.04, thighF: -1.5, shinF: 1.45, thighB: -1.45, shinB: 1.5, upperF: -0.9, foreF: -0.6, upperB: -0.35, foreB: -0.9 },
  // The hand withdrawn from the altar, resting on a thigh.
  sitChairHandAway: { hipY: -98, hipX: 0, lean: 0.02, head: 0.1, thighF: -1.5, shinF: 1.45, thighB: -1.45, shinB: 1.5, upperF: -0.3, foreF: -0.9, upperB: -0.35, foreB: -0.9 },
  // Both hands to the back of the head, gathering hair.
  gatherHair: { hipY: -154, hipX: 0, lean: 0.02, head: 0.25, thighF: -0.04, shinF: 0.06, thighB: 0.06, shinB: 0.04, upperF: -2.75, foreF: -1.96, upperB: -2.6, foreB: -1.9 },
  // Raising the helmet above the head.
  raiseHelmet: { hipY: -156, hipX: 0, lean: -0.06, head: -0.25, thighF: -0.05, shinF: 0.05, thighB: 0.08, shinB: 0.02, upperF: -2.9, foreF: -0.15, upperB: -2.75, foreB: -0.25 },
  // Settling it down.
  lowerHelmet: { hipY: -153, hipX: 0, lean: 0.0, head: 0.08, thighF: -0.05, shinF: 0.05, thighB: 0.08, shinB: 0.02, upperF: -2.2, foreF: -1.72, upperB: -2.1, foreB: -1.7 },
  // Holding the helmet at chest height, looking at it.
  holdHelmet: { hipY: -151, hipX: 0, lean: 0.08, head: 0.35, thighF: -0.05, shinF: 0.05, thighB: 0.08, shinB: 0.02, upperF: -0.5, foreF: -1.5, upperB: -0.4, foreB: -1.4 },
  // Standing tall: the persona.
  standTall: { hipY: -158, hipX: 0, lean: -0.05, head: -0.06, thighF: -0.06, shinF: 0.02, thighB: 0.1, shinB: 0.0, upperF: 0.08, foreF: -0.12, upperB: -0.08, foreB: -0.15 },
  // Reaching toward the wall of profiles.
  reach: { hipY: -156, hipX: 0, lean: -0.02, head: -0.12, thighF: -0.25, shinF: 0.12, thighB: 0.18, shinB: 0.04, upperF: -1.45, foreF: -0.25, upperB: 0.05, foreB: -0.2 },
  // Frozen, watching.
  still: { hipY: -157, hipX: 0, lean: 0.0, head: -0.1, thighF: -0.08, shinF: 0.03, thighB: 0.1, shinB: 0.0, upperF: 0.04, foreF: -0.25, upperB: -0.06, foreB: -0.2 },
  // Bending to touch the sheet.
  lean: { hipY: -150, hipX: -4, lean: 0.55, head: 0.35, thighF: -0.2, shinF: 0.25, thighB: 0.15, shinB: 0.2, upperF: -1.2, foreF: 0.2, upperB: -0.2, foreB: -0.5 },
};

const KEYS = Object.keys(PRESETS.still);

function end(x, y, angle, len) {
  return { x: x - Math.sin(angle) * len, y: y + Math.cos(angle) * len };
}

function rot(dx, dy, a) {
  const c = Math.cos(a); const s = Math.sin(a);
  return { x: dx * c - dy * s, y: dx * s + dy * c };
}

export class Parallax {
  constructor(scene, x, y, { outfit = 'robe', helmet = false, scale = 1.24 } = {}) {
    this.scene = scene;
    this.size = scale;
    this.root = scene.add.container(x, y).setScale(scale);
    this.facing = 1;
    this.vx = 0;
    this.posture = 0;   // 0 hungover … 1 precise
    this.phase = 0;
    this.time = Math.random() * 10;
    this.breath = 0.25; // breaths/sec
    this.fear = 0;      // trembling, quick breath
    this.visorLevel = 0;
    this.capeWind = 0;
    this.presetFrom = null;
    this.presetTo = null;
    this.presetT = 1;
    this.lastPose = null;
    this.stepCallback = null;
    this.lastStepSign = 0;
    this.lookOffset = 0;

    this.shadow = scene.add.image(x, y + 2, 'light_soft').setTint(0x000000).setAlpha(0.6).setScale(0.75 * scale, 0.12 * scale);

    const add = (key, ox, oy) => scene.add.image(0, 0, key).setOrigin(ox, oy);
    this.capeG = scene.add.graphics();
    this.upperB = add('px_upper', 0.5, 0.05);
    this.foreB = add('px_fore', 0.5, 0.04);
    this.thighB = add('px_thigh', 0.5, 0.04);
    this.shinB = add('px_shin', 20 / 70, 0.03);
    this.thighF = add('px_thigh', 0.5, 0.04);
    this.shinF = add('px_shin', 20 / 70, 0.03);
    this.robeG = scene.add.graphics();
    this.torso = add('px_torso', 45 / 100, 118 / 130);
    this.halo = add('px_halo', 0.5, 0.5).setAlpha(0);
    this.head = add('px_head_hair', 22 / 60, 62 / 74);
    this.visor = add('px_visor', 0.5, 0.5).setBlendMode(Phaser.BlendModes.ADD).setTint(0xcbb2ff).setAlpha(0);
    this.visorGlow = add('light_soft', 0.5, 0.5).setBlendMode(Phaser.BlendModes.ADD).setTint(0x8a5cff).setScale(0.35).setAlpha(0);
    this.upperF = add('px_upper', 0.5, 0.05);
    this.foreF = add('px_fore', 0.5, 0.04);
    // Something held in the front hand (the helmet during the equip beat).
    this.held = null;

    this.root.add([this.capeG, this.upperB, this.foreB, this.thighB, this.shinB, this.thighF, this.shinF, this.robeG, this.torso, this.halo, this.head, this.visorGlow, this.visor, this.upperF, this.foreF]);
    [this.upperB, this.foreB, this.thighB, this.shinB].forEach((p) => p.setTint(0x6c6478));

    this.setOutfit(outfit);
    this.setHelmet(helmet, true);
  }

  get x() { return this.root.x; }
  set x(v) { this.root.x = v; }

  setDepth(d) {
    this.root.setDepth(d);
    this.shadow.setDepth(d - 1);
    return this;
  }

  setVisible(v) {
    this.root.setVisible(v);
    this.shadow.setVisible(v);
    return this;
  }

  setOutfit(outfit) {
    this.outfit = outfit;
    const robe = outfit === 'robe';
    this.torso.setTexture(robe ? 'robe_torso' : 'px_torso');
    [this.upperF, this.upperB].forEach((p) => p.setTexture(robe ? 'robe_upper' : 'px_upper'));
    [this.foreF, this.foreB].forEach((p) => p.setTexture(robe ? 'robe_fore' : 'px_fore'));
    [this.thighF, this.thighB].forEach((p) => p.setTexture(robe ? 'robe_thigh' : 'px_thigh'));
    [this.shinF, this.shinB].forEach((p) => p.setTexture(robe ? 'robe_shin' : 'px_shin'));
    // The robe's sleeves are wider; keep their origin centred on the joint.
    this.foreF.setOrigin(0.5, 0.04);
    this.foreB.setOrigin(0.5, 0.04);
  }

  setHelmet(on, instant = false) {
    this.helmet = on;
    this.head.setTexture(on ? 'px_helmet' : (this.hideHead ? 'px_helmet' : 'px_head_hair'));
    if (instant) {
      this.halo.setAlpha(on ? 0.9 : 0);
      this.visorLevel = on ? 1 : 0;
    }
  }

  // Front hand position in world space (for held props).
  handWorld() {
    const h = this.hand || { x: 0, y: -100 };
    return { x: this.root.x + h.x * this.root.scaleX, y: this.root.y + h.y * this.size };
  }

  holdItem(image) {
    this.held = image;
    if (image) this.root.add(image);
  }

  // Blend toward a named preset (or back to procedural motion with null).
  pose(name, duration = 600, ease = 'Sine.easeInOut') {
    this.presetFrom = this.lastPose ? { ...this.lastPose } : null;
    this.presetTo = name;
    this.presetT = 0;
    this.scene.tweens.killTweensOf(this, ['presetT']);
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: this, presetT: 1, duration, ease, onComplete: resolve });
    });
  }

  face(dir, animate = true) {
    if (dir === this.facing || dir === 0) return;
    this.facing = dir;
    if (!animate) {
      this.root.scaleX = dir * this.size;
      return;
    }
    // A quick 2.5D turn: squash through zero width.
    this.scene.tweens.killTweensOf(this.root, ['scaleX']);
    this.scene.tweens.add({ targets: this.root, scaleX: dir * this.size, duration: 160, ease: 'Sine.easeInOut' });
  }

  proceduralPose(dt) {
    const p = this.posture;
    const speed = Math.abs(this.vx);
    const run = Phaser.Math.Clamp((speed - 200) / 260, 0, 1);
    const moving = Phaser.Math.Clamp(speed / 120, 0, 1);

    // Step frequency follows distance travelled, so feet never skate badly.
    const stride = Phaser.Math.Linear(Phaser.Math.Linear(70, 92, p), 150, run);
    this.phase += (speed * dt) / stride;
    const ph = this.phase;
    const s = Math.sin(ph);
    const c = Math.cos(ph);

    const ampT = moving * Phaser.Math.Linear(Phaser.Math.Linear(0.34, 0.46, p), 0.9, run);
    const ampK = moving * Phaser.Math.Linear(Phaser.Math.Linear(0.5, 0.55, p), 1.25, run);
    const ampA = moving * Phaser.Math.Linear(Phaser.Math.Linear(0.18, 0.3, p), 0.95, run);

    // Hungover sway: slow, irregular — a body that would rather be lying down.
    const sway = (1 - p) * (Math.sin(this.time * 0.9) * 0.03 + Math.sin(this.time * 0.37) * 0.025);
    const breathe = Math.sin(this.time * Math.PI * 2 * this.breath);
    const tremble = this.fear * Math.sin(this.time * 47) * 0.012;

    const pose = {
      hipY: -Phaser.Math.Linear(150, 157, p) + Math.abs(c) * moving * Phaser.Math.Linear(4, 9, run) - run * 6,
      hipX: 0,
      lean: Phaser.Math.Linear(0.12, -0.02, p) + sway + run * 0.2 + moving * 0.03 + breathe * 0.006 + tremble,
      head: Phaser.Math.Linear(0.36, 0.0, p) - run * 0.12 + Math.sin(this.time * 0.5) * 0.03 * (1 - p) + this.lookOffset,
      thighF: -s * ampT - run * 0.15,
      shinF: Math.max(0, Math.sin(ph + 1.3)) * ampK + 0.06,
      thighB: s * ampT - run * 0.15,
      shinB: Math.max(0, Math.sin(ph + 1.3 + Math.PI)) * ampK + 0.06,
      upperF: s * ampA + Phaser.Math.Linear(0.06, -0.02, p) - run * 0.1,
      foreF: -Phaser.Math.Linear(0.15, 0.25, p) - run * 1.25 - moving * 0.1,
      upperB: -s * ampA + Phaser.Math.Linear(0.04, -0.04, p) - run * 0.1,
      foreB: -Phaser.Math.Linear(0.12, 0.25, p) - run * 1.25 - moving * 0.1,
    };

    // Footstep events at the bottom of each stride.
    const sign = Math.sign(s);
    if (moving > 0.3 && sign !== this.lastStepSign) {
      this.lastStepSign = sign;
      this.stepCallback?.(run > 0.5 ? 'run' : (this.outfit === 'robe' ? 'soft' : 'boot'));
    }
    return pose;
  }

  update(dt) {
    this.time += dt;
    let pose = this.proceduralPose(dt);

    if (this.presetTo || this.presetFrom) {
      const from = this.presetFrom || pose;
      const to = this.presetTo ? PRESETS[this.presetTo] : pose;
      const t = this.presetT;
      const blended = {};
      KEYS.forEach((k) => { blended[k] = Phaser.Math.Linear(from[k], to[k], t); });
      if (this.presetTo) {
        // Keep the body breathing inside a held pose.
        blended.lean += Math.sin(this.time * Math.PI * 2 * this.breath) * 0.008 + this.fear * Math.sin(this.time * 41) * 0.01;
      }
      pose = blended;
      if (!this.presetTo && t >= 1) this.presetFrom = null;
    }
    this.lastPose = pose;
    this.applyPose(pose);
    this.drawCape(dt, pose);
    this.drawRobe(pose);

    // Visor & halo.
    const flicker = 0.92 + Math.sin(this.time * 31) * 0.03 + (Math.random() < 0.01 ? -0.3 : 0);
    const lvl = this.helmet ? this.visorLevel * flicker : 0;
    this.visor.setAlpha(lvl);
    this.visorGlow.setAlpha(lvl * 0.35);

    this.shadow.x = this.root.x + (pose.hipX || 0) * this.facing * this.size;
    this.shadow.y = this.root.y + 2;
  }

  applyPose(P) {
    const hip = { x: P.hipX, y: P.hipY };
    const lean = P.lean;

    // Legs: back first.
    const legs = [[this.thighB, this.shinB, P.thighB, P.shinB, -3], [this.thighF, this.shinF, P.thighF, P.shinF, 3]];
    legs.forEach(([thigh, shin, a, k, dx]) => {
      const h = { x: hip.x + dx, y: hip.y };
      thigh.setPosition(h.x, h.y).setRotation(a);
      const knee = end(h.x, h.y, a, THIGH);
      shin.setPosition(knee.x, knee.y).setRotation(a + k);
    });

    this.torso.setPosition(hip.x, hip.y + 4).setRotation(lean);
    const neck = rot(-6, -TORSO, lean);
    const neckP = { x: hip.x + neck.x, y: hip.y + neck.y };
    this.neck = neckP;
    const headA = lean + P.head;
    this.head.setPosition(neckP.x, neckP.y + 2).setRotation(headA);

    const hc = rot(4, -34, headA);
    this.halo.setPosition(neckP.x + hc.x - 16, neckP.y + hc.y - 4).setRotation(headA * 0.4 + Math.sin(this.time * 0.6) * 0.03);
    const vc = rot(23, -32, headA);
    this.visor.setPosition(neckP.x + vc.x, neckP.y + vc.y).setRotation(headA);
    this.visorGlow.setPosition(neckP.x + vc.x, neckP.y + vc.y);

    const shF = rot(6, -92, lean);
    const shB = rot(-12, -94, lean);
    const arms = [[this.upperB, this.foreB, shB, P.upperB, P.foreB], [this.upperF, this.foreF, shF, P.upperF, P.foreF]];
    arms.forEach(([up, fo, sh, a, e], i) => {
      const s = { x: hip.x + sh.x, y: hip.y + sh.y };
      up.setPosition(s.x, s.y).setRotation(a);
      const el = end(s.x, s.y, a, UPPER);
      fo.setPosition(el.x, el.y).setRotation(a + e);
      if (i === 1) this.hand = end(el.x, el.y, a + e, FORE + 6);
    });

    if (this.held && this.hand) {
      // Held object sits between both hands (approximation: front hand).
      this.held.setPosition(this.hand.x + 6, this.hand.y - 10);
    }
  }

  drawCape(dt, P) {
    const g = this.capeG;
    g.clear();
    if (this.outfit !== 'suit') return;
    const lean = P.lean;
    const anchor = rot(-14, -100, lean);
    const ax = P.hipX + anchor.x;
    const ay = P.hipY + anchor.y;
    const speed = Math.abs(this.vx);
    const groundY = -6;
    const len = Math.max(60, groundY - ay);
    const trail = speed * 0.16 + this.capeWind;
    const N = 14;
    const outer = [];
    const inner = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const wave = Math.sin(this.time * (2.2 + speed * 0.006) - t * 4.5) * (2 + speed * 0.025 + this.capeWind * 0.1) * t;
      const lift = Math.min(len * 0.35, trail * 0.7) * Math.pow(t, 1.6);
      const y = ay + t * len - lift;
      const back = 8 + t * 34 + trail * Math.pow(t, 1.25) + wave;
      outer.push([ax - back, y]);
      inner.push([ax - back + 14 + t * 30 + (P.thighB > 0.2 ? P.thighB * 10 : 0), y]);
    }
    // Heavy cloth: near-black body, a violet lining glimpsed at the edge.
    g.fillStyle(0x07040b, 1);
    g.beginPath();
    g.moveTo(ax + 6, ay - 4);
    outer.forEach(([x, y]) => g.lineTo(x, y));
    for (let i = inner.length - 1; i >= 0; i--) g.lineTo(inner[i][0], inner[i][1]);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x2a1640, 0.9);
    g.beginPath();
    outer.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = outer.length - 1; i >= 0; i--) g.lineTo(outer[i][0] + 3.5, outer[i][1]);
    g.closePath();
    g.fillPath();
    g.lineStyle(1, 0xa9a4b6, 0.18);
    g.beginPath();
    g.moveTo(outer[N][0], outer[N][1]);
    g.lineTo(inner[N][0], inner[N][1]);
    g.strokePath();
  }

  drawRobe(P) {
    const g = this.robeG;
    g.clear();
    if (this.outfit !== 'robe') return;
    const hipX = P.hipX; const hipY = P.hipY;
    const kF = end(hipX + 3, hipY, P.thighF, THIGH);
    const kB = end(hipX - 3, hipY, P.thighB, THIGH);
    const fF = end(kF.x, kF.y, P.thighF + P.shinF, SHIN * 0.8);
    const fB = end(kB.x, kB.y, P.thighB + P.shinB, SHIN * 0.8);
    const sitting = P.hipY > -120;
    const drag = Math.abs(this.vx) * 0.05;
    const sway = Math.sin(this.time * 1.3) * 2;
    // Long silk dressing gown: falls to the ankles, trails slightly, opens at the front.
    const back = sitting
      ? [[hipX - 26, hipY - 4], [hipX - 30, hipY + 30], [Math.min(fB.x, fF.x) - 12, Math.max(fB.y, fF.y) - 6]]
      : [[hipX - 24, hipY - 8], [hipX - 30 - drag * 0.5, hipY + 70], [Math.min(fB.x, kB.x) - 22 - drag + sway, -14]];
    const front = sitting
      ? [[kF.x + 12, kF.y + 6], [fF.x + 8, fF.y - 10]]
      : [[Math.max(kF.x, kB.x) + 12, Math.max(kF.y, kB.y)], [Math.max(fF.x, fB.x) + 6 + sway * 0.5, -20]];
    g.fillStyle(0x170a1f, 1);
    g.beginPath();
    g.moveTo(hipX + 20, hipY - 8);
    g.lineTo(front[0][0], front[0][1]);
    g.lineTo(front[1][0], front[1][1]);
    g.lineTo(back[2][0], back[2][1]);
    g.lineTo(back[1][0], back[1][1]);
    g.lineTo(back[0][0], back[0][1]);
    g.closePath();
    g.fillPath();
    // Satin sheen down the front edge, and one long fold.
    g.fillStyle(0x4a2560, 0.85);
    g.beginPath();
    g.moveTo(hipX + 20, hipY - 8);
    g.lineTo(front[0][0], front[0][1]);
    g.lineTo(front[1][0], front[1][1]);
    g.lineTo(front[1][0] - 6, front[1][1]);
    g.lineTo(front[0][0] - 6, front[0][1]);
    g.lineTo(hipX + 14, hipY - 8);
    g.closePath();
    g.fillPath();
    g.lineStyle(1.5, 0x2c1438, 0.9);
    g.beginPath();
    g.moveTo(hipX - 6, hipY + 4);
    g.lineTo((back[2][0] + front[1][0]) / 2 - 6, -18);
    g.strokePath();
  }

  destroy() {
    this.root.destroy();
    this.shadow.destroy();
  }
}
