import type { Metadata } from "next";

/** The public address. Vercel provides its production domain at build time; set NEXT_PUBLIC_SITE_URL to override. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const siteName = "Maker Portfolio";

/** Per-page title, description, canonical link and share card, kept in one shape so no page forgets one. */
export function pageMeta({ title, description, path }: { title?: string; description: string; path: string }): Metadata {
  const full = title ? `${title} · ${siteName}` : `${siteName} · Henry Zhao`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName, url: path, title: full, description, images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Maker Portfolio by Henry Zhao" }] },
    twitter: { card: "summary_large_image", title: full, description, images: ["/og.jpg"] },
  };
}
