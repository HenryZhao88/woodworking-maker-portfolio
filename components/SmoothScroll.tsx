"use client";
import Lenis from "lenis";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance (null under reduced motion or before mount). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const instance = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick, false, true); // first, so the scene renders after scroll updates
    gsap.ticker.lagSmoothing(0);
    // Publishing an external instance created in this effect is the intended use here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);
    (window as unknown as { __lenis?: Lenis }).__lenis = instance;
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
