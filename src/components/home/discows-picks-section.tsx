import { Disc3Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Static placeholder until the recommendation engine behind "Discows picks"
// ships. No data fetching here on purpose.
const PLACEHOLDER_COLLECTIONS = [
  {
    title: "Essential Hip-Hop",
    description:
      "The definitive timeline of game-changing rap and hip-hop milestones.",
  },
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
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-xl font-medium">Discows picks</h2>
        <Badge variant="secondary">Coming soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Curated collections from our team, tailored to what you listen to.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="font-medium leading-tight">{collection.title}</p>
              <p className="text-sm text-muted-foreground">
                {collection.description}
              </p>
            </div>
            <Button size="sm" variant="outline" disabled className="w-fit">
              Explore list
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
