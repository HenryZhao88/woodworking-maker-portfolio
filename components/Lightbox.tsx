"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap, Flip, prefersReducedMotion } from "@/lib/gsap";
import { useLenis } from "@/components/SmoothScroll";
import type { ProjectImage } from "@/content/types";
import styles from "./Lightbox.module.css";

type Ctx = { open(img: ProjectImage, originEl: HTMLElement): void };
const LightboxContext = createContext<Ctx>({ open() {} });
export const useLightbox = () => useContext(LightboxContext);

type Item = { img: ProjectImage; el: HTMLElement };

function readFigure(el: HTMLElement): ProjectImage {
  return { src: el.dataset.src!, alt: el.dataset.alt ?? "", width: Number(el.dataset.w), height: Number(el.dataset.h), role: "feature" };
}

/** Gallery = every distinct photo on the page, in document order. */
function collect(): Item[] {
  const seen = new Set<string>();
  const out: Item[] = [];
  document.querySelectorAll<HTMLElement>("main [data-photo]").forEach((el) => {
    const src = el.dataset.src!;
    if (seen.has(src)) return;
    seen.add(src);
    out.push({ img: readFigure(el), el });
  });
  return out;
}

export function LightboxProvider({ children }: { children: ReactNode }) {
  const lenis = useLenis();
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const originRef = useRef<HTMLElement | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closing = useRef(false);
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  // A route change (e.g. the Back button) closes the lightbox.
  if (index !== null && openPath !== null && openPath !== pathname) {
    setIndex(null);
    setOpenPath(null);
  }

  const open = useCallback((img: ProjectImage, originEl: HTMLElement) => {
    const list = collect();
    const i = Math.max(0, list.findIndex((it) => it.img.src === img.src));
    originRef.current = originEl;
    setItems(list);
    setIndex(i);
    setOpenPath(window.location.pathname);
  }, []);

  const close = useCallback(() => {
    if (index === null || closing.current) return;
    const origin = originRef.current;
    const finish = () => {
      closing.current = false;
      setIndex(null);
      document.querySelectorAll<HTMLElement>("main, header").forEach((el) => (el.inert = false)); // before refocusing
      origin?.focus({ preventScroll: true });
    };
    if (prefersReducedMotion() || !imgRef.current || !origin) return finish();
    closing.current = true;
    const r = origin.getBoundingClientRect();
    const box = imgRef.current.getBoundingClientRect();
    gsap.to(imgRef.current, {
      x: r.left + r.width / 2 - (box.left + box.width / 2),
      y: r.top + r.height / 2 - (box.top + box.height / 2),
      scale: r.width / box.width,
      duration: 0.55,
      ease: "expo.inOut",
    });
    gsap.to(`.${styles.backdrop}`, { opacity: 0, duration: 0.5, onComplete: finish });
  }, [index]);

  // Delegated click / Enter on any [data-photo].
  useEffect(() => {
    const activate = (e: Event) => {
      const fig = (e.target as HTMLElement).closest<HTMLElement>("[data-photo]");
      if (!fig || !fig.closest("main")) return;
      if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      open(readFigure(fig), fig);
    };
    document.addEventListener("click", activate);
    document.addEventListener("keydown", activate);
    return () => {
      document.removeEventListener("click", activate);
      document.removeEventListener("keydown", activate);
    };
  }, [open]);

  // While open: lock scroll, keys, opening animation.
  useEffect(() => {
    if (index === null) return;
    lenis?.stop();
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const block = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    // Modal: everything behind the dialog is inert; Tab cycles inside it.
    const behind = [...document.querySelectorAll<HTMLElement>("main, header")];
    behind.forEach((el) => (el.inert = true));
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    dialog?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" && dialog) {
        const f = [...dialog.querySelectorAll<HTMLElement>("button")];
        if (!f.length) return;
        const i = f.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        return;
      }
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % items.length));
      else if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      behind.forEach((el) => (el.inert = false));
      lenis?.start();
      html.style.overflow = prevOverflow;
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", onKey);
    };
  }, [index, items.length, lenis, close]);

  // Fly in from the clicked photo the first time it opens.
  const opened = index !== null;
  useEffect(() => {
    if (!opened || !imgRef.current || !originRef.current || prefersReducedMotion()) return;
    const state = Flip.getState(originRef.current);
    Flip.from(state, { targets: imgRef.current, duration: 0.8, ease: "expo.out", absolute: true, scale: true, simple: true });
    gsap.from(`.${styles.backdrop}`, { opacity: 0, duration: 0.5 });
    imgRef.current.closest<HTMLElement>("[role=dialog]")?.focus();
  }, [opened]);

  const current = index !== null ? items[index] : null;

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      {current && (
        <div className={styles.root} role="dialog" aria-modal="true" aria-label={current.img.alt} tabIndex={-1}>
          <div className={styles.backdrop} onClick={close} />
          {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution original, intentionally unoptimized */}
          <img
            ref={imgRef}
            key={current.img.src}
            src={current.img.src}
            alt={current.img.alt}
            width={current.img.width}
            height={current.img.height}
            className={styles.img}
            style={{ aspectRatio: `${current.img.width} / ${current.img.height}` }}
            onClick={close}
          />
          <div className={styles.bar}>
            <span>
              {String(index! + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <span className={styles.alt}>{current.img.alt}</span>
            <span className={styles.controls}>
              <button type="button" onClick={() => setIndex((i) => (i! - 1 + items.length) % items.length)} aria-label="Previous photo">
                ←
              </button>
              <button type="button" onClick={() => setIndex((i) => (i! + 1) % items.length)} aria-label="Next photo">
                →
              </button>
              <button type="button" onClick={close} aria-label="Close">
                Close
              </button>
            </span>
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  );
}
