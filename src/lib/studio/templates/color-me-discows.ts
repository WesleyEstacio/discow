import { createEmptySlide, MAX_ALBUMS_PER_GRID_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  chunkAlbums,
  createVariantPicker,
  describeAlbumLine,
  editorPlaceholder,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

const COPY = {
  pt: {
    coverKicker: "Color Me Discows",
    coverBody: ["Álbuns para ouvir com os olhos.", "Uma cor, vários sons.", "Quando a capa já diz como o disco soa."],
    gridHeadline: ["", "Em tons de", "Tudo em"],
    ctaKicker: ["Salve esta paleta", "Paleta completa", "Próxima cor?"],
    defaultCtaHeadline: [
      "Qual capa dessa cor ficou de fora?",
      "Que cor a gente pinta na próxima?",
      "Qual dessas capas você penduraria na parede?",
    ],
    ctaBody: ["Conte nos comentários.", "Sugira nos comentários.", "Salve para montar sua playlist colorida."],
    captionOpening: [
      (colorName: string) => `Color Me Discows: ${colorName}.`,
      (colorName: string) => `Hoje a paleta é ${colorName}.`,
      (colorName: string) => `${colorName}, em forma de disco.`,
    ],
    captionWhy: "Escreva aqui o que essa cor diz sobre esses discos",
    captionQuestion: [
      "Qual capa dessa cor você colocaria aqui?",
      "Qual dessas você conhecia só pela capa?",
      "Que cor vem na próxima?",
    ],
  },
  en: {
    coverKicker: "Color Me Discows",
    coverBody: ["Records to listen to with your eyes.", "One color, many sounds.", "When the cover already tells you how it sounds."],
    gridHeadline: ["", "Shades of", "All in"],
    ctaKicker: ["Save this palette", "Full palette", "Next color?"],
    defaultCtaHeadline: [
      "Which cover in this color did we miss?",
      "Which color should we paint next?",
      "Which of these covers would you hang on your wall?",
    ],
    ctaBody: ["Tell us in the comments.", "Suggest it in the comments.", "Save it to build your colorful playlist."],
    captionOpening: [
      (colorName: string) => `Color Me Discows: ${colorName}.`,
      (colorName: string) => `Today's palette: ${colorName}.`,
      (colorName: string) => `${colorName}, in record form.`,
    ],
    captionWhy: "Write what this color says about these records",
    captionQuestion: [
      "Which cover in this color would you add?",
      "Which of these did you only know by the cover?",
      "What color comes next?",
    ],
  },
} as const

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
  defaultIdentityKey: "minimal",
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
      appearsIn: "Ordena as capas na etapa 2 e pinta a capa e o último slide",
      kind: "color",
      required: true,
      defaultValue: "#c2268f",
    },
    {
      key: "colorName",
      label: "Nome da cor",
      appearsIn: "Título da capa, rótulo dos slides e legenda",
      kind: "text",
      required: true,
      placeholder: "Ex.: Rosa-choque",
    },
    ...COMMON_SETTING_FIELDS.filter((field) => field.key !== "theme"),
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const approvedAlbums = albumsBySlot.albums ?? []
    const colorHex = HEX_COLOR_PATTERN.test(settings.colorHex ?? "") ? settings.colorHex! : "#c2268f"
    const colorName = settings.colorName?.trim() || colorHex
    if (approvedAlbums.length < 2) throw new Error("Aprove pelo menos duas capas.")

    const gridHeadline = pick(copy.gridHeadline)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: colorName,
        body: pick(copy.coverBody),
        albumIds: approvedAlbums.slice(0, 3).map((album) => album.id),
        customBackgroundHex: colorHex,
      }),
      ...chunkAlbums(approvedAlbums, MAX_ALBUMS_PER_GRID_SLIDE).map((albumsOnSlide, chunkIndex) =>
        createEmptySlide("album-grid", {
          kicker: colorName,
          headline: chunkIndex === 0 && gridHeadline ? `${gridHeadline} ${colorName.toLowerCase()}` : "",
          albumIds: albumsOnSlide.map((album) => album.id),
        })
      ),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
        customBackgroundHex: colorHex,
      }),
    ]

    const caption = [
      pick(copy.captionOpening)(colorName),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      approvedAlbums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      pick(copy.captionQuestion),
      buildHashtags(approvedAlbums, language),
    ].join("\n\n")

    return { title: `Color Me Discows: ${colorName}`, slides, caption }
  },
}
