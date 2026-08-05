import { Disc3Icon } from "lucide-react"
import { PicksCollectionDialog } from "@/components/home/picks-collection-dialog"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { PICKS_COLLECTIONS } from "@/lib/picks"
import { cn } from "@/lib/utils"

// Collections that don't have real data behind them yet - unlike the
// entries in PICKS_COLLECTIONS (src/lib/picks.ts), these render as inert
// "coming soon" cards instead of opening a dialog.
const PLACEHOLDER_COLLECTIONS = [
  {
    title: "Sunday Morning Jazz",
    description:
      "Slow-burning standards and modern jazz for a quiet start to the day.",
  },
  {
    title: "Bedroom Pop Essentials",
    description:
      "Lo-fi, intimate records from the genre's most inventive voices.",
  },
] as const

export function DiscowsPicksSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-medium">Discows picks</h2>
      <p className="text-sm text-muted-foreground">
        Curated collections from our team, tailored to what you listen to.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PICKS_COLLECTIONS.map((collection) => (
          <PicksCollectionDialog key={collection.id} collection={collection} />
        ))}

        {PLACEHOLDER_COLLECTIONS.map((collection) => (
          <div
            key={collection.title}
            aria-disabled
            className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground opacity-70"
          >
            <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Disc3Icon className="size-8" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="font-medium leading-tight">{collection.title}</p>
                <Badge variant="secondary">Soon</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {collection.description}
              </p>
            </div>
            <span
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "w-fit pointer-events-none opacity-50"
              )}
            >
              Explore list
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
