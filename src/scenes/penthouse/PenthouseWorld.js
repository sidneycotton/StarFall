import Phaser from 'phaser';
import { addPainted } from '../../art/paint.js';
import { VIEW_W, VIEW_H } from '../../config.js';
import { WORLD_W, SF, L, px } from './layout.js';
import { WALL_H } from '../../art/kit.js';

// Builds the penthouse: parallax city, modular walls with real window holes,
// floor, props, foreground silhouettes and all light sprites. Returns handles
// the scene animates. No game logic lives here.

const ADD = Phaser.BlendModes.ADD;

// Depth bands.
export const D = {
  sky: 0, city: 2, traffic: 4, cityFx: 5, shutter: 8, wall: 10, wallFx: 12, wallLight: 13,
  floor: 15, floorFx: 16, back: 20, prop: 30, player: 50, front: 60, light: 70, fg: 80, dark: 90,
};

export class PenthouseWorld {
  constructor(scene) {
    this.scene = scene;
    this.lights = { violet: [], red: [], window: [] };
    this.shutters = [];
    this.slitShutters = [];
    this.screens = [];
    this.balloons = [];
    this.vehicles = [];
    this.build();
  }

  img(x, y, key, ox = 0.5, oy = 0.5, depth = D.prop, sf = 1) {
    const i = addPainted(this.scene, x, y, key, ox, oy).setDepth(depth);
    if (sf !== 1) i.setScrollFactor(sf, 1);
    return i;
  }

  light(x, y, tint, scale, alpha, { depth = D.light, sf = 1, key = 'light_soft', group } = {}) {
    const l = this.scene.add.image(x, y, key).setBlendMode(ADD).setTint(tint).setAlpha(alpha).setDepth(depth);
    if (Array.isArray(scale)) l.setScale(scale[0], scale[1]); else l.setScale(scale);
    if (sf !== 1) l.setScrollFactor(sf, 1);
    l.baseAlpha = alpha;
    if (group) this.lights[group].push(l);
    return l;
  }

  build() {
    this.buildCity();
    this.buildWalls();
    this.buildFloor();
    this.buildSpine();
    this.buildBedroom();
    this.buildLounge();
    this.buildGallery();
    this.buildSanctum();
    this.buildForeground();
    this.buildAtmosphere();
  }

  // ---------------------------------------------------------------- city
  buildCity() {
    const s = this.scene;
    this.sky = addPainted(s, VIEW_W / 2, VIEW_H / 2, 'city_sky').setScrollFactor(0).setDepth(D.sky);
    this.cityFar = addPainted(s, 0, 0, 'city_far', 0, 0).setScrollFactor(SF.cityFar, 0).setDepth(D.city);
    this.cityMid = addPainted(s, -80, 40, 'city_mid', 0, 0).setScrollFactor(SF.cityMid, 0).setDepth(D.city + 1);
    // The statue's star — it will keep glowing until the very end.
    this.statueStar = s.add.image(-80 + 1250 + 32, 40 + 640 - 300, 'light_soft').setScrollFactor(SF.cityMid, 0)
      .setBlendMode(ADD).setTint(0xf0cf8a).setScale(0.35).setAlpha(0.55).setDepth(D.cityFx);

    // Flying traffic on slow parallax lanes.
    const lanes = [[230, 0.18, 0.7], [300, 0.2, 0.55], [380, 0.22, 0.8], [470, 0.25, 0.5], [540, 0.28, 0.6]];
    lanes.forEach(([y, sf, a], li) => {
      for (let i = 0; i < 3; i++) {
        const dir = (li + i) % 2 ? 1 : -1;
        const v = s.add.image(0, y + i * 6, 'vehicle').setScrollFactor(sf, 0).setDepth(D.traffic)
          .setBlendMode(ADD).setAlpha(a).setTint(dir > 0 ? 0xfff0e0 : 0xff5a6a).setFlipX(dir < 0).setScale(0.6 + sf);
        v.lane = { dir, sf, speed: 30 + Math.random() * 50, span: VIEW_W + WORLD_W * sf + 400 };
        v.x = Math.random() * v.lane.span - 200;
        this.vehicles.push(v);
      }
    });

    // Searchlights and gold launch streaks, used once the city wakes up.
    this.searchlights = [0.15, 0.45, 0.8].map((k, i) => s.add.image(VIEW_W * k + i * 200, 900, 'light_beam')
      .setOrigin(0.5, 1).setScale(2.4, 1.1).setScrollFactor(SF.cityMid, 0).setDepth(D.cityFx)
      .setBlendMode(ADD).setTint(i === 1 ? 0xffe0b0 : 0xd8e6ff).setAlpha(0));
    this.streaks = [];

    // The moon, behind the oculus. Different depth from the hanging disc, so
    // walking past the bed slides one across the other: a moving eclipse.
    this.moonGlow = s.add.image(px(L.bed, 0.6), 300, 'light_soft').setScrollFactor(0.6, 1).setScale(3.2)
      .setBlendMode(ADD).setTint(0xb8a6e8).setAlpha(0.35).setDepth(D.cityFx);
    this.moon = s.add.image(px(L.bed, 0.6), 300, 'moon').setScrollFactor(0.6, 1).setScale(0.92).setDepth(D.cityFx);
  }

  // ---------------------------------------------------------------- walls
  // Lay out wall features in wall space and fill the gaps with plain panels.
  buildWalls() {
    const s = this.scene;
    const features = [];
    L.spineSlits.forEach((x) => features.push({ x, key: 'wall_slit', w: 220 }));
    features.push({ x: 3240, key: 'pilaster', w: 100 });
    features.push({ x: L.bed, key: 'wall_oculus', w: 800 });
    features.push({ x: 4460, key: 'pilaster', w: 100 });
    L.arches.forEach((x) => features.push({ x, key: 'wall_arch', w: 420 }));
    features.push({ x: L.niches[0], key: 'wall_niche', w: 320 });
    features.push({ x: L.gallerySlit, key: 'wall_slit', w: 220 });
    features.push({ x: L.niches[1], key: 'wall_niche', w: 320 });
    features.push({ x: L.sanctumWall, key: 'sanctum_wall', w: 1200 });
    features.sort((a, b) => a.x - b.x);

    const sf = SF.wall;
    let cursor = px(-200, sf);
    const endX = px(WORLD_W + 200, sf);
    const panel = (from, to, plain) => {
      if (to - from < 1) return;
      const key = plain ? 'wall_panel_plain' : 'wall_panel';
      s.add.image(from, 0, key).setOrigin(0, 0).setDisplaySize(to - from + 1, WALL_H).setScrollFactor(sf, 1).setDepth(D.wall);
    };
    features.forEach((f) => {
      const cx = px(f.x, sf);
      const left = cx - f.w / 2;
      panel(cursor, left, f.x < 3000 || f.x > 7400);
      const im = addPainted(s, cx, 0, f.key, 0.5, 0).setScrollFactor(sf, 1).setDepth(D.wall);
      if (f.key === 'sanctum_wall') im.setDisplaySize(1200, WALL_H);
      cursor = cx + f.w / 2;
    });
    panel(cursor, endX, true);

    // Emergency strip: a thin red line under the cornice through every room.
    this.redStrip = s.add.image(px(WORLD_W / 2, sf), 26, 'light_streak').setScrollFactor(sf, 1)
      .setDisplaySize(px(WORLD_W, sf) - px(0, sf) + 400, 10).setBlendMode(ADD).setTint(0xff2a3a).setAlpha(0).setDepth(D.wallLight);
    this.redStrip2 = s.add.image(px(WORLD_W / 2, sf), 34, 'pixel').setScrollFactor(sf, 1)
      .setDisplaySize(px(WORLD_W, sf) - px(0, sf) + 400, 1.2).setTint(0xff6a70).setAlpha(0).setDepth(D.wallLight);
    this.lights.red.push(this.redStrip, this.redStrip2);
    this.redStrip.baseAlpha = 0.9;
    this.redStrip2.baseAlpha = 0.8;

    // Shutters over the lounge arches (opened during the run).
    L.arches.forEach((x) => {
      const sh = addPainted(s, px(x, sf), 70, 'shutter_arch', 0.5, 0).setScrollFactor(sf, 1).setDepth(D.shutter);
      sh.homeScale = sh.scaleY;
      this.shutters.push(sh);
    });
    // Spine slits get heavy shutters too.
    L.spineSlits.forEach((x) => {
      const sh = addPainted(s, px(x, sf), 60, 'shutter_slit', 0.5, 0).setScrollFactor(sf, 1).setDepth(D.shutter);
      sh.homeScale = sh.scaleY;
      sh.worldX = x;
      // Shafts of city light that pour in once the shutter lifts.
      sh.shaft = s.add.image(px(x, 0.97), 60, 'light_cone').setOrigin(0.5, 0).setScrollFactor(0.97, 1)
        .setScale(0.9, 1.5).setRotation(0.38).setBlendMode(ADD).setTint(0xc8c4ff).setAlpha(0).setDepth(D.light - 1);
      sh.pool = s.add.image(x + 120, 800, 'light_soft').setScale(1.8, 0.28).setBlendMode(ADD).setTint(0xb8b4f0).setAlpha(0).setDepth(D.floorFx);
      this.slitShutters.push(sh);
    });

    // Window light falling into the rooms.
    L.arches.forEach((x) => {
      const l = this.light(px(x, sf), 380, 0x8a6ad0, [1.4, 1.1], 0.08, { sf, depth: D.wallFx, key: 'light_soft', group: 'window' });
      l.home = 0.08;
      const pool = this.light(x - 40, 760, 0x7a5ac0, [2.6, 0.35], 0.1, { depth: D.floorFx, group: 'window' });
      pool.home = 0.1;
    });
    // Light shafts slanting in from the arches, with their lacquer reflections.
    L.arches.forEach((x) => {
      const shaft = this.light(px(x, 0.97), 90, 0xa08ae0, [1.5, 1.45], 0.07, { sf: 0.97, depth: D.light - 1, key: 'light_cone', group: 'window' });
      shaft.setOrigin(0.5, 0).setRotation(-0.32);
      shaft.home = 0.07;
      const drip = this.light(x - 60, 700, 0x9a86e0, [5, 0.55], 0.08, { depth: D.floorFx, key: 'light_drip', group: 'window' });
      drip.setOrigin(0.5, 0);
      drip.home = 0.08;
    });
    // The oculus: city light through a round window.
    this.oculusGlow = this.light(px(L.bed, sf), 300, 0x9a7ad8, 1.9, 0.12, { sf, depth: D.wallFx, group: 'window' });
    this.oculusGlow.home = 0.12;
  }

  buildFloor() {
    const s = this.scene;
    s.add.image(-200, L.floorTop, 'floor_strip').setOrigin(0, 0).setDisplaySize(WORLD_W + 400, 230).setDepth(D.floor);
  }

  // ---------------------------------------------------------------- spine
  buildSpine() {
    const s = this.scene;
    // Corridor ceiling beams for rhythm.
    for (let x = 100; x < 3000; x += 210) {
      s.add.image(px(x, SF.wall), 0, 'pixel').setOrigin(0.5, 0).setDisplaySize(16, 700).setScrollFactor(SF.wall, 1)
        .setTint(0x050407).setAlpha(0.6).setDepth(D.wallFx);
    }
    L.spineScreens.forEach((x) => {
      const fr = addPainted(s, px(x, SF.wall), 330, 'spine_screen').setScrollFactor(SF.wall, 1).setDepth(D.wallFx);
      this.screens.push({ frame: fr, x, kind: 'spine' });
    });
    this.chamberDoor = this.makeDoor(L.chamberDoor, 0xa9a4b6);
    this.eclipseDoor = this.makeDoor(L.eclipseDoor, 0xa77bff);
    // Cold floor light in the corridor.
    for (let x = 300; x < 3000; x += 420) {
      this.light(x, 780, 0x6a6a90, [2.2, 0.25], 0.06, { depth: D.floorFx });
    }
  }

  makeDoor(x, glyphTint) {
    const s = this.scene;
    const beyond = s.add.image(x, 520, 'light_soft').setScale(1.4, 3).setTint(0xcfc6ff).setBlendMode(ADD).setAlpha(0).setDepth(D.back - 1);
    const left = s.add.image(x - 50, 230, 'door_leaf').setOrigin(0.5, 0).setDepth(D.back);
    const right = s.add.image(x + 50, 230, 'door_leaf').setOrigin(0.5, 0).setDepth(D.back).setFlipX(true);
    const frame = s.add.image(x, 0, 'door_frame').setOrigin(0.5, 0).setDepth(D.back + 1);
    const glyph = s.add.image(x, 140, 'light_soft').setScale(0.6).setTint(glyphTint).setBlendMode(ADD).setAlpha(0.12).setDepth(D.back + 2);
    return { x, left, right, frame, glyph, beyond, open: false };
  }

  // ---------------------------------------------------------------- bedroom
  buildBedroom() {
    const s = this.scene;
    // The eclipse disc hangs between the oculus and the bed, on its own depth.
    this.disc = addPainted(s, px(L.bed + 70, SF.disc), -260, 'eclipse_disc', 0.5, 0).setScrollFactor(SF.disc, 1).setDepth(D.wallFx + 1);
    this.discRim = s.add.image(this.disc.x, 300, 'light_soft').setScrollFactor(SF.disc, 1).setScale(1.9).setTint(0x6a3aa8)
      .setBlendMode(ADD).setAlpha(0.0).setDepth(D.wallFx);

    this.img(L.bed, 830, 'rug', 0.5, 0.5, D.floorFx);
    this.garland = this.img(L.bed - 40, 30, 'garland', 0.5, 0, D.wallLight, SF.wall);
    this.bed = this.img(L.bed, 790, 'bed', 0.5, 1, D.back);
    const bedLeft = L.bed - 450;
    this.pxLying = this.img(bedLeft + 20, 500, 'px_lying', 0, 0, D.back + 2);
    this.sleeper = this.img(bedLeft + 450, 500, 'sleeper', 0, 0, D.back + 2);
    this.sleeperSit = this.img(bedLeft + 520, 420, 'sleeper_sit', 0, 0, D.back + 2).setAlpha(0);
    // A fold of sheet that can be drawn up over her shoulder.
    this.sheetCover = s.add.image(bedLeft + 650, 590, 'light_soft').setTint(0x3a1844).setScale(0.9, 0.35).setAlpha(0).setDepth(D.back + 3);

    this.nightstand = this.img(L.nightstand, 785, 'nightstand', 0.5, 1, D.prop);
    this.relay = this.img(L.nightstand - 36, 716, 'relay', 0.5, 1, D.prop + 1);
    this.relayLed = s.add.image(L.nightstand - 36, 701, 'light_core').setScale(0.32).setBlendMode(ADD).setTint(0xff2a3a).setAlpha(0).setDepth(D.prop + 2);
    this.relayHalo = s.add.image(L.nightstand - 36, 701, 'light_soft').setScale(1.4).setBlendMode(ADD).setTint(0xff2030).setAlpha(0).setDepth(D.light);
    this.glass = this.img(L.nightstand + 26, 716, 'glass', 0.5, 1, D.prop + 3);
    this.arm = this.img(bedLeft + 105, 598, 'px_arm_hang', 0.45, 0.02, D.prop + 2).setRotation(0.12);

    this.lampL = this.img(L.lampL, 790, 'floor_lamp', 0.5, 1, D.back + 1);
    this.lampR = this.img(L.lampR, 790, 'floor_lamp', 0.5, 1, D.back + 1);
    [L.lampL, L.lampR].forEach((x) => {
      this.light(x, 700, 0xb08aff, [2.2, 0.5], 0.2, { depth: D.floorFx, key: 'light_drip', group: 'violet' }).setOrigin(0.5, 0);
      this.light(x, 400, 0xb08aff, 2.2, 0.5, { group: 'violet' });
      this.light(x, 790, 0x8a5ae0, [3.2, 0.5], 0.28, { depth: D.floorFx, group: 'violet' });
    });
    this.light(L.bed, 360, 0x9a6ae0, [4.5, 2.2], 0.12, { group: 'violet' });
    this.light(L.bed - 40, 90, 0xc9a2ff, [5, 0.7], 0.1, { group: 'violet', sf: SF.wall });

    this.img(L.iceBucket, 800, 'ice_bucket', 0.5, 1, D.prop);
    this.img(L.dress, 806, 'dress', 0.5, 1, D.prop);
    this.img(L.heels, 812, 'heels', 0.5, 1, D.prop);
    this.mask = this.img(L.mask, 818, 'mask_sun', 0.5, 1, D.front);
    this.img(L.chairJacket, 792, 'chair_jacket', 0.5, 1, D.back + 1);
  }

  // ---------------------------------------------------------------- lounge
  buildLounge() {
    const s = this.scene;
    this.img(L.sofa, 772, 'sofa', 0.5, 1, D.back);
    this.capeReplica = this.img(L.capeReplica, 600, 'cape_replica', 0.5, 0, D.back + 1).setRotation(0.05);
    this.img(L.helmetReplica, 818, 'helmet_replica', 0.5, 1, D.front);
    this.img(L.lowTable, 796, 'low_table', 0.5, 1, D.back + 2);
    this.chandelier = this.img(L.chandelier, 0, 'chandelier', 0.5, 0, D.wallLight + 1, 0.97);
    this.light(px(L.chandelier, 0.97), 200, 0xc9a2ff, [3.4, 1.3], 0.22, { sf: 0.97, group: 'violet' });
    this.light(L.chandelier, 790, 0x9a6ae0, [4.6, 0.5], 0.18, { depth: D.floorFx, group: 'violet' });
    this.news = this.img(L.newsScreen, 792, 'news_frame', 0.5, 1, D.back);
    this.screens.push({ frame: this.news, x: L.newsScreen, kind: 'news' });
    this.img(L.bar, 792, 'bar', 0.5, 1, D.back + 1);
    this.bottle = this.img(L.bottle, 818, 'bottle_empty', 0.5, 1, D.front).setRotation(-0.06);
    this.img(L.speaker, 792, 'speaker', 0.5, 1, D.back);
    this.speakerLed = this.light(L.speaker, 510, 0xa77bff, 0.25, 0.6, { group: 'violet' });
    this.img(5150, 815, 'confetti', 0.5, 1, D.floorFx);
    this.img(5850, 818, 'confetti', 0.5, 1, D.floorFx).setFlipX(true);

    [['gold', 5250, 470], ['black', 5700, 560], ['violet', 6120, 420], ['gold', 4870, 610], ['black', 5390, 380]].forEach(([k, x, y], i) => {
      const b = this.img(x, y, `balloon_${k}`, 0.5, 0.15, D.back + 3 + (i % 2) * 10).setScale(0.82).setTint(0xb8a8c8);
      b.home = { x, y, phase: i * 1.7 };
      this.balloons.push(b);
    });
  }

  // ---------------------------------------------------------------- gallery
  buildGallery() {
    this.img(L.console, 792, 'console_table', 0.5, 1, D.back);
    this.letters = this.img(L.console - 30, 666, 'letters', 0.5, 1, D.back + 1);
    this.trophy = this.img(L.trophy, 742, 'trophy', 0.5, 1, D.back + 1).setRotation(-0.14);
    this.img(L.crate, 794, 'crate', 0.5, 1, D.back + 2);
    this.figurine = this.img(L.figurine, 812, 'figurine', 0.5, 1, D.front);
    this.img(L.portrait, 794, 'portrait_back', 0.5, 1, D.back).setRotation(0.06).setScale(0.72).setTint(0x8a7a90);
    // A single cold spot from the gallery slit.
    this.light(px(L.gallerySlit, SF.wall), 360, 0xa0a8d0, [0.8, 2.2], 0.07, { sf: SF.wall, depth: D.wallFx, group: 'window' }).home = 0.07;
    this.light(L.crate, 780, 0x6a5aa0, [2.4, 0.4], 0.12, { depth: D.floorFx, group: 'violet' });
    this.light(L.niches[0], 300, 0x8a6ad0, 1.2, 0.08, { sf: SF.wall, depth: D.wallFx, group: 'violet' });
    this.light(L.niches[1], 300, 0x8a6ad0, 1.2, 0.08, { sf: SF.wall, depth: D.wallFx, group: 'violet' });
  }

  // ---------------------------------------------------------------- sanctum
  buildSanctum() {
    const s = this.scene;
    this.img(L.altar - 60, 832, 'floor_rings', 0.5, 0.5, D.floorFx);
    this.suitForm = this.img(L.vestry, 780, 'suit_form', 0.5, 1, D.back);
    this.pedestal = this.img(L.pedestal, 792, 'pedestal', 0.5, 1, D.back);
    this.helmet = this.img(L.pedestal, 566, 'helmet_item', 0.5, 1, D.back + 1);
    this.robeHeap = this.img(L.vestry + 10, 806, 'robe_heap', 0.5, 1, D.prop).setAlpha(0);
    this.chair = this.img(L.chair, 795, 'chair', 40 / 170, 1, D.player + 2);
    this.altar = this.img(L.altar, 794, 'altar', 0.5, 1, D.player + 3);

    // The three Seer lights on the Glass — gold, slate, violet in a triangle.
    const gx = px(L.glass, SF.wall);
    const seerCols = [0xf0cf8a, 0x9fc5d0, 0xa77bff];
    const pts = [[-48, 250], [48, 250], [0, 330]];
    this.seerPoints = pts.map(([dx, y], i) => s.add.image(gx + dx, y, 'seer_point').setScrollFactor(SF.wall, 1)
      .setBlendMode(ADD).setTint(seerCols[i]).setScale(0.8).setAlpha(0.0).setDepth(D.wallLight));
    // Altar discs light in the same colours.
    const top = 794 - 210;
    const discs = [[-70, 74], [70, 74], [0, 94]];
    this.altarDiscs = discs.map(([dx, dy], i) => s.add.image(L.altar + dx, top + dy, 'light_soft')
      .setBlendMode(ADD).setTint(seerCols[i]).setScale(0.32, 0.12).setAlpha(0).setDepth(D.player + 4));

    // The emergency source: red from the altar, strongest here.
    this.redSource = this.light(L.altar, 520, 0xff2030, [5, 3.5], 0, { group: 'red' });
    this.redSource.baseAlpha = 0.75;
    this.glassGlow = this.light(gx, 300, 0x7b4bc4, [1.6, 2.6], 0.14, { sf: SF.wall, depth: D.wallFx, group: 'violet' });
    this.redFloor = this.light(L.altar, 800, 0xff2a3a, [5, 0.6], 0, { depth: D.floorFx, group: 'red' });
    this.redFloor.baseAlpha = 0.5;
    this.vestryGlow = this.light(px(L.vestry, SF.wall), 260, 0x7b4bc4, [1.2, 2.4], 0.1, { sf: SF.wall, depth: D.wallFx, group: 'violet' });
  }

  // ---------------------------------------------------------------- foreground
  buildForeground() {
    const s = this.scene;
    const fg = (X, y, key, ox, oy, alpha = 1, flip = false) => {
      const i = addPainted(s, px(X, SF.fg), y, key, ox, oy).setScrollFactor(SF.fg, 1).setDepth(D.fg).setAlpha(alpha).setFlipX(flip);
      return i;
    };
    fg(3140, 0, 'fg_drape', 1, 0);
    fg(4430, 940, 'fg_bottles', 0.5, 1, 0.95);
    fg(4980, 960, 'fg_plant', 0.5, 1);
    fg(6300, 0, 'fg_column', 0.5, 0);
    fg(7180, 960, 'fg_plant', 0.5, 1, 1, true);
    fg(8420, 0, 'fg_drape', 0, 0, 1, true);
    fg(1350, 0, 'fg_column', 0.5, 0);
    this.fgLamp = fg(5700, 40, 'fg_lamp', 0.5, 0.5, 0.55).setBlendMode(ADD);
  }

  buildAtmosphere() {
    const s = this.scene;
    // Dust in the window light. Few particles, slow, never "sparkly".
    this.motes = s.add.particles(0, 0, 'mote', {
      x: { min: 3000, max: 8400 },
      y: { min: 120, max: 760 },
      lifespan: 9000,
      speedX: { min: -6, max: 6 },
      speedY: { min: -4, max: 3 },
      scale: { min: 0.15, max: 0.4 },
      alpha: { values: [0, 0.35, 0.35, 0] },
      quantity: 1,
      frequency: 160,
      blendMode: 'ADD',
      tint: 0xd8c8ff,
      emitting: true,
    }).setDepth(D.light);

    // A full-screen darkness layer for the opening (only the relay LED sits above it).
    this.darkness = s.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W * 4, VIEW_H * 4, 0x000000, 1).setScrollFactor(0).setDepth(D.dark);
  }

  // ---------------------------------------------------------------- per-frame
  update(time, dt, state) {
    const t = time / 1000;
    this.vehicles.forEach((v) => {
      v.x += v.lane.dir * v.lane.speed * dt * (state.trafficScale ?? 1);
      if (v.lane.dir > 0 && v.x > v.lane.span) v.x = -200;
      if (v.lane.dir < 0 && v.x < -200) v.x = v.lane.span;
    });
    this.balloons.forEach((b) => {
      const h = b.home;
      const wind = state.wind || 0;
      b.y = h.y + Math.sin(t * 0.4 + h.phase) * 6;
      b.x = h.x + Math.sin(t * 0.23 + h.phase) * 4 + wind * 30 * Math.sin(t * 1.3 + h.phase);
      b.rotation = Math.sin(t * 0.5 + h.phase) * 0.04 + wind * 0.15 * Math.sin(t * 1.7 + h.phase);
    });
    this.statueStar.setAlpha(0.45 + Math.sin(t * 0.7) * 0.08);
  }
}
