import { NOISE } from "./noise";

export const PLANE_MODE = { generic: 0, strip: 1, grain: 2, displace: 3, inspect: 4 } as const;

export const planeVertex = /* glsl */ `
uniform mat3 uH;        // unit square -> clip space (projective)
uniform float uVel;     // smoothed scroll velocity, ~-1..1
uniform float uMode;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = uH * vec3(uv, 1.0);
  float k = 3.14159265;
  if (uMode == 1.0) {
    // film strip: the card bows sideways like flexible veneer
    p.x += sin(uv.y * k) * uVel * 0.05 * p.z;
  } else {
    p.y += sin(uv.x * k) * uVel * 0.025 * p.z;
  }
  gl_Position = vec4(p.xy, 0.0, p.z);
}
`;

export const planeFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform float uAlpha;
uniform float uVel;
uniform float uMode;
uniform float uProgress;
uniform float uTime;
uniform vec4 uClip;      // visible region in framebuffer pixels (x0, y0, x1, y1), like the DOM's overflow clip
varying vec2 vUv;
${NOISE}
void main() {
  if (gl_FragCoord.x < uClip.x || gl_FragCoord.y < uClip.y || gl_FragCoord.x > uClip.z || gl_FragCoord.y > uClip.w) discard;
  vec2 uv = vUv;
  float alpha = uAlpha;

  if (uMode == 3.0) {
    // displacement crossfade: the photo liquefies as it fades
    float t = 1.0 - uAlpha;
    float n = fbm(uv * 3.0 + vec2(uTime * 0.05, 0.0));
    uv += (vec2(n, fbm(uv * 3.0 + 7.3)) - 0.5) * 0.35 * t;
  }

  vec2 split = vec2(0.0, clamp(uVel, -1.0, 1.0) * 0.012);
  if (uMode == 4.0) {
    // inspection cut: as the photo fades, rows tear sideways along the grain and the color channels split
    float t = 1.0 - uAlpha;
    float row = floor(uv.y * 54.0);
    float tear = fbm(vec2(row * 0.41, floor(uTime * 12.0) * 0.13)) - 0.5;
    uv.x += tear * 0.28 * t * t;
    uv.y += (fbm(uv * 3.0 + 7.0) - 0.5) * 0.03 * t;
    split += vec2(0.045 * t, 0.0);
  }
  vec3 col = vec3(
    texture2D(uTex, uv + split).r,
    texture2D(uTex, uv).g,
    texture2D(uTex, uv - split).b
  );

  if (uMode == 2.0) {
    // wood-grain dissolve: reveal follows growth-ring contours, with a hot gold edge
    float rings = sin(uv.x * 34.0 + fbm(uv * vec2(1.5, 6.0)) * 7.0) * 0.5 + 0.5;
    float n = mix(rings, fbm(uv * 5.0), 0.45);
    float p = uProgress * 1.25 - 0.1;
    float m = smoothstep(n - 0.06, n + 0.06, p);
    float edge = smoothstep(0.0, 0.5, m) * (1.0 - smoothstep(0.5, 1.0, m));
    col = mix(col, vec3(0.86, 0.72, 0.42), edge * 1.4);
    alpha *= m;
  }

  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
`;
