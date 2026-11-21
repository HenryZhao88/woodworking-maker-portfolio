"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useScene } from "./sceneStore";
import { backdropFragment, backdropVertex, compositeFragment, motesFragment, motesVertex } from "./shaders/backdrop";
import { markDirty } from "./frameGate";

/** The backdrop drifts slowly: it is drawn at 30fps into a buffer at 75% of CSS resolution, then scaled up. */
const BG_FPS = 30;
const BG_SCALE = 0.75;

type Uniforms = {
  uTime: { value: number };
  uMix: { value: number };
  uScroll: { value: number };
  uMouse: { value: THREE.Vector2 };
  uRes: { value: THREE.Vector2 };
  uPixelRatio: { value: number };
};

/** Small deterministic PRNG so the mote field is stable between renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Persistent backdrop: flowing walnut grain + dust motes in a drifting shaft of light. */
export function HomeBackground({ particles }: { particles: number }) {
  const { gl, scene } = useThree();
  const sceneName = useScene((s) => s.scene);
  const uniforms = useRef<Uniforms | null>(null);
  const timeScale = useRef(1);
  const bg = useRef<{ scene: THREE.Scene; rt: THREE.WebGLRenderTarget; seed: { value: number }; last: number } | null>(null);

  // Build the scene objects imperatively (they are GPU resources, not React state).
  useEffect(() => {
    const u: Uniforms = {
      uTime: { value: 0 },
      uMix: { value: useScene.getState().scene === "home" ? 0 : 1 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uPixelRatio: { value: gl.getPixelRatio() },
    };
    uniforms.current = u;
    timeScale.current = prefersReducedMotion() ? 0.15 : 1;

    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: backdropVertex, fragmentShader: backdropFragment, uniforms: u, depthTest: false, depthWrite: false })
    );
    quad.frustumCulled = false;

    const rand = mulberry32(7);
    const seeds = new Float32Array(particles * 4);
    for (let i = 0; i < particles; i++) {
      seeds[i * 4] = rand() * 2.2 - 1.1;
      seeds[i * 4 + 1] = rand() * 2.2 - 1.1;
      seeds[i * 4 + 2] = 0.3 + rand() * 0.9;
      seeds[i * 4 + 3] = Math.pow(rand(), 2.2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particles * 3), 3));
    const motes = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({ vertexShader: motesVertex, fragmentShader: motesFragment, uniforms: u, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    motes.frustumCulled = false;
    motes.renderOrder = 1;
    const bgScene = new THREE.Scene();
    bgScene.add(quad, motes);
    const rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
    const seed = { value: 0 };
    const composite = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: backdropVertex,
        fragmentShader: compositeFragment,
        uniforms: { uBg: { value: rt.texture }, uRes: u.uRes, uSeed: seed },
        depthTest: false,
        depthWrite: false,
      })
    );
    composite.frustumCulled = false;
    composite.renderOrder = -10;
    scene.add(composite);
    bg.current = { scene: bgScene, rt, seed, last: -Infinity };

    // Subtle cursor drift (fine pointers only, never under reduced motion).
    let move: ((e: PointerEvent) => void) | null = null;
    if (!prefersReducedMotion() && !window.matchMedia("(pointer: coarse)").matches) {
      const toX = gsap.quickTo(u.uMouse.value, "x", { duration: 2.2, ease: "power3" });
      const toY = gsap.quickTo(u.uMouse.value, "y", { duration: 2.2, ease: "power3" });
      move = (e: PointerEvent) => {
        toX((e.clientX / window.innerWidth) * 2 - 1);
        toY(-((e.clientY / window.innerHeight) * 2 - 1));
      };
      window.addEventListener("pointermove", move);
    }

    return () => {
      if (move) window.removeEventListener("pointermove", move);
      scene.remove(composite);
      composite.geometry.dispose();
      (composite.material as THREE.Material).dispose();
      rt.dispose();
      bg.current = null;
      quad.geometry.dispose();
      (quad.material as THREE.Material).dispose();
      geo.dispose();
      (motes.material as THREE.Material).dispose();
      uniforms.current = null;
    };
  }, [particles, scene, gl]);

  // Scene changes ease the backdrop between home and project moods.
  useEffect(() => {
    const u = uniforms.current;
    if (!u) return;
    const target = sceneName === "home" ? 0 : sceneName === "spoon" ? 1 : 0.7;
    const tw = gsap.to(u.uMix, { value: target, duration: 1.6, ease: "power2.inOut" });
    return () => {
      tw.kill();
    };
  }, [sceneName]);

  useFrame(({ camera }, delta) => {
    const u = uniforms.current;
    const b = bg.current;
    if (!u || !b) return;
    u.uTime.value += delta * timeScale.current;
    const now = performance.now();
    const W = window.innerWidth;
    const H = window.innerHeight;
    const w = Math.max(1, Math.round(W * BG_SCALE));
    const h = Math.max(1, Math.round(H * BG_SCALE));
    const resized = b.rt.width !== w || b.rt.height !== h;
    if (!resized && now - b.last < 1000 / BG_FPS - 2) return;
    b.last = now;
    if (resized) b.rt.setSize(w, h);
    u.uRes.value.set(W, H);
    u.uPixelRatio.value = 1; // motes keep their on-screen size (a touch larger than 75% buffer pixels, so the smallest stay visible)
    u.uScroll.value = Math.min(1, window.scrollY / H);
    b.seed.value = u.uTime.value % 1;
    gl.setRenderTarget(b.rt);
    gl.render(b.scene, camera);
    gl.setRenderTarget(null);
    markDirty();
  });

  return null;
}
