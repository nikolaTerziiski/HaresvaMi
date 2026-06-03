import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://haresvami.bg";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/login", "/register", "/forgot-password"];

  return routes.map((route) => ({
    url: `${siteUrl}${route || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.6,
  }));
}
