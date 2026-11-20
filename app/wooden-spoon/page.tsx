import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "@/content/projects";
import type { Project, ProjectImage } from "@/content/types";
import { Hero } from "@/components/spoon/Hero";
import { About } from "@/components/spoon/About";
import { TextFeature } from "@/components/spoon/TextFeature";
import { Mosaic } from "@/components/spoon/Mosaic";
import { ProcessStrip } from "@/components/spoon/ProcessStrip";
import { OverallViews } from "@/components/spoon/OverallViews";
import { DetailDive } from "@/components/spoon/DetailDive";

export const metadata: Metadata = { title: "Wooden Spoon" };

function allImages(p: Project): ProjectImage[] {
  return [
    ...(p.about ? [p.about.image] : []),
    ...(p.process?.stages.flatMap((s) => s.images) ?? []),
    ...(p.favorite ? [p.favorite.image] : []),
    ...(p.challenging ? [p.challenging.image] : []),
    ...(p.finished ? [...p.finished.overall, ...p.finished.details] : []),
  ];
}

export default function WoodenSpoon() {
  const p = getProject("wooden-spoon");
  if (!p || !p.about || !p.favorite || !p.challenging || !p.impression || !p.process || !p.finished) notFound();
  return (
    <main style={{ position: "relative", zIndex: 1 }}>
      <Hero title={p.title} index="01" />
      <About about={p.about} />
      <ProcessStrip process={p.process} />
      <TextFeature id="favorite-h" eyebrow="Favorite parts" variant="grain" {...p.favorite} />
      <TextFeature id="challenging-h" eyebrow="Most challenging" variant="wipe" {...p.challenging} />
      <OverallViews views={p.finished.overall} />
      <DetailDive details={p.finished.details} />
      <Mosaic impression={p.impression} images={allImages(p)} />
    </main>
  );
}
