import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { Disc3Icon } from "lucide-react"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { Badge } from "@/components/ui/badge"
import { formatRating, formatReleaseYear, formatTrackCount } from "@/lib/format"
import type { AlbumSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

type AlbumCardProps = {
  album: AlbumSummary
  rating?: number | null
  className?: string
  badge?: "year" | "tracks"
  // Rendered top-right, overlapping the cover art - e.g. a FavoriteButton
  // (src/components/favorite-button.tsx). Kept as a sibling of the Link
  // below rather than a child of it, so an interactive button never ends up
  // nested inside the card's anchor.
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
    <div className={cn("group relative", className)}>
      {favoriteButton ? (
        <div className="absolute top-2 right-2 z-10">{favoriteButton}</div>
      ) : null}
      <Link
        href={`/album/${album.id}`}
        className="flex flex-col gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
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
        </div>
        <div className="flex flex-col gap-1">
          <p className="truncate font-medium leading-tight">{album.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {album.artists.join(", ")}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <Badge variant="secondary">
              {badge === "tracks"
                ? formatTrackCount(album.totalTracks)
                : formatReleaseYear(album.releaseDate)}
            </Badge>
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
      </Link>
    </div>
  )
}
