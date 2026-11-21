"use client";
import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { frameGate, markDirty } from "./frameGate";

/** Takes over R3F's render (positive priority): draws the scene only on frames where something changed. */
export function RenderGate() {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  useEffect(() => {
    markDirty();
  }, [size, dpr]);
  useFrame(({ gl, scene, camera }) => {
    if (!frameGate.dirty) return;
    frameGate.dirty = false;
    frameGate.renders++;
    gl.render(scene, camera);
  }, 1);
  return null;
}
