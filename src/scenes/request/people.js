import { lerp } from '../../fp/Room.js';
import * as sfx from '../../audio/sfx.js';

// People in a first-person room: a billboard each, a front and a back.
// Walking, they show their back when they are going away from you and their
// face when they are coming toward you.

export function person(scene, id, x, z, { h = 1.75, key = `f_${id}`, visible = true } = {}) {
  const b = scene.figure(key, { x, z, h });
  b.visible = visible;
  return { id, key, x, z, b, hurt: 0 };
}

export function show(scene, p, key) {
  if (p.b.key === key) return;
  scene.v.setBoardTexture(p.b, key);
}

// Face or back, by which way they are heading relative to the camera.
function turn(scene, p, dx, dz) {
  const cx = p.x - scene.pos.x;
  const cz = p.z - scene.pos.z;
  const away = dx * cx + dz * cz > 0;
  show(scene, p, away ? `${p.key}_back` : p.key);
}

// Walk through points ([x, z] pairs) at `speed` m/s; ends facing the camera.
export async function walk(scene, p, pts, speed = 1.2, { steps = true, end = 'front' } = {}) {
  for (const [x, z] of pts) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < 0.02) continue;
    const from = { x: p.x, z: p.z };
    const s = { t: 0 };
    let stride = 0;
    await new Promise((resolve) => scene.tweens.add({
      targets: s, t: 1, duration: (d / speed) * 1000, ease: 'Linear',
      onUpdate: () => {
        const nx = lerp(from.x, x, s.t);
        const nz = lerp(from.z, z, s.t);
        stride += Math.hypot(nx - p.x, nz - p.z);
        p.x = nx; p.z = nz;
        p.b.x = nx; p.b.z = nz;
        turn(scene, p, x - from.x, z - from.z);
        if (steps && stride > 0.7) {
          stride = 0;
          const near = Math.hypot(p.x - scene.pos.x, p.z - scene.pos.z);
          sfx.footstep({ kind: 'soft', gain: Math.max(0.05, 0.4 - near * 0.04) });
        }
      },
      onComplete: resolve,
    }));
  }
  if (end === 'front') show(scene, p, p.key);
  if (end === 'back') show(scene, p, `${p.key}_back`);
}
