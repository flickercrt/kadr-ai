import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const paths = ["/", "/faq", "/contact", "/gallery", "/roadmap", "/login", "/signup"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
