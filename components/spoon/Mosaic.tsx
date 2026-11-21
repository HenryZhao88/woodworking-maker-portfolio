"use client";
import { useRef } from "react";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { RevealText } from "@/components/RevealText";
import { Rich } from "@/components/Rich";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import type { ProjectImage, TextBlock } from "@/content/types";
import styles from "./Mosaic.module.css";

/** Closing reflection; every photo from the project drifts in from depth and settles into a grid. */
export function Mosaic({ impression, images }: { impression: TextBlock; images: ProjectImage[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tiles = gsap.utils.toArray<HTMLElement>("[data-tile]");
      tiles.forEach((t, i) => {
        const seed = Math.sin(i * 12.9898) * 43758.5453;
        const r = seed - Math.floor(seed);
        gsap.fromTo(
          t,
          { z: -900 - r * 900, rotateX: 25 - r * 50, rotateY: r * 40 - 20, yPercent: 60 + r * 80, autoAlpha: 0 },
          {
            z: 0,
            rotateX: 0,
            rotateY: 0,
            yPercent: 0,
            autoAlpha: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: t, start: "top bottom", end: "top 55%", scrub: 1.2 },
          }
        );
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.section} aria-labelledby="impression-h">
      <div className={styles.copy}>
        <span className="eyebrow">Overall impression</span>
        <RevealText as="h2" split="words" className={styles.h} id="impression-h">
          {impression.heading}
        </RevealText>
        {impression.body.map((t, i) => (
          <RevealText key={i} effect="scrub" className={styles.p}>
            <Rich text={t} />
          </RevealText>
        ))}
      </div>
      <div className={styles.grid} data-gl-effect="mosaic">
        {images.map((img, i) => (
          <div key={img.src + i} data-tile data-gl-fade className={styles.tile}>
            <Photo image={img} sizes="(max-width: 700px) 45vw, 18vw" />
          </div>
        ))}
      </div>
      <div className={styles.end}>
        <span className={styles.rule} aria-hidden />
        <Link href="/" className={styles.back}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
