import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { auth } from "@/auth"
import { AppHeader, type AppHeaderUser } from "@/components/app-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { baseMetadata } from "@/lib/seo"
import "../globals.css"

// This is its own root layout, independent from app/(marketing)/layout.tsx -
// see the "Root Layout" section of
// https://nextjs.org/docs/app/api-reference/file-conventions/layout. Every
// route in this group is authenticated-or-public app UI, so the session
// lookup, account menu, and toast system only ever ship to these routes,
// never to the landing page.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = baseMetadata

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Not awaited: the header shell renders immediately and only the
  // account-specific slot inside it suspends on the session lookup.
  const userPromise: Promise<AppHeaderUser | null> = auth().then(
    (session) => session?.user ?? null
  )

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
          <Toaster>
            <div className="flex min-h-full flex-col">
              <AppHeader userPromise={userPromise} />
              <div className="flex-1">{children}</div>
            </div>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
