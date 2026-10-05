import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';

// A small first-person projector for a paper-theatre world: painted cut-outs
// (billboards) and flat polygons, seen through a camera that can turn its head
// (yaw, pitch) and move. Units are metres; y is up; +z is "forward" at yaw 0.
//
// Two frames of reference: `world` things are fixed to the bridge, `local`
// things ride with the tram. The camera has a local position plus the tram's
// offset along z, so looking out of a moving tram works without moving
// everything inside it.
//
// Layers are drawn back to front: sky panoramas (screen space), outside
// polygons, outside billboards, the tram shell, inside billboards, then hands.
// Within a layer, billboards are depth-sorted every frame.

const NEAR = 0.08;

// Colour helpers for depth fog (0xRRGGBB integers).
function mixInt(a, b, t) {
  const r = ((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * t);
  const g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * t);
  const bl = (a & 255) + (((b & 255) - (a & 255)) * t);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}

export class View3D {
  constructor(scene, { focal = 820 } = {}) {
    this.scene = scene;
    this.F = focal;
    this.cam = { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, roll: 0 };
    this.offset = 0;              // tram position along world z
    this.layers = {};
    ['outside', 'inside'].forEach((name, i) => {
      const g = scene.add.graphics().setDepth(10 + i * 20);
      const c = scene.add.container(0, 0).setDepth(11 + i * 20);
      this.layers[name] = { g, c, polys: [], boards: [], groups: [], fog: null };
    });
    this.shell = { g: scene.add.graphics().setDepth(25), polys: [], fog: null };
    this.lines = [];
  }

  // --- content -------------------------------------------------------------
  // A billboard: a painted image standing at (x, y, z), `h` metres tall,
  // anchored at its feet unless anchor says otherwise.
  board(key, { x = 0, y = 0, z = 0, h = 1.7, world = false, layer = world ? 'outside' : 'inside', anchor = 1, tint, alpha = 1, blend, flip = false } = {}) {
    const img = this.scene.add.image(0, 0, key).setOrigin(0.5, anchor);
    if (tint !== undefined) img.setTint(tint);
    if (blend) img.setBlendMode(blend);
    img.setFlipX(flip);
    const b = { img, x, y, z, h, world, alpha, tint, visible: true, texH: img.height, key };
    this.layers[layer].c.add(img);
    this.layers[layer].boards.push(b);
    return b;
  }

  setBoardTexture(b, key) {
    b.img.setTexture(key);
    b.texH = b.img.height;
    b.key = key;
  }

  // A flat polygon (array of [x, y, z]); `fill` colour and alpha. Polygons on
  // the outside layer are depth-sorted by centroid; the shell is drawn in order.
  // `ground` polygons are drawn first, unsorted (the deck, the floor).
  // A `group` (see below) draws its polygons in its own depth slot among the
  // billboards, so a tower leg can hide the lantern behind it.
  poly(points, { fill = 0x000000, alpha = 1, world = false, layer = 'outside', stroke, strokeAlpha = 1, lineWidth = 1, ground = false, group, fog = true } = {}) {
    const p = { points, fill, alpha, world, stroke, strokeAlpha, lineWidth, ground, fog, visible: true };
    if (group) group.polys.push(p);
    else if (layer === 'shell') this.shell.polys.push(p);
    else this.layers[layer].polys.push(p);
    return p;
  }

  // A set of polygons sorted as one object at `at` ([x, y, z]).
  group(at, { world = true, layer = world ? 'outside' : 'inside' } = {}) {
    const g = this.scene.add.graphics();
    this.layers[layer].c.add(g);
    const grp = { g, at, world, polys: [], visible: true };
    this.layers[layer].groups.push(grp);
    return grp;
  }

  // Depth fog for a layer: colours drift toward `color` with distance.
  setFog(layer, color, dist) {
    this.layers[layer].fog = color === null ? null : { color, dist };
  }

  // Aim the camera at a point; returns { yaw, pitch } without applying it.
  aim(x, y, z, world = false) {
    const c = this.cam;
    const dx = x - c.x;
    const dy = y - c.y;
    const dz = z - (c.z + (world ? this.offset : 0));
    return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  }

  // A polyline (e.g. a cable) in world space.
  line(points, { color = 0x000000, alpha = 1, width = 2, world = true } = {}) {
    const l = { points, color, alpha, width, world, visible: true };
    this.lines.push(l);
    return l;
  }

  // --- projection ------------------------------------------------------------
  toCam(x, y, z, world) {
    const c = this.cam;
    const dx = x - c.x;
    const dy = y - c.y;
    const dz = z - (c.z + (world ? this.offset : 0));
    const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    const x1 = dx * cy - dz * sy;
    const z1 = dx * sy + dz * cy;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const y2 = dy * cp - z1 * sp;
    const z2 = dy * sp + z1 * cp;
    return [x1, y2, z2];
  }

  screen(v) {
    const [x, y, z] = v;
    let sx = (x / z) * this.F;
    let sy = (-y / z) * this.F;
    if (this.cam.roll) {
      const cr = Math.cos(this.cam.roll), sr = Math.sin(this.cam.roll);
      [sx, sy] = [sx * cr - sy * sr, sx * sr + sy * cr];
    }
    return [VIEW_W / 2 + sx, VIEW_H / 2 + sy];
  }

  // Public: where on screen is this point (null if behind the eye)?
  project(x, y, z, world = false) {
    const v = this.toCam(x, y, z, world);
    if (v[2] < NEAR) return null;
    const [sx, sy] = this.screen(v);
    return { x: sx, y: sy, z: v[2] };
  }

  clip(vs) {
    // Sutherland–Hodgman against the near plane.
    const out = [];
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i];
      const b = vs[(i + 1) % vs.length];
      const ain = a[2] >= NEAR;
      const bin = b[2] >= NEAR;
      if (ain) out.push(a);
      if (ain !== bin) {
        const t = (NEAR - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
      }
    }
    return out;
  }

  drawPolys(g, polys, sort, fog = null) {
    const list = [];
    for (const p of polys) {
      if (!p.visible || p.alpha <= 0) continue;
      const vs = p.points.map(([x, y, z]) => this.toCam(x, y, z, p.world));
      const c = this.clip(vs);
      if (c.length < 3) continue;
      let depth = 0;
      vs.forEach((v) => { depth += Math.hypot(v[0], v[1], v[2]); });
      list.push({ p, pts: c.map((v) => this.screen(v)), depth: depth / vs.length });
    }
    if (sort) list.sort((a, b) => (b.p.ground - a.p.ground) || (b.depth - a.depth));
    for (const { p, pts, depth } of list) {
      const flat = pts.map(([x, y]) => new Phaser.Geom.Point(x, y));
      const fill = fog && p.fog ? mixInt(p.fill, fog.color, 1 - Math.exp(-depth / fog.dist)) : p.fill;
      g.fillStyle(fill, p.alpha);
      g.fillPoints(flat, true);
      if (p.stroke !== undefined) {
        g.lineStyle(p.lineWidth, p.stroke, p.strokeAlpha);
        g.strokePoints(flat, true);
      }
    }
  }

  drawLines(g) {
    for (const l of this.lines) {
      if (!l.visible) continue;
      g.lineStyle(l.width, l.color, l.alpha);
      let prev = null;
      for (const [x, y, z] of l.points) {
        const v = this.toCam(x, y, z, l.world);
        if (prev) {
          let a = prev, b = v;
          if (a[2] >= NEAR || b[2] >= NEAR) {
            if (a[2] < NEAR) { const t = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]; }
            if (b[2] < NEAR) { const t = (NEAR - b[2]) / (a[2] - b[2]); b = [b[0] + (a[0] - b[0]) * t, b[1] + (a[1] - b[1]) * t, NEAR]; }
            const [x0, y0] = this.screen(a);
            const [x1, y1] = this.screen(b);
            g.lineBetween(x0, y0, x1, y1);
          }
        }
        prev = v;
      }
    }
  }

  drawBoards(layer) {
    const items = [];
    const fog = layer.fog;
    for (const b of layer.boards) {
      const v = this.toCam(b.x, b.y, b.z, b.world);
      if (!b.visible || b.alpha <= 0 || v[2] < NEAR * 2) { b.img.setVisible(false); continue; }
      const [sx, sy] = this.screen(v);
      const px = (b.h / v[2]) * this.F;
      if (sx < -px * 2 || sx > VIEW_W + px * 2 || px < 0.5) { b.img.setVisible(false); continue; }
      const s = px / b.texH;
      b.img.setVisible(true).setPosition(sx, sy).setScale(s).setAlpha(b.alpha).setRotation(this.cam.roll);
      if (fog && b.fog !== false) {
        const k = 1 - Math.exp(-Math.hypot(v[0], v[1], v[2]) / fog.dist);
        if (b.img.blendMode === Phaser.BlendModes.ADD) b.img.setAlpha(b.alpha * (1 - k * 0.6));
        else b.img.setTint(mixInt(b.tint ?? 0xffffff, fog.color, k));
      }
      items.push([v[2], b.img]);
    }
    for (const grp of layer.groups) {
      if (!grp.visible) { grp.g.setVisible(false); continue; }
      grp.g.setVisible(true).clear();
      this.drawPolys(grp.g, grp.polys, true, fog);
      items.push([this.toCam(...grp.at, grp.world)[2], grp.g]);
    }
    items.sort((a, b) => b[0] - a[0]);
    items.forEach(([, img], i) => layer.c.moveTo(img, i));
  }

  render() {
    const o = this.layers.outside;
    o.g.clear();
    this.drawPolys(o.g, o.polys, true, o.fog);
    this.drawLines(o.g);
    this.drawBoards(o);
    this.shell.g.clear();
    this.drawPolys(this.shell.g, this.shell.polys, false, this.shell.fog);
    const i = this.layers.inside;
    i.g.clear();
    this.drawPolys(i.g, i.polys, true, i.fog);
    this.drawBoards(i);
  }
}
