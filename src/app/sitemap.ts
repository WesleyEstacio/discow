import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

// Static, well-known entry points only. Profile and album pages are public
// but numerous and change with community activity, so they're better
// discovered by crawlers through internal links than listed here.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]
}
