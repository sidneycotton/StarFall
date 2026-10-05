// Aureate Relay 9: one long room at the edge of the Sere, dead for years.
// Shared by the meeting (3.3) and what comes after it (3.4).
//
// The room runs x -6..6 and z 0..10 (metres), with the front door at the
// near end (z 0, on the left) and the back door at the far end (on the right).
// Under the far end is the pump room; its hatch is in the floor.

export const RELAY = {
  W: 6,
  D: 10,
  H: 3.4,
  front: { x: -4.5, z: 0 },
  back: { x: 4, z: 10 },
  hatch: { x: -1.5, z: 8.7 },
  side: { x: -6, z: 6 },
  boiler: { x0: 4.7, x1: 5.9, z0: 5, z1: 6.4 },
  panel: { x: 5.9, y: 1.35, z: 3.3 },
  table: { x0: -1.1, x1: 1.1, z0: 3.6, z1: 5 },
  // Where Wallflower stands when nobody is counting.
  byDoor: { x: -4.5, z: 0.9 },
  lamps: [1.6, 4.1, 6.6, 9.0],
};

// Dusk through a hole in a wall: sky, a line of fire on the horizon, the Sere.
function dusk(scene, pts, flat) {
  // pts: [[x,y,z] bottom-left, bottom-right, top-right, top-left] of the opening,
  // pushed just outside the wall; split into three bands.
  const [a, b, c, d] = pts;
  const at = (p, q, t) => p.map((v, i) => v + (q[i] - v) * t);
  const bands = [
    [0, 0.34, 0x1a1210],    // the Sere, almost black
    [0.34, 0.42, 0xb0582c], // the last of the sun
    [0.42, 0.62, 0x6a3a5a],
    [0.62, 1, 0x2a2048],    // violet going up
  ];
  return bands.map(([t0, t1, fill]) => scene.v.poly([at(a, d, t0), at(b, c, t0), at(b, c, t1), at(a, d, t1)], { fill, fog: flat !== true, layer: 'outside' }));
}

export function buildRelay(scene) {
  const { W, D, H } = RELAY;
  const s = scene;
  const WALL = 0x4a4038;
  const WALL_LOW = 0x2e2824;
  const out = {};

  // The floor: worn tiles, the hatch at the far end.
  s.floor(-W, W, 0, D, { step: 0.5, a: 0x2c2620, b: 0x26211c });
  const { hatch } = RELAY;
  out.hatch = s.face([[hatch.x - 0.5, 0.004, hatch.z - 0.5], [hatch.x + 0.5, 0.004, hatch.z - 0.5], [hatch.x + 0.5, 0.004, hatch.z + 0.5], [hatch.x - 0.5, 0.004, hatch.z + 0.5]], { fill: 0x0c0a0a, lit: false });
  out.hatch.ground = true;
  s.ceiling(-W, W, 0, D, H, 0x2a2420, 2);

  // Near wall (z 0) with the front door on the left.
  const fx0 = RELAY.front.x - 0.55;
  const fx1 = RELAY.front.x + 0.55;
  s.wallZ(0, -W, fx0, 0, H, { fill: WALL, dado: 1.1, dadoFill: WALL_LOW, step: 0.55 });
  s.wallZ(0, fx1, W, 0, H, { fill: WALL, dado: 1.1, dadoFill: WALL_LOW });
  s.face([[fx0, 2.15, 0], [fx1, 2.15, 0], [fx1, H, 0], [fx0, H, 0]], { fill: WALL });
  out.frontDusk = dusk(s, [[fx0, 0, -0.05], [fx1, 0, -0.05], [fx1, 2.15, -0.05], [fx0, 2.15, -0.05]]);
  out.frontLeaf = s.face([[fx0, 0, 0.01], [fx1, 0, 0.01], [fx1, 2.15, 0.01], [fx0, 2.15, 0.01]], { fill: 0x3a2a20, shade: 0.9 });

  // Far wall (z D) with the back door on the right.
  const bx0 = RELAY.back.x - 0.55;
  const bx1 = RELAY.back.x + 0.55;
  s.wallZ(D, -W, bx0, 0, H, { fill: WALL, dado: 1.1, dadoFill: WALL_LOW });
  s.wallZ(D, bx1, W, 0, H, { fill: WALL, dado: 1.1, dadoFill: WALL_LOW, step: 0.45 });
  s.face([[bx0, 2.15, D], [bx1, 2.15, D], [bx1, H, D], [bx0, H, D]], { fill: WALL });
  out.backDusk = dusk(s, [[bx0, 0, D + 0.05], [bx1, 0, D + 0.05], [bx1, 2.15, D + 0.05], [bx0, 2.15, D + 0.05]]);
  out.backLeaf = s.face([[bx0, 0, D - 0.01], [bx1, 0, D - 0.01], [bx1, 2.15, D - 0.01], [bx0, 2.15, D - 0.01]], { fill: 0x3a2a20, shade: 0.9 });
  // The bar across it.
  out.bar = s.face([[bx0 - 0.15, 1.02, D - 0.06], [bx1 + 0.15, 1.02, D - 0.06], [bx1 + 0.15, 1.1, D - 0.06], [bx0 - 0.15, 1.1, D - 0.06]], { fill: 0x5a5048, shade: 1.2 });

  // Left wall (x -W): two windows onto the Sere, and the office doorway.
  const L = -W;
  const win = [[1.8, 3.4], [7.6, 9.2]];
  const side0 = RELAY.side.z - 0.55;
  const side1 = RELAY.side.z + 0.55;
  const spans = [[0, win[0][0]], [win[0][1], side0], [side1, win[1][0]], [win[1][1], D]];
  spans.forEach(([z0, z1]) => s.wallX(L, z0, z1, 0, H, { fill: WALL, dado: 1.1, dadoFill: WALL_LOW, step: Math.min(1, z1 - z0) }));
  win.forEach(([z0, z1]) => {
    s.wallX(L, z0, z1, 0, 1.1, { fill: WALL_LOW, step: z1 - z0 });
    s.wallX(L, z0, z1, 2.3, H, { fill: WALL, step: z1 - z0 });
    dusk(s, [[L - 0.05, -0.6, z1], [L - 0.05, -0.6, z0], [L - 0.05, 2.3, z0], [L - 0.05, 2.3, z1]]).forEach((p, i) => {
      // Only the part of the view inside the window frame.
      p.points.forEach((q) => { q[1] = Math.max(1.1, Math.min(2.3, q[1])); });
      if (i === 0) p.visible = false;
    });
    // Mullion.
    const m = (z0 + z1) / 2;
    s.face([[L + 0.02, 1.1, m - 0.03], [L + 0.02, 1.1, m + 0.03], [L + 0.02, 2.3, m + 0.03], [L + 0.02, 2.3, m - 0.03]], { fill: 0x1a1410 });
  });
  s.wallX(L, side0, side1, 2.15, H, { fill: WALL, step: 1.1 });
  // The office beyond the doorway: dark.
  s.face([[L - 1.2, 0, side0], [L - 1.2, 0, side1], [L - 1.2, 2.15, side1], [L - 1.2, 2.15, side0]], { fill: 0x0e0c0c, lit: false });
  s.face([[L - 1.2, 0, side0], [L, 0, side0], [L, 2.15, side0], [L - 1.2, 2.15, side0]], { fill: 0x161210, lit: false });
  s.face([[L - 1.2, 0, side1], [L, 0, side1], [L, 2.15, side1], [L - 1.2, 2.15, side1]], { fill: 0x121010, lit: false });

  // Right wall (x W): the relay cabinets, the boiler, the panel.
  s.wallX(W, 0, D, 0, H, { fill: WALL, dado: 1.1, dadoFill: WALL_LOW, shade: 0.8 });

  // Things in the room.
  const { boiler, table, panel } = RELAY;
  out.boiler = s.box(boiler.x0, boiler.x1, 0, 2.1, boiler.z0, boiler.z1, { fill: 0x5a3a2a, top: 0x6a4a36 });
  s.box(boiler.x0 + 0.3, boiler.x0 + 0.5, 2.1, H, boiler.z0 + 0.6, boiler.z0 + 0.8, { fill: 0x3a2a22, solid: false });
  s.box(table.x0, table.x1, 0.7, 0.78, table.z0, table.z1, { fill: 0x5a4632, top: 0x6a5238 });
  [[table.x0 + 0.1, table.z0 + 0.1], [table.x1 - 0.16, table.z0 + 0.1], [table.x0 + 0.1, table.z1 - 0.16], [table.x1 - 0.16, table.z1 - 0.16]]
    .forEach(([x, z]) => s.box(x, x + 0.06, 0, 0.7, z, z + 0.06, { fill: 0x3a2a20, solid: false }));
  s.blocks.push({ x0: table.x0, x1: table.x1, z0: table.z0, z1: table.z1 });
  // Chairs.
  out.chairs = [[-1.5, 4.3], [1.5, 4.3], [0, 3.1], [0, 5.5]].map(([x, z]) => s.box(x - 0.22, x + 0.22, 0.42, 0.47, z - 0.22, z + 0.22, { fill: 0x4a3626, solid: false }));
  // The dead relay: a bank of cabinets with brass dials, along the right wall.
  s.box(5.2, W, 0, 2.4, 7, 9.6, { fill: 0x3a3a34, top: 0x4a4a42 });
  for (let i = 0; i < 6; i++) {
    const z = 7.25 + i * 0.4;
    s.face([[5.18, 1.5, z], [5.18, 1.5, z + 0.22], [5.18, 1.72, z + 0.22], [5.18, 1.72, z]], { fill: 0x8a6a2a, shade: 1.3 });
  }
  // A counter with the kettle, by the far wall on the left.
  s.box(-5.6, -3.6, 0, 0.95, 9.3, D, { fill: 0x4a3c30, top: 0x5a4a3a });
  out.kettle = s.box(-4.9, -4.7, 0.95, 1.15, 9.5, 9.7, { fill: 0x6a6a68, solid: false });
  // The power panel by the boiler.
  out.panel = s.face([[panel.x - 0.03, panel.y - 0.35, panel.z - 0.25], [panel.x - 0.03, panel.y - 0.35, panel.z + 0.25], [panel.x - 0.03, panel.y + 0.35, panel.z + 0.25], [panel.x - 0.03, panel.y + 0.35, panel.z - 0.25]], { fill: 0x6a6450, shade: 1.1 });

  // Lamps on chains down the middle, and their light.
  out.lamps = RELAY.lamps.map((z) => {
    s.face([[-0.3, H - 0.62, z - 0.18], [0.3, H - 0.62, z - 0.18], [0.3, H - 0.62, z + 0.18], [-0.3, H - 0.62, z + 0.18]], { fill: 0x2a2620, lit: false });
    const bulb = s.v.poly([[-0.22, H - 0.64, z - 0.12], [0.22, H - 0.64, z - 0.12], [0.22, H - 0.64, z + 0.12], [-0.22, H - 0.64, z + 0.12]], { fill: 0xffd8a0 });
    s.v.line([[0, H, z], [0, H - 0.62, z]], { color: 0x1a1612, width: 2, world: false });
    const light = s.light({ x: 0, y: H - 0.8, z, power: 1.5, radius: 4, color: 0xffd6a0 });
    return { z, bulb, light };
  });
  // What the windows let in: dusk, low and orange, from the left.
  out.duskLight = s.light({ x: -W - 1, y: 1.6, z: 5, power: 0.6, radius: 7, color: 0xd07850 });
  s.bounds = [-W, 0, W, D];
  return out;
}
