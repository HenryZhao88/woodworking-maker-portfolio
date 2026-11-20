# Maker Portfolio — Design

**Date:** 2026-11-19
**Owner:** Henry Zhao (student, woodworking class)
**Status:** Draft for approval

## Intent

A personal maker portfolio for a woodworking class, replacing the Google Sites template the teacher originally suggested (the teacher approved a custom site). The teacher grades it. Henry wants it to be visually stunning, at the level of an Awwwards Site of the Day: a cinematic, scroll-driven experience, not an ordinary website.

The site must carry the information in the original template header: the title **"Maker Portfolio"**, a nav with **Home · Wooden Spoon · Cutting Board**, and a gold accent bar (template color ≈ `#C8AE74`). It must **not look like** the template. Only the content carries over.

## Goals

- **Loading screen** that waits until everything is genuinely ready, so the first interaction is never janky.
- **Cinematic home page**: "Maker Portfolio" + "Henry Zhao" over a passive, always-moving 3D background animation.
- **Shared-element page transition** from Home to Wooden Spoon. Home elements visibly carry over and transform (no fade-out/fade-in, no white flash).
- **Wooden Spoon page**: a scroll-driven story. Photos animate into view in real 3D (bend, rotate in depth, parallax), and text reveals beside them (line/word reveals). Smooth, weighted scrolling throughout.
- Easy to add more project pages later.
- Deployed on Vercel from a GitHub repo.

## Non-goals

- Not an explorable 3D world or game. It's a scroll experience.
- No real content for Cutting Board yet. The page exists in the nav but stays blank / minimal placeholder.
- No CMS, no backend, no forms.
- Final copy is not part of this work. Placeholder text is used; Henry fills it in later.

## Anti-goals (fails even if it technically works)

- Reduced visual quality on normal devices. Quality is **never** traded for speed except on Chromebooks.
- Visible stutter, half-loaded images, or pop-in after the loader finishes.
- 3D effects that bury the spoon photos or make the text hard to read. The project is the star.
- Looking like the Google Sites template (dark photo banner + centered title + right-aligned nav).
- A plain crossfade between pages.

## Constraints

- **Hosting:** Vercel. Code in a GitHub repo (Claude may create it via `gh` when asked).
- **Viewer hardware:** unknown. The teacher may grade on a school Chromebook.
- **Assets:** spoon photos are not provided yet. Build with placeholder images at realistic aspect ratios, structured so real photos drop in by filename.
- Must work in current Chrome, Safari, Edge, Firefox, on desktop and mobile.
- **Deadline: Monday 2026-11-23** (spec written Thursday 2026-11-19). That leaves about 4 days, so the build is phased (see Phasing).
- **The teacher already has a URL in a spreadsheet** (probably the Google Sites one). Henry must confirm with her how the Vercel URL replaces it. Possible routes: she updates the spreadsheet, or the Google Site is published with a link/redirect to the Vercel site. Not a code problem, but it blocks grading.

## Assignment requirements (from the teacher; graded, non-negotiable)

- **12+ process photos.**
- **6 finished photos:** 3 different overall views + 3 details of plane changes / curves.
- Writing addressed to a general viewer who knows nothing about the assignment (not to the teacher).
- Must cover: **about the project**, **the process**, **favorite parts**, **most challenging aspects**, and **an overall impression of the whole experience** at the end.
- The teacher has example portfolios. Henry may share them as a structural reference only.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | **Next.js (App Router) + GSAP/ScrollTrigger + Lenis + Three.js (via React Three Fiber)** | Most code, most control. A persistent WebGL canvas in the root layout survives route changes, which is what enables the shared-element transition with a living background. WebGL image planes let photos truly bend/ripple. Native to Vercel. |
| B | Astro + View Transitions API + GSAP | Lighter, with native shared-element morphs, but keeping a live WebGL scene across page loads is fragile, and cross-browser behavior varies. |
| C | Vanilla HTML/JS + Barba.js | Simplest start, but means hand-rolling everything A provides. Gets messy at this polish level. |

Henry picked **A**, and asked that the library choice stay open: evaluate alternatives (e.g. **anime.js v4**, **Motion**) and use whatever produces the best result per effect. Default stance: GSAP (now fully free, including SplitText/Flip) as the primary timeline/scroll engine. Swap in or add another library only where it clearly wins for a specific effect. Avoid running two overlapping animation engines on the same elements.

## The experience (decided with Henry)

### 1. Loader
- Shows on first visit (and hard refresh). Not on client-side navigation.
- **Waits for real readiness**, not a fixed timer:
  - all images for the current route (and Wooden Spoon's hero images) decoded,
  - web fonts loaded,
  - WebGL scene created, textures uploaded, shaders compiled (pre-render once offscreen / `renderer.compile`),
  - a few warm-up frames rendered, with frame times stable.
- **Plus a hardware-scaled minimum duration**: about 2s on strong machines (so the intro animation always plays fully), longer on weaker ones. Signals: `navigator.hardwareConcurrency`, `navigator.deviceMemory`, WebGL `UNMASKED_RENDERER` string, measured warm-up frame time.
- The loader itself must be beautiful and on-brand (e.g. a progress element built from the gold accent), and it exits with an animation that hands off into the home intro, not a cut.

### 2. Quality policy
- **Full quality on every device**, with one exception.
- **Chromebooks** (UA contains `CrOS`) get a slightly lighter tier: lower pixel ratio cap, fewer particles/geometry, cheaper post-processing. The layout and choreography stay the same.
- Respect `prefers-reduced-motion`: keep the design, replace heavy motion with gentle fades. This is an accessibility floor, not a quality downgrade.

### 3. Home
- Content: **"Maker Portfolio"** and **"Henry Zhao"**, the nav, and the gold accent reinterpreted as a motion detail.
- **Passive, always-running cinematic background** in WebGL. The concept is left to the builder, but it should relate to woodworking (wood grain, shavings, light through timber, etc.) and keep text readable.
- **Mouse interaction:** subtle only (gentle drift/parallax toward the cursor). Drop it if it pulls focus.
- Optionally a short scroll section teasing the spoon and linking to it (builder's call).

### 4. Transition: Home → Wooden Spoon (and back)
- The WebGL canvas lives in the root layout and persists across routes. The background **transforms** into the spoon page's backdrop instead of reloading.
- DOM shared elements morph (GSAP Flip or equivalent). For example, the big "Maker Portfolio" title shrinks into the corner logo, and the "Wooden Spoon" heading grows out of the clicked nav link.
- No white flash, no plain crossfade. Must also work with browser back/forward.
- Cutting Board uses the same transition system, landing on its blank page.

### 5. Wooden Spoon page
- Scroll story with a hero title, then process sections, then a finale. It must hold **18+ photos** (12+ process, 6 finished), so sections carry **multiple photos each**, not one per section.
- **Choreography principle (Claude's call, approved in spirit by Henry: "do what you think is best"):** 18+ photos with one repeated reveal would get monotonous. Each section gets its **own signature technique**, no technique repeats in consecutive sections, and pacing alternates between photo-dense and text-led "breather" sections.
- Structure (placeholder copy, maps to the rubric):
  1. **Hero:** "Wooden Spoon" title reveal (split letters rise), the background shifts from the Home scene.
  2. **About the project** (1 photo): a single large photo plane **unfolds/unbends** from flat-and-tilted into place as text reveals beside it.
  3. **Process (12+ photos): a pinned horizontal film strip.** Vertical scroll drives a horizontal track. Photos are WebGL planes laid along a **gently curved 3D arc** that bends/skews with scroll velocity. Stage labels (Blank & Layout → Rough Shaping → Carving the Bowl → Refining/Sanding → Finishing) and short captions travel with their photos, and a progress rail in the gold accent shows the current stage. This handles any photo count gracefully. On mobile it becomes a vertical stack with per-photo depth reveals.
  4. **Favorite parts** (breather): oversized typography, with one photo revealed through a **wood-grain shader mask** that dissolves it in.
  5. **Most challenging** (breather): text-led, with a different reveal from section 4 (e.g. split-panel / clip-path wipe with parallax).
  6. **Finished: overall views (3):** pinned. Scroll crossfades/morphs between the 3 views with a displacement transition so the spoon appears to **turn**.
  7. **Finished: details (3):** **macro dive.** Each detail starts small, then scroll pushes the camera into it until it fills the screen (lens/zoom feel), with a caption naming the curve or plane change.
  8. **Overall impression:** closing reflection over a final **mosaic**. All the photos drift in from depth and settle into a grid, which recaps the whole project, then a link back to Home.
- **Click-to-enlarge lightbox** on every photo (Claude's call). The teacher grades photo quality, so any photo must be viewable full-size and still. Smooth open/close transition from the photo's position.
- **Finale uses photos, not a 3D model** (Claude's call due to the deadline). The 3 overall views form a pinned photo sequence with 3D plane motion. A photogrammetry model could be added after Monday.
- Photos render as WebGL planes synced to DOM placeholders (keeping layout, accessibility, and SEO in the DOM). As they scroll in they rotate in depth, bend, and parallax. Text reveals beside them (split lines/words), alternating sides.
- Number of sections and copy are easy to change in one content file.

### 5b. Fallbacks (Claude's call)
- **Smoothness vs. quality:** Henry's rule stands. Full quality everywhere, lighter tier only on Chromebooks. No runtime auto-downgrade on other devices.
- **WebGL unavailable/blocked** (possible on managed school devices): photos render as DOM images with CSS 3D transforms, and the background becomes a CSS/canvas-2D version. The page must never break.

### 6. Cutting Board page
- Exists in the nav, with the transition working. The page body is blank / minimal "coming soon" placeholder.

### 7. Smooth scroll
- Lenis (or equivalent) driving ScrollTrigger, with the WebGL render loop synced to the same RAF.

## Phasing (Claude's call; Monday deadline)

Each phase ends deployable, so there is always something gradeable.
1. **Phase 1 (gradeable core):** Next.js scaffold, content file, Lenis + GSAP scroll story with DOM images using CSS 3D motion and text reveals, all rubric sections, nav, blank Cutting Board, Vercel deploy.
2. **Phase 2 (signature):** persistent WebGL canvas, home background, WebGL photo planes replacing DOM image motion (DOM stays as the fallback).
3. **Phase 3 (polish):** shared-element route transitions, the real-readiness loader with hardware-scaled minimum, Chromebook tier, reduced motion, perf/QA.

If time runs out, Phase 3 items ship in simplified form before any Phase 1 requirement is dropped.

## Content structure

- A single content file (e.g. `content/projects.ts`) defines each project: slug, title, sections (heading, body, **a list of images** each with path, alt text, and role: process / overall / detail). The nav and pages derive from it, so adding a project is data, not code.
- Images live in `public/projects/<slug>/` with predictable names.

## Left to the builder

- Visual direction: palette (gold accent kept), typography, layout. Must clearly not resemble the template.
- The concept for the home background and the loader visuals.
- Exact animation choreography, easing, and timing.
- Final library mix within approach A, including whether anime.js / Motion earns a place.
- Mobile adaptation of the scroll story.
- Placeholder image source (generated or neutral).
- Verification: run it in a real browser, check frame pacing, test the Chromebook tier by spoofing the UA, test reduced motion, and run a Lighthouse pass.

## Open (Henry will supply later)

- Spoon photos and the final written copy.
- GitHub repo creation (Henry's, or Claude's via `gh` on request), then Vercel publishing.
