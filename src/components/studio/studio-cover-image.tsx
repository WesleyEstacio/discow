import { Disc3Icon } from "lucide-react"
import { cn } from "@/lib/utils"

type StudioCoverImageProps = {
  coverImageUrl: string | null
  albumTitle: string
  className?: string
}

// Plain <img> on purpose: covers come from several hosts (Spotify, Cover
// Art Archive, admin-provided links) and are shown whole, never cropped or
// re-encoded, matching how the exported slides render them.
export function StudioCoverImage({ coverImageUrl, albumTitle, className }: StudioCoverImageProps) {
  if (!coverImageUrl) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center rounded-md bg-muted text-muted-foreground",
          className
        )}
        role="img"
        aria-label={`${albumTitle} sem capa`}
      >
        <Disc3Icon className="size-1/3" aria-hidden="true" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- see comment above
    <img
      src={coverImageUrl}
      alt={`Capa de ${albumTitle}`}
      loading="lazy"
      className={cn("aspect-square rounded-md bg-muted object-contain", className)}
    />
  )
}
