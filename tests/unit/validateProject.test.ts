import { describe, it, expect } from "vitest";
import { getProject, projects } from "@/content/projects";
import { validateProject } from "@/lib/validateProject";
import type { Project, ProjectImage } from "@/content/types";

const img = (n: number, role: ProjectImage["role"] = "process"): ProjectImage => ({
  src: `/x/${role}-${n}.jpg`,
  alt: `alt ${n}`,
  role,
  width: 1200,
  height: 900,
});

function validFixture(processCount = 12): Project {
  const procImgs = Array.from({ length: processCount }, (_, i) => img(i + 1));
  return {
    slug: "fixture",
    title: "Fixture",
    navLabel: "Fixture",
    status: "published",
    about: { heading: "About", body: ["b"], image: img(1, "feature") },
    process: { heading: "Process", intro: "i", stages: [{ label: "S", when: "Oct 1", caption: "c", images: procImgs }] },
    favorite: { heading: "Fav", body: ["b"], image: img(2, "feature") },
    challenging: { heading: "Hard", body: ["b"], image: img(3, "feature") },
    finished: { overall: [1, 2, 3].map((n) => img(n, "overall")), details: [1, 2, 3].map((n) => img(n, "detail")) },
    impression: { heading: "Overall", body: ["b"] },
  };
}

describe("validateProject", () => {
  it("wooden-spoon passes validation", () => {
    expect(validateProject(getProject("wooden-spoon")!)).toEqual([]);
  });

  it("valid fixture passes", () => {
    expect(validateProject(validFixture())).toEqual([]);
  });

  it("flags fewer than 12 process photos", () => {
    expect(validateProject(validFixture(11))).toContain("process: need ≥12 photos, got 11");
  });

  it("flags wrong finished overall count", () => {
    const p = validFixture();
    p.finished!.overall = p.finished!.overall.slice(0, 2);
    expect(validateProject(p)).toContain("finished.overall: need exactly 3, got 2");
  });

  it("flags wrong finished details count", () => {
    const p = validFixture();
    p.finished!.details.push(img(4, "detail"));
    expect(validateProject(p)).toContain("finished.details: need exactly 3, got 4");
  });

  it("flags missing rubric section", () => {
    const p = validFixture();
    delete p.challenging;
    expect(validateProject(p)).toContain("missing section: challenging");
  });

  it("flags image without dimensions", () => {
    const p = validFixture();
    p.about!.image = { ...p.about!.image, width: 0 };
    expect(validateProject(p)).toContain(`image ${p.about!.image.src}: width/height required`);
  });

  it("flags image without alt text", () => {
    const p = validFixture();
    p.favorite!.image = { ...p.favorite!.image, alt: " " };
    expect(validateProject(p)).toContain(`image ${p.favorite!.image.src}: alt text required`);
  });

  it("placeholder projects skip rubric", () => {
    expect(validateProject({ slug: "cb", title: "CB", navLabel: "CB", status: "placeholder" })).toEqual([]);
  });
});

describe("projects", () => {
  it("nav order", () => {
    expect(projects.map((p) => p.navLabel)).toEqual(["Wooden Spoon", "Cutting Board"]);
  });

  it("wooden spoon has mixed aspect ratios in process photos", () => {
    const imgs = getProject("wooden-spoon")!.process!.stages.flatMap((s) => s.images);
    expect(imgs.some((i) => i.height > i.width)).toBe(true);
    expect(imgs.some((i) => i.width > i.height)).toBe(true);
  });
});
