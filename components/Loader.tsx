"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getImageProps } from "next/image";
import { projects } from "@/content/projects";
import { otherRoutes, sitePreloads } from "@/lib/preload";
import { AsciiFire } from "@/components/AsciiFire";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { LOADER_HARD_CAP_MS, minLoaderDuration } from "@/lib/loader";
import { useLenis } from "@/components/SmoothScroll";
import { useScene } from "@/components/gl/sceneStore";
import { BOOT_KEYS, bootGate, bootStats, finishBoot, markBoot } from "@/components/bootGate";
import styles from "./Loader.module.css";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function measureFrames(n: number): Promise<number> {
  return new Promise((resolve) => {
    const times: number[] = [];
    let last = performance.now();
    const f = (now: number) => {
      times.push(now - last);
      last = now;
      if (times.length > n) resolve(times.slice(1).reduce((a, b) => a + b, 0) / n);
      else requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
}

/**
 * First-visit loader. Waits for real readiness (fonts, every photo on this page decoded, every photo
 * and route of the other pages prefetched, WebGL compiled with textures uploaded, warm-up frames) plus a
 * hardware-scaled minimum, never longer than the hard cap. An ASCII fire burns higher as loading
 * progresses. Not shown again on client-side navigation.
 */
export function Loader() {
  const [mounted, setMounted] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const tier = useScene((s) => s.tier);
  const lenis = useLenis();
  const router = useRouter();
  const fire = useRef(0.55); // fire fuel, 0..1
  const siteFrac = useRef(0); // share of other pages' photos fetched

  // Hold the page still while loading.
  useEffect(() => {
    if (!mounted) return;
    lenis?.stop();
    return () => lenis?.start();
  }, [lenis, mounted]);

  // Fonts + images (Photo renders loading="eager", so every photo is already downloading).
  useEffect(() => {
    document.fonts.ready.then(() => markBoot("fonts"));
    const imgs = [...document.querySelectorAll<HTMLImageElement>("main img")];
    Promise.all(imgs.map((img) => img.decode().catch(() => undefined))).then(() => markBoot("images"));
  }, []);

  // The rest of the site: other pages' code/data and every photo they show, at the exact size they'll
  // request (same srcset + sizes as the page), so visiting them later is served from cache.
  useEffect(() => {
    const path = window.location.pathname;
    otherRoutes(projects, path).forEach((r) => router.prefetch(r));
    const list = sitePreloads(projects, path);
    if (!list.length) {
      markBoot("site");
      return;
    }
    let settled = 0;
    const keep: HTMLImageElement[] = [];
    Promise.all(
      list.map(({ src, width, height, sizes }) => {
        const { props } = getImageProps({ src, width, height, sizes, alt: "" });
        const img = new Image();
        keep.push(img);
        if (props.sizes) img.sizes = props.sizes;
        if (props.srcSet) img.srcset = props.srcSet;
        img.src = props.src;
        return img
          .decode()
          .catch(() => undefined)
          .finally(() => (siteFrac.current = ++settled / list.length));
      })
    ).then(() => markBoot("site"));
  }, [router]);

  // Without WebGL there is nothing to compile: measure plain frames instead.
  useEffect(() => {
    if (tier !== "fallback") return;
    markBoot("gl");
    measureFrames(10).then((ms) => {
      bootStats.warmupFrameMs = ms;
      markBoot("warmup");
    });
  }, [tier]);

  // Progress readout + finish.
  useEffect(() => {
    if (prefersReducedMotion()) {
      // The CSS already hides the loader; the page is live from the first frame.
      const tl = gsap.timeline({ onComplete: () => setMounted(false) }).call(finishBoot);
      return () => {
        tl.kill();
      };
    }
    const t0 = performance.now();
    const gate = bootGate();
    let shown = 0;
    let raf = 0;
    const tick = () => {
      const timeFrac = Math.min(1, (performance.now() - t0) / 2000);
      // Readiness steps count whole, except the site preload, which counts photo by photo.
      const keys = gate.progress() * BOOT_KEYS.length;
      const steps = (gate.isDone("site") ? keys : keys + siteFrac.current) / BOOT_KEYS.length;
      const target = Math.min(0.99, steps * 0.7 + timeFrac * 0.3);
      fire.current = 0.55 + 0.45 * shown;
      shown += (target - shown) * 0.08;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(shown * 100)).padStart(2, "0");
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const readyThenMin = gate.ready.then(() => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      const min = minLoaderDuration({ cores: nav.hardwareConcurrency, memoryGB: nav.deviceMemory, warmupFrameMs: bootStats.warmupFrameMs });
      return sleep(Math.max(0, min - (performance.now() - t0)));
    });
    let cancelled = false;
    // The cap counts from navigation start (performance.now() is relative to it), not from hydration.
    Promise.race([readyThenMin, sleep(Math.max(0, LOADER_HARD_CAP_MS - performance.now()))]).then(() => {
      if (cancelled) return;
      cancelAnimationFrame(raf);
      if (pctRef.current) pctRef.current.textContent = "100";
      fire.current = 0; // the fire dies down as the board opens
      const el = root.current!;
      const tl = gsap.timeline({ onComplete: () => setMounted(false) });
      if (prefersReducedMotion()) {
        tl.call(finishBoot).to(el, { opacity: 0, duration: 0.6 });
        return;
      }
      tl.to(barRef.current, { scaleX: 1, duration: 0.5, ease: "expo.out" })
        .to(`.${styles.meta}`, { opacity: 0, y: -10, duration: 0.4, ease: "power2.in" }, "<0.1")
        .call(finishBoot)
        // the board splits along the gold line
        .to(`.${styles.top}`, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, ">-0.05")
        .to(`.${styles.bottom}`, { yPercent: 100, duration: 1.1, ease: "expo.inOut" }, "<")
        .to(`.${styles.line}`, { scaleX: 0, opacity: 0, duration: 0.8, ease: "expo.inOut" }, "<0.15");
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!mounted) return null;
  return (
    <div ref={root} className={styles.loader} data-loader role="status" aria-label="Loading">
      <div className={styles.top} />
      <div className={styles.bottom}>
        <AsciiFire intensity={fire} className={styles.fire} />
      </div>
      <div className={styles.line}>
        <span ref={barRef} className={styles.bar} />
      </div>
      <div className={styles.meta}>
        <span className={styles.name}>Maker Portfolio</span>
        <span className={styles.pct}>
          <span ref={pctRef}>00</span>
        </span>
        <span className={styles.who}>Henry Zhao</span>
      </div>
    </div>
  );
}
