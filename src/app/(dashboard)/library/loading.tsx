import { CommunityActivityListSkeleton } from "@/components/home/community-activity-section"
import { NewReleasesGridSkeleton } from "@/components/home/new-releases-section"
import { PopularAlbumsGridSkeleton } from "@/components/home/popular-albums-section"
import { Skeleton } from "@/components/ui/skeleton"

// Mirrors the real page shell: section headers are static text (no data
// dependency, so no skeleton needed for them), only the data-driven grids
// below each header get a skeleton while this route boundary is active.
export default function LibraryLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10">
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="flex w-full max-w-2xl flex-col items-center gap-2">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-sm" />
        </div>
        <Skeleton className="h-9 w-full max-w-xl" />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-medium">New this week</h2>
          <p className="text-sm text-muted-foreground">
            Albums released in the last couple of weeks.
          </p>
        </div>
        <NewReleasesGridSkeleton />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-medium">Popular this week</h2>
          <p className="text-sm text-muted-foreground">
            The most-reviewed albums among Discows listeners recently.
          </p>
        </div>
        <PopularAlbumsGridSkeleton />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-medium">Community activity</h2>
          <p className="text-sm text-muted-foreground">
            Recent reviews from Discows listeners.
          </p>
        </div>
        <CommunityActivityListSkeleton />
      </section>
    </main>
  )
}
