import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/toast"
import { SITE_URL } from "@/lib/seo"
import "../globals.css"

// Separate root layout so the internal Studio never ships inside the public
// app's bundle (and vice versa). Always dark: it's a production tool, not a
// themed reader experience.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Discows Studio",
    template: "%s · Discows Studio",
  },
  robots: { index: false, follow: false },
}

export default function StudioRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  )
}
