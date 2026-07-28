import type { Metadata } from "next"

// Falls back to the production domain so metadata that needs an absolute
// URL (canonical links, Open Graph images, the sitemap) still resolves
// correctly in environments that don't set this explicitly.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://discows.app"

export const SITE_NAME = "Discows"

export const SITE_DESCRIPTION =
  "Catalog the albums you listen to, rate them, write reviews, and see what the Discows community is discovering."

// The app has two separate root layouts (see app/(marketing)/layout.tsx and
// app/(dashboard)/layout.tsx) so the landing page never loads dashboard-only
// code. Each root layout's `metadata` export spreads this object so both
// halves of the site still carry identical baseline SEO fields.
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "album ratings",
    "music reviews",
    "album catalog",
    "music discovery",
    "rate albums",
    "Discows",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
}
