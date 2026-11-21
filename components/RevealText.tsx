"use client";
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { isMorphTarget } from "@/components/transitions/RouteTransition";
import { isBootDone, onBootDone } from "@/components/bootGate";
import { isEditMode } from "@/lib/editMode";

type Props = {
  as?: ElementType;
  split?: "chars" | "words" | "lines";
  trigger?: "scroll" | "mount";
  /** "rise": pieces rise out of a mask once. "scrub": words light up one by one, tied to scroll. */
  effect?: "rise" | "scrub";
  delay?: number;
  className?: string;
  id?: string;
  children: ReactNode;
  [key: `data-${string}`]: string | undefined;
};

/** Masked text reveal: pieces rise out of their own line box. */
export function RevealText({ as: Tag = "p", split = "lines", trigger = "scroll", effect = "rise", delay = 0, className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (isEditMode()) {
        // Click-to-edit: plain, unsplit text so it can be typed into.
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      if (isMorphTarget(el)) {
        // A page-transition ghost is landing on this element: show it as-is.
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      if (prefersReducedMotion()) {
        gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay, scrollTrigger: trigger === "scroll" ? { trigger: el, start: "top 88%" } : undefined });
        return;
      }
      if (effect === "scrub") {
        // Story text: each word brightens as the reader scrolls through it (and dims again going back up).
        const s = SplitText.create(el, {
          type: "words",
          aria: "none",
          autoSplit: true,
          onSplit(self) {
            self.words.forEach((w) => w.setAttribute("data-word", ""));
            return gsap.fromTo(
              self.words,
              { opacity: 0.18 },
              { opacity: 1, ease: "none", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 45%", scrub: 0.5 } }
            );
          },
        });
        gsap.set(el, { autoAlpha: 1 });
        return () => s.revert();
      }
      const s = SplitText.create(el, {
        type: split === "chars" ? "lines,words,chars" : split === "words" ? "lines,words" : "lines",
        mask: "lines",
        linesClass: "rt-line",
        autoSplit: true,
        // Words/lines stay readable as-is; letter splits are aria-hidden and a screen-reader copy carries the text.
        aria: split === "chars" ? "hidden" : "none",
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

  const el = (
    <Tag ref={ref} className={className} style={{ visibility: "hidden" }} aria-hidden={split === "chars" ? true : undefined} {...rest}>
      {children}
    </Tag>
  );
  if (split !== "chars") return el;
  return (
    <>
      {el}
      <span className="sr-only">{children}</span>
    </>
  );
}
