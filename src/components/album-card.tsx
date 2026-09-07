import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { Disc3Icon } from "lucide-react"
import { ArtistNames } from "@/components/artist-names"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { Badge } from "@/components/ui/badge"
import { formatRating, formatReleaseYear, formatTrackCount } from "@/lib/format"
import type { AlbumSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

type AlbumCardProps = {
  album: AlbumSummary
  rating?: number | null
  className?: string
  // "year-and-tracks" shows both badges at once (e.g. the artist page's
  // Albums grid, where track count meaningfully varies album to album) -
  // "year"/"tracks" show just the one that matters most (e.g. Singles & EPs,
  // where nearly every entry is 1-2 tracks and the year is the useful part).
  badge?: "year" | "tracks" | "year-and-tracks"
  // Rendered top-right, overlapping the cover art - e.g. a FavoriteButton
  // (src/components/favorite-button.tsx). Kept as a sibling of the cover
  // Link below rather than a child of it, so an interactive button never
  // ends up nested inside an anchor.
  favoriteButton?: ReactNode
}

export function AlbumCard({
  album,
  rating,
  className,
  badge = "year",
  favoriteButton,
}: AlbumCardProps) {
  return (
    <div className={cn("group relative flex flex-col gap-3", className)}>
      {favoriteButton ? (
        <div className="absolute top-2 right-2 z-10">{favoriteButton}</div>
      ) : null}
      {/* Cover art and title link to the album; the artist line below has
          its own per-artist links to /artist/[id] (see ArtistNames) - two
          separate anchors instead of one card-wide Link, since a Link can't
          nest inside another Link. */}
      <Link
        href={`/album/${album.id}`}
        className="relative aspect-square overflow-hidden rounded-xl bg-muted outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {album.imageUrl ? (
          <Image
            src={album.imageUrl}
            alt={`${album.name} cover`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Disc3Icon className="size-10" />
          </div>
        )}
      </Link>
      <div className="flex flex-col gap-1">
        <Link
          href={`/album/${album.id}`}
          className="truncate font-medium leading-tight outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {album.name}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          <ArtistNames
            names={album.artists}
            artistIds={album.artistIds}
            linkClassName="hover:text-foreground"
          />
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {badge === "year-and-tracks" ? (
            <>
              <Badge variant="secondary">{formatReleaseYear(album.releaseDate)}</Badge>
              <Badge variant="outline">{formatTrackCount(album.totalTracks)}</Badge>
            </>
          ) : (
            <Badge variant="secondary">
              {badge === "tracks"
                ? formatTrackCount(album.totalTracks)
                : formatReleaseYear(album.releaseDate)}
            </Badge>
          )}
          {typeof rating === "number" ? (
            <div className="flex items-center gap-1.5">
              <StarRatingDisplay value={rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {formatRating(rating)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
