/**
 * ALL portfolio content lives here. Wrap a phrase in *asterisks* to set it in gold italic.
 *
 * To add your real photos:
 *   1. Put them in /public/projects/wooden-spoon/ as JPG/PNG/WebP (not HEIC), exact filename case.
 *   2. Update `src`, `alt`, `width`, `height` below (width/height = the photo's real pixel size).
 *   3. Run `npm test`: it checks the teacher's rubric (≥12 process, 3 overall, 3 details, all sections).
 *
 * Write for someone who knows nothing about the class.
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
      heading: "It started as a block of wood.",
      body: [
        "At the end of September this was a plain rectangular block sitting on my bench. Seven weeks later it was a spoon, with a deep bowl, a long handle, and *a small crossbar that sticks out on both sides*.",
        "I drew the design myself on grid paper: one view of the spoon from above and one from the side. After that, I just kept cutting wood away until the block matched both drawings.",
        "Getting there took a drill press, a gouge (basically a curved chisel you tap with a mallet), the band saw, and more hand sanding than I want to count.",
      ],
      image: { src: `${DIR}/about.jpg`, alt: "The back of the finished spoon's bowl, curving into the handle", role: "feature", ...PORTRAIT },
    },
    process: {
      heading: "From block to spoon.",
      intro: "Thirteen photos, in the order I took them. The dates come straight off my camera roll.",
      stages: [
        {
          label: "Layout & Drilling",
          when: "Sept 30 to Oct 8",
          caption: "I glued my drawings right onto the block so I could follow the lines as I worked. The first real cut was a hole from the drill press, *right where the bowl would go*.",
          images: [
            proc(1, "Grid-paper drawings of the spoon's top and side views glued onto a block of wood", LANDSCAPE),
            proc(2, "A round hole drilled into the bowl area with the drill press"),
          ],
        },
        {
          label: "Carving the Bowl",
          when: "Oct 8 to 14",
          caption: "Then the gouge and mallet. Every tap lifted a curl of wood, and *the hole slowly turned into a bowl*. I went back in with a Dremel to finish the inside.",
          images: [
            proc(3, "Carving the bowl with a gouge and a wooden mallet"),
            proc(4, "The bowl fully hollowed after gouging and Dremel work"),
          ],
        },
        {
          label: "Band Saw Cuts",
          when: "Oct 14 to 20",
          caption: "Ms. Bernstein started the side cut on the band saw and let me finish it. I sanded everything flat, then she cut the outline from above, and *for the first time it actually looked like a spoon*.",
          images: [
            proc(5, "Ms. Bernstein cutting the spoon's side profile on the band saw"),
            proc(6, "Finishing the side-profile cut on the band saw"),
            proc(7, "Sanding the block flat on the belt sander after the side cut"),
            proc(8, "Hand sanding the inside of the bowl with folded sandpaper"),
            proc(9, "Ms. Bernstein cutting the spoon's top-down outline on the band saw"),
          ],
        },
        {
          label: "Shaping & Sanding",
          when: "Oct 20 to 29",
          caption: "From here it was all sanding. The belt sander rounded the back of the bowl, the spindle sander (a sanding drum that spins and bobs up and down) got into the tight curves of the handle, and then I went over *every inch by hand*.",
          images: [
            proc(10, "Sanding the spoon on the belt sander"),
            proc(11, "Smoothing the handle's inside curves on the spindle sander"),
            proc(12, "Hand sanding the whole spoon with a sanding block"),
          ],
        },
        {
          label: "Finishing",
          when: "Nov 17",
          caption: "Oil went on last. Once it dried, I buffed it to a soft shine.",
          images: [proc(13, "The oiled spoon drying on a paper towel")],
        },
      ],
    },
    favorite: {
      heading: "The part I loved.",
      body: [
        "My favorite moment was wiping on the oil. For weeks the spoon had been pale and dusty from all the sanding.",
        "Then one coat went on and everything changed. Rings and swirls I had never noticed showed up all over the bowl, *like they had been hiding in there all along*.",
      ],
      image: { src: `${DIR}/favorite.jpg`, alt: "Close-up of the wood grain swirling inside the finished bowl", role: "feature", ...PORTRAIT },
    },
    challenging: {
      heading: "The part that fought back.",
      body: [
        "The crossbar on the handle has two tiny wings, one on each side. After the band saw they were covered in saw marks, so I went at them with a sharp chisel to clean them up. I pushed too hard, and one of the wings snapped right off.",
        "Those wings are small and the grain runs across them, so they break easily. Ms. Bernstein wood-glued it back on for me, and *it has held ever since*.",
        "I didn't get any photos of it, but it taught me to take really light cuts on anything small.",
      ],
      quote: "I pushed too hard, and one side snapped clean off.",
      image: { src: `${DIR}/detail-1.jpg`, alt: "The crossbar on the handle, where one wing snapped off during cleanup and was glued back on", role: "feature", ...PORTRAIT },
    },
    finished: {
      overall: [
        { src: `${DIR}/overall-1.jpg`, alt: "The finished spoon from a three-quarter angle", role: "overall", ...LANDSCAPE },
        { src: `${DIR}/overall-2.jpg`, alt: "The finished spoon from directly above, bowl at the bottom", role: "overall", ...PORTRAIT },
        { src: `${DIR}/overall-3.jpg`, alt: "Looking down the length of the spoon from the flared end of the handle", role: "overall", ...PORTRAIT },
      ],
      details: [
        { src: `${DIR}/detail-1.jpg`, alt: "Close-up of the crossbar, where the handle's flat planes step out and back", role: "detail", ...PORTRAIT, caption: "Here the handle steps out into the crossbar and back in again." },
        { src: `${DIR}/detail-2.jpg`, alt: "Close-up of the handle flaring out into a wide, curved end", role: "detail", ...PORTRAIT, caption: "The end of the handle gets wider and curves out." },
        { src: `${DIR}/detail-3.jpg`, alt: "Close-up of the bowl's rounded rim and side", role: "detail", ...PORTRAIT, caption: "I rounded the rim of the bowl so there are no sharp edges." },
      ],
    },
    impression: {
      heading: "Looking back.",
      body: [
        "Back in September this was a drawing glued to a piece of wood. Now it is a spoon I made from start to finish, with some help from Ms. Bernstein on the band saw and one emergency glue job.",
        "Honestly, most of this project was sanding. The band saw cuts took a few minutes each. *Making it look finished took weeks.*",
        "Next time I would slow down on the small details, and I would take a lot more photos. But I am proud of how it turned out.",
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
