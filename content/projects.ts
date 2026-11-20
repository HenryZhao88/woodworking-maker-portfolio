/**
 * ALL portfolio content lives here.
 *
 * To add your real photos:
 *   1. Put them in /public/projects/wooden-spoon/ as JPG/PNG/WebP (not HEIC), exact filename case.
 *   2. Update `src`, `alt`, `width`, `height` below (width/height = the photo's real pixel size).
 *   3. Run `npm test` — it checks the teacher's rubric (≥12 process, 3 overall, 3 details, all sections).
 *
 * Text marked [Placeholder] is yours to replace. Write for someone who knows nothing about the class.
 */
import type { Project, ProjectImage } from "./types";

const DIR = "/projects/wooden-spoon";

// Every photo was shot on a phone; all but two are portrait. Sizes are the real pixel sizes of the files.
const PORTRAIT = { width: 1800, height: 2400 };
const LANDSCAPE = { width: 2400, height: 1800 };

const proc = (n: number, alt: string, size = PORTRAIT): ProjectImage => ({
  src: `${DIR}/process-${String(n).padStart(2, "0")}.jpg`,
  alt,
  role: "process",
  ...size,
});

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
      image: { src: `${DIR}/about.jpg`, alt: "The back of the finished cherry spoon's bowl, curving into the handle", role: "feature", ...PORTRAIT },
    },
    process: {
      heading: "From board to bowl.",
      intro: "[Placeholder] One or two sentences framing the process — the path from a rough blank to a finished spoon.",
      stages: [
        {
          label: "Layout & Drilling",
          caption: "[Placeholder] Drawing the spoon's top and side views on grid paper, gluing them to the block, and drilling out the start of the bowl.",
          images: [
            proc(1, "Grid-paper drawings of the spoon's top and side views glued onto a block of wood", LANDSCAPE),
            proc(2, "A round hole drilled into the bowl area with the drill press"),
          ],
        },
        {
          label: "Carving the Bowl",
          caption: "[Placeholder] Hollowing the bowl with a gouge and mallet, then smoothing it with a Dremel.",
          images: [
            proc(3, "Carving the bowl with a gouge and a wooden mallet"),
            proc(4, "The bowl fully hollowed after gouging and Dremel work"),
          ],
        },
        {
          label: "Band Saw Cuts",
          caption: "[Placeholder] Cutting the side profile on the band saw with Ms. Bernstein, sanding it flat, then cutting the top-down outline.",
          images: [
            proc(5, "Ms. Bernstein cutting the spoon's side profile on the band saw"),
            proc(6, "Finishing the side-profile cut on the band saw"),
            proc(7, "Sanding the blank flat on the belt sander after the side cut"),
            proc(8, "Hand sanding the inside of the bowl with folded sandpaper"),
            proc(9, "Ms. Bernstein cutting the spoon's top-down outline on the band saw"),
          ],
        },
        {
          label: "Shaping & Sanding",
          caption: "[Placeholder] Sanding the whole spoon into its final shape on the belt and spindle sanders, then by hand.",
          images: [
            proc(10, "Sanding the spoon on the belt sander"),
            proc(11, "Smoothing the handle's inside curves on the spindle sander"),
            proc(12, "Hand sanding the whole spoon with a sanding block"),
          ],
        },
        {
          label: "Finishing",
          caption: "[Placeholder] Oiling the spoon to bring out the grain, letting it dry, and buffing it to a soft shine.",
          images: [proc(13, "The oiled spoon drying on a paper towel")],
        },
      ],
    },
    favorite: {
      heading: "The part I loved.",
      body: [
        "[Placeholder] What was your favorite part of the project, and why? Describe the moment it clicked.",
      ],
      image: { src: `${DIR}/favorite.jpg`, alt: "Close-up of the cherry grain swirling inside the finished bowl", role: "feature", ...PORTRAIT },
    },
    challenging: {
      heading: "The part that fought back.",
      body: [
        "[Placeholder] What was the most challenging aspect? What went wrong, and how did you solve or work around it?",
      ],
      image: { src: `${DIR}/challenging.jpg`, alt: "The bowl after gouging and Dremel work, still inside the rectangular block", role: "feature", ...PORTRAIT },
    },
    finished: {
      overall: [
        { src: `${DIR}/overall-1.jpg`, alt: "The finished cherry spoon from a three-quarter angle", role: "overall", ...LANDSCAPE },
        { src: `${DIR}/overall-2.jpg`, alt: "The finished spoon from directly above, bowl at the bottom", role: "overall", ...PORTRAIT },
        { src: `${DIR}/overall-3.jpg`, alt: "Looking down the length of the spoon from the flared end of the handle", role: "overall", ...PORTRAIT },
      ],
      details: [
        { src: `${DIR}/detail-1.jpg`, alt: "Close-up of the crossbar, where the handle's flat planes step out and back", role: "detail", ...PORTRAIT, caption: "[Placeholder] Detail: the crossbar, where the handle's planes change." },
        { src: `${DIR}/detail-2.jpg`, alt: "Close-up of the handle flaring out into a wide, curved end", role: "detail", ...PORTRAIT, caption: "[Placeholder] Detail: the curve of the flared handle end." },
        { src: `${DIR}/detail-3.jpg`, alt: "Close-up of the bowl's rounded rim and side", role: "detail", ...PORTRAIT, caption: "[Placeholder] Detail: the curve of the bowl's rim." },
      ],
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
