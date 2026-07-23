import type { Metadata } from "next"
import { DiscoverPanel } from "@/components/discover-panel"

export const metadata: Metadata = {
  title: "Discover",
}

export default function DiscoverPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Discover
        </h1>
        <p className="text-muted-foreground">
          Get album picks by genre, artist, or a surprise mix based on what you
          already love.
        </p>
      </div>
      <DiscoverPanel />
    </main>
  )
}
