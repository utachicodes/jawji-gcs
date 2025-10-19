import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const routes = ["/", "/dashboard", "/control", "/missions", "/analytics", "/diagnostics", "/fleet", "/preflight", "/settings", "/login", "/signup"]
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "daily",
    priority: route === "/" ? 1 : 0.7,
  }))
}
