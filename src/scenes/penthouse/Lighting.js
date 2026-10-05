import Phaser from 'phaser';
import { sound } from '../../audio/soundscape.js';
import { audio } from '../../audio/AudioEngine.js';
import { L, SF } from './layout.js';

// Two lighting systems fighting over one room.
//   PARTY  — violet, soft, slow, residual: lamp pools that breathe.
//   ALARM  — red, sharp, rhythmic: one clock shared with the alarm audio.
// Each red pulse suppresses the violet and drags the whole frame through the
// shader's red duotone, then lets the violet seep back. RED. PURPLE. RED.

export class Lighting {
  constructor(scene, world, fx) {
    this.scene = scene;
    this.world = world;
    this.fx = fx;
    this.mode = 'party';
    this.violet = 1;       // party light level
    this.alarm = 0;        // 0..1 how hard the emergency fights
    this.windowLevel = 1;
    this.cityAlert = 0;    // run sequence: city emergency light through windows
    this.ledOnly = false;  // the opening: only the relay LED exists
    this.pulse = 0;
  }

  update(time, cam) {
    const t = time / 1000;
    const w = this.world;
    const pulse = sound.alarm.running ? sound.alarm.pulseAt(audio.now) : 0;
    this.pulse = pulse;
    const red = pulse * this.alarm;

    // Violet breathes slowly; red pushes it down.
    const breathe = 0.86 + Math.sin(t * 0.55) * 0.1 + Math.sin(t * 1.7) * 0.03;
    const violetK = this.violet * breathe * (1 - red * 0.65);
    w.lights.violet.forEach((l) => l.setAlpha(l.baseAlpha * violetK));
    w.lights.red.forEach((l) => l.setAlpha(l.baseAlpha * red));
    w.lights.window.forEach((l) => l.setAlpha((l.home ?? l.baseAlpha) * this.windowLevel * (1 + this.cityAlert * 1.6 * (0.6 + 0.4 * Math.sin(t * 5.2)))));

    // The relay LED: the very first thing the player sees.
    const led = sound.alarm.running ? pulse : 0;
    w.relayLed.setAlpha(led);
    w.relayHalo.setAlpha(led * 0.45);

    // Seer points on the Glass pulse in sequence with the three-tone chord.
    if (this.seerPointsOn) {
      const idx = Math.floor(((audio.now - sound.alarm.origin) / sound.alarm.period)) % 3;
      w.seerPoints.forEach((p, i) => p.setAlpha(this.seerLevel[i] * (0.35 + (i === idx ? pulse * 0.65 : 0))));
      w.altarDiscs.forEach((d, i) => d.setAlpha(this.seerLevel[i] * (0.25 + (i === idx ? pulse * 0.5 : 0))));
    }

    // The eclipse disc catches a violet rim when the window is behind it.
    w.discRim.setAlpha(0.05 + violetK * 0.08);

    // Shader: red duotone weighted toward the sanctum (the alarm's source).
    if (this.fx) {
      const camCenter = cam.scrollX + cam.width / 2;
      const srcX = 0.5 + (L.altar - camCenter) / (cam.width / cam.zoom);
      const p = this.fx.p;
      p.red = Phaser.Math.Clamp(red * 0.78 + this.cityAlert * 0.18 * Math.max(0, Math.sin(t * 5.2)), 0, 1);
      p.redX = Phaser.Math.Clamp(srcX, -0.6, 1.6);
      p.redY = 0.45;
      p.redFocus = this.cityAlert > 0 ? 0.2 : 0.55;
    }
    void SF;
  }

  setSeerPoints(levels) {
    this.seerPointsOn = true;
    this.seerLevel = levels;
  }
}
