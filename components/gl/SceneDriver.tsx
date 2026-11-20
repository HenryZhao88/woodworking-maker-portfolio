"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sceneForPath, useScene } from "./sceneStore";

/** Keeps the scene in sync with the route (the transition layer can set it earlier for choreography). */
export function SceneDriver() {
  const pathname = usePathname();
  const setScene = useScene((s) => s.setScene);
  useEffect(() => {
    setScene(sceneForPath(pathname));
    document.documentElement.setAttribute("data-scene", sceneForPath(pathname));
  }, [pathname, setScene]);
  return null;
}
