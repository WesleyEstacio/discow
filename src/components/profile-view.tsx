import Link from "next/link"
import { Disc3Icon } from "lucide-react"
import { AlbumCard } from "@/components/album-card"
import { StarRating } from "@/components/star-rating"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRating } from "@/lib/format"
import type { Review } from "@/lib/types"

type ProfileUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

type ProfileViewProps = {
  user: ProfileUser
  reviews: Review[]
}

export function ProfileView({ user, reviews }: ProfileViewProps) {
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

  const displayName = user.name ?? user.email ?? "Discows listener"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar size="lg" className="size-16">
          {user.image ? (
            <AvatarImage src={user.image} alt={displayName} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {displayName}
            </h1>
          </div>
          {user.email ? (
            <p className="max-w-xl text-muted-foreground">{user.email}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{reviews.length}</strong>{" "}
              albums
            </span>
            <span>
              Avg rating{" "}
              <strong className="text-foreground">
                {reviews.length ? formatRating(average) : "—"}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {reviews.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Disc3Icon />
            </EmptyMedia>
            <EmptyTitle>Your catalog is empty</EmptyTitle>
            <EmptyDescription>
              Rate an album to start building your profile.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/search" />} nativeButton={false}>
              Search albums
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <TabsContent value="grid" className="pt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {reviews.map((review) => (
                <AlbumCard
                  key={review.spotifyId}
                  album={{
                    id: review.spotifyId,
                    name: review.albumName,
                    artists: review.artists,
                    releaseDate: review.releaseDate ?? review.listenedAt.slice(0, 4),
                    totalTracks: 0,
                    imageUrl: review.imageUrl,
                    spotifyUrl: `https://open.spotify.com/album/${review.spotifyId}`,
                  }}
                  rating={review.rating}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="list" className="pt-4">
            <ul className="flex flex-col divide-y rounded-xl border">
              {reviews.map((review) => (
                <li key={review.spotifyId}>
                  <Link
                    href={`/album/${review.spotifyId}`}
                    className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{review.albumName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {review.artists.join(", ")}
                      </p>
                      {review.text ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {review.text}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StarRating value={review.rating} size="sm" readOnly />
                      <span className="text-xs text-muted-foreground">
                        {formatRating(review.rating)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
