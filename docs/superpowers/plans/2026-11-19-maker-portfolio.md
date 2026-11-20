# Maker Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Awwwards-caliber, scroll-driven woodworking portfolio (Home, Wooden Spoon, blank Cutting Board) and deploy it to Vercel by Monday 2026-11-23.

**Architecture:** Next.js App Router site. One data file drives nav and pages. Lenis smooth scroll drives GSAP ScrollTrigger. A single persistent React Three Fiber canvas in the root layout renders the home background and DOM-synced WebGL photo planes, so it survives route changes for shared-element transitions. Every WebGL effect has a DOM/CSS fallback. Built in 3 phases, each ending deployable.

**Tech Stack:** Next.js (latest stable, App Router, TypeScript), GSAP (+ ScrollTrigger, SplitText, Flip, `@gsap/react`), Lenis, three + `@react-three/fiber` + `@react-three/drei`, Vitest (unit), Playwright (e2e), Vercel.

**Spec:** `docs/superpowers/specs/2026-11-19-maker-portfolio-design.md`

## Global Constraints

- Nav labels exactly: `Home` · `Wooden Spoon` · `Cutting Board`. Site title `Maker Portfolio`. Name `Henry Zhao` on Home.
- Gold accent token `--gold: #C8AE74` (may be tuned, must stay gold). Must not resemble the Google Sites template (dark photo banner + centered title + right nav).
- Quality: `full` everywhere. `lite` only when the UA contains `CrOS`. `fallback` only when WebGL is unavailable. No runtime auto-downgrade.
- `prefers-reduced-motion: reduce` → gentle fades instead of heavy motion. Layout unchanged.
- Spoon page holds ≥12 process photos, exactly 3 `overall` + 3 `detail` finished photos, and sections: about, process, favorite, challenging, finished, impression.
- All copy is placeholder text written for a general viewer (never addressed to the teacher).
- Cutting Board page: blank / minimal "coming soon".
- Works in current Chrome, Safari, Edge, Firefox, desktop + mobile.
- Commit messages: plain subject (+ optional body). **No Claude attribution lines of any kind.**
- One animation engine per element. GSAP is primary. Another library (e.g. anime.js v4, Motion) only where it clearly beats GSAP for a specific effect, with the reason noted in the commit body.
- Every phase ends with `npm run build` passing and a deployable site.

## Review Focus

1. **Mixed photo aspect ratios** (Henry's real photos will be portrait and landscape): no layout may hard-crop away the subject. Planes/frames size from each image's `width`/`height`. Covered by Task 2 validator + Task 5 e2e.
2. **Direct link / refresh on `/wooden-spoon`, and browser back/forward**: the page must render fully with no transition source, and back/forward must animate or at least land correctly, never blank. Covered in Task 11.
3. **Resize or phone rotation mid-pinned section** (filmstrip, overall-views pin): pins must recompute, with no overlap or dead scroll. Covered in Task 5.
4. **WebGL unavailable or context lost** (managed school devices): site must show the DOM fallback, never a blank canvas. Covered in Tasks 7 and 8.
5. **An image fails to load or the network is slow**: the loader must never hang. A hard cap of 15 s, then proceed. Covered in Task 12.

---

## File Structure

```
app/
  layout.tsx              root: fonts, tokens, <SmoothScroll>, <Nav>, <SceneCanvas>, <Loader>
  page.tsx                Home
  wooden-spoon/page.tsx   renders project "wooden-spoon"
  cutting-board/page.tsx  blank placeholder
  globals.css             tokens (:root), base styles
content/
  projects.ts             all project data (the only file Henry edits for copy/photos)
  types.ts                content types
lib/
  validateProject.ts      rubric validator
  quality.ts              quality tier detection
  loader.ts               readiness gate + min duration
components/
  Nav.tsx
  SmoothScroll.tsx        Lenis ↔ ScrollTrigger ↔ RAF
  RevealText.tsx          SplitText line/word reveal
  Lightbox.tsx
  Loader.tsx
  spoon/                  one file per section: Hero, About, ProcessStrip, TextFeature, OverallViews, DetailDive, Mosaic
  gl/
    SceneCanvas.tsx       persistent R3F canvas, tier-aware
    ImagePlane.tsx        DOM-synced plane (tracks a DOM element's rect)
    HomeBackground.tsx
    shaders/              grainMask.glsl, displacement.glsl, bend.glsl
    sceneStore.ts         current route scene state (zustand or tiny store)
  transitions/
    RouteTransition.tsx   Flip-based shared elements + scene morph
public/projects/wooden-spoon/   placeholder images (later: real photos)
tests/unit/  tests/e2e/
```

---

## Phase 1: Gradeable core (DOM only)

### Task 1: Scaffold, tooling, design tokens

**Files:** Create: project via `create-next-app`, `app/globals.css`, `app/layout.tsx`, `vitest.config.ts`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`

**Produces:** scripts `dev`, `build`, `test` (vitest), `test:e2e` (playwright). CSS tokens on `:root`: `--bg`, `--fg`, `--muted`, `--gold`, font variables `--font-display`, `--font-body`.

- [ ] **Step 1:** `git init` in the project root. Scaffold Next.js (TypeScript, App Router, ESLint, no Tailwind unless the builder prefers it) into the existing folder. Install `gsap @gsap/react lenis three @react-three/fiber @react-three/drei`, dev: `vitest @playwright/test`.
- [ ] **Step 2: Write failing e2e** `tests/e2e/smoke.spec.ts`: `GET /` has `<title>` containing `Maker Portfolio`.
- [ ] **Step 3:** Run `npx playwright test smoke`. Expected: FAIL.
- [ ] **Step 4:** Set metadata title, add tokens and fonts (display face: distinctive editorial serif or grotesk, builder's call, loaded via `next/font`).
- [ ] **Step 5:** Run `npx playwright test smoke && npm run build`. Expected: PASS, build succeeds.
- [ ] **Step 6:** Commit `chore: scaffold Next.js site with tooling and tokens`.

### Task 2: Content model, placeholder content, rubric validator

**Files:** Create `content/types.ts`, `content/projects.ts`, `lib/validateProject.ts`, `public/projects/wooden-spoon/*` (placeholders), Test `tests/unit/validateProject.test.ts`

**Produces:**
```ts
export type ImageRole = 'process' | 'overall' | 'detail' | 'feature';
export interface ProjectImage { src: string; alt: string; role: ImageRole; width: number; height: number; caption?: string }
export interface ProcessStage { label: string; caption: string; images: ProjectImage[] }
export interface Project {
  slug: string; title: string; navLabel: string; status: 'published' | 'placeholder';
  about?: { heading: string; body: string[]; image: ProjectImage };
  process?: { heading: string; intro: string; stages: ProcessStage[] };
  favorite?: { heading: string; body: string[]; image: ProjectImage };
  challenging?: { heading: string; body: string[]; image: ProjectImage };
  finished?: { overall: ProjectImage[]; details: ProjectImage[] };
  impression?: { heading: string; body: string[] };
}
export const projects: Project[];               // order = nav order after Home
export function getProject(slug: string): Project | undefined;
export function validateProject(p: Project): string[];   // [] = valid
```

- [ ] **Step 1: Write failing tests:**
  - `wooden-spoon passes validation`: `expect(validateProject(getProject('wooden-spoon')!)).toEqual([])`
  - `flags fewer than 12 process photos`: a fixture with 11 → errors contain `'process: need ≥12 photos, got 11'`
  - `flags wrong finished counts`: 2 overall → contains `'finished.overall: need exactly 3, got 2'`. Same message format for `details`.
  - `flags missing rubric section`: no `challenging` → contains `'missing section: challenging'`
  - `flags image without dimensions`: `width: 0` → contains `'image <src>: width/height required'`
  - `placeholder projects skip rubric`: `{status:'placeholder'}` → `[]`
  - `projects order`: `projects.map(p=>p.navLabel)` equals `['Wooden Spoon','Cutting Board']`
- [ ] **Step 2:** `npx vitest run validateProject`. Expected: FAIL.
- [ ] **Step 3:** Implement types, validator, and content. Placeholder copy follows the spec's sections and 5 stage labels (`Blank & Layout`, `Rough Shaping`, `Carving the Bowl`, `Refining & Sanding`, `Finishing`), 2–4 images each, 13 process total. Placeholder images: generated neutral wood-toned JPGs at mixed sizes (some 3:4 portrait, some 4:3 landscape) named `process-01.jpg` … `overall-1.jpg` … `detail-1.jpg`. Every placeholder body string is visibly marked (e.g. starts with `[Placeholder]`).
- [ ] **Step 4:** `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add project content model and rubric validator`.

### Task 3: Shell: nav, smooth scroll, Home (static), Cutting Board

**Files:** Create `components/Nav.tsx`, `components/SmoothScroll.tsx`, `components/RevealText.tsx`, `app/page.tsx`, `app/cutting-board/page.tsx`, Test `tests/e2e/nav.spec.ts`

**Consumes:** `projects`, `getProject`. **Produces:** `<RevealText as="h1|h2|p" split="chars|words|lines" trigger="scroll|mount">`. `SmoothScroll` exposes `useLenis()` and registers ScrollTrigger with Lenis via `gsap.ticker`.

- [ ] **Step 1: Write failing e2e:** nav shows `Home`, `Wooden Spoon`, `Cutting Board` in order. Clicking `Cutting Board` lands on `/cutting-board`. Home contains `Maker Portfolio` and `Henry Zhao`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Home is the typographic composition (title, name, gold detail) with mount reveal. Background is a placeholder gradient until Task 9. Nav current-page state uses `usePathname`. Lenis is disabled under reduced motion.
- [ ] **Step 4:** Run e2e + build. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add nav, smooth scroll, home and cutting board pages`.

### Task 4: Spoon page sections (DOM): Hero, About, Favorite, Challenging, Impression

**Files:** Create `app/wooden-spoon/page.tsx`, `components/spoon/{Hero,About,TextFeature,Mosaic}.tsx`, Test `tests/e2e/spoon.spec.ts`

**Consumes:** `getProject('wooden-spoon')`, `RevealText`.

- [ ] **Step 1: Write failing e2e:** `/wooden-spoon` renders headings for about, favorite, challenging, impression from content. `img` count on the page ≥ 19. Every `img` has non-empty `alt`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement DOM versions with CSS 3D/GSAP motion standing in for later shaders. About: photo unfolds from `rotateX(~60deg)` flat to 0 on scroll. Favorite and Challenging use different reveals (clip-path wipe vs. split panel with parallax). Mosaic: all images fly in from `translateZ`/scale into a grid. Use `next/image` with intrinsic width/height (`object-fit: contain` or aspect-preserving frames, no subject-cropping).
- [ ] **Step 4:** Run e2e + build. Expected: PASS. Visually check in a browser at 1440×900 and 390×844.
- [ ] **Step 5:** Commit `feat: build wooden spoon story sections`.

### Task 5: Process filmstrip + Finished (overall views, detail dive)

**Files:** Create `components/spoon/{ProcessStrip,OverallViews,DetailDive}.tsx`, Modify `app/wooden-spoon/page.tsx`, Test `tests/e2e/spoon-pins.spec.ts`

- [ ] **Step 1: Write failing e2e:**
  - `filmstrip scrolls horizontally`: after scrolling into the process section, the last process image's bounding box becomes visible within the viewport.
  - `stage rail updates`: the active stage label text changes from `Blank & Layout` to `Finishing` between start and end of the pin.
  - `survives resize`: resize to 390×844 mid-section, call `ScrollTrigger.refresh` via the app's resize handler, and assert no horizontal page overflow (`document.documentElement.scrollWidth <= innerWidth`).
  - `overall views cycle`: at three scroll positions inside the pin, the visible overall image `src` is `overall-1`, `overall-2`, `overall-3`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. ProcessStrip: pinned section, vertical scroll → `x` translation of a track, perspective arc via per-card `rotateY` by distance from center, skew from Lenis velocity, gold progress rail. Below 768px, switch to a vertical stack with per-photo depth reveal (`gsap.matchMedia`). OverallViews: pinned crossfade between 3. DetailDive: each detail scales from small card to full-viewport with caption.
- [ ] **Step 4:** Run e2e + build. Expected: PASS. Check with mixed-aspect placeholders.
- [ ] **Step 5:** Commit `feat: add process filmstrip and finished-piece sequences`.

### Task 6: Lightbox

**Files:** Create `components/Lightbox.tsx`, Modify spoon components to make images openable, Test `tests/e2e/lightbox.spec.ts`

**Produces:** `useLightbox(): { open(img: ProjectImage, originEl: HTMLElement): void }` via a context provider in `app/layout.tsx`.

- [ ] **Step 1: Write failing e2e:** clicking a process image opens a dialog (`role="dialog"`) showing the same `src` at full size. `Escape` closes it, and focus returns to the clicked image. Arrow keys move to the next image. Scroll is locked while open (Lenis stopped).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement with a GSAP Flip open/close from the origin element.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add full-size photo lightbox`.

### Task 7: Phase 1 deploy checkpoint (requires Henry)

- [ ] **Step 1:** `npm run build && npx vitest run && npx playwright test`. Expected: all pass.
- [ ] **Step 2:** **Ask Henry** before creating anything public: create the GitHub repo (`gh repo create <name> --private --source . --push`) or have him create it. Then he imports it in Vercel.
- [ ] **Step 3:** Open the Vercel preview URL and spot-check Home → Wooden Spoon → Cutting Board.
- [ ] **Step 4:** Remind Henry to get the teacher's spreadsheet URL updated (or link from the Google Site).

---

## Phase 2: Signature WebGL

### Task 8: Quality tiers + persistent canvas + DOM-synced image planes

**Files:** Create `lib/quality.ts`, `components/gl/{SceneCanvas,ImagePlane,sceneStore}.tsx`, Modify `app/layout.tsx`, Test `tests/unit/quality.test.ts`, `tests/e2e/fallback.spec.ts`

**Produces:**
```ts
export type QualityTier = 'full' | 'lite' | 'fallback';
export function detectQuality(env: { userAgent: string; webgl: boolean }): QualityTier;
export function tierSettings(t: QualityTier): { dprMax: number; particles: number; postFx: boolean };
// <ImagePlane image={ProjectImage} effect="unfold"|"strip"|"grainMask"|"displace"|"dive"|"mosaic" progress={MotionValue|number} />
```

- [ ] **Step 1: Write failing unit tests:** macOS Chrome UA + webgl → `'full'`. UA containing `CrOS` + webgl → `'lite'`. Any UA + `webgl:false` → `'fallback'`. `tierSettings('full').dprMax === 2`, `tierSettings('lite').dprMax === 1.25`, `tierSettings('full').particles > tierSettings('lite').particles`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `quality.ts`. `SceneCanvas` is fixed full-screen behind content, mounted once in the root layout, and renders nothing when the tier is `fallback`. It listens for `webglcontextlost` and flips the store to `fallback`. `ImagePlane` reads its DOM placeholder's rect every frame (synced to the Lenis RAF) and positions an orthographic-mapped plane. When planes are active, the DOM `img` gets `visibility:hidden` but stays in layout and in the accessibility tree.
- [ ] **Step 4: Write e2e** `fallback.spec.ts`: launch with `--disable-webgl` (Chromium arg) and assert spoon images are visible DOM images and no console errors.
- [ ] **Step 5:** Run unit + e2e. Expected: PASS.
- [ ] **Step 6:** Commit `feat: add persistent WebGL canvas, quality tiers and image planes`.

### Task 9: Home background scene

**Files:** Create `components/gl/HomeBackground.tsx`, Modify `app/page.tsx`

- [ ] **Step 1:** Implement a woodworking-themed passive scene (builder's concept: grain flow field, drifting shavings, light through timber), with particle count from `tierSettings`. Add subtle cursor drift (eased, max ~3% offset). No drift on touch devices or under reduced motion. Title stays readable (contrast ≥ 4.5:1 over the scene).
- [ ] **Step 2:** Verify in a browser: steady 60fps in Chrome DevTools performance panel on the dev machine, and with UA spoofed to `CrOS` (lite).
- [ ] **Step 3:** Commit `feat: add cinematic home background`.

### Task 10: Spoon WebGL effects

**Files:** Create `components/gl/shaders/{bend,grainMask,displacement}.glsl`, Modify `ImagePlane.tsx`, `components/spoon/*`

- [ ] **Step 1:** Wire each section to its plane effect per the spec: About `unfold`, ProcessStrip `strip` (curved arc + velocity bend in the vertex shader), Favorite `grainMask` (procedural wood-grain noise threshold dissolve), Challenging keeps its DOM wipe (deliberately different), OverallViews `displace` (displacement-map crossfade so the spoon "turns"), DetailDive `dive`, Mosaic `mosaic` (planes from depth into grid). Existing Phase 1 e2e tests must still pass unchanged.
- [ ] **Step 2:** Run `npx playwright test` + `--disable-webgl` run. Expected: PASS both.
- [ ] **Step 3:** Visual check full / lite / fallback at desktop and mobile sizes.
- [ ] **Step 4:** Commit `feat: add WebGL photo effects to wooden spoon story`.

---

## Phase 3: Transitions, loader, polish

### Task 11: Shared-element route transitions

**Files:** Create `components/transitions/RouteTransition.tsx`, Modify `Nav.tsx`, `sceneStore.ts`, `app/layout.tsx`, Test `tests/e2e/transitions.spec.ts`

**Produces:** `navigateWithTransition(href: string, sourceEl?: HTMLElement): Promise<void>`. `sceneStore.setScene('home'|'spoon'|'blank')` animates canvas uniforms between scenes.

- [ ] **Step 1: Write failing e2e:**
  - Clicking `Wooden Spoon` from Home: no frame where `body` background is white without content. (Sample a screenshot at mid-transition and check that the corner pixel matches `--bg`.) URL ends `/wooden-spoon`.
  - Direct load of `/wooden-spoon` renders the hero heading with no errors.
  - `page.goBack()` returns to Home with `Maker Portfolio` visible.
- [ ] **Step 2:** Run. Expected: FAIL (or partially).
- [ ] **Step 3:** Implement. Intercept nav clicks, capture Flip state of shared elements (Home title → nav logo, clicked nav link → page H1), `router.push`, then Flip into the new layout. The canvas scene morphs via `setScene`. Handle `popstate` with the same flow. Fall back to a plain instant swap if the source element is missing.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add shared-element page transitions`.

### Task 12: Loader

**Files:** Create `lib/loader.ts`, `components/Loader.tsx`, Modify `app/layout.tsx`, `SceneCanvas.tsx`, Test `tests/unit/loader.test.ts`

**Produces:**
```ts
export function minLoaderDuration(hw: { cores?: number; memoryGB?: number; warmupFrameMs?: number }): number;
export function createReadinessGate(keys: string[]): { mark(key: string): void; ready: Promise<void> };
export const LOADER_HARD_CAP_MS = 15000;
```

- [ ] **Step 1: Write failing unit tests:**
  - `{cores:8, memoryGB:8, warmupFrameMs:10}` → `2000`
  - `{cores:4, memoryGB:8, warmupFrameMs:10}` → `3000` (any one mid signal: cores ≤4, memory ≤4, or frame 13–20 ms)
  - `{cores:2, memoryGB:2, warmupFrameMs:30}` → `4000` (frame > 20 ms or two+ weak signals)
  - `{}` (Safari, no `deviceMemory`) → `2000` (unknown signals count as strong)
  - gate resolves only after every key is marked. Marking an unknown key throws.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Gate keys are `fonts`, `images` (current route + spoon hero decode), `gl` (textures uploaded + `gl.compile`), `warmup` (10 rendered frames, mean frame time recorded). Loader exits at `max(gate.ready, minDuration)` or `LOADER_HARD_CAP_MS`, whichever comes first. Shown only on first load (not client nav). The exit animation hands off into the Home intro (gold accent motif).
- [ ] **Step 4:** Run unit tests + e2e suite (the e2e config waits for `[data-loader-done]`). Expected: PASS.
- [ ] **Step 5:** Commit `feat: add readiness-based loader`.

### Task 13: Reduced motion, performance QA, final deploy

**Files:** Modify as needed, Test `tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Write e2e:** with `reducedMotion: 'reduce'`, all spoon headings and images are visible after scrolling through, and no pinned section exceeds 1 viewport of extra scroll.
- [ ] **Step 2:** Run, fix, re-run until PASS.
- [ ] **Step 3:** Lighthouse on the production build. Target Performance ≥ 80 desktop, Accessibility ≥ 95. Check frame pacing in full and spoofed `CrOS`. Test Safari and Firefox manually.
- [ ] **Step 4:** Commit `chore: reduced-motion and performance pass`. Push, then confirm the Vercel production URL works.
- [ ] **Step 5:** Hand Henry the list: drop photos into `public/projects/wooden-spoon/` with the listed names and real `width`/`height`, edit copy in `content/projects.ts`, run `npx vitest run` (the validator confirms rubric counts), push.
