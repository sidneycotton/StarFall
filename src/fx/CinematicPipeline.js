import Phaser from 'phaser';

// One full-screen post pass per camera: the film stock of the game.
// - duotone emergency grade (the RED that fights the violet)
// - radial chromatic separation, grain, vignette
// - exposure / tint / desaturation / flash / fade, driven by the FX controller
// Cheap enough for mid-range phones: 3 texture reads and some arithmetic.

const FRAG = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2  uResolution;
uniform float uTime;
uniform float uRed;
uniform vec2  uRedPos;
uniform float uRedFocus;
uniform float uGrain;
uniform float uAberration;
uniform float uVignette;
uniform float uFlash;
uniform vec3  uFlashColor;
uniform float uFade;
uniform float uDesat;
uniform float uWarp;
uniform vec3  uTint;
uniform vec3  uLift;
uniform float uExposure;

varying vec2 outTexCoord;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = outTexCoord;
  // Hangover: the slightest horizontal sway, never enough to read as "drunk".
  uv.x += sin(uv.y * 5.0 + uTime * 0.8) * uWarp * 0.0016;
  uv.y += sin(uv.x * 4.0 + uTime * 0.6) * uWarp * 0.0010;

  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  vec2 off = c * (0.0015 + r2 * 0.012) * uAberration;
  vec3 col;
  col.r = texture2D(uMainSampler, uv + off).r;
  col.g = texture2D(uMainSampler, uv).g;
  col.b = texture2D(uMainSampler, uv - off).b;

  col *= uExposure;

  // Emergency duotone: luminance remapped onto a red ramp, strongest near the source.
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 redRamp = mix(vec3(0.02, 0.0, 0.004), vec3(1.0, 0.16, 0.18), smoothstep(0.0, 0.55, lum));
  redRamp += vec3(1.0, 0.75, 0.7) * smoothstep(0.55, 1.0, lum) * 0.6;
  float d = distance(uv * vec2(1.7778, 1.0), uRedPos * vec2(1.7778, 1.0));
  float focus = mix(1.0, smoothstep(1.6, 0.0, d), uRedFocus);
  col = mix(col, redRamp * 1.15, clamp(uRed * focus, 0.0, 1.0));

  col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), uDesat);
  col = col * uTint + uLift * (1.0 - col);

  // Vignette (wider than tall, like a lens).
  vec2 vc = c * vec2(1.0, 1.25);
  float v = smoothstep(0.92, 0.18, length(vc) * 1.18);
  col *= mix(1.0, v, uVignette);

  // Grain: luminance-weighted so blacks stay black.
  float g = hash(uv * uResolution + fract(uTime * 7.13) * 91.7) - 0.5;
  col += g * uGrain * (0.35 + lum * 0.9);

  col = mix(col, uFlashColor, uFlash);
  col *= (1.0 - uFade);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const FX_DEFAULTS = {
  red: 0,
  redX: 0.5,
  redY: 0.5,
  redFocus: 0,
  grain: 0.07,
  aberration: 0.6,
  vignette: 0.75,
  flash: 0,
  flashR: 1, flashG: 1, flashB: 1,
  fade: 0,
  desat: 0,
  warp: 0,
  tintR: 1, tintG: 1, tintB: 1,
  liftR: 0, liftG: 0, liftB: 0,
  exposure: 1,
};

export class CinematicPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({ game, name: 'CinematicPipeline', fragShader: FRAG });
    this.params = { ...FX_DEFAULTS };
  }

  onPreRender() {
    const p = this.params;
    this.set1f('uTime', (this.game.loop.time / 1000) % 1000);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
    this.set1f('uRed', p.red);
    this.set2f('uRedPos', p.redX, 1 - p.redY);
    this.set1f('uRedFocus', p.redFocus);
    this.set1f('uGrain', p.grain);
    this.set1f('uAberration', p.aberration);
    this.set1f('uVignette', p.vignette);
    this.set1f('uFlash', p.flash);
    this.set3f('uFlashColor', p.flashR, p.flashG, p.flashB);
    this.set1f('uFade', p.fade);
    this.set1f('uDesat', p.desat);
    this.set1f('uWarp', p.warp);
    this.set3f('uTint', p.tintR, p.tintG, p.tintB);
    this.set3f('uLift', p.liftR, p.liftG, p.liftB);
    this.set1f('uExposure', p.exposure);
  }
}
