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
        "At the end of September this was a plain rectangular block sitting on my bench. Seven weeks later it was a spoon, with a deep bowl, a long handle, and a small crossbar to make it resemble a chess piece somewhat.",
        "I drew the design on grid paper: one view of the spoon from above and one from the side. The top view showed the outline of the bowl, the narrow handle, and the crossbar. The side view showed how thick the spoon would be and how the bowl would curve into the handle. Both drawings mattered because I was turning a flat design into something with depth.",
        "Getting there took a drill press, a gouge (basically a curved chisel you tap with a mallet), the band saw, and more hours of hand sanding than I want to count.",
      ],
      image: { src: `${DIR}/about.jpg`, alt: "The back of the finished spoon's bowl, curving into the handle", role: "feature", ...PORTRAIT },
    },
    process: {
      heading: "From block to spoon.",
      intro: "These 13 photos follow the spoon from the paper layout to the final coat of oil. Each stage had a different job: hollowing out the bowl, cutting the outline, rounding the rough edges, and finally making the surface smooth enough to finish.",
      stages: [
        {
          label: "Layout & Drilling",
          when: "Sept 30 to Oct 8",
          caption: "I started by gluing the grid-paper drawings onto the block, with the top view on one face and the side view on another which let me see where I was cutting. Then I used the drill press to make a round hole where the bowl would go. The hole removed some of the wood from the middle and gave me a starting point for carving. At this stage the outside was still rectangular.",
          images: [
            proc(1, "Grid-paper drawings of the spoon's top and side views glued onto a block of wood", LANDSCAPE),
            proc(2, "A round hole drilled into the bowl area with the drill press"),
          ],
        },
        {
          label: "Carving the Bowl",
          when: "Oct 8 to 14",
          caption: "Next I used a gouge and a wooden mallet to open up the drilled hole. The gouge is a curved chisel, so each tap scooped out a small piece of wood. Gradually, the round hole became wider and wider until it started looking like the bowl in my drawing. This part was about making the inside shape, while the block still had plenty of wood around it. After the gouge work, I used a Dremel, a small rotary tool, to refine the inside. The bowl was hollowed out, but it still needed hand sanding to smooth the surface.",
          images: [
            proc(3, "Carving the bowl with a gouge and a wooden mallet"),
            proc(4, "The bowl fully hollowed after gouging and Dremel work"),
          ],
        },
        {
          label: "Band Saw Cuts",
          when: "Oct 14 to 20",
          caption: "Ms. Bernstein started the side-profile cut on the band saw and let me finish it. That cut established the spoon's thickness and the curve underneath the bowl. I then used the belt sander to sand the cut surface flat and worked inside the bowl with folded sandpaper. After that, Ms. Bernstein cut the top-down outline, following the shape of the bowl and handle. The two views from my original drawing were finally coming together. The spoon had its overall shape now, but the saw left blemishes that I wanted gone.",
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
          caption: "The belt sander helped turn the flat cuts on the back of the bowl into a rounded curve. For the tighter curves along the handle, I used the spindle sander, which has a narrow sanding drum that can reach places the belt sander cannot. Then I went over the spoon by hand, using folded sandpaper inside the bowl and a sanding block on the more open surfaces. This was where most of the time went. The outline was already there, but the surfaces still needed work. I got to 1000 grit, although some areas still weren't as smooth as I wanted.",
          images: [
            proc(10, "Sanding the spoon on the belt sander"),
            proc(11, "Smoothing the handle's inside curves on the spindle sander"),
            proc(12, "Hand sanding the whole spoon with a sanding block"),
          ],
        },
        {
          label: "Finishing",
          when: "Nov 17",
          caption: "Once the shaping and sanding were done, I wiped on the oil. Up to this point, the wood had looked pale and dusty, so this was the first time I could really see the finished color and grain. The rings and swirls inside the bowl became much clearer, and so did some of the marks I hadn't completely sanded out. I left the oiled spoon to dry overnight on a paper towel. After it dried, I buffed it with wax to give the surface more shine. The finish brought out the work, including the parts I would improve next time.",
          images: [proc(13, "The oiled spoon drying on a paper towel")],
        },
      ],
    },
    favorite: {
      heading: "Favorite part",
      body: [
        "My favorite moment was wiping on the oil. For weeks the spoon had been pale and dusty from all the sanding.",
        "Then one coat went on and everything changed. The color of the spoon started showing more. Rings and swirls showed up all over the bowl (along with mistakes 😔) and all the dust from sanding was gone.",
      ],
      image: { src: `${DIR}/favorite.jpg`, alt: "Close-up of the wood grain swirling inside the finished bowl", role: "feature", ...PORTRAIT },
    },
    challenging: {
      heading: "I panicked here",
      body: [
        "The crossbar on the handle has two tiny wings, one on each side. After the band saw they were covered in saw marks, so I went at them with a sharp chisel to clean them up. I pushed too hard, and one of the wings snapped right off.",
        "Those wings are small and the grain runs across them, so they break easily. Luckily, Ms. Bernstein was able to wood-glue it back on for me.",
        "I didn't get any photos of the break, but it changed how I thought about cleaning up the spoon. Removing saw marks sounds like a small job, but a chisel can still take off more than you mean to. Next time I would use much lighter cuts around the crossbar and leave more of that delicate cleanup to hand sanding. Getting rid of a tool mark isn't worth breaking the shape underneath it.",
      ],
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
        "Honestly, most of this project was sanding. The band saw cuts took a few minutes each and made the biggest visible changes, but they only gave me the rough shape. Rounding the bowl, smoothing its inside, and cleaning up the curves of the handle took much longer. I learned that getting the outline right and getting the surface finished are two separate jobs.",
        "Next time I would slow down on the small details, especially the crossbar, and spend more time getting the rough marks out before moving to finer sandpaper. Reaching 1000 grit didn't mean every part was equally smooth, and the oil made that obvious. I would also take more photos of the in-between work and the repair. But I am proud that the finished spoon still follows the design I drew back in September.",
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
