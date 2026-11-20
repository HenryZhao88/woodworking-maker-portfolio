"use client";
import { useEffect, useRef } from "react";
import { Canvas, advance } from "@react-three/fiber";
import { gsap } from "@/lib/gsap";
import { tierSettings } from "@/lib/quality";
import { useLenis } from "@/components/SmoothScroll";
import { useScene } from "./sceneStore";
import { PlaneLayer } from "./PlaneLayer";
import { HomeBackground } from "./HomeBackground";
import { BootProbe } from "./BootProbe";
import { GLErrorBoundary } from "./GLErrorBoundary";
import styles from "./SceneCanvas.module.css";

/**
 * The one persistent WebGL canvas (mounted in the root layout, survives route changes).
 * Rendering is driven from the GSAP ticker *after* Lenis + ScrollTrigger have updated the DOM,
 * so planes never lag a frame behind the page.
 */
export function SceneCanvas() {
  const tier = useScene((s) => s.tier);
  const setTier = useScene((s) => s.setTier);
  const lenis = useLenis();
  const velocity = useRef(0);

  useEffect(() => {
    if (!tier || tier === "fallback") return;
    const tick = () => {
      const raw = lenis ? lenis.velocity : 0;
      const target = gsap.utils.clamp(-1, 1, raw / 45);
      velocity.current += (target - velocity.current) * 0.12;
      advance(performance.now() / 1000); // R3F "never" mode expects seconds
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [tier, lenis]);

  if (!tier || tier === "fallback") return null;
  const settings = tierSettings(tier);

  return (
    <div className={styles.wrap} aria-hidden>
      <GLErrorBoundary onError={() => setTier("fallback")}>
      <Canvas
        frameloop="never"
        dpr={[1, settings.dprMax]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        orthographic
        camera={{ position: [0, 0, 5], zoom: 1 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setTier("fallback");
          });
        }}
      >
        <HomeBackground particles={settings.particles} />
        <PlaneLayer velocity={velocity} />
        <BootProbe />
      </Canvas>
      </GLErrorBoundary>
    </div>
  );
}
