import { Suspense } from "react"
import { AlbumCard } from "@/components/album-card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getNewReleases } from "@/lib/home"

const NEW_RELEASES_LIMIT = 6

// The header text never depends on data, so it renders immediately on the
// server. Only the grid below it needs to wait on Spotify, so that's the
// only part wrapped in Suspense.
export function NewReleasesSection() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-medium">New this week</h2>
        <p className="text-sm text-muted-foreground">
          Albums released in the last couple of weeks.
        </p>
      </div>
      <Suspense fallback={<NewReleasesGridSkeleton />}>
        <NewReleasesGrid />
      </Suspense>
    </section>
  )
}

async function NewReleasesGrid() {
  let albums: Awaited<ReturnType<typeof getNewReleases>> = []
  let errorMessage: string | null = null

  try {
    albums = await getNewReleases(NEW_RELEASES_LIMIT)
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load new releases"
  }

  if (errorMessage) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>New releases unavailable</EmptyTitle>
          <EmptyDescription>{errorMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (albums.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Nothing new yet</EmptyTitle>
          <EmptyDescription>
            Check back soon for fresh releases.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} badge="tracks" />
      ))}
    </div>
  )
}

export function NewReleasesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: NEW_RELEASES_LIMIT }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
