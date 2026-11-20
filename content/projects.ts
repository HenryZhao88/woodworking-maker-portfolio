/**
 * ALL portfolio content lives here.
 *
 * To add your real photos:
 *   1. Put them in /public/projects/wooden-spoon/ (any filename).
 *   2. Update `src`, `alt`, `width`, `height` below (width/height = the photo's real pixel size).
 *   3. Run `npm test` — it checks the teacher's rubric (≥12 process, 3 overall, 3 details, all sections).
 *
 * Text marked [Placeholder] is yours to replace. Write for someone who knows nothing about the class.
 */
import type { Project, ProjectImage } from "./types";

const DIR = "/projects/wooden-spoon";

const P = (n: number, portrait: boolean, alt: string): ProjectImage => ({
  src: `${DIR}/process-${String(n).padStart(2, "0")}.jpg`,
  alt,
  role: "process",
  width: portrait ? 1200 : 1600,
  height: portrait ? 1600 : 1200,
});

// Placeholder images: every 3rd process photo is landscape, others portrait (mirrors a real phone camera roll).
const proc = (n: number, alt: string) => P(n, n % 3 !== 0, alt);

export const projects: Project[] = [
  {
    slug: "wooden-spoon",
    title: "Wooden Spoon",
    navLabel: "Wooden Spoon",
    status: "published",
    about: {
      heading: "A spoon, carved from a single board.",
      body: [
        "[Placeholder] Introduce the project for someone who has never seen it: what you made, what wood you used, how long it took, and what the goal was.",
        "[Placeholder] Mention the main tools — saws, rasps, gouges, files, sandpaper — and anything new you learned to use.",
      ],
      image: { src: `${DIR}/about.jpg`, alt: "[Placeholder] The finished wooden spoon", role: "feature", width: 1600, height: 1100 },
    },
    process: {
      heading: "From board to bowl.",
      intro: "[Placeholder] One or two sentences framing the process — the path from a rough blank to a finished spoon.",
      stages: [
        {
          label: "Blank & Layout",
          caption: "[Placeholder] Choosing the wood and drawing the spoon's outline onto the blank.",
          images: [proc(1, "[Placeholder] Selecting the board"), proc(2, "[Placeholder] Tracing the template"), proc(3, "[Placeholder] Marked-out blank")],
        },
        {
          label: "Rough Shaping",
          caption: "[Placeholder] Cutting out the profile and removing the bulk of the waste.",
          images: [proc(4, "[Placeholder] Cutting the outline"), proc(5, "[Placeholder] Rough profile"), proc(6, "[Placeholder] Side profile cut")],
        },
        {
          label: "Carving the Bowl",
          caption: "[Placeholder] Hollowing the bowl with gouges and checking the depth.",
          images: [proc(7, "[Placeholder] Starting the bowl"), proc(8, "[Placeholder] Gouge work"), proc(9, "[Placeholder] Checking depth")],
        },
        {
          label: "Refining & Sanding",
          caption: "[Placeholder] Rasping the curves smooth and working through the sandpaper grits.",
          images: [proc(10, "[Placeholder] Rasping the handle"), proc(11, "[Placeholder] Sanding the bowl")],
        },
        {
          label: "Finishing",
          caption: "[Placeholder] Applying a food-safe finish to bring out the grain.",
          images: [proc(12, "[Placeholder] Applying finish"), proc(13, "[Placeholder] Drying")],
        },
      ],
    },
    favorite: {
      heading: "The part I loved.",
      body: [
        "[Placeholder] What was your favorite part of the project, and why? Describe the moment it clicked.",
      ],
      image: { src: `${DIR}/favorite.jpg`, alt: "[Placeholder] Favorite step", role: "feature", width: 1200, height: 1500 },
    },
    challenging: {
      heading: "The part that fought back.",
      body: [
        "[Placeholder] What was the most challenging aspect? What went wrong, and how did you solve or work around it?",
      ],
      image: { src: `${DIR}/challenging.jpg`, alt: "[Placeholder] The hardest step", role: "feature", width: 1600, height: 1100 },
    },
    finished: {
      overall: [1, 2, 3].map((n) => ({
        src: `${DIR}/overall-${n}.jpg`,
        alt: `[Placeholder] Finished spoon, overall view ${n}`,
        role: "overall" as const,
        width: 1600,
        height: 1200,
      })),
      details: [
        "where the bowl meets the handle",
        "the curve of the bowl's rim",
        "the plane change along the handle",
      ].map((what, i) => ({
        src: `${DIR}/detail-${i + 1}.jpg`,
        alt: `[Placeholder] Detail: ${what}`,
        role: "detail" as const,
        width: 1200,
        height: 1500,
        caption: `[Placeholder] Detail — ${what}.`,
      })),
    },
    impression: {
      heading: "Looking back.",
      body: [
        "[Placeholder] Your overall impression of the whole experience. What would you do differently next time? What are you proud of?",
      ],
    },
  },
  {
    slug: "cutting-board",
    title: "Cutting Board",
    navLabel: "Cutting Board",
    status: "placeholder",
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
