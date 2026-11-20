"use client";
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { isMorphTarget } from "@/components/transitions/RouteTransition";
import { isBootDone, onBootDone } from "@/components/bootGate";

type Props = {
  as?: ElementType;
  split?: "chars" | "words" | "lines";
  trigger?: "scroll" | "mount";
  delay?: number;
  className?: string;
  id?: string;
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
      if (isMorphTarget(el)) {
        // A page-transition ghost is landing on this element: show it as-is.
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
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
          // Entrance animations wait for the loader to hand off.
          const waiting = trigger === "mount" && !isBootDone();
          const tween = gsap.from(targets, {
            paused: waiting,
            yPercent: 115,
            rotate: split === "lines" ? 0 : 4,
            duration: split === "chars" ? 1.4 : 1.1,
            ease: "expo.soft",
            stagger: split === "chars" ? 0.028 : split === "words" ? 0.035 : 0.09,
            delay,
            scrollTrigger: trigger === "scroll" ? { trigger: el, start: "top 88%" } : undefined,
          });
          if (waiting) onBootDone(() => tween.play());
          return tween;
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
