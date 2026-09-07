import Image from "next/image"
import Link from "next/link"
import { UserRoundIcon } from "lucide-react"
import type { ArtistSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

type ArtistCardProps = {
  artist: ArtistSummary
  className?: string
}

// Circular tile for an artist - used by the related-artists section on the
// artist page. Mirrors AlbumCard's structure (src/components/album-card.tsx)
// but round instead of square, matching Spotify's own artist tiles.
export function ArtistCard({ artist, className }: ArtistCardProps) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-xl p-2 text-center outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-full bg-muted">
        {artist.imageUrl ? (
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            fill
            sizes="(max-width: 640px) 33vw, 160px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <UserRoundIcon className="size-8" />
          </div>
        )}
      </div>
      <p className="w-full truncate text-sm font-medium leading-tight">
        {artist.name}
      </p>
    </Link>
  )
}
