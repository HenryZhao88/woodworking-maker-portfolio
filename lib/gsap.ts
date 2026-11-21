"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, CustomEase, useGSAP);
  CustomEase.create("expo.soft", "0.16, 1, 0.3, 1");
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };

/** Publish a pinned ScrollTrigger's scroll range on its element (used by tests and the WebGL layer). */
export function exposePin(el: Element, st: ScrollTrigger) {
  el.setAttribute("data-pin-start", String(Math.round(st.start)));
  el.setAttribute("data-pin-end", String(Math.round(st.end)));
}
