"use client";
import { useRef } from "react";
import { Photo } from "@/components/Photo";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import type { ProjectImage } from "@/content/types";
import styles from "./DetailDive.module.css";

/** Macro dive: each detail starts as a small card; scroll pushes in until it fills the screen. */
export function DetailDive({ details }: { details: ProjectImage[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>("[data-dive]").forEach((block) => {
        const frame = block.querySelector<HTMLElement>("[data-dive-frame]")!;
        const cap = block.querySelector<HTMLElement>("[data-dive-cap]")!;
        const scrim = block.querySelector<HTMLElement>("[data-dive-scrim]")!;
        const cover = () => {
          const r = frame.offsetWidth / frame.offsetHeight;
          const W = window.innerWidth;
          const H = window.innerHeight;
          return Math.max(W / frame.offsetWidth, H / frame.offsetHeight, r > 0 ? 1 : 1) * 1.02;
        };
        const tl = gsap.timeline({
          scrollTrigger: { trigger: block, start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true },
        });
        tl.fromTo(frame, { scale: 1, rotate: -4 }, { scale: cover, rotate: 0, ease: "power2.in", duration: 1 })
          .fromTo(frame.querySelector("img"), { scale: 1.25 }, { scale: 1, ease: "none", duration: 1 }, 0)
          .fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.5)
          .fromTo(cap, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.55)
          .to({}, { duration: 0.25 });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.section} aria-label="Details of the finished piece" data-gl-effect="dive">
      {details.map((d, i) => (
        <div key={d.src} className={styles.block} data-dive>
          <div className={styles.sticky}>
            <span className={`eyebrow ${styles.tag}`}>Detail 0{i + 1}</span>
            <div className={styles.frame} data-dive-frame style={{ width: `min(34vw, calc(46svh * ${d.width / d.height}))` }}>
              <Photo image={d} sizes="100vw" />
            </div>
            <div className={styles.scrim} data-dive-scrim aria-hidden />
            <p className={styles.cap} data-dive-cap>
              {d.caption}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
