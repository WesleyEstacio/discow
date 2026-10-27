import { createEmptySlide, MAX_ALBUMS_PER_GRID_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  chunkAlbums,
  describeAlbumLine,
  editorPlaceholder,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

const COPY = {
  pt: {
    coverKicker: "Color Me Discows",
    coverBody: "Álbuns para ouvir com os olhos.",
    ctaKicker: "Salve esta paleta",
    defaultCtaHeadline: "Qual capa dessa cor ficou de fora?",
    ctaBody: "Conte nos comentários.",
    captionOpening: (colorName: string) => `Color Me Discows: ${colorName}.`,
    captionWhy: "Escreva aqui o que essa cor diz sobre esses discos",
    captionQuestion: "Qual capa dessa cor você colocaria aqui?",
  },
  en: {
    coverKicker: "Color Me Discows",
    coverBody: "Records to listen to with your eyes.",
    ctaKicker: "Save this palette",
    defaultCtaHeadline: "Which cover in this color did we miss?",
    ctaBody: "Tell us in the comments.",
    captionOpening: (colorName: string) => `Color Me Discows: ${colorName}.`,
    captionWhy: "Write what this color says about these records",
    captionQuestion: "Which cover in this color would you add?",
  },
}

export const colorMeDiscowsTemplate: StudioTemplate = {
  key: "color-me-discows",
  name: "Color Me Discows",
  tagline: "Descoberta pela identidade visual das capas.",
  objective: "Descobrir álbuns por meio de sua identidade visual.",
  slideStructure: [
    "Capa destacando a cor escolhida",
    "Grade editorial com as capas dessa cor",
    "Recomendações adicionais (opcional)",
    "Chamada final para salvar ou descobrir",
  ],
  isAvailable: true,
  albumSlots: [
    {
      key: "albums",
      label: "Capas aprovadas",
      description: "Ordenadas pela proximidade com a cor escolhida. Você aprova cada capa manualmente.",
      minAlbums: 2,
      maxAlbums: 12,
      sortByColorSetting: "colorHex",
    },
  ],
  settingFields: [
    {
      key: "colorHex",
      label: "Cor",
      kind: "color",
      required: true,
      defaultValue: "#c2268f",
    },
    {
      key: "colorName",
      label: "Nome da cor",
      kind: "text",
      required: true,
      placeholder: "Ex.: Rosa-choque",
    },
    ...COMMON_SETTING_FIELDS.filter((field) => field.key !== "theme"),
  ],
  buildCarousel({ albumsBySlot, settings, language }) {
    const copy = COPY[language]
    const approvedAlbums = albumsBySlot.albums ?? []
    const colorHex = HEX_COLOR_PATTERN.test(settings.colorHex ?? "") ? settings.colorHex! : "#c2268f"
    const colorName = settings.colorName?.trim() || colorHex
    if (approvedAlbums.length < 2) throw new Error("Aprove pelo menos duas capas.")

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: colorName,
        body: copy.coverBody,
        customBackgroundHex: colorHex,
      }),
      ...chunkAlbums(approvedAlbums, MAX_ALBUMS_PER_GRID_SLIDE).map((albumsOnSlide) =>
        createEmptySlide("album-grid", {
          kicker: colorName,
          albumIds: albumsOnSlide.map((album) => album.id),
          backgroundKey: "ink",
        })
      ),
      createEmptySlide("cta", {
        kicker: copy.ctaKicker,
        headline: settings.callToAction?.trim() || copy.defaultCtaHeadline,
        body: copy.ctaBody,
        customBackgroundHex: colorHex,
        textAlign: "center",
      }),
    ]

    const caption = [
      copy.captionOpening(colorName),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      approvedAlbums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      copy.captionQuestion,
      buildHashtags(approvedAlbums, language),
    ].join("\n\n")

    return { title: `Color Me Discows: ${colorName}`, slides, caption }
  },
}
