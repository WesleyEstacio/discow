import { albumsForEveryFeelingTemplate } from "@/lib/studio/templates/albums-for-every-feeling"
import { ifYouLikeThisTemplate } from "@/lib/studio/templates/if-you-like-this"
import { thisOrThatTemplate } from "@/lib/studio/templates/this-or-that"
import type { PlannedStudioTemplate, StudioTemplate } from "@/lib/studio/templates/types"

// Adding a format = one new file exporting a StudioTemplate, registered here.
// The creation flow, editor, renderer and export all work from this list.
export const STUDIO_TEMPLATES: StudioTemplate[] = [
  ifYouLikeThisTemplate,
  albumsForEveryFeelingTemplate,
  thisOrThatTemplate,
]

export const PLANNED_STUDIO_TEMPLATES: PlannedStudioTemplate[] = []

export function findStudioTemplate(templateKey: string): StudioTemplate | null {
  return STUDIO_TEMPLATES.find((template) => template.key === templateKey) ?? null
}

// Formats taken out of the creation flow; posts made with them still list by name.
const RETIRED_TEMPLATE_NAMES: Record<string, string> = {
  "a-closer-listen": "A Closer Listen",
  "artist-behind-the-artist": "O Artista por Trás do Artista",
  "artist-starter-pack": "The Artist Starter Pack",
  "beyond-the-hit": "Beyond the Hit",
  "color-me-discows": "Color Me Discows",
  "community-picks": "Discow Community Picks",
  "discography-ranking": "O Ranking da Discografia",
  "fresh-on-rotation": "Fresh on Rotation",
  "unfairly-underrated": "Injustamente Subestimados",
}

export function findTemplateName(templateKey: string): string {
  return (
    STUDIO_TEMPLATES.find((template) => template.key === templateKey)?.name ??
    PLANNED_STUDIO_TEMPLATES.find((template) => template.key === templateKey)?.name ??
    RETIRED_TEMPLATE_NAMES[templateKey] ??
    templateKey
  )
}
