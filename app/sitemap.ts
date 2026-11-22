import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl }, ...projects.map((p) => ({ url: `${siteUrl}/${p.slug}` }))];
}
