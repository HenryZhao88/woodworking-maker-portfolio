"use client";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useScene } from "./sceneStore";
import { backdropFragment, backdropVertex, motesFragment, motesVertex } from "./shaders/backdrop";

/** Persistent backdrop: flowing walnut grain + dust motes in a drifting shaft of light. */
export function HomeBackground({ particles }: { particles: number }) {
  const { gl, scene } = useThree();
  const sceneName = useScene((s) => s.scene);
  const reduced = useMemo(() => (typeof window !== "undefined" ? prefersReducedMotion() : false), []);

  const shared = useMemo(
    () => ({
      uTime: { value: 0 },
      uMix: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPixelRatio: { value: 1 },
    }),
    []
  );

  const { quad, motes } = useMemo(() => {
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: backdropVertex, fragmentShader: backdropFragment, uniforms: shared, depthTest: false, depthWrite: false })
    );
    quad.frustumCulled = false;
    quad.renderOrder = -10;

    const geo = new THREE.BufferGeometry();
    const seeds = new Float32Array(particles * 4);
    for (let i = 0; i < particles; i++) {
      seeds[i * 4] = Math.random() * 2.2 - 1.1;
      seeds[i * 4 + 1] = Math.random() * 2.2 - 1.1;
      seeds[i * 4 + 2] = 0.3 + Math.random() * 0.9;
      seeds[i * 4 + 3] = Math.pow(Math.random(), 2.2);
    }
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particles * 3), 3));
    const motes = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({ vertexShader: motesVertex, fragmentShader: motesFragment, uniforms: shared, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    motes.frustumCulled = false;
    motes.renderOrder = -9;
    return { quad, motes };
  }, [particles, shared]);

  useEffect(() => {
    scene.add(quad, motes);
    return () => {
      scene.remove(quad, motes);
      quad.geometry.dispose();
      (quad.material as THREE.Material).dispose();
      motes.geometry.dispose();
      (motes.material as THREE.Material).dispose();
    };
  }, [scene, quad, motes]);

  // Scene changes ease the backdrop between home and project moods.
  useEffect(() => {
    const target = sceneName === "home" ? 0 : sceneName === "spoon" ? 1 : 0.7;
    gsap.to(shared.uMix, { value: target, duration: 1.6, ease: "power2.inOut" });
  }, [sceneName, shared]);

  // Subtle cursor drift (fine pointers only, never under reduced motion).
  useEffect(() => {
    if (reduced || window.matchMedia("(pointer: coarse)").matches) return;
    const to = { x: gsap.quickTo(shared.uMouse.value, "x", { duration: 2.2, ease: "power3" }), y: gsap.quickTo(shared.uMouse.value, "y", { duration: 2.2, ease: "power3" }) };
    const move = (e: PointerEvent) => {
      to.x((e.clientX / window.innerWidth) * 2 - 1);
      to.y(-((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [reduced, shared]);

  useFrame((_, delta) => {
    shared.uTime.value += delta * (reduced ? 0.15 : 1);
    shared.uRes.value.set(window.innerWidth, window.innerHeight);
    shared.uPixelRatio.value = gl.getPixelRatio();
    shared.uScroll.value = Math.min(1, window.scrollY / window.innerHeight);
  });

  return null;
}
