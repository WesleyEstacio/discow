import { colorMeDiscowsTemplate } from "@/lib/studio/templates/color-me-discows"
import { ifYouLikeThisTemplate } from "@/lib/studio/templates/if-you-like-this"
import type { PlannedStudioTemplate, StudioTemplate } from "@/lib/studio/templates/types"

// Adding a format = one new file exporting a StudioTemplate, registered here.
// The creation flow, editor, renderer and export all work from this list.
export const STUDIO_TEMPLATES: StudioTemplate[] = [ifYouLikeThisTemplate, colorMeDiscowsTemplate]

export const PLANNED_STUDIO_TEMPLATES: PlannedStudioTemplate[] = [
  {
    key: "albums-for-every-feeling",
    name: "Álbuns para Cada Sentimento",
    tagline: "Discos para um momento ou situação.",
    objective: "Recomendar álbuns com base em um sentimento, momento ou situação.",
    slideStructure: ["Título com apelo emocional", "Álbuns com descrições curtas", "Chamada final"],
    isAvailable: false,
  },
  {
    key: "discography-ranking",
    name: "O Ranking da Discografia",
    tagline: "A discografia de um artista em ordem.",
    objective: "Organizar os álbuns de um artista em um ranking editorial, editável manualmente.",
    slideStructure: ["Artista e título do ranking", "Álbuns em ordem", "Comentários curtos", "Convite para opinar"],
    isAvailable: false,
  },
  {
    key: "artist-behind-the-artist",
    name: "O Artista por Trás do Artista",
    tagline: "Influências e conexões entre artistas.",
    objective: "Explorar influências com fontes confiáveis; alegações sem fonte ficam sinalizadas.",
    slideStructure: ["Artista principal", "Uma influência por slide", "A conexão", "Convite para explorar"],
    isAvailable: false,
  },
  {
    key: "unfairly-underrated",
    name: "Injustamente Subestimados",
    tagline: "Discos que merecem mais atenção — como opinião editorial.",
    objective: "Destacar álbuns que merecem mais reconhecimento, sem tratar 'subestimado' como estatística.",
    slideStructure: ["Título marcante", "Capa, artista e título", "Por que merece atenção", "Convite para ouvir"],
    isAvailable: false,
  },
]

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
