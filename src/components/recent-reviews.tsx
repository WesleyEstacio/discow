"use client"

import Link from "next/link"
import { AlbumCard } from "@/components/album-card"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useReviews } from "@/hooks/use-reviews"
import { Disc3Icon } from "lucide-react"

export function RecentReviews() {
  const { reviews } = useReviews()
  const recent = reviews.slice(0, 8)

  if (recent.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-medium">Your catalog</h2>
          <p className="text-sm text-muted-foreground">
            Reviews you save will show up here.
          </p>
        </div>
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Disc3Icon />
            </EmptyMedia>
            <EmptyTitle>No albums yet</EmptyTitle>
            <EmptyDescription>
              Search for an album and leave your first review.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/search" />} nativeButton={false}>
              Search albums
            </Button>
          </EmptyContent>
        </Empty>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-medium">Your catalog</h2>
          <p className="text-sm text-muted-foreground">
            Recently rated albums on this device.
          </p>
        </div>
        <Button render={<Link href="/profile" />} nativeButton={false} variant="outline" size="sm">
          View all
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {recent.map((review) => (
          <AlbumCard
            key={review.spotifyId}
            album={{
              id: review.spotifyId,
              name: review.albumName,
              artists: review.artists,
              releaseDate: review.listenedAt.slice(0, 4),
              totalTracks: 0,
              imageUrl: review.imageUrl,
              spotifyUrl: `https://open.spotify.com/album/${review.spotifyId}`,
            }}
            rating={review.rating}
          />
        ))}
      </div>
    </section>
  )
}
