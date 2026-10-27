import type { StudioCoverSource } from "@/lib/db/schema"
import type { PostLanguage } from "@/lib/studio/post-status"
import type { StudioSlide } from "@/lib/studio/slides"

// The album fields templates and slides are allowed to use. Everything here
// is verified metadata from the music library (or typed in by the admin) -
// templates must never invent album facts beyond these.
export type TemplateAlbum = {
  id: string
  title: string
  artistNames: string[]
  releaseYear: number | null
  coverImageUrl: string | null
  coverSource: StudioCoverSource | null
  dominantColorHex: string | null
  genres: string[]
  tags: string[]
  editorialDescription: string
}

export type TemplateAlbumSlot = {
  key: string
  label: string
  description: string
  minAlbums: number
  maxAlbums: number
  sortByColorSetting?: string
}

export type TemplateSettingField = {
  key: string
  label: string
  description?: string
  kind: "text" | "textarea" | "color"
  placeholder?: string
  required?: boolean
  defaultValue?: string
}

export type CarouselDraft = {
  title: string
  slides: StudioSlide[]
  caption: string
}

export type BuildCarouselInput = {
  albumsBySlot: Record<string, TemplateAlbum[]>
  settings: Record<string, string>
  language: PostLanguage
}

export type StudioTemplate = {
  key: string
  name: string
  tagline: string
  objective: string
  slideStructure: string[]
  isAvailable: true
  albumSlots: TemplateAlbumSlot[]
  settingFields: TemplateSettingField[]
  buildCarousel: (input: BuildCarouselInput) => CarouselDraft
}

export type PlannedStudioTemplate = {
  key: string
  name: string
  tagline: string
  objective: string
  slideStructure: string[]
  isAvailable: false
}

// Settings every template shares (step 3 of the creation flow).
export const COMMON_SETTING_FIELDS: TemplateSettingField[] = [
  {
    key: "theme",
    label: "Tema ou título de trabalho",
    kind: "text",
    placeholder: "Ex.: para quem cresceu ouvindo MPB",
  },
  {
    key: "audience",
    label: "Público-alvo",
    kind: "text",
    placeholder: "Ex.: quem está começando a ouvir jazz",
  },
  {
    key: "tone",
    label: "Tom editorial",
    kind: "text",
    placeholder: "Ex.: caloroso e direto",
  },
  {
    key: "callToAction",
    label: "Chamada para ação (opcional)",
    kind: "text",
    placeholder: "Ex.: Salve para ouvir no fim de semana",
  },
]
