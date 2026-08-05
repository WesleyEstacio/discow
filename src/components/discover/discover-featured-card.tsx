import Image from "next/image"
import { Disc3Icon, ExternalLinkIcon } from "lucide-react"
import { SurpriseMeButton } from "@/components/discover/surprise-me-button"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UNKNOWN_GENRE_LABEL, type CommunityRating, type DiscoverFilters, type DiscoverRollResult } from "@/lib/discover"
import { formatRating, formatReleaseYear } from "@/lib/format"
import type { AlbumSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

type DiscoverFeaturedCardProps = {
  album: AlbumSummary
  genreLabel: string | null
  communityRating: CommunityRating | null
  filters: DiscoverFilters
  excludeIds: string[]
  onRolled: (result: DiscoverRollResult) => void
  className?: string
}

export function DiscoverFeaturedCard({
  album,
  genreLabel,
  communityRating,
  filters,
  excludeIds,
  onRolled,
  className,
}: DiscoverFeaturedCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card p-5 text-card-foreground sm:flex-row sm:p-6",
        className
      )}
    >
      <div className="relative mx-auto aspect-square w-full max-w-52 shrink-0 overflow-hidden rounded-xl bg-muted sm:mx-0">
        {album.imageUrl ? (
          <Image
            src={album.imageUrl}
            alt={`${album.name} cover`}
            fill
            priority
            sizes="(max-width: 640px) 60vw, 208px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Disc3Icon className="size-12" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatReleaseYear(album.releaseDate)}</Badge>
          {genreLabel && genreLabel !== UNKNOWN_GENRE_LABEL ? (
            <Badge variant="secondary">{genreLabel}</Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {album.name}
          </h2>
          <p className="text-muted-foreground">{album.artists.join(", ")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StarRatingDisplay value={communityRating?.average ?? 0} size="sm" />
          <span className="text-sm text-muted-foreground">
            {communityRating && communityRating.count > 0
              ? `${formatRating(communityRating.average)} · ${communityRating.count} community rating${communityRating.count === 1 ? "" : "s"}`
              : "No community ratings yet"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="secondary"
            render={<a href={album.spotifyUrl} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            Open in Spotify
          </Button>
          <SurpriseMeButton filters={filters} excludeIds={excludeIds} onRolled={onRolled} />
        </div>
      </div>
    </div>
  )
}
