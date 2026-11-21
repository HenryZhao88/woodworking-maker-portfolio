"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/** Hotter cells use denser glyphs and brighter color: ember brown, orange, gold, pale ash at the core. */
const RAMP = " .,:;-=+*#%@";
const MAX = RAMP.length - 1;
/** Internal heat has finer steps than the glyph ramp, so cooling is uneven and flames break into tongues. */
const HEAT = 26;
const COLORS = ["", "#4e2410", "#743214", "#984318", "#b8541c", "#d06622", "#dc7a2c", "#e0923e", "#d9a956", "#d8bd7e", "#e6d3a6", "#f4ecdc"];
const FPS = 30;

/**
 * The loading screen's ASCII fire: a classic heat-spread simulation (heat rises from the bottom row,
 * drifts sideways and cools as it climbs) drawn as text glyphs. `intensity` (0..1) feeds the base
 * of the fire, so it burns higher as loading progresses and dies down when set to 0.
 */
export function AsciiFire({ intensity, className }: { intensity: { current: number }; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const font = getComputedStyle(document.body).fontFamily;
    let cols = 0;
    let rows = 0;
    let cw = 0;
    let ch = 0;
    let heat = new Uint8Array(0);
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const small = width < 768;
      cw = small ? 8 : 10;
      ch = small ? 12 : 15;
      cols = Math.ceil(width / cw);
      rows = Math.ceil(height / ch);
      heat = new Uint8Array(cols * rows);
      ctx.font = `500 ${small ? 11 : 13}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };

    const step = () => {
      // Feed the bottom row: hotter as loading progresses, flickering per column.
      const base = (rows - 1) * cols;
      const fuel = intensity.current;
      // Hot and cool spots drift along the base (three slow waves), so the fire forms separate swaying tongues.
      const t = (frame += 1) / FPS;
      for (let x = 0; x < cols; x++) {
        const wave = (Math.sin(x * 0.13 + t * 1.7) + Math.sin(x * 0.051 - t * 1.1) + 0.5 * Math.sin(x * 0.29 + t * 2.3)) / 2.5; // -1..1
        const local = 0.12 + 0.88 * Math.pow(wave * 0.5 + 0.5, 1.6); // deep gaps between tall tongues
        heat[base + x] = fuel <= 0 ? 0 : Math.round(HEAT * Math.min(1, fuel * local * (0.85 + Math.random() * 0.3)));
      }
      // Each cell passes its heat to the cell above (with sideways drift), losing a little.
      for (let y = 1; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const src = y * cols + x;
          const r = (Math.random() * 3) | 0; // sideways drift: -1, 0, +1
          const dst = src - cols - r + 1;
          const roll = Math.random();
          const cool = roll < 0.42 ? 1 : roll < 0.5 ? 2 : 0;
          if (dst >= 0) heat[dst] = Math.max(0, heat[src] - cool);
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, cols * cw, rows * ch);
      // One fillStyle per heat level, so each color is set once per frame.
      for (let level = 1; level <= MAX; level++) {
        ctx.fillStyle = COLORS[level];
        const glyph = RAMP[level];
        for (let i = 0; i < heat.length; i++) {
          if (Math.round((heat[i] / HEAT) * MAX) !== level) continue;
          ctx.fillText(glyph, (i % cols) * cw + cw / 2, ((i / cols) | 0) * ch + ch / 2);
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.setAttribute("data-running", ""); // drawing starts after hydration

    if (prefersReducedMotion()) {
      // A still frame: let the fire settle, then draw it once.
      for (let i = 0; i < rows * 2; i++) step();
      draw();
      return () => window.removeEventListener("resize", resize);
    }

    let acc = 0;
    const tick = (_t: number, dt: number) => {
      acc += dt;
      if (acc < 1000 / FPS) return;
      acc = 0;
      step();
      draw();
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return <canvas ref={ref} className={className} data-fire aria-hidden />;
}
