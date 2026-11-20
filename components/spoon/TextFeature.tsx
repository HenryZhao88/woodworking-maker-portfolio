"use client";
import { useRef } from "react";
import { Photo } from "@/components/Photo";
import { RevealText } from "@/components/RevealText";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import type { ProjectImage } from "@/content/types";
import styles from "./TextFeature.module.css";

type Props = {
  eyebrow: string;
  heading: string;
  body: string[];
  image: ProjectImage;
  /** "grain": photo revealed board-by-board (WebGL wood-grain dissolve in phase 2). "wipe": diagonal clip wipe with parallax. */
  variant: "grain" | "wipe";
  id: string;
};

const SLATS = 9;

export function TextFeature({ eyebrow, heading, body, image, variant, id }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const st = { trigger: "[data-media]", start: "top 80%", end: "center 50%", scrub: 1 };
      if (variant === "grain") {
        gsap.to("[data-slat]", { scaleY: 0, ease: "power2.inOut", stagger: { each: 0.08, from: "random" }, scrollTrigger: st });
      } else {
        gsap.fromTo("[data-media]", { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" }, { clipPath: "polygon(0% 0%, 130% 0%, 100% 100%, 0% 100%)", ease: "none", scrollTrigger: st });
        gsap.fromTo("[data-media] img", { scale: 1.35, xPercent: -8 }, { scale: 1, xPercent: 0, ease: "none", scrollTrigger: { ...st, end: "bottom 30%" } });
      }
      gsap.fromTo("[data-big]", { xPercent: variant === "grain" ? 6 : -6 }, { xPercent: variant === "grain" ? -6 : 6, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    },
    { scope: root }
  );

  return (
    <section ref={root} className={`${styles.feature} ${styles[variant]}`} aria-labelledby={id}>
      <span className="eyebrow">{eyebrow}</span>
      <RevealText as="h2" split="words" className={styles.h} id={id} data-big="">
        {heading}
      </RevealText>
      <div className={styles.row}>
        <div className={styles.media} data-media data-gl-effect={variant === "grain" ? "grainMask" : undefined}>
          <Photo image={image} sizes="(max-width: 900px) 92vw, 44vw" />
          {variant === "grain" && (
            <div className={styles.slats} aria-hidden>
              {Array.from({ length: SLATS }, (_, i) => (
                <span key={i} data-slat />
              ))}
            </div>
          )}
        </div>
        <div className={styles.copy}>
          {body.map((t, i) => (
            <RevealText key={i} className={styles.p}>
              {t}
            </RevealText>
          ))}
        </div>
      </div>
    </section>
  );
}
