import { createEmptySlide, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  describeAlbumLine,
  editorPlaceholder,
  primaryArtistName,
} from "@/lib/studio/templates/template-helpers"
import {
  COMMON_SETTING_FIELDS,
  type StudioTemplate,
  type TemplateAlbum,
  type TemplateAlbumSlot,
} from "@/lib/studio/templates/types"

const COPY = {
  pt: {
    coverKicker: "Se você gosta disto",
    defaultSinglePairCoverHeadline: (referenceArtist: string) => `Se você gosta de ${referenceArtist}, experimente estes discos`,
    defaultMultiplePairsCoverHeadline: (referenceArtists: string) => `Gosta de ${referenceArtists}? Experimente estes discos`,
    coverBody: "Uma ponte entre o que você já ouve e o que você ainda vai amar.",
    referenceKicker: "Se você gosta de",
    recommendationKicker: "Experimente",
    connectionKicker: "A conexão",
    connectionHeadline: "Por que combinam",
    ctaKicker: "Sua vez",
    defaultCtaHeadline: "Qual disco você colocaria nessa lista?",
    ctaBody: "Salve para ouvir depois.",
    or: "ou",
    captionOpening: "Do que você já ama para o que você ainda vai amar:",
    captionPair: (referenceTitle: string, referenceArtist: string) => `Se ${referenceTitle}, de ${referenceArtist}, vive no seu repeat:`,
    captionConnection: "Escreva aqui o que liga esses discos",
    captionQuestion: "Qual você ouviria primeiro?",
  },
  en: {
    coverKicker: "If you like this",
    defaultSinglePairCoverHeadline: (referenceArtist: string) => `If you like ${referenceArtist}, try these records`,
    defaultMultiplePairsCoverHeadline: (referenceArtists: string) => `Into ${referenceArtists}? Try these records`,
    coverBody: "A bridge between what you already play and what you're about to love.",
    referenceKicker: "If you like",
    recommendationKicker: "Try",
    connectionKicker: "The connection",
    connectionHeadline: "Why they fit",
    ctaKicker: "Your turn",
    defaultCtaHeadline: "Which record would you add to this list?",
    ctaBody: "Save it for later.",
    or: "or",
    captionOpening: "From what you already love to what you're about to love:",
    captionPair: (referenceTitle: string, referenceArtist: string) => `If ${referenceTitle} by ${referenceArtist} lives on repeat for you:`,
    captionConnection: "Write what connects these records",
    captionQuestion: "Which one would you play first?",
  },
}

// Each pair = 1 reference slide + 2 slides per recommendation. These limits
// keep the worst case (3 full pairs + cover + CTA) within MAX_SLIDES_PER_POST.
const RECOMMENDATION_PAIRS = [
  { referenceSlotKey: "reference", recommendationsSlotKey: "recommendations", maxRecommendations: 3 },
  { referenceSlotKey: "reference2", recommendationsSlotKey: "recommendations2", maxRecommendations: 2 },
  { referenceSlotKey: "reference3", recommendationsSlotKey: "recommendations3", maxRecommendations: 2 },
] as const

type RecommendationPair = {
  referenceAlbum: TemplateAlbum
  recommendedAlbums: TemplateAlbum[]
}

function buildPairSlots(): TemplateAlbumSlot[] {
  return RECOMMENDATION_PAIRS.flatMap((pair, pairIndex) => {
    const isFirstPair = pairIndex === 0
    const minAlbums = isFirstPair ? 1 : 0
    const group = {
      key: `pair-${pairIndex + 1}`,
      label: `Par ${pairIndex + 1}`,
      description: isFirstPair
        ? "O disco que o ouvinte já gosta e o que ele deveria ouvir a seguir."
        : "Opcional: outro gosto e o que recomendar para ele.",
    }
    return [
      {
        key: pair.referenceSlotKey,
        label: "Se você gosta de…",
        description: "O álbum de referência.",
        minAlbums,
        maxAlbums: 1,
        group,
      },
      {
        key: pair.recommendationsSlotKey,
        label: "…experimente",
        description: `Até ${pair.maxRecommendations}. Cada um ganha um slide de capa e um de conexão.`,
        minAlbums,
        maxAlbums: pair.maxRecommendations,
        group,
      },
    ]
  })
}

function readRecommendationPairs(albumsBySlot: Record<string, TemplateAlbum[]>): RecommendationPair[] {
  return RECOMMENDATION_PAIRS.flatMap((pair, pairIndex) => {
    const referenceAlbum = albumsBySlot[pair.referenceSlotKey]?.[0]
    const recommendedAlbums = albumsBySlot[pair.recommendationsSlotKey] ?? []
    if (!referenceAlbum && recommendedAlbums.length === 0) return []
    if (!referenceAlbum || recommendedAlbums.length === 0) {
      throw new Error(`O par ${pairIndex + 1} precisa de um álbum de referência e de pelo menos uma recomendação.`)
    }
    return [{ referenceAlbum, recommendedAlbums }]
  })
}

function joinWithOr(names: string[], orWord: string): string {
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} ${orWord} ${names.at(-1)}`
}

export const ifYouLikeThisTemplate: StudioTemplate = {
  key: "if-you-like-this",
  name: "Se Você Gosta Disto, Experimente Aquilo",
  tagline: "Recomendações a partir de um gosto que o ouvinte já tem.",
  objective: "Recomendar álbuns com base no gosto musical atual do ouvinte.",
  slideStructure: [
    "Capa com título marcante",
    "Para cada par: álbum de referência",
    "Para cada par: álbuns recomendados",
    "Conexão musical entre os discos",
    "Chamada final para descoberta",
  ],
  isAvailable: true,
  albumSlots: buildPairSlots(),
  settingFields: COMMON_SETTING_FIELDS,
  buildCarousel({ albumsBySlot, settings, language }) {
    const copy = COPY[language]
    const recommendationPairs = readRecommendationPairs(albumsBySlot)
    const firstPair = recommendationPairs[0]
    if (!firstPair) throw new Error("Escolha o álbum de referência e pelo menos uma recomendação.")

    const referenceArtists = [...new Set(recommendationPairs.map((pair) => primaryArtistName(pair.referenceAlbum)))]
    const defaultCoverHeadline =
      recommendationPairs.length === 1
        ? copy.defaultSinglePairCoverHeadline(referenceArtists[0] ?? "")
        : copy.defaultMultiplePairsCoverHeadline(joinWithOr(referenceArtists, copy.or))
    const coverHeadline = settings.theme?.trim() || defaultCoverHeadline

    const coverAlbumIds =
      recommendationPairs.length === 1
        ? [firstPair.referenceAlbum, ...firstPair.recommendedAlbums].slice(0, 3).map((album) => album.id)
        : recommendationPairs.map((pair) => pair.referenceAlbum.id).concat(firstPair.recommendedAlbums[0]!.id).slice(0, 4)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: coverHeadline,
        body: copy.coverBody,
        albumIds: coverAlbumIds,
        backgroundKey: "ink",
      }),
      ...recommendationPairs.flatMap(({ referenceAlbum, recommendedAlbums }) => [
        createEmptySlide("album", {
          kicker: copy.referenceKicker,
          albumIds: [referenceAlbum.id],
          body: referenceAlbum.editorialDescription,
          backgroundKey: "plum",
        }),
        ...recommendedAlbums.flatMap((recommendedAlbum) => [
          createEmptySlide("album", {
            kicker: copy.recommendationKicker,
            albumIds: [recommendedAlbum.id],
            body: recommendedAlbum.editorialDescription,
            backgroundKey: "ink",
          }),
          createEmptySlide("text", {
            kicker: copy.connectionKicker,
            headline: copy.connectionHeadline,
            body: "",
            backgroundKey: "paper",
          }),
        ]),
      ]),
      createEmptySlide("cta", {
        kicker: copy.ctaKicker,
        headline: settings.callToAction?.trim() || copy.defaultCtaHeadline,
        body: copy.ctaBody,
        backgroundKey: "magenta",
        textAlign: "center",
      }),
    ]

    const pairCaptionBlocks = recommendationPairs.map(({ referenceAlbum, recommendedAlbums }) =>
      [
        copy.captionPair(referenceAlbum.title, primaryArtistName(referenceAlbum)),
        ...recommendedAlbums.map((album) => `→ ${describeAlbumLine(album)}`),
      ].join("\n")
    )
    const allAlbums = recommendationPairs.flatMap((pair) => [pair.referenceAlbum, ...pair.recommendedAlbums])

    const caption = [
      ...(recommendationPairs.length > 1 ? [copy.captionOpening] : []),
      ...pairCaptionBlocks,
      editorPlaceholder(language, COPY.pt.captionConnection, COPY.en.captionConnection),
      settings.callToAction?.trim() || copy.captionQuestion,
      buildHashtags(allAlbums, language),
    ].join("\n\n")

    return { title: coverHeadline, slides, caption }
  },
}
