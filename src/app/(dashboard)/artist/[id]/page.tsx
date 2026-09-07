import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import {
  ExternalLinkIcon,
  FlameIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react"
import { auth } from "@/auth"
import { AlbumCard } from "@/components/album-card"
import { ArtistCard } from "@/components/artist-card"
import { FavoriteArtistButton } from "@/components/favorite-artist-button"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { isFavoriteArtist } from "@/lib/favorite-artists"
import { formatCompactNumber, formatDuration, formatRating } from "@/lib/format"
import { getReviewsForUser } from "@/lib/reviews"
import {
  ARTIST_ALBUMS_LIMIT_MAX,
  getArtist,
  getArtistAlbums,
  getArtistTopTracks,
  getRelatedArtists,
} from "@/lib/spotify"
import type { ArtistDetail } from "@/lib/types"

type ArtistPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: ArtistPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const artist = await getArtist(id)
    const description = artist.genres.length
      ? `${artist.name} - ${artist.genres.join(", ")}. Rate their albums and explore their discography on Discows.`
      : `${artist.name} on Discows - rate their albums and explore their discography.`

    return {
      title: artist.name,
      description,
      alternates: { canonical: `/artist/${id}` },
      openGraph: {
        title: artist.name,
        description,
        images: artist.imageUrl ? [{ url: artist.imageUrl }] : undefined,
      },
    }
  } catch {
    return { title: "Artist" }
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params

  let artist: ArtistDetail

  try {
    artist = await getArtist(id)
  } catch {
    notFound()
  }

  // Each fetched independently and degrades to an empty list on failure
  // (rather than failing the whole page) since related-artists in
  // particular requires extended Spotify API access and 403s for most apps -
  // see the comment on getRelatedArtists() in src/lib/spotify.ts.
  const [albums, singles, topTracks, relatedArtists] = await Promise.all([
    getArtistAlbums(id, ARTIST_ALBUMS_LIMIT_MAX, "album").catch(() => []),
    getArtistAlbums(id, ARTIST_ALBUMS_LIMIT_MAX, "single").catch(() => []),
    getArtistTopTracks(id).catch(() => []),
    getRelatedArtists(id).catch(() => []),
  ])

  const hasNoCatalogData =
    albums.length === 0 && singles.length === 0 && topTracks.length === 0

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="grid gap-8 md:grid-cols-[240px_1fr] md:items-start">
        <div className="relative mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-full bg-muted md:mx-0">
          {artist.imageUrl ? (
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              priority
              sizes="240px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <UserRoundIcon className="size-12" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Artist</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {artist.name}
            </h1>
            {artist.followers > 0 ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UsersIcon className="size-3.5" />
                {formatCompactNumber(artist.followers)} followers
              </p>
            ) : null}
          </div>

          {artist.genres.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {artist.genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}

          {/* Spotify omits `followers`/`popularity` entirely for apps
              without extended API access (see the comment on
              SpotifyArtistDetailRaw in src/lib/spotify.ts) - getArtist()
              defaults a missing popularity to 0, which reads as "no data"
              here rather than a real score, so the meter just doesn't
              render instead of showing a misleading empty bar. */}
          {artist.popularity > 0 ? (
            <div className="flex max-w-xs flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <FlameIcon className="size-3.5" />
                  Popularity
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {artist.popularity}/100
                </span>
              </div>
              <Progress value={artist.popularity} aria-label="Popularity on Spotify" />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={
                <a href={artist.spotifyUrl} target="_blank" rel="noreferrer" />
              }
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Open in Spotify
            </Button>
            <Suspense fallback={null}>
              <FavoriteArtistButtonData artist={artist} />
            </Suspense>
          </div>
        </div>
      </section>

      {topTracks.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-medium">Popular tracks</h2>
          <Separator />
          <ol className="flex flex-col">
            {topTracks.map((track, index) => (
              <li
                key={track.id}
                className="flex items-center gap-3 border-b py-3 last:border-b-0"
              >
                <span className="w-6 shrink-0 text-sm text-muted-foreground">
                  {index + 1}
                </span>
                <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                  {track.imageUrl ? (
                    <Image
                      src={track.imageUrl}
                      alt={track.albumName}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{track.name}</p>
                  <Link
                    href={`/album/${track.albumId}`}
                    className="truncate text-sm text-muted-foreground hover:underline"
                  >
                    {track.albumName}
                  </Link>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatDuration(track.durationMs)}
                </span>
                <Button
                  render={
                    <a href={track.spotifyUrl} target="_blank" rel="noreferrer" />
                  }
                  nativeButton={false}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Open ${track.name} in Spotify`}
                >
                  <ExternalLinkIcon />
                </Button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {albums.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-medium">Albums</h2>
            {albums.length >= ARTIST_ALBUMS_LIMIT_MAX ? (
              <a
                href={`${artist.spotifyUrl}/discography/album`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                View full discography
              </a>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} badge="year-and-tracks" />
            ))}
          </div>
        </section>
      ) : null}

      {singles.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-medium">Singles &amp; EPs</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {singles.map((single) => (
              <AlbumCard key={single.id} album={single} badge="year" />
            ))}
          </div>
        </section>
      ) : null}

      {relatedArtists.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-medium">Fans also like</h2>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {relatedArtists.map((related) => (
              <ArtistCard key={related.id} artist={related} />
            ))}
          </div>
        </section>
      ) : null}

      <Suspense fallback={null}>
        <YourReviewsData artist={artist} />
      </Suspense>

      {hasNoCatalogData ? (
        <p className="text-sm text-muted-foreground">
          No catalog data is available for this artist right now.
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        <Link href="/library" className="underline-offset-4 hover:underline">
          Back to library
        </Link>
      </p>
    </main>
  )
}

// Isolated in its own Suspense boundary, same reasoning as
// AlbumFavoriteButtonData in the album page: the session lookup shouldn't
// hold back the `priority` cover image. Renders nothing for guests.
async function FavoriteArtistButtonData({ artist }: { artist: ArtistDetail }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const favorited = await isFavoriteArtist(session.user.id, artist.id)

  return (
    <FavoriteArtistButton
      artist={{
        spotifyId: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        genres: artist.genres,
      }}
      initialFavorited={favorited}
    />
  )
}

// Cross-references the signed-in listener's own reviews against this artist
// by name (reviews only ever store the artist's name, not their Spotify id -
// see ROADMAP.md's note on why the LOVER/discography-percentage feature
// needs a schema change first). Good enough for "did I review something by
// this artist", not reliable for an exact per-artist percentage.
async function YourReviewsData({ artist }: { artist: ArtistDetail }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const reviews = await getReviewsForUser(session.user.id)
  const artistNameLower = artist.name.toLowerCase()
  const matchingReviews = reviews.filter((review) =>
    review.artists.some((name) => name.toLowerCase() === artistNameLower)
  )

  if (matchingReviews.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-medium">
        Your reviews of {artist.name}
      </h2>
      <Separator />
      <ul className="flex flex-col divide-y rounded-xl border">
        {matchingReviews.map((review) => (
          <li key={review.spotifyId}>
            <Link
              href={`/album/${review.spotifyId}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{review.albumName}</p>
                {review.text ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {review.text}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <StarRatingDisplay value={review.rating} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formatRating(review.rating)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
