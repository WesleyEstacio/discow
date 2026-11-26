import type { SlideCanvasAlbum } from "@/components/studio/slide-canvas"
import type { StudioSlide } from "@/lib/studio/slides"
import type { StudioTemplate, TemplateAlbum, TemplateSettingField } from "@/lib/studio/templates/types"
import { applyVisualIdentity, findVisualIdentity, type VisualIdentity } from "@/lib/studio/visual-identities"

export type TemplatePreview = {
  slides: StudioSlide[]
  albumsById: Record<string, SlideCanvasAlbum>
  carouselAlbumIds: string[]
  slideCount: number
}

const PREVIEW_VARIANT_SEED = 7

function previewSettingValue(field: TemplateSettingField): string {
  if (field.defaultValue) return field.defaultValue
  if (field.required && field.placeholder) return field.placeholder.replace(/^Ex\.:\s*/, "")
  return ""
}

function fillSlotsWithSampleAlbums(template: StudioTemplate, sampleAlbums: TemplateAlbum[]): Record<string, TemplateAlbum[]> {
  let nextAlbumIndex = 0
  return Object.fromEntries(
    template.albumSlots.map((slot) => {
      const slotAlbums = sampleAlbums.slice(nextAlbumIndex, nextAlbumIndex + slot.minAlbums)
      nextAlbumIndex += slot.minAlbums
      return [slot.key, slotAlbums]
    })
  )
}

// Builds the format's real first slides from library albums, so the format
// picker shows what the carousel will look like instead of describing it.
export function buildTemplatePreview(
  template: StudioTemplate,
  sampleAlbums: TemplateAlbum[],
  visibleSlideCount: number,
  identityOverride?: VisualIdentity
): TemplatePreview | null {
  const identity = identityOverride ?? findVisualIdentity(template.defaultIdentityKey)
  const albumsBySlot = fillSlotsWithSampleAlbums(template, sampleAlbums)
  const hasEnoughAlbums = template.albumSlots.every((slot) => (albumsBySlot[slot.key]?.length ?? 0) >= slot.minAlbums)
  if (!identity || !hasEnoughAlbums) return null

  try {
    const carousel = template.buildCarousel({
      albumsBySlot,
      settings: Object.fromEntries(template.settingFields.map((field) => [field.key, previewSettingValue(field)])),
      language: "pt",
      variantSeed: PREVIEW_VARIANT_SEED,
    })
    const styledSlides = applyVisualIdentity(carousel.slides, identity, { keepCustomBackgrounds: true })
    const usedAlbums = Object.values(albumsBySlot).flat()
    return {
      slides: styledSlides.slice(0, visibleSlideCount),
      albumsById: Object.fromEntries(usedAlbums.map((album) => [album.id, album])),
      carouselAlbumIds: [...new Set(styledSlides.flatMap((slide) => slide.albumIds))],
      slideCount: styledSlides.length,
    }
  } catch {
    return null
  }
}
