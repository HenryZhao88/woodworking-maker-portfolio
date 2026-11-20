import type { Project, ProjectImage } from "@/content/types";

const RUBRIC_SECTIONS = ["about", "process", "favorite", "challenging", "finished", "impression"] as const;
const MIN_PROCESS = 12;
const FINISHED_EACH = 3;

/** Checks a published project against the teacher's portfolio rubric. Returns [] when valid. */
export function validateProject(p: Project): string[] {
  if (p.status === "placeholder") return [];
  const errors: string[] = [];

  for (const key of RUBRIC_SECTIONS) {
    if (!p[key]) errors.push(`missing section: ${key}`);
  }

  const processImages = p.process?.stages.flatMap((s) => s.images) ?? [];
  if (p.process && processImages.length < MIN_PROCESS) {
    errors.push(`process: need ≥${MIN_PROCESS} photos, got ${processImages.length}`);
  }

  if (p.finished) {
    for (const key of ["overall", "details"] as const) {
      const n = p.finished[key].length;
      if (n !== FINISHED_EACH) errors.push(`finished.${key}: need exactly ${FINISHED_EACH}, got ${n}`);
    }
  }

  const all: ProjectImage[] = [
    ...(p.about ? [p.about.image] : []),
    ...processImages,
    ...(p.favorite ? [p.favorite.image] : []),
    ...(p.challenging ? [p.challenging.image] : []),
    ...(p.finished ? [...p.finished.overall, ...p.finished.details] : []),
  ];
  for (const img of all) {
    if (!(img.width > 0 && img.height > 0)) errors.push(`image ${img.src}: width/height required`);
    if (!img.alt.trim()) errors.push(`image ${img.src}: alt text required`);
  }

  return errors;
}
