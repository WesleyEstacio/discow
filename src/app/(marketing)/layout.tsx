import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { baseMetadata } from "@/lib/seo"
import "../globals.css"

// This is its own root layout (see the "Root Layout" section of
// https://nextjs.org/docs/app/api-reference/file-conventions/layout),
// separate from app/(dashboard)/layout.tsx. The landing page is the only
// route in this group, so it never bundles the auth/session code, the
// dashboard header, or the toast system that the dashboard needs -
// it only loads its own files, which keeps it fast and lets it stay static.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = baseMetadata

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
