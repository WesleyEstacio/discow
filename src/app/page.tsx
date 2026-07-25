import Link from "next/link"
import { Plus_Jakarta_Sans } from "next/font/google"
import { LandingHeader } from "@/components/landing/header"
import { CoverFlow } from "@/components/landing/cover-flow"
import { LandingFooter } from "@/components/landing/footer"
import { LANDING_ALBUMS } from "@/components/landing/albums"
import { Disc3Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export default function HomePage() {
  return (
    <div
      className={`${plusJakartaSans.className} relative w-full h-dvh bg-background text-foreground flex flex-col overflow-hidden select-none`}
    >
      {/* Theme toggle: pinned to the top-right of the screen, independent of the header */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30">
        <ModeToggle />
      </div>

      {/* Header: logo + title + slogan, centered */}
      <div className="w-full shrink-0 pt-4 sm:pt-6 px-4 sm:px-8">
        <LandingHeader />
      </div>

      {/* Main: 3D Cover Flow Carousel, centered in the remaining space */}
      <main className="w-full flex-1 flex flex-col items-center justify-center gap-6 px-4 min-h-0">
        <CoverFlow albums={LANDING_ALBUMS} autoPlayInterval={3800} />
        <Button
          variant="outline"
          className="uppercase py-3 px-6 h-auto"
          render={<Link href="/library" />}
          nativeButton={false}
        >
          <Disc3Icon />
          Explore
        </Button>
      </main>

      {/* Footer: pinned to the bottom, takes only the space it needs — same container as header */}
      <div className="w-full shrink-0 px-4 sm:px-8">
        <LandingFooter />
      </div>
    </div>
  )
}
