"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useScene } from "./sceneStore";
import { backdropFragment, backdropVertex, motesFragment, motesVertex } from "./shaders/backdrop";

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
    quad.renderOrder = -10;

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
    motes.renderOrder = -9;
    scene.add(quad, motes);

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
      scene.remove(quad, motes);
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

  useFrame((_, delta) => {
    const u = uniforms.current;
    if (!u) return;
    u.uTime.value += delta * timeScale.current;
    u.uRes.value.set(window.innerWidth, window.innerHeight);
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uScroll.value = Math.min(1, window.scrollY / window.innerHeight);
  });

  return null;
}
