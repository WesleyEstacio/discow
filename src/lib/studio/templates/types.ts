import type { StudioCoverSource } from "@/lib/db/schema"
import type { PostLanguage } from "@/lib/studio/post-status"
import type { StudioSlide } from "@/lib/studio/slides"
import type { VisualIdentityKey } from "@/lib/studio/visual-identities"

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
  isOrdered?: boolean
  group?: TemplateAlbumSlotGroup
}

// Slots that share a group are picked side by side. A group whose slots are
// all optional (minAlbums 0) stays hidden until the admin chooses to add it.
export type TemplateAlbumSlotGroup = {
  key: string
  label: string
  description?: string
}

export type TemplateSettingOption = {
  value: string
  label: string
}

export type TemplateSettingField = {
  key: string
  label: string
  description?: string
  appearsIn?: string
  kind: "text" | "textarea" | "color" | "select"
  options?: TemplateSettingOption[]
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
  // Picks which version of each text the post gets, so two posts of the
  // same format don't read the same.
  variantSeed: number
}

export type StudioTemplate = {
  key: string
  name: string
  tagline: string
  objective: string
  slideStructure: string[]
  isAvailable: true
  defaultIdentityKey: VisualIdentityKey
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
    label: "Título da capa (opcional)",
    appearsIn: "Slide 1 e título da publicação",
    description: "O texto grande do primeiro slide. Vazio = o formato cria um título com os álbuns escolhidos.",
    kind: "text",
    placeholder: "Ex.: Se você gosta de Clube da Esquina, ouça estes discos",
  },
  {
    key: "callToAction",
    label: "Pergunta final (opcional)",
    appearsIn: "Último slide e fim da legenda",
    description: "Convida o público a comentar ou salvar. Vazio = usa a pergunta padrão do formato.",
    kind: "text",
    placeholder: "Ex.: Qual desses você ouviria primeiro?",
  },
]
