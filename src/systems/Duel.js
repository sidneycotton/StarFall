import Phaser from 'phaser';
import { input } from './Input.js';
import { bus } from '../core/EventBus.js';
import { settings } from '../core/Settings.js';
import { ui } from '../ui/UI.js';
import { audio } from '../audio/AudioEngine.js';
import { speakModulated } from '../audio/VoiceModulator.js';
import * as sfx from '../audio/sfx.js';
import { RECORD } from '../data/record.js';

// One-on-one fight on a flat stage. Star is the player: move, strike (action)
// and dodge (dodge verb). Parallax guards by default — striking into the
// guard is parried — and opens up only after committing to an attack.
// Every attack is telegraphed (visor flare, glint, a rising tone). Dodging
// through the blow at the last moment slows time and leaves him wide open.
// Nobody dies here: being hit staggers, and the Record notes it.

const ADD = Phaser.BlendModes.ADD;

const PHASES = {
  1: { tell: 760, guardMin: 1100, guardMax: 2000, bolt: 0 },
  2: { tell: 560, guardMin: 750, guardMax: 1450, bolt: 0.4 },
};

export class Duel {
  constructor(scene, { star, foe, player, minX, maxX, groundY, onStarHit, onFoeHit }) {
    this.scene = scene;
    this.star = star;
    this.foe = foe;
    this.player = player;
    this.minX = minX;
    this.maxX = maxX;
    this.groundY = groundY;
    this.onStarHit = onStarHit;
    this.onFoeHit = onFoeHit;
    this.active = false;
    this.stats = { hitsTaken: 0, perfect: 0, parried: 0 };
    this.seenHints = new Set();
    this.bolts = [];
    this.glint = scene.add.image(0, 0, 'spark').setBlendMode(ADD).setTint(0xd8c8ff).setAlpha(0).setDepth(80);
    this.sparks = scene.add.particles(0, 0, 'mote', {
      speed: { min: 120, max: 420 }, angle: { min: 0, max: 360 }, lifespan: { min: 200, max: 520 },
      scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false,
    }).setDepth(81);
  }

  // Run one phase until Star lands `hits` blows. Resolves with stats.
  run(phase, { hits = 3, barks = [], starBarks = [] } = {}) {
    const assist = settings.get('assist') || 'standard';
    this.relaxed = assist === 'relaxed';
    this.auto = assist === 'auto';
    const P = PHASES[phase];
    this.P = {
      ...P,
      tell: P.tell * (this.relaxed ? 1.35 : 1),
      perfect: this.relaxed ? 360 : 230,
      vulnLong: 1750 * (this.relaxed ? 1.3 : 1),
      vulnShort: 700 * (this.relaxed ? 1.3 : 1),
    };
    this.phase = phase;
    this.need = hits;
    this.hits = 0;
    this.barks = [...barks];
    this.starBarks = [...starBarks];
    this.barkClock = 5;
    this.active = true;
    this.s = { state: 'free', t: 0, invuln: 0, dodgeAt: -9999, cool: 0 };
    this.f = { state: 'guard', t: 0, next: this.guardTime() + 600 };
    this.clock = 0;
    this.player.enabled = true;
    this.player.lockFacing = true;
    this.player.setBounds(this.minX, this.maxX);
    this.starPose = null;
    this.setStarPose('stance');
    this.foe.pose('guard', 400);
    ui.touch.setCombat(true);
    ui.touch.setMovement(true);
    this.offStrike = input.pushActionHandler(() => this.strike());
    this.offDodge = bus.on('input:dodge', () => this.dodge());
    return new Promise((resolve) => { this.resolve = resolve; });
  }

  stop() {
    this.active = false;
    this.offStrike?.();
    this.offDodge?.();
    this.offStrike = null;
    this.offDodge = null;
    this.player.enabled = false;
    this.player.lockFacing = false;
    this.star.vx = 0;
    ui.touch.setCombat(false);
    ui.touch.setMovement(false);
    ui.hint('');
    this.bolts.forEach((b) => b.destroy());
    this.bolts = [];
    this.glint.setAlpha(0);
    this.foe.visorLevel = 1;
    this.setSlow(1);
  }

  guardTime() {
    return Phaser.Math.Between(this.P.guardMin, this.P.guardMax);
  }

  hint(key, text, ms = 4200) {
    if (this.seenHints.has(key)) return;
    this.seenHints.add(key);
    ui.hint(text, ms);
  }

  setStarPose(name, ms = 160) {
    if (this.starPose === name) return;
    this.starPose = name;
    this.star.pose(name, ms);
  }

  dir() {
    return Math.sign(this.foe.x - this.star.x) || 1;
  }

  headWorld(rig) {
    const n = rig.neck || { x: 0, y: -260 };
    return { x: rig.root.x + (n.x + 22) * rig.root.scaleX, y: rig.root.y + (n.y - 30) * rig.size };
  }

  setSlow(k) {
    const sc = this.scene;
    sc.slow = k;
    sc.tweens.timeScale = k;
    sc.time.timeScale = k;
  }

  slowMo(ms = 900) {
    if (settings.get('reduceMotion')) return;
    this.setSlow(0.3);
    sfx.timeSlip();
    audio.dip(700, ms / 1000);
    this.scene.fx.tween({ desat: 0.45, aberration: 1.6 }, 120);
    clearTimeout(this.slowTimer);
    this.slowTimer = setTimeout(() => {
      this.setSlow(1);
      this.scene.fx.tween({ desat: 0.15, aberration: 0.6 }, 300);
    }, ms);
  }

  // --- Star's verbs -----------------------------------------------------------
  strike() {
    if (!this.active || this.scene.paused) return;
    const s = this.s;
    if (s.state !== 'free') return;
    s.state = 'strike';
    s.t = 0;
    s.hitDone = false;
    this.player.enabled = false;
    this.star.face(this.dir(), false);
    this.starPose = 'windup';
    this.star.pose('windup', 90);
  }

  dodge() {
    if (!this.active) return;
    const s = this.s;
    if (s.cool > 0) return;
    if (s.state !== 'free' && !(s.state === 'strike' && s.t > 200)) return;
    s.state = 'dodge';
    s.t = 0;
    s.invuln = 340;
    s.dodgeAt = this.clock;
    s.cool = 480;
    this.player.enabled = false;
    this.starPose = 'dodge';
    this.star.pose('dodge', 90);
    sfx.dodge({ pan: 0 });
    // A light-trail afterimage where she was.
    const ghost = this.scene.add.image(this.star.x, this.groundY - 150, 'light_soft').setBlendMode(ADD).setTint(0xffe2a0).setScale(0.5, 1.2).setAlpha(0.35).setDepth(49);
    this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 400, onComplete: () => ghost.destroy() });
  }

  // --- per-frame ----------------------------------------------------------------
  update(realDt) {
    if (!this.active) return;
    const k = this.scene.slow || 1;
    const dt = realDt * 1000;
    const gdt = dt * k; // game time
    this.clock += gdt;
    this.updateStar(gdt, dt);
    this.updateFoe(gdt);
    this.updateBolts(gdt);
    this.barkClock -= gdt / 1000;
    if (this.barkClock <= 0) this.bark();
  }

  bark() {
    this.barkClock = Phaser.Math.Between(9, 13);
    const fromStar = Math.random() < 0.25 && this.starBarks.length;
    const list = fromStar ? this.starBarks : this.barks;
    if (!list.length) return;
    const text = list.shift();
    ui.bark(text, { who: fromStar ? 'Star' : 'Parallax', ms: 3200 });
    if (!fromStar) speakModulated(text, { duration: Math.max(0.6, text.length / 26), gain: 0.08 });
  }

  updateStar(gdt) {
    const s = this.s;
    const st = this.star;
    s.t += gdt;
    s.invuln = Math.max(0, s.invuln - gdt);
    s.cool = Math.max(0, s.cool - gdt);
    const d = this.dir();
    if (s.state === 'free') {
      this.player.enabled = true;
      if (st.facing !== d) st.face(d);
      const moving = Math.abs(st.vx) > 30;
      this.setStarPose(moving ? null : 'stance', moving ? 140 : 220);
    } else if (s.state === 'strike') {
      if (s.t >= 90 && !s.hitDone) {
        s.hitDone = true;
        this.starPose = 'strike';
        st.pose('strike', 60);
        this.scene.tweens.add({ targets: st.root, x: Phaser.Math.Clamp(st.x + d * 54, this.minX, this.maxX), duration: 110, ease: 'Cubic.easeOut' });
        this.resolveStrike(d);
      }
      if (s.t >= 380) { s.state = 'free'; this.starPose = null; }
    } else if (s.state === 'dodge') {
      const p = Math.min(1, s.t / 240);
      const speed = (1 - p) * 1.25; // px per ms, easing out
      st.x = Phaser.Math.Clamp(st.x - d * speed * gdt, this.minX, this.maxX);
      if (s.t >= 300) { s.state = 'free'; this.starPose = null; }
    } else if (s.state === 'stagger') {
      if (s.t >= 560) { s.state = 'free'; this.starPose = null; }
    }
    // Auto assist: dodge exactly on the tell.
    if (this.auto && s.state === 'free' && s.cool <= 0) {
      const f = this.f;
      const remaining = f.state === 'tell' ? f.dur - f.t : Infinity;
      const bolt = this.bolts.find((b) => Math.abs(b.x - st.x) < 150);
      if (remaining < this.P.perfect * 0.45 || bolt) this.dodge();
      else if (f.state === 'vulnerable' && f.t > 120) this.strike();
    }
  }

  resolveStrike(d) {
    const f = this.f;
    const dist = Math.abs(this.foe.x - this.star.x);
    const reach = this.auto ? 400 : 175;
    if (dist > reach) { sfx.lightStrike({ hit: false, gain: 0.5 }); return; }
    if (f.state === 'vulnerable') {
      this.hits++;
      this.foe.radiance = 0;
      sfx.lightStrike({ pan: d * 0.2 });
      this.scene.cameraDir.kick(12);
      this.scene.fx.flash({ r: 1, g: 0.92, b: 0.7, peak: 0.35, release: 300 });
      const h = this.headWorld(this.foe);
      this.sparks.setParticleTint(0xffe2a0);
      this.sparks.emitParticleAt(h.x - d * 10, h.y + 90, 22);
      f.state = 'stagger';
      f.t = 0;
      this.foe.pose('hit', 80);
      this.scene.tweens.add({ targets: this.foe.root, x: Phaser.Math.Clamp(this.foe.x + d * 110, this.minX, this.maxX + 140), duration: 260, ease: 'Cubic.easeOut' });
      this.onFoeHit?.(this.hits);
      ui.hint('');
      if (this.hits >= this.need) this.finish();
    } else if (f.state === 'guard' || f.state === 'tell' || f.state === 'stagger') {
      this.stats.parried++;
      sfx.parry({ pan: d * 0.2 });
      this.scene.cameraDir.kick(5);
      const h = this.headWorld(this.foe);
      this.sparks.setParticleTint(0xcbb2ff);
      this.sparks.emitParticleAt(h.x - d * 40, h.y + 70, 12);
      this.foe.pose('guard', 60);
      this.scene.tweens.add({ targets: this.star.root, x: Phaser.Math.Clamp(this.star.x - d * 46, this.minX, this.maxX), duration: 180, ease: 'Cubic.easeOut' });
      if (f.state === 'guard') f.next = Math.min(f.next, f.t + 450);
      this.hint('parry', RECORD_HINTS.parry, 3600);
    }
  }

  finish() {
    const resolve = this.resolve;
    this.resolve = null;
    this.stop();
    this.scene.time.delayedCall(10, () => resolve?.(this.stats));
  }

  starHit(fromX) {
    const s = this.s;
    s.state = 'stagger';
    s.t = 0;
    this.stats.hitsTaken++;
    this.player.enabled = false;
    this.starPose = 'hit';
    this.star.pose('hit', 70);
    const away = Math.sign(this.star.x - fromX) || -1;
    this.scene.tweens.add({ targets: this.star.root, x: Phaser.Math.Clamp(this.star.x + away * 120, this.minX, this.maxX), duration: 300, ease: 'Cubic.easeOut' });
    sfx.umbralStrike({ pan: away * -0.2 });
    this.scene.cameraDir.kick(16);
    this.scene.fx.flash({ r: 0.55, g: 0.35, b: 1, peak: 0.45, release: 450 });
    this.onStarHit?.(this.stats.hitsTaken);
  }

  // --- Parallax -----------------------------------------------------------------
  updateFoe(gdt) {
    const f = this.f;
    const fo = this.foe;
    f.t += gdt;
    const d = -this.dir(); // his facing toward Star
    const dist = Math.abs(fo.x - this.star.x);
    if (f.state === 'guard') {
      if (fo.facing !== d) fo.face(d);
      // Keep a measured distance: glide, never walk.
      const want = 230;
      const err = dist - want;
      if (Math.abs(err) > 20) fo.x = Phaser.Math.Clamp(fo.x + Math.sign(err) * d * Math.min(Math.abs(err), gdt * 0.16), this.minX - 40, this.maxX + 140);
      if (f.t >= f.next) {
        if (this.P.bolt && dist > 260 && Math.random() < this.P.bolt) this.beginTell('bolt');
        else this.beginTell('lunge');
      }
    } else if (f.state === 'tell') {
      const p = f.t / f.dur;
      fo.visorLevel = 1 + p * 2.2;
      const h = this.headWorld(fo);
      this.glint.setPosition(h.x, h.y).setAlpha(Math.min(1, p * 1.4)).setScale(0.3 + p * 0.9).setRotation(p * 1.2);
      if (f.t >= f.dur) {
        this.glint.setAlpha(0);
        fo.visorLevel = 1;
        if (f.kind === 'bolt') this.fireBolt(d); else this.lunge(d);
      }
    } else if (f.state === 'attack') {
      if (f.t >= 100 && !f.checked) {
        f.checked = true;
        const near = Math.abs(fo.x - this.star.x) < 175;
        const s = this.s;
        if (s.invuln > 0) {
          const perfect = this.clock - s.dodgeAt <= this.P.perfect + 120;
          if (perfect) {
            this.stats.perfect++;
            this.slowMo(900);
            f.vuln = this.P.vulnLong;
          } else {
            f.vuln = this.P.vulnShort;
          }
        } else if (near && s.state !== 'stagger') {
          this.starHit(fo.x);
          f.vuln = 0;
        } else {
          f.vuln = this.P.vulnShort;
        }
      }
      if (f.t >= 260) {
        if (f.vuln > 0) {
          f.state = 'vulnerable';
          f.t = 0;
          f.dur = f.vuln;
          fo.pose('lunge', 120);
          fo.radiance = 1;
          if (f.vuln >= this.P.vulnLong) this.hint('strike', RECORD_HINTS.strike(input.keyName('action')), 3200);
        } else {
          this.toGuard();
        }
      }
    } else if (f.state === 'vulnerable') {
      // Off balance: the helmet dims, he sways.
      fo.visorLevel = 0.35 + Math.sin(f.t / 60) * 0.1;
      if (f.t >= f.dur) this.toGuard();
    } else if (f.state === 'stagger') {
      fo.visorLevel = 0.6;
      if (f.t >= 560) this.toGuard();
    } else if (f.state === 'cast') {
      if (f.t >= 380) this.toGuard();
    }
  }

  toGuard() {
    const f = this.f;
    f.state = 'guard';
    f.t = 0;
    f.next = this.guardTime();
    this.foe.visorLevel = 1;
    this.foe.radiance = 0;
    this.foe.pose('guard', 260);
  }

  beginTell(kind) {
    const f = this.f;
    f.state = 'tell';
    f.kind = kind;
    f.t = 0;
    f.dur = this.P.tell * (kind === 'bolt' ? 0.9 : 1);
    this.foe.pose(kind === 'bolt' ? 'cast' : 'windup', f.dur * 0.7);
    sfx.tell({ ms: f.dur });
    const key = input.keyName('dodge');
    if (kind === 'bolt') this.hint('bolt', RECORD_HINTS.bolt(key));
    else this.hint('dodge', RECORD_HINTS.dodge(key), 5200);
  }

  lunge(d) {
    const f = this.f;
    const fo = this.foe;
    f.state = 'attack';
    f.t = 0;
    f.checked = false;
    fo.pose('lunge', 70);
    const travel = Phaser.Math.Clamp(Math.abs(this.star.x - fo.x) - 115, 0, 320);
    this.scene.tweens.add({ targets: fo.root, x: Phaser.Math.Clamp(fo.x + d * travel, this.minX - 40, this.maxX + 140), duration: 120, ease: 'Cubic.easeOut' });
    sfx.whoosh({ gain: 0.06, duration: 0.35, pan: d * 0.3 });
    // A smear of dark light along the path.
    const smear = this.scene.add.image(fo.x + d * travel * 0.5, this.groundY - 160, 'light_streak').setTint(0x7b4bc4).setBlendMode(ADD).setAlpha(0.5).setDepth(48);
    smear.setDisplaySize(travel + 120, 40);
    this.scene.tweens.add({ targets: smear, alpha: 0, duration: 380, onComplete: () => smear.destroy() });
  }

  fireBolt(d) {
    const f = this.f;
    f.state = 'cast';
    f.t = 0;
    const fo = this.foe;
    const y = this.groundY - 150;
    const c = this.scene.add.container(fo.x + d * 70, y).setDepth(70);
    const glow = this.scene.add.image(0, 0, 'light_soft').setBlendMode(ADD).setTint(0x8a5cff).setScale(0.5);
    const core = this.scene.add.circle(0, 0, 15, 0x05030a);
    const rim = this.scene.add.circle(0, 0, 17).setStrokeStyle(2, 0xcbb2ff, 0.9);
    c.add([glow, core, rim]);
    c.vx = d * 0.85; // px/ms
    c.hitDone = false;
    this.bolts.push(c);
    sfx.umbralStrike({ gain: 0.4, pan: d * 0.3 });
  }

  updateBolts(gdt) {
    this.bolts = this.bolts.filter((b) => {
      b.x += b.vx * gdt;
      b.rotation += gdt * 0.01;
      const s = this.s;
      if (!b.hitDone && Math.abs(b.x - this.star.x) < 40) {
        b.hitDone = true;
        if (s.invuln > 0) {
          if (this.clock - s.dodgeAt <= this.P.perfect + 160) { this.stats.perfect++; this.slowMo(600); }
        } else if (s.state !== 'stagger') {
          this.starHit(b.x - b.vx * 100);
          b.destroy();
          return false;
        }
      }
      if (b.x < this.minX - 400 || b.x > this.maxX + 400) { b.destroy(); return false; }
      return true;
    });
  }
}

const RECORD_HINTS = {
  dodge: RECORD.duel.hintDodge,
  strike: RECORD.duel.hintStrike,
  parry: RECORD.duel.hintParry,
  bolt: RECORD.duel.hintBolt,
};
