import { Suspense } from "react"
import { PicksCollectionDialog } from "@/components/home/picks-collection-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { getPicksCollections } from "@/lib/picks"

const PICKS_COLLECTIONS_COUNT = 2

// Same idea as NewReleasesSection/PopularAlbumsSection: the header renders
// immediately, only the grid below waits on getPicksCollections() (which now
// resolves each album's real Spotify artist id - see src/lib/picks.ts).
export function DiscowsPicksSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-medium">Discows picks</h2>
      <p className="text-sm text-muted-foreground">
        Curated collections from our team, tailored to what you listen to.
      </p>
      <Suspense fallback={<DiscowsPicksGridSkeleton />}>
        <DiscowsPicksGrid />
      </Suspense>
    </section>
  )
}

async function DiscowsPicksGrid() {
  const collections = await getPicksCollections()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <PicksCollectionDialog key={collection.id} collection={collection} />
      ))}
    </div>
  )
}

function DiscowsPicksGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: PICKS_COLLECTIONS_COUNT }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-xl border p-4">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  )
}
