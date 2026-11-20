"use client";
import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { squareToQuad, type Quad } from "@/lib/homography";
import { planeFragment, planeVertex, PLANE_MODE } from "./shaders/plane";

type Plane = {
  fig: HTMLElement;
  corners: HTMLElement[];
  fadeEl: HTMLElement | null;
  progressEl: HTMLElement | null;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  visible: boolean;
  disposed: boolean;
};

const GEO = new THREE.PlaneGeometry(1, 1, 24, 24);
const loader = new THREE.TextureLoader();

function modeFor(fig: HTMLElement): number {
  const effect = fig.closest<HTMLElement>("[data-gl-effect]")?.dataset.glEffect;
  if (effect === "strip") return PLANE_MODE.strip;
  if (effect === "grainMask") return PLANE_MODE.grain;
  if (effect === "displace") return PLANE_MODE.displace;
  return PLANE_MODE.generic;
}

function readOpacity(el: HTMLElement | null): number {
  if (!el) return 1;
  if (el.style.visibility === "hidden") return 0;
  const o = el.style.opacity;
  return o === "" ? 1 : Number(o);
}

/**
 * Mirrors every DOM photo marked `data-gl` as a WebGL plane. Each frame it reads the photo's four
 * corner markers (which include all CSS 3D transforms) and maps the plane onto that exact quad with a
 * projective transform, so the WebGL layer adds shader effects without fighting the CSS choreography.
 */
export function PlaneLayer({ velocity }: { velocity: { current: number } }) {
  const { scene } = useThree();
  const group = useMemo(() => new THREE.Group(), []);
  const planes = useRef<Map<HTMLElement, Plane>>(new Map());
  const pathname = usePathname();

  useEffect(() => {
    scene.add(group);
    return () => {
      scene.remove(group);
    };
  }, [scene, group]);

  useEffect(() => {
    const map = planes.current;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const p = map.get(e.target as HTMLElement);
        if (p) p.visible = e.isIntersecting;
      }),
      { rootMargin: "50% 50% 50% 50%" }
    );

    const add = (fig: HTMLElement) => {
      if (map.has(fig)) return;
      const img = fig.querySelector("img");
      if (!img) return;
      const material = new THREE.ShaderMaterial({
        vertexShader: planeVertex,
        fragmentShader: planeFragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTex: { value: null },
          uH: { value: new THREE.Matrix3() },
          uAlpha: { value: 1 },
          uVel: { value: 0 },
          uMode: { value: modeFor(fig) },
          uProgress: { value: 1 },
          uTime: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(GEO, material);
      mesh.frustumCulled = false;
      mesh.visible = false;
      const plane: Plane = {
        fig,
        corners: [0, 1, 2, 3].map((i) => fig.querySelector<HTMLElement>(`[data-c="${i}"]`)!),
        fadeEl: fig.closest<HTMLElement>("[data-gl-fade]"),
        progressEl: fig.closest<HTMLElement>("[data-gl-progress]"),
        mesh,
        visible: false,
        disposed: false,
      };
      map.set(fig, plane);
      group.add(mesh);
      io.observe(fig);

      const load = () => {
        const url = img.currentSrc || img.src;
        loader.load(url, (tex) => {
          if (plane.disposed) return tex.dispose();
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          material.uniforms.uTex.value = tex;
          fig.setAttribute("data-gl-ready", "");
        });
      };
      if (img.complete && img.naturalWidth) load();
      else img.addEventListener("load", load, { once: true });
    };

    const remove = (fig: HTMLElement) => {
      const p = map.get(fig);
      if (!p) return;
      p.disposed = true;
      io.unobserve(fig);
      group.remove(p.mesh);
      p.mesh.material.uniforms.uTex.value?.dispose();
      p.mesh.material.dispose();
      fig.removeAttribute("data-gl-ready");
      map.delete(fig);
    };

    const sync = () => {
      const live = new Set(document.querySelectorAll<HTMLElement>("main [data-photo][data-gl]"));
      map.forEach((_, fig) => !live.has(fig) && remove(fig));
      live.forEach(add);
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      [...map.keys()].forEach(remove);
    };
  }, [group, pathname]);

  useFrame((state) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const vel = velocity.current;
    const t = state.clock.elapsedTime;
    planes.current.forEach((p) => {
      const u = p.mesh.material.uniforms;
      const alpha = readOpacity(p.fadeEl);
      if (!p.visible || !u.uTex.value || alpha <= 0.001) {
        p.mesh.visible = false;
        return;
      }
      // corner markers: 0 bottom-left, 1 bottom-right, 2 top-right, 3 top-left (UV order)
      const q = p.corners.map((c) => {
        const r = c.getBoundingClientRect();
        return [(r.left / W) * 2 - 1, 1 - (r.top / H) * 2];
      }) as Quad;
      const m = squareToQuad(q);
      (u.uH.value as THREE.Matrix3).set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]);
      u.uAlpha.value = alpha;
      u.uVel.value = vel;
      u.uTime.value = t;
      if (p.progressEl) u.uProgress.value = Number(p.progressEl.style.getPropertyValue("--p") || 0);
      p.mesh.visible = true;
    });
  });

  return null;
}
