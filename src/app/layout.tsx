import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AppHeader } from "@/components/app-header"
import { Toaster } from "@/components/ui/toast"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Discow",
    template: "%s · Discow",
  },
  description: "Catalog albums, rate them, and write reviews.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Toaster>
          <div className="flex min-h-full flex-col">
            <AppHeader />
            <div className="flex-1">{children}</div>
          </div>
        </Toaster>
      </body>
    </html>
  )
}
