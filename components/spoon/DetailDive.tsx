"use client";
import { useRef } from "react";
import { Photo } from "@/components/Photo";
import { PHOTO_SIZES } from "@/lib/photoSizes";
import { gsap, ScrollTrigger, SplitText, useGSAP, prefersReducedMotion, exposePin } from "@/lib/gsap";
import { isEditMode } from "@/lib/editMode";
import type { ProjectImage } from "@/content/types";
import styles from "./DetailDive.module.css";

/**
 * The inspection bench: one pinned section steps through the three details. Each photo arrives with a
 * tear along the grain and a color split (WebGL "inspect" mode, driven by the frame's opacity), inside
 * gold viewfinder brackets; the big number rolls 01 → 03 like an odometer and each caption pulls into
 * focus word by word, like a lens finding the subject.
 * Every photo is shown whole. Reduced motion: a static list.
 */
export function DetailDive({ details }: { details: ProjectImage[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const pin = root.current!.querySelector<HTMLElement>("[data-details]")!;
      const frames = gsap.utils.toArray<HTMLElement>("[data-detail-frame]", pin);
      const caps = gsap.utils.toArray<HTMLElement>("[data-detail-cap]", pin);
      const num = pin.querySelector<HTMLElement>("[data-detail-num]")!;
      const ticks = gsap.utils.toArray<HTMLElement>("[data-detail-tick]", pin);
      if (prefersReducedMotion()) {
        [...frames, ...caps].forEach((el) => el.setAttribute("data-active", ""));
        return;
      }
      const n = frames.length;
      gsap.set(frames.slice(1), { opacity: 0 });
      const edit = isEditMode();
      // Captions split into words once (kept as real text) so each can blur into focus.
      const splits = edit ? [] : caps.map((c) => SplitText.create(c, { type: "words", aria: "none" }));
      splits.forEach((s) => s.words.forEach((w) => w.setAttribute("data-word", "")));
      let current = 0;

      const show = (i: number) => {
        pin.setAttribute("data-detail-active", String(i + 1));
        frames.forEach((f, k) => f.toggleAttribute("data-active", k === i));
        ticks.forEach((t, k) => t.toggleAttribute("data-active", k <= i));
        caps.forEach((c, k) => c.toggleAttribute("data-active", k === i));
        const words = splits[i]?.words;
        if (words) {
          gsap.killTweensOf(words);
          // Focus pull: each word starts soft and low, then sharpens into place.
          gsap.fromTo(words, { opacity: 0, filter: "blur(12px)", y: 10 }, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.9, stagger: 0.05, ease: "power3.out" });
        }
        // Odometer: the old number rolls out, the new one rolls in (downward when scrolling back up).
        const dir = i >= current ? 1 : -1;
        current = i;
        gsap.killTweensOf(num);
        if (edit) {
          num.textContent = `0${i + 1}`;
          return;
        }
        gsap
          .timeline()
          .to(num, { yPercent: -110 * dir, duration: 0.22, ease: "power2.in" })
          .call(() => {
            num.textContent = `0${i + 1}`;
          })
          .fromTo(num, { yPercent: 110 * dir }, { yPercent: 0, duration: 0.55, ease: "expo.out" });
      };

      // Hold each detail, with a cut between them: the outgoing photo tears away as the next resolves.
      const hold = 1.4;
      const cut = 0.6;
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: pin,
          pin: true,
          refreshPriority: 4,
          start: "top top",
          end: () => `+=${window.innerHeight * n}`,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onRefresh: (self) => exposePin(pin, self),
          onUpdate: (self) => {
            // Switch at the middle of each cut.
            const t = self.progress * tl.duration();
            let i = 0;
            for (let k = 1; k < n; k++) if (t >= k * (hold + cut) - cut / 2) i = k;
            if (pin.getAttribute("data-detail-active") !== String(i + 1)) show(i);
          },
        },
      });
      for (let k = 1; k < n; k++) {
        const at = k * (hold + cut) - cut;
        tl.to(frames[k - 1], { opacity: 0, scale: 0.96, xPercent: -3, duration: cut }, at).fromTo(
          frames[k],
          { opacity: 0, scale: 1.06, xPercent: 3 },
          { opacity: 1, scale: 1, xPercent: 0, duration: cut },
          at
        );
      }
      tl.to({}, { duration: hold });
      exposePin(pin, tl.scrollTrigger as ScrollTrigger);
      show(0);
      return () => splits.forEach((s) => s.revert());
    },
    { scope: root }
  );

  return (
    <section ref={root} className={styles.section} aria-labelledby="details-h">
      <div className={styles.pin} data-details data-detail-active="1">
        <div className={styles.side}>
          <div className={styles.head}>
            <span className="eyebrow" id="details-h">
              Up close
            </span>
            <span className={styles.count} aria-hidden>
              <span className={styles.numMask}>
                <span className={styles.num} data-detail-num>
                  01
                </span>
              </span>
              <span className={styles.of}>/ 0{details.length}</span>
            </span>
          </div>
          <div className={styles.caps}>
            {details.map((d, i) => (
              <p key={d.src} className={styles.cap} data-detail-cap data-active={i === 0 ? "" : undefined}>
                {d.caption}
              </p>
            ))}
          </div>
          <div className={styles.ticks} aria-hidden>
            {details.map((d, i) => (
              <span key={d.src} className={styles.tick} data-detail-tick data-active={i === 0 ? "" : undefined} />
            ))}
          </div>
        </div>
        <div className={styles.stage} data-gl-effect="inspect">
          {details.map((d, i) => (
            <div key={d.src} className={styles.frame} data-detail-frame data-gl-fade data-active={i === 0 ? "" : undefined} style={{ zIndex: details.length - i }}>
              <div className={styles.view} style={{ ["--ar" as string]: d.width / d.height }}>
                <Photo image={d} sizes={PHOTO_SIZES.detail} />
                <i className={styles.corner} data-corner="tl" aria-hidden />
                <i className={styles.corner} data-corner="tr" aria-hidden />
                <i className={styles.corner} data-corner="bl" aria-hidden />
                <i className={styles.corner} data-corner="br" aria-hidden />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
