"use client";
import { Fragment, useRef, type CSSProperties } from "react";
import { Photo } from "@/components/Photo";
import { PHOTO_SIZES } from "@/lib/photoSizes";
import { RevealText } from "@/components/RevealText";
import { Rich } from "@/components/Rich";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import type { ProjectImage } from "@/content/types";
import styles from "./TextFeature.module.css";

type Props = {
  /** Small label above the heading; omit when the heading says it all. */
  eyebrow?: string;
  heading: string;
  body: string[];
  quote?: string;
  image: ProjectImage;
  /** "grain": photo revealed board-by-board (WebGL wood-grain dissolve in phase 2). "wipe": diagonal clip wipe with parallax. */
  variant: "grain" | "wipe";
  id: string;
};

const SLATS = 9;
// Server render starts fully revealed; the client tween rewinds it to 0 before first paint of the section.
const INITIAL_REVEAL = 1;

export function TextFeature({ eyebrow, heading, body, quote, image, variant, id }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const st = { trigger: "[data-media]", start: "top 80%", end: "center 50%", scrub: 1 };
      if (variant === "grain") {
        gsap.to("[data-slat]", { scaleY: 0, ease: "power2.inOut", stagger: { each: 0.08, from: "random" }, scrollTrigger: st });
        // Drives the WebGL wood-grain dissolve (read by the plane as --p).
        gsap.fromTo("[data-media]", { "--p": 0 }, { "--p": 1, ease: "none", scrollTrigger: st });
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
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <RevealText as="h2" split="words" className={styles.h} id={id} data-big="">
        {heading}
      </RevealText>
      <div className={styles.row}>
        <div
          className={styles.media}
          data-media
          data-gl-effect={variant === "grain" ? "grainMask" : undefined}
          data-gl-progress={variant === "grain" ? "" : undefined}
          style={variant === "grain" ? ({ "--p": INITIAL_REVEAL } as CSSProperties) : undefined}
        >
          <Photo image={image} sizes={PHOTO_SIZES.feature} gl={variant === "grain"} />
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
            <Fragment key={i}>
              <RevealText effect="scrub" className={styles.p}>
                <Rich text={t} />
              </RevealText>
              {quote && i === 0 && (
                <blockquote className={styles.quote}>
                  <RevealText as="p" split="words">
                    {quote}
                  </RevealText>
                </blockquote>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
