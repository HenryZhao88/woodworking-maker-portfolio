import { NOISE } from "./noise";

export const backdropVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const backdropFragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uMix;     // 0 home, 1 project pages (calmer, dimmer)
uniform float uScroll;  // 0..1 page scroll in the first viewport
uniform vec2 uMouse;    // eased pointer, -1..1
uniform vec2 uRes;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  p += uMouse * 0.035;
  float t = uTime * 0.035;

  // domain-warped coordinates: grain that slowly breathes
  vec2 q = vec2(fbm(p * 1.2 + t), fbm(p * 1.2 - t + 5.2));
  vec2 r = p + (q - 0.5) * 0.9;

  // growth rings of a log whose pith sits far below the frame -> long flowing lines
  float d = length(vec2(r.x * 0.32, r.y * 2.6 + 2.4));
  float rings = sin(d * 30.0 + fbm(r * 3.5) * 4.0) * 0.5 + 0.5;
  float fine = sin(d * 140.0 + fbm(r * 9.0) * 6.0) * 0.5 + 0.5;

  vec3 base = vec3(0.052, 0.040, 0.029);
  vec3 late = vec3(0.115, 0.080, 0.050);
  vec3 col = mix(base, late, pow(rings, 3.0) * 0.85 + fine * 0.08);

  // drifting shaft of workshop light (gold), revealing the grain where it falls
  vec2 lp = vec2(0.45 + sin(t * 1.7) * 0.18, 0.42 + cos(t * 1.3) * 0.06);
  float light = smoothstep(1.15, 0.0, length((p - lp) * vec2(0.8, 1.3)));
  col += vec3(0.78, 0.64, 0.40) * light * (0.06 + pow(rings, 2.0) * 0.16);

  col *= smoothstep(1.35, 0.25, length(p * vec2(0.85, 1.0)));     // vignette
  col = mix(col, base + (col - base) * 0.38, uMix);               // calmer on project pages
  col *= 1.0 - uScroll * 0.45;
  gl_FragColor = vec4(col, 1.0); // colors authored in sRGB: no output conversion
}
`;

/** Draws the low-res backdrop (grain + motes) full screen, with the film grain added at full resolution. */
export const compositeFragment = /* glsl */ `
precision highp float;
uniform sampler2D uBg;
uniform vec2 uRes;
uniform float uSeed;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
void main() {
  vec3 col = texture2D(uBg, vUv).rgb;
  col += (hash(vUv * uRes + uSeed) - 0.5) * 0.012; // film grain
  gl_FragColor = vec4(col, 1.0);
}
`;

export const motesVertex = /* glsl */ `
attribute vec4 aSeed;   // x,y start, speed, size
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uRes;
uniform float uPixelRatio;
varying float vAlpha;
void main() {
  float y = mod(aSeed.y + uTime * aSeed.z * 0.03 + 1.0, 2.2) - 1.1;
  float x = aSeed.x + sin(uTime * 0.2 + aSeed.y * 9.0) * 0.04;
  float depth = aSeed.w;                       // 0..1, near motes move more with the cursor
  vec2 pos = vec2(x, y) + uMouse * 0.025 * (0.3 + depth);
  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = (1.0 + depth * 3.2) * uPixelRatio;
  // brighter where the light shaft is
  float shaft = smoothstep(0.9, 0.0, abs(pos.x - 0.3 + pos.y * 0.35));
  vAlpha = (0.12 + 0.55 * shaft) * (0.4 + depth * 0.6) * (0.6 + 0.4 * sin(uTime * 1.3 + aSeed.x * 40.0));
}
`;

export const motesFragment = /* glsl */ `
precision highp float;
uniform float uMix;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha * (1.0 - uMix * 0.6);
  gl_FragColor = vec4(vec3(0.92, 0.80, 0.55) * a, a);
}
`;
