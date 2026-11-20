"use client";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { useLenis } from "@/components/SmoothScroll";
import { sceneForPath, useScene } from "@/components/gl/sceneStore";

type Ctx = { navigateWithTransition(href: string, sourceEl?: HTMLElement): Promise<void> };
const TransitionContext = createContext<Ctx>({ navigateWithTransition: async () => {} });
export const useRouteTransition = () => useContext(TransitionContext);

/** Flip ids of elements that should skip their own entrance animation (a ghost lands on them). */
const morphTargets = new Set<string>();
export const isMorphTarget = (el: Element | null) => {
  const id = el?.closest<HTMLElement>("[data-flip-id]")?.dataset.flipId;
  return !!id && morphTargets.has(id);
};

const OUT = 0.5;
const FLY = 1.05;

const titleIdFor = (href: string) => (href === "/" ? "site-title-hero" : "page-title");

function visibleRect(el: Element | null) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.bottom < 0 || r.top > window.innerHeight) return null;
  return r;
}

/**
 * A fixed-position clone that looks exactly like `el`: deep clone (keeps line structure) plus the
 * computed type styles of the root (which it would otherwise lose by leaving its ancestors).
 */
function textGhost(el: HTMLElement, rect: DOMRect) {
  const cs = getComputedStyle(el);
  const g = el.cloneNode(true) as HTMLElement;
  [g, ...g.querySelectorAll<HTMLElement>("*")].forEach((n) => {
    n.removeAttribute("data-flip-id");
    n.removeAttribute("id");
  });
  g.setAttribute("data-morph-ghost", "");
  g.setAttribute("aria-hidden", "true");
  Object.assign(g.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    padding: cs.padding,
    zIndex: "80",
    pointerEvents: "none",
    visibility: "visible",
    opacity: "1",
    color: cs.color,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    fontVariationSettings: cs.fontVariationSettings,
    letterSpacing: cs.letterSpacing,
    lineHeight: cs.lineHeight,
    textTransform: cs.textTransform,
    whiteSpace: "nowrap",
    mixBlendMode: "normal",
    transform: "none",
    transformOrigin: "0 0",
    willChange: "transform, opacity",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(g);
  return g;
}

type MorphMode = "cross" | "shrink" | "grow";

/**
 * Flies a captured ghost `a` (cloned while its source was still on screen) onto `dst`.
 * - cross:  a and a clone of dst travel the same path and cross-fade (label → page title)
 * - shrink: a alone scales onto dst, which fades in as it lands (big hero title → small logo)
 * - grow:   only a clone of dst grows out of a's box (small logo → big hero title)
 */
function morph(a: HTMLElement, srcRect: DOMRect, dst: HTMLElement, mode: MorphMode, tl: gsap.core.Timeline, at: number) {
  gsap.set(dst, { opacity: 1 });
  const dstRect = dst.getBoundingClientRect();
  const b = mode === "shrink" ? null : textGhost(dst, dstRect);
  gsap.set(dst, { opacity: 0 }); // the real element appears only when its ghost has landed
  const s = mode === "cross" ? Math.min(dstRect.width / srcRect.width, dstRect.height / srcRect.height) : dstRect.height / srcRect.height;
  const ghosts: HTMLElement[] = [a];
  if (mode === "grow") {
    gsap.set(a, { opacity: 0 });
  } else {
    tl.to(a, { x: dstRect.left - srcRect.left, y: dstRect.top - srcRect.top, scale: s, duration: FLY, ease: "expo.inOut" }, at);
    if (mode === "cross") tl.to(a, { opacity: 0, duration: FLY * 0.45, ease: "power1.in" }, at + FLY * 0.3);
    else tl.to(a, { opacity: 0, duration: 0.25 }, at + FLY - 0.2).to(dst, { opacity: 1, duration: 0.25 }, at + FLY - 0.2);
  }
  if (b) {
    ghosts.push(b);
    gsap.set(b, { x: srcRect.left - dstRect.left, y: srcRect.top - dstRect.top, scale: 1 / s, opacity: mode === "grow" ? 1 : 0 });
    tl.to(b, { x: 0, y: 0, scale: 1, duration: FLY, ease: "expo.inOut" }, at);
    if (mode === "cross") tl.to(b, { opacity: 1, duration: FLY * 0.45, ease: "power1.out" }, at + FLY * 0.3);
  }
  return { ghosts, dst };
}

function waitFor<T>(get: () => T | null, timeout = 4000): Promise<T | null> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const check = () => {
      const v = get();
      if (v) return resolve(v);
      if (performance.now() - t0 > timeout) return resolve(null);
      requestAnimationFrame(check);
    };
    check();
  });
}

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const busy = useRef(false);
  const internalNav = useRef(false);
  const lastPath = useRef(pathname);
  const setScene = useScene((s) => s.setScene);

  const navigateWithTransition = useCallback(
    async (href: string, sourceEl?: HTMLElement) => {
      if (busy.current || href === window.location.pathname) return;
      const main = document.querySelector("main");
      if (prefersReducedMotion() || !main) {
        router.push(href);
        return;
      }
      busy.current = true;
      internalNav.current = true;
      const from = window.location.pathname;
      const logo = document.querySelector<HTMLElement>('[data-flip-id="site-title"]');

      // 1. Capture sources while the old page is still on screen.
      const label = sourceEl?.querySelector<HTMLElement>("[data-flip-id]") ?? sourceEl ?? null;
      const labelRect = visibleRect(label);
      const heroTitle = from === "/" ? document.querySelector<HTMLElement>('[data-flip-id="site-title-hero"]') : null;
      const heroRect = visibleRect(heroTitle);
      const logoRect = href === "/" ? visibleRect(logo) : null;

      const targetId = titleIdFor(href);
      morphTargets.clear();
      if (labelRect) morphTargets.add(targetId);
      if (logoRect) morphTargets.add("site-title-hero");

      // Ghosts for the outgoing elements stay put while the page dissolves around them.
      const holdLabel = label && labelRect ? textGhost(label, labelRect) : null;
      const holdHero = heroTitle && heroRect ? textGhost(heroTitle, heroRect) : null;
      const holdLogo = logo && logoRect ? textGhost(logo, logoRect) : null;
      if (holdHero && heroTitle) gsap.set(heroTitle, { opacity: 0 });
      if ((holdHero || holdLogo) && logo) gsap.set(logo, { opacity: 0 });

      setScene(sceneForPath(href));
      await gsap.to(main, { opacity: 0, y: -40, duration: OUT, ease: "power2.in" });

      // 2. Swap the route underneath, at the top of the page.
      lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
      router.push(href, { scroll: false });
      const nextMain = await waitFor(() => {
        const m = document.querySelector("main");
        return m && m !== main && window.location.pathname === href ? m : null;
      });
      if (!nextMain) {
        [holdLabel, holdHero, holdLogo].forEach((g) => g?.remove());
        if (logo) gsap.set(logo, { clearProps: "opacity" });
        morphTargets.clear();
        busy.current = false;
        return;
      }
      gsap.set(nextMain, { opacity: 0 });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      ScrollTrigger.refresh();

      // 3. Fly every captured element onto its counterpart, then reveal the new page.
      const tl = gsap.timeline();
      const ghosts: HTMLElement[] = [];
      const landed: HTMLElement[] = [];
      const fly = (ghost: HTMLElement, r: DOMRect, dst: HTMLElement, mode: MorphMode, at: number) => {
        const m = morph(ghost, r, dst, mode, tl, at);
        ghosts.push(...m.ghosts);
        landed.push(m.dst);
      };
      const dstTitle = document.querySelector<HTMLElement>(`[data-flip-id="${targetId}"]`);
      if (holdLabel && labelRect && dstTitle) fly(holdLabel, labelRect, dstTitle, "cross", 0);
      else holdLabel?.remove();
      if (holdHero && heroRect && logo) fly(holdHero, heroRect, logo, "shrink", 0.05);
      else holdHero?.remove();
      const dstHero = document.querySelector<HTMLElement>('[data-flip-id="site-title-hero"]');
      if (holdLogo && logoRect && dstHero) fly(holdLogo, logoRect, dstHero, "grow", 0.05);
      else holdLogo?.remove();

      tl.fromTo(nextMain, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" }, FLY * 0.55);
      await tl;
      landed.forEach((el) => gsap.set(el, { clearProps: "opacity" }));
      ghosts.forEach((g) => g.remove());
      if (logo) gsap.set(logo, { clearProps: "opacity" });
      gsap.set(nextMain, { clearProps: "opacity,transform" });
      morphTargets.clear();
      busy.current = false;
    },
    [router, lenis, setScene]
  );

  // Intercept plain left-clicks on internal links.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash) return;
      e.preventDefault();
      if (url.pathname === window.location.pathname) {
        lenis?.scrollTo(0);
        return;
      }
      void navigateWithTransition(url.pathname, a);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [navigateWithTransition, lenis]);

  // Back/forward (route changed without us): land at the top and let the page's own entrance play.
  useEffect(() => {
    // Only real route changes (idempotent under React's dev double-invoked effects; never on first load).
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    if (internalNav.current) {
      internalNav.current = false;
      return;
    }
    const main = document.querySelector("main");
    if (!main || prefersReducedMotion()) return;
    gsap.fromTo(main, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", clearProps: "opacity,transform" });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname]);

  return <TransitionContext.Provider value={{ navigateWithTransition }}>{children}</TransitionContext.Provider>;
}
