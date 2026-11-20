"use client";
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  as?: ElementType;
  split?: "chars" | "words" | "lines";
  trigger?: "scroll" | "mount";
  delay?: number;
  className?: string;
  children: ReactNode;
  [key: `data-${string}`]: string | undefined;
};

/** Masked text reveal: pieces rise out of their own line box. */
export function RevealText({ as: Tag = "p", split = "lines", trigger = "scroll", delay = 0, className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay, scrollTrigger: trigger === "scroll" ? { trigger: el, start: "top 88%" } : undefined });
        return;
      }
      const s = SplitText.create(el, {
        type: split === "chars" ? "lines,words,chars" : split === "words" ? "lines,words" : "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          const targets = split === "chars" ? self.chars : split === "words" ? self.words : self.lines;
          return gsap.from(targets, {
            yPercent: 115,
            rotate: split === "lines" ? 0 : 4,
            duration: split === "chars" ? 1.4 : 1.1,
            ease: "expo.soft",
            stagger: split === "chars" ? 0.028 : split === "words" ? 0.035 : 0.09,
            delay,
            scrollTrigger: trigger === "scroll" ? { trigger: el, start: "top 88%" } : undefined,
          });
        },
      });
      gsap.set(el, { autoAlpha: 1 });
      return () => s.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} style={{ visibility: "hidden" }} {...rest}>
      {children}
    </Tag>
  );
}
