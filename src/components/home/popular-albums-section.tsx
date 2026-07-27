import { Suspense } from "react"
import { AlbumCard } from "@/components/album-card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getPopularAlbumsThisWeek } from "@/lib/home"

const POPULAR_ALBUMS_LIMIT = 6

// Same idea as NewReleasesSection: static header renders immediately,
// Suspense only wraps the part that has to wait on the database.
export function PopularAlbumsSection() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-medium">Popular this week</h2>
        <p className="text-sm text-muted-foreground">
          The most-reviewed albums among Discows listeners recently.
        </p>
      </div>
      <Suspense fallback={<PopularAlbumsGridSkeleton />}>
        <PopularAlbumsGrid />
      </Suspense>
    </section>
  )
}

async function PopularAlbumsGrid() {
  const popularAlbums = await getPopularAlbumsThisWeek(POPULAR_ALBUMS_LIMIT)

  if (popularAlbums.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No ratings yet</EmptyTitle>
          <EmptyDescription>
            Once listeners start rating albums, the most popular ones will
            show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {popularAlbums.map(({ album, averageRating }) => (
        <AlbumCard key={album.id} album={album} rating={averageRating} />
      ))}
    </div>
  )
}

export function PopularAlbumsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: POPULAR_ALBUMS_LIMIT }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
