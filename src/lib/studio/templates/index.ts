import { aCloserListenTemplate } from "@/lib/studio/templates/a-closer-listen"
import { albumsForEveryFeelingTemplate } from "@/lib/studio/templates/albums-for-every-feeling"
import { artistBehindTheArtistTemplate } from "@/lib/studio/templates/artist-behind-the-artist"
import { artistStarterPackTemplate } from "@/lib/studio/templates/artist-starter-pack"
import { beyondTheHitTemplate } from "@/lib/studio/templates/beyond-the-hit"
import { colorMeDiscowsTemplate } from "@/lib/studio/templates/color-me-discows"
import { communityPicksTemplate } from "@/lib/studio/templates/community-picks"
import { discographyRankingTemplate } from "@/lib/studio/templates/discography-ranking"
import { freshOnRotationTemplate } from "@/lib/studio/templates/fresh-on-rotation"
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
  artistStarterPackTemplate,
  beyondTheHitTemplate,
  aCloserListenTemplate,
  freshOnRotationTemplate,
  communityPicksTemplate,
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
