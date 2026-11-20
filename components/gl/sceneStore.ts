"use client";
import { create } from "zustand";
import type { QualityTier } from "@/lib/quality";

export type SceneName = "home" | "spoon" | "blank";

type SceneState = {
  tier: QualityTier | null; // null until detected on the client
  scene: SceneName;
  setTier(t: QualityTier): void;
  setScene(s: SceneName): void;
};

export const useScene = create<SceneState>((set) => ({
  tier: null,
  scene: "home",
  setTier: (tier) => {
    document.documentElement.setAttribute("data-quality", tier);
    set({ tier });
  },
  setScene: (scene) => set({ scene }),
}));

export const sceneForPath = (path: string): SceneName => (path === "/" ? "home" : path.startsWith("/wooden-spoon") ? "spoon" : "blank");
