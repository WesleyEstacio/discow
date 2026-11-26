import { FileImageIcon } from "lucide-react"
import { SlidePreview } from "@/components/studio/slide-preview"
import type { PostCover } from "@/lib/studio/post-covers"
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/lib/studio/slides"
import { cn } from "@/lib/utils"

type PostCoverThumbnailProps = {
  cover: PostCover | undefined
  width: number
  className?: string
}

export function PostCoverThumbnail({ cover, width, className }: PostCoverThumbnailProps) {
  const frameClassName = cn("shrink-0 overflow-hidden rounded-md shadow-lg shadow-black/30 ring-1 ring-white/10", className)

  if (!cover) {
    return (
      <div
        aria-hidden="true"
        className={cn(frameClassName, "flex items-center justify-center bg-muted text-muted-foreground")}
        style={{ width, height: Math.round((width * SLIDE_HEIGHT) / SLIDE_WIDTH) }}
      >
        <FileImageIcon className="size-1/4" />
      </div>
    )
  }

  return (
    <div aria-hidden="true" className={frameClassName}>
      <SlidePreview
        slide={cover.slide}
        albumsById={cover.albumsById}
        carouselAlbumIds={cover.slide.albumIds}
        slideNumber={1}
        slideCount={cover.slideCount}
        displayWidth={width}
      />
    </div>
  )
}
