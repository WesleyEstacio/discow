import { SlideCanvas, type SlideCanvasAlbum } from "@/components/studio/slide-canvas"
import { buildHighlightTypography, type HighlightFontKey } from "@/lib/studio/highlight-fonts"
import { SLIDE_HEIGHT, SLIDE_WIDTH, studioImageUrl, type StudioSlide } from "@/lib/studio/slides"
import { cn } from "@/lib/utils"

type SlidePreviewProps = {
  slide: StudioSlide
  albumsById: Record<string, SlideCanvasAlbum>
  carouselAlbumIds: string[]
  slideNumber: number
  slideCount: number
  displayWidth: number
  highlightFontKey: HighlightFontKey
  className?: string
}

// The exact 1080×1350 canvas used for export, scaled down with a CSS
// transform so the preview matches the PNG layout pixel for pixel.
export function SlidePreview({ slide, albumsById, carouselAlbumIds, slideNumber, slideCount, displayWidth, highlightFontKey, className }: SlidePreviewProps) {
  const scale = displayWidth / SLIDE_WIDTH

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden", className)}
      style={{ width: displayWidth, height: SLIDE_HEIGHT * scale }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}>
        <SlideCanvas
          slide={slide}
          albumsById={albumsById}
          carouselAlbumIds={carouselAlbumIds}
          slideNumber={slideNumber}
          slideCount={slideCount}
          fontFamily="var(--font-sans), sans-serif"
          highlightTypography={buildHighlightTypography(highlightFontKey, "preview")}
          backgroundImageSrc={slide.backgroundImage ? studioImageUrl(slide.backgroundImage.imageId) : null}
          blurredCoversSrc={null}
          backgroundEffectsMode="css"
        />
      </div>
    </div>
  )
}
