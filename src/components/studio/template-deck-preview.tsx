import { SlidePreview } from "@/components/studio/slide-preview"
import type { TemplatePreview } from "@/lib/studio/template-previews"
import { cn } from "@/lib/utils"

const DECK_SLIDE_WIDTHS = [168, 148, 130]

const DECK_SLIDE_POSITIONS = [
  "z-30",
  "z-20 -ml-20 group-hover:translate-x-4",
  "z-10 -ml-20 group-hover:translate-x-8",
]

export function TemplateDeckPreview({ preview }: { preview: TemplatePreview | null }) {
  if (!preview) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-muted/40 px-6 text-center text-sm text-muted-foreground">
        Adicione álbuns com capa à biblioteca para ver a prévia deste formato.
      </div>
    )
  }

  return (
    <div aria-hidden="true" className="flex h-64 items-center justify-center overflow-hidden rounded-lg bg-muted/40">
      {preview.slides.map((slide, slideIndex) => (
        <div
          key={slide.id}
          className={cn(
            "relative overflow-hidden rounded-md shadow-xl shadow-black/40 ring-1 ring-white/10 transition-transform duration-300 ease-out motion-reduce:transition-none",
            DECK_SLIDE_POSITIONS[slideIndex]
          )}
        >
          <SlidePreview
            slide={slide}
            albumsById={preview.albumsById}
            carouselAlbumIds={preview.carouselAlbumIds}
            slideNumber={slideIndex + 1}
            slideCount={preview.slideCount}
            displayWidth={DECK_SLIDE_WIDTHS[slideIndex] ?? DECK_SLIDE_WIDTHS[0]!}
          />
        </div>
      ))}
    </div>
  )
}
