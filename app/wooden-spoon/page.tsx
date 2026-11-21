import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "@/content/projects";
import { mosaicImages } from "@/lib/preload";
import { Hero } from "@/components/spoon/Hero";
import { About } from "@/components/spoon/About";
import { TextFeature } from "@/components/spoon/TextFeature";
import { Mosaic } from "@/components/spoon/Mosaic";
import { ProcessStrip } from "@/components/spoon/ProcessStrip";
import { OverallViews } from "@/components/spoon/OverallViews";
import { DetailDive } from "@/components/spoon/DetailDive";

export const metadata: Metadata = { title: "Wooden Spoon" };

export default function WoodenSpoon() {
  const p = getProject("wooden-spoon");
  if (!p || !p.about || !p.favorite || !p.challenging || !p.impression || !p.process || !p.finished) notFound();
  return (
    <main style={{ position: "relative", zIndex: 1 }}>
      <Hero title={p.title} index="01" />
      <About about={p.about} />
      <ProcessStrip process={p.process} />
      <TextFeature id="favorite-h" variant="grain" {...p.favorite} />
      <TextFeature id="challenging-h" eyebrow="Most challenging" variant="wipe" {...p.challenging} />
      <OverallViews views={p.finished.overall} />
      <DetailDive details={p.finished.details} />
      <Mosaic impression={p.impression} images={mosaicImages(p)} />
    </main>
  );
}
