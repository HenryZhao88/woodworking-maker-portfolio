"use client";
import { useRef } from "react";
import { Photo } from "@/components/Photo";
import { RevealText } from "@/components/RevealText";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion, exposePin } from "@/lib/gsap";
import type { ProjectImage } from "@/content/types";
import styles from "./OverallViews.module.css";

/** Pinned: scroll turns the spoon through its 3 overall views (crossfade + rotate; WebGL displacement in phase 2). */
export function OverallViews({ views }: { views: ProjectImage[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const pin = root.current!.querySelector<HTMLElement>("[data-overall]")!;
      const frames = gsap.utils.toArray<HTMLElement>("[data-view]", pin);
      const counter = pin.querySelector<HTMLElement>("[data-counter]")!;
      const reduced = prefersReducedMotion();
      if (reduced) {
        // Static: all three views side by side, no pinning.
        frames.forEach((f) => f.setAttribute("data-active", ""));
        return;
      }
      gsap.set(frames.slice(1), { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut", duration: 1 },
        scrollTrigger: {
          trigger: pin,
          pin: true,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.4}`,
          scrub: reduced ? true : 1,
          invalidateOnRefresh: true,
          onRefresh: (self) => exposePin(pin, self),
          onUpdate: (self) => {
            const n = self.progress < 1 / 3 ? 1 : self.progress < 2 / 3 ? 2 : 3;
            if (pin.getAttribute("data-overall-active") !== String(n)) {
              pin.setAttribute("data-overall-active", String(n));
              counter.textContent = `0${n}`;
              frames.forEach((f, i) => f.toggleAttribute("data-active", i === n - 1));
            }
          },
        },
      });
      // Hold, turn 1→2 around 1/3, hold, turn 2→3 around 2/3, hold. Total length 6.
      tl.to({}, { duration: 1.4 });
      frames.slice(1).forEach((f, i) => {
        const prev = frames[i];
        tl.to(prev, { opacity: 0, rotateY: reduced ? 0 : -38, scale: reduced ? 1 : 0.92, duration: 0.9 }, i === 0 ? 1.55 : 3.55)
          .fromTo(f, { opacity: 0, rotateY: reduced ? 0 : 38, scale: reduced ? 1 : 0.92 }, { opacity: 1, rotateY: 0, scale: 1, duration: 0.9 }, "<");
      });
      tl.to({}, { duration: 1.4 }, 4.6);
      exposePin(pin, tl.scrollTrigger as ScrollTrigger);
    },
    { scope: root }
  );

  return (
    <section ref={root} aria-labelledby="finished-h">
      <div className={styles.pin} data-overall data-overall-active="1">
        <div className={styles.copy}>
          <span className="eyebrow">The finished piece</span>
          <RevealText as="h2" split="words" className={styles.h} id="finished-h">
            Three ways around.
          </RevealText>
        </div>
        <div className={styles.stage} data-gl-effect="displace">
          {views.map((v, i) => (
            <div key={v.src} className={styles.view} data-view data-gl-fade data-active={i === 0 ? "" : undefined} style={{ zIndex: views.length - i }}>
              <Photo image={v} sizes="80vw" style={{ width: `min(76vw, calc(72svh * ${v.width / v.height}))` }} />
            </div>
          ))}
        </div>
        <div className={styles.counter} aria-hidden>
          <span data-counter>01</span>
          <span className={styles.of}>/ 0{views.length}</span>
          <span className={styles.label}>Overall view</span>
        </div>
      </div>
    </section>
  );
}
