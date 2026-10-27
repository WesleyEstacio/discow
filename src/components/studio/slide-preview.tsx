import { SlideCanvas, type SlideCanvasAlbum } from "@/components/studio/slide-canvas"
import { SLIDE_HEIGHT, SLIDE_WIDTH, type StudioSlide } from "@/lib/studio/slides"
import { cn } from "@/lib/utils"

type SlidePreviewProps = {
  slide: StudioSlide
  albumsById: Record<string, SlideCanvasAlbum>
  slideNumber: number
  slideCount: number
  displayWidth: number
  className?: string
}

// The exact 1080×1350 canvas used for export, scaled down with a CSS
// transform so the preview matches the PNG layout pixel for pixel.
export function SlidePreview({ slide, albumsById, slideNumber, slideCount, displayWidth, className }: SlidePreviewProps) {
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
          slideNumber={slideNumber}
          slideCount={slideCount}
          fontFamily="var(--font-sans), sans-serif"
        />
      </div>
    </div>
  )
}
