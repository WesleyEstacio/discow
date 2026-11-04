import { albumsForEveryFeelingTemplate } from "@/lib/studio/templates/albums-for-every-feeling"
import { artistBehindTheArtistTemplate } from "@/lib/studio/templates/artist-behind-the-artist"
import { colorMeDiscowsTemplate } from "@/lib/studio/templates/color-me-discows"
import { discographyRankingTemplate } from "@/lib/studio/templates/discography-ranking"
import { ifYouLikeThisTemplate } from "@/lib/studio/templates/if-you-like-this"
import { thisOrThatTemplate } from "@/lib/studio/templates/this-or-that"
import type { PlannedStudioTemplate, StudioTemplate } from "@/lib/studio/templates/types"
import { unfairlyUnderratedTemplate } from "@/lib/studio/templates/unfairly-underrated"

// Adding a format = one new file exporting a StudioTemplate, registered here.
// The creation flow, editor, renderer and export all work from this list.
export const STUDIO_TEMPLATES: StudioTemplate[] = [
  ifYouLikeThisTemplate,
  colorMeDiscowsTemplate,
  albumsForEveryFeelingTemplate,
  discographyRankingTemplate,
  artistBehindTheArtistTemplate,
  unfairlyUnderratedTemplate,
  thisOrThatTemplate,
]

export const PLANNED_STUDIO_TEMPLATES: PlannedStudioTemplate[] = []

export function findStudioTemplate(templateKey: string): StudioTemplate | null {
  return STUDIO_TEMPLATES.find((template) => template.key === templateKey) ?? null
}

export function findTemplateName(templateKey: string): string {
  return (
    STUDIO_TEMPLATES.find((template) => template.key === templateKey)?.name ??
    PLANNED_STUDIO_TEMPLATES.find((template) => template.key === templateKey)?.name ??
    templateKey
  )
}
