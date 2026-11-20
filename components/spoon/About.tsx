"use client";
import { useRef } from "react";
import { Photo } from "@/components/Photo";
import { RevealText } from "@/components/RevealText";
import { Rich } from "@/components/Rich";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import type { Project } from "@/content/types";
import styles from "./About.module.css";

export function About({ about }: { about: NonNullable<Project["about"]> }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // The photo "unfolds" from lying flat to standing upright as you scroll in.
      gsap.fromTo(
        "[data-unfold]",
        { rotateX: 64, yPercent: 18, scale: 0.82, transformOrigin: "50% 100%" },
        {
          rotateX: 0,
          yPercent: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "center 55%", scrub: 1 },
        }
      );
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.about} aria-labelledby="about-h">
      <div className={styles.stage}>
        <div data-unfold data-gl-effect="unfold">
          <Photo image={about.image} sizes="(max-width: 900px) 92vw, 56vw" priority />
        </div>
      </div>
      <div className={styles.copy}>
        <span className="eyebrow">About the project</span>
        <RevealText as="h2" split="words" className={styles.h} id="about-h">
          {about.heading}
        </RevealText>
        {about.body.map((t, i) => (
          <RevealText key={i} className={i === 0 ? styles.lede : styles.p}>
            <Rich text={t} />
          </RevealText>
        ))}
      </div>
    </section>
  );
}
