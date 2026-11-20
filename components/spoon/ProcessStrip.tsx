"use client";
import { useRef, useState } from "react";
import { Photo } from "@/components/Photo";
import { RevealText } from "@/components/RevealText";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion, exposePin } from "@/lib/gsap";
import type { Project } from "@/content/types";
import styles from "./ProcessStrip.module.css";

type Process = NonNullable<Project["process"]>;

/**
 * Pinned horizontal film strip: vertical scroll drives the track sideways. Cards sit on a
 * curved arc (rotateY/z by distance from center) and the track skews with scroll velocity.
 * Below 768px it becomes a vertical stack with per-photo depth reveals.
 */
export function ProcessStrip({ process }: { process: Process }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const stageStart = process.stages.map((_, i) => process.stages.slice(0, i).reduce((a, st) => a + st.images.length, 0));

  useGSAP(
    () => {
      const pin = root.current!.querySelector<HTMLElement>("[data-process]")!;
      const track = pin.querySelector<HTMLElement>("[data-track]")!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", pin);
      const stages = gsap.utils.toArray<HTMLElement>("[data-stage]", pin);
      const bar = pin.querySelector<HTMLElement>("[data-bar]");
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const reduced = prefersReducedMotion();
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const skewTo = gsap.quickTo(track, "skewX", { duration: 0.5, ease: "power3" });
        const setters = cards.map((c) => ({
          ry: gsap.quickSetter(c, "rotateY", "deg"),
          z: gsap.quickSetter(c, "z", "px"),
        }));

        const arc = () => {
          if (reduced) return;
          const W = window.innerWidth;
          cards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const d = (r.left + r.width / 2 - W / 2) / W; // -1..1 across the viewport
            setters[i].ry(gsap.utils.clamp(-32, 32, -d * 34));
            setters[i].z(-Math.abs(d) * 260);
          });
        };

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            pin: true,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: reduced ? true : 0.8,
            invalidateOnRefresh: true,
            onRefresh: (self) => exposePin(pin, self),
            onUpdate: (self) => {
              // The stage under the viewport's center is "current"; the final stretch always shows the last one.
              const playhead = self.progress * distance() + window.innerWidth / 2;
              let idx = 0;
              stages.forEach((s, i) => {
                if (s.offsetLeft <= playhead) idx = i;
              });
              if (self.progress >= 0.98) idx = stages.length - 1;
              setActive(idx);
              if (bar) bar.style.transform = `scaleX(${self.progress})`;
              arc();
            },
          },
        });
        exposePin(pin, tween.scrollTrigger as ScrollTrigger);
        arc();
        // Skew follows live scroll velocity every frame, so it eases back to 0 when scrolling stops.
        const skewTick = () => {
          if (reduced) return;
          const st = tween.scrollTrigger as ScrollTrigger;
          if (!st.isActive) return skewTo(0);
          const v = (window as unknown as { __lenis?: { velocity: number } }).__lenis?.velocity ?? 0;
          skewTo(gsap.utils.clamp(-6, 6, -v / 9));
        };
        gsap.ticker.add(skewTick);
        return () => {
          gsap.ticker.remove(skewTick);
          gsap.set(cards, { clearProps: "transform" });
          gsap.set(track, { clearProps: "transform" });
          pin.removeAttribute("data-pin-start");
          pin.removeAttribute("data-pin-end");
        };
      });

      mm.add("(max-width: 767px)", () => {
        if (prefersReducedMotion()) return;
        cards.forEach((c) =>
          gsap.fromTo(
            c,
            { rotateX: 28, z: -240, yPercent: 20, opacity: 0.001 },
            { rotateX: 0, z: 0, yPercent: 0, opacity: 1, ease: "power3.out", scrollTrigger: { trigger: c, start: "top 95%", end: "top 55%", scrub: 1 } }
          )
        );
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.section} aria-labelledby="process-h">
      <header className={styles.head}>
        <span className="eyebrow">The process</span>
        <RevealText as="h2" split="words" className={styles.h} id="process-h">
          {process.heading}
        </RevealText>
        <RevealText className={styles.intro}>{process.intro}</RevealText>
      </header>

      <div className={styles.pin} data-process>
        <div className={styles.rail} aria-hidden>
          <span className={styles.railIndex}>{String(active + 1).padStart(2, "0")} / {String(process.stages.length).padStart(2, "0")}</span>
          <span className={styles.railLabel} data-stage-current>
            {process.stages[active].label}
          </span>
          <span className={styles.barTrack}>
            <span className={styles.bar} data-bar />
          </span>
        </div>

        <div className={styles.track} data-track data-gl-effect="strip">
          {process.stages.map((stage, si) => (
            <div key={stage.label} className={styles.stage} data-stage>
              <div className={styles.stageHead}>
                <span className={styles.stageNum}>{String(si + 1).padStart(2, "0")}</span>
                <h3 className={styles.stageLabel}>{stage.label}</h3>
                <p className={styles.stageCaption}>{stage.caption}</p>
              </div>
              {stage.images.map((img, ii) => {
                const n = stageStart[si] + ii + 1;
                return (
                  <div key={img.src} className={styles.card} data-card style={{ ["--ar" as string]: img.width / img.height }}>
                    <Photo image={img} sizes="(max-width: 767px) 88vw, 40vw" />
                    <span className={styles.cardNum}>{String(n).padStart(2, "0")}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
