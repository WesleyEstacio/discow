import Link from "next/link"
import { cn } from "@/lib/utils"

type ArtistNamesProps = {
  names: string[]
  // Same order/length as `names`, when known (see AlbumSummary.artistIds in
  // src/lib/types.ts) - a name with no matching id just renders as plain
  // text instead of a link.
  artistIds?: string[]
  className?: string
  linkClassName?: string
}

// Comma-joined artist credits, each linked to /artist/[id] when its Spotify
// id is known - shared by every place an album/track's artist names show up
// (album page header + tracklist, AlbumCard, Discover).
export function ArtistNames({
  names,
  artistIds,
  className,
  linkClassName,
}: ArtistNamesProps) {
  return (
    <span className={className}>
      {names.map((name, index) => {
        const artistId = artistIds?.[index]
        return (
          <span key={artistId ?? `${name}-${index}`}>
            {index > 0 ? ", " : null}
            {artistId ? (
              <Link
                href={`/artist/${artistId}`}
                className={cn("hover:underline", linkClassName)}
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </span>
        )
      })}
    </span>
  )
}
