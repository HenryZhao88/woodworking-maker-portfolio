"use client";
import { useEffect } from "react";
import { detectQuality, hasWebGL } from "@/lib/quality";
import { useScene } from "@/components/gl/sceneStore";

/** Detects the quality tier once on the client and publishes it (store + <html data-quality>). */
export function QualityGate() {
  const setTier = useScene((s) => s.setTier);
  useEffect(() => {
    setTier(detectQuality({ userAgent: navigator.userAgent, webgl: hasWebGL() }));
  }, [setTier]);
  return null;
}
