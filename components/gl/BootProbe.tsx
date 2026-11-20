"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { bootStats, markBoot } from "@/components/bootGate";

/**
 * Marks boot readiness for the WebGL layer: shaders compiled and every photo plane's texture
 * uploaded ("gl"), then 16 rendered warm-up frames with the steady-state median frame time recorded ("warmup").
 */
export function BootProbe() {
  const { gl, scene, camera } = useThree();
  const phase = useRef<"compile" | "textures" | "warmup" | "done">("compile");
  const frames = useRef<number[]>([]);

  useEffect(() => {
    gl.compile(scene, camera);
    phase.current = "textures";
  }, [gl, scene, camera]);

  useFrame((_, delta) => {
    if (phase.current === "textures") {
      const all = document.querySelectorAll("main [data-photo][data-gl]").length;
      const ready = document.querySelectorAll("main [data-photo][data-gl][data-gl-ready], main [data-photo][data-gl][data-gl-failed]").length;
      if (ready >= all) {
        gl.compile(scene, camera); // compile the plane materials too
        markBoot("gl");
        phase.current = "warmup";
      }
    } else if (phase.current === "warmup") {
      frames.current.push(delta * 1000);
      if (frames.current.length >= 16) {
        // skip the first frames (texture upload / first-use compile spikes), take the median of the rest
        const f = frames.current.slice(6).sort((a, b) => a - b);
        bootStats.warmupFrameMs = f[f.length >> 1];
        markBoot("warmup");
        phase.current = "done";
      }
    }
  });

  return null;
}
