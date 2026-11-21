/** The `sizes` each section gives its photos. Shared with the preloader so it fetches the exact same files. */
export const PHOTO_SIZES = {
  about: "(max-width: 900px) 92vw, 56vw",
  process: "(max-width: 767px) 88vw, 40vw",
  feature: "(max-width: 900px) 92vw, 44vw",
  overall: "80vw",
  detail: "100vw",
  mosaic: "(max-width: 700px) 45vw, 18vw",
} as const;
