import { PicksCollectionDialog } from "@/components/home/picks-collection-dialog"
import { PICKS_COLLECTIONS } from "@/lib/picks"

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
      </div>
    </section>
  )
}
