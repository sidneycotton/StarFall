import { paintTexture, rad, lin, rgba } from './paint.js';

// Neutral light shapes, tinted and ADD-blended in scenes. White textures let a
// single asset serve violet party light, red emergency light and gold sky streaks.

export function registerLights(scene) {
  paintTexture(scene, 'light_soft', 256, 256, (ctx) => {
    ctx.fillStyle = rad(ctx, 128, 128, 128, [
      [0, 'rgba(255,255,255,1)'],
      [0.25, 'rgba(255,255,255,0.55)'],
      [0.6, 'rgba(255,255,255,0.14)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    ctx.fillRect(0, 0, 256, 256);
  });

  paintTexture(scene, 'light_core', 64, 64, (ctx) => {
    ctx.fillStyle = rad(ctx, 32, 32, 32, [
      [0, 'rgba(255,255,255,1)'],
      [0.2, 'rgba(255,255,255,0.8)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    ctx.fillRect(0, 0, 64, 64);
  });

  // A downward cone, origin at the top.
  paintTexture(scene, 'light_cone', 256, 512, (ctx, w, h) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.44, 0);
    ctx.lineTo(w * 0.56, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, 'rgba(255,255,255,0.9)'], [0.5, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, w, h);
    // Soften the edges horizontally.
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(0,0,0,0)'], [0.3, 'rgba(0,0,0,1)'], [0.7, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }, { scale: 0.5 });

  // A long soft horizontal streak (floor reflections, light strips).
  paintTexture(scene, 'light_streak', 512, 32, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(0, 0, w, h);
  });

  // Vertical reflection streak for lacquered floors.
  paintTexture(scene, 'light_drip', 32, 256, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(0, 0, w, h);
  });

  // A searchlight beam, origin at the bottom centre.
  paintTexture(scene, 'light_beam', 128, 1024, (ctx, w, h) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.47, h);
    ctx.lineTo(w * 0.53, h);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = lin(ctx, 0, h, 0, 0, [[0, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }, { scale: 0.5 });

  paintTexture(scene, 'mote', 16, 16, (ctx) => {
    ctx.fillStyle = rad(ctx, 8, 8, 8, [[0, 'rgba(255,255,255,0.9)'], [0.4, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, 16, 16);
  });

  // A thin falling streak (sky traffic / hero launches).
  paintTexture(scene, 'streak', 256, 8, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(255,255,255,0)'], [0.85, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,1)']]);
    ctx.fillRect(0, h * 0.25, w, h * 0.5);
  });

  paintTexture(scene, 'pixel', 4, 4, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 4, 4);
  });

  paintTexture(scene, 'vignette_bar', 16, 256, (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, rgba('#000000', 1)], [1, rgba('#000000', 0)]]);
    ctx.fillRect(0, 0, w, h);
  });
}
