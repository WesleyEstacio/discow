import Image from "next/image"
import Link from "next/link"
import { Disc3Icon } from "lucide-react"
import { StarRating } from "@/components/star-rating"
import { Badge } from "@/components/ui/badge"
import { formatRating, formatReleaseYear } from "@/lib/format"
import type { AlbumSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

type AlbumCardProps = {
  album: AlbumSummary
  rating?: number | null
  className?: string
}

export function AlbumCard({ album, rating, className }: AlbumCardProps) {
  return (
    <Link
      href={`/album/${album.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
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
          <Badge variant="secondary">{formatReleaseYear(album.releaseDate)}</Badge>
          {typeof rating === "number" ? (
            <div className="flex items-center gap-1.5">
              <StarRating value={rating} size="sm" readOnly />
              <span className="text-xs text-muted-foreground">
                {formatRating(rating)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
