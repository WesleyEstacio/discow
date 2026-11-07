import { createEmptySlide, MAX_SLIDES_PER_POST, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  createVariantPicker,
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
    coverKicker: ["Se você gosta disto", "Próxima audição", "Do seu repeat para cá"],
    defaultSinglePairCoverHeadline: [
      (referenceArtist: string) => `Se você gosta de ${referenceArtist}, experimente estes discos`,
      (referenceArtist: string) => `Ouve ${referenceArtist} sem parar? Seu próximo vício está aqui`,
      (referenceArtist: string) => `Para quem tem ${referenceArtist} no repeat`,
    ],
    defaultMultiplePairsCoverHeadline: [
      (referenceArtists: string) => `Gosta de ${referenceArtists}? Experimente estes discos`,
      (referenceArtists: string) => `${referenceArtists}: o que ouvir depois`,
      (referenceArtists: string) => `Se ${referenceArtists} mora na sua playlist, continue por aqui`,
    ],
    coverBody: [
      "Uma ponte entre o que você já ouve e o que você ainda vai amar.",
      "Partimos do que você conhece para chegar no que você ainda não ouviu.",
      "Recomendações feitas no ouvido, não no algoritmo.",
    ],
    referenceKicker: ["Se você gosta de", "Você já ama", "Ponto de partida"],
    recommendationKicker: ["Experimente", "Ouça a seguir", "Próximo play"],
    connectionKicker: ["A conexão", "O fio que liga", "Por que funciona"],
    connectionHeadline: ["Por que combinam", "O que eles têm em comum", "Onde os dois se encontram"],
    ctaKicker: ["Sua vez", "Complete a lista", "E aí?"],
    defaultCtaHeadline: [
      "Qual disco você colocaria nessa lista?",
      "Que recomendação faltou aqui?",
      "Qual desses vai pro seu repeat?",
    ],
    ctaBody: ["Salve para ouvir depois.", "Salve e mande para quem precisa ouvir.", "Conta nos comentários."],
    or: "ou",
    captionOpening: [
      "Do que você já ama para o que você ainda vai amar:",
      "Algumas pontes entre discos que você conhece e outros que deveria conhecer:",
    ],
    captionPair: [
      (referenceTitle: string, referenceArtist: string) => `Se ${referenceTitle}, de ${referenceArtist}, vive no seu repeat:`,
      (referenceTitle: string, referenceArtist: string) => `Gosta de ${referenceTitle} (${referenceArtist})? Então ouça:`,
    ],
    captionConnection: "Escreva aqui o que liga esses discos",
    captionQuestion: ["Qual você ouviria primeiro?", "Qual dessas pontes você vai atravessar hoje?", "Já conhecia algum?"],
  },
  en: {
    coverKicker: ["If you like this", "Next listen", "From your repeat to here"],
    defaultSinglePairCoverHeadline: [
      (referenceArtist: string) => `If you like ${referenceArtist}, try these records`,
      (referenceArtist: string) => `Can't stop playing ${referenceArtist}? Your next obsession is here`,
      (referenceArtist: string) => `For everyone with ${referenceArtist} on repeat`,
    ],
    defaultMultiplePairsCoverHeadline: [
      (referenceArtists: string) => `Into ${referenceArtists}? Try these records`,
      (referenceArtists: string) => `${referenceArtists}: what to play next`,
      (referenceArtists: string) => `If ${referenceArtists} lives in your playlist, keep going here`,
    ],
    coverBody: [
      "A bridge between what you already play and what you're about to love.",
      "We start from what you know and land on what you haven't heard yet.",
      "Recommendations made by ear, not by algorithm.",
    ],
    referenceKicker: ["If you like", "You already love", "Starting point"],
    recommendationKicker: ["Try", "Play next", "Up next"],
    connectionKicker: ["The connection", "The common thread", "Why it works"],
    connectionHeadline: ["Why they fit", "What they share", "Where they meet"],
    ctaKicker: ["Your turn", "Finish the list", "So?"],
    defaultCtaHeadline: [
      "Which record would you add to this list?",
      "What recommendation did we miss?",
      "Which one is going on repeat?",
    ],
    ctaBody: ["Save it for later.", "Save it and send it to someone who needs it.", "Tell us in the comments."],
    or: "or",
    captionOpening: [
      "From what you already love to what you're about to love:",
      "A few bridges between records you know and records you should:",
    ],
    captionPair: [
      (referenceTitle: string, referenceArtist: string) => `If ${referenceTitle} by ${referenceArtist} lives on repeat for you:`,
      (referenceTitle: string, referenceArtist: string) => `Like ${referenceTitle} (${referenceArtist})? Then play:`,
    ],
    captionConnection: "Write what connects these records",
    captionQuestion: ["Which one would you play first?", "Which bridge are you crossing today?", "Did you know any of them?"],
  },
} as const

const RECOMMENDATION_PAIRS = [
  { referenceSlotKey: "reference", recommendationsSlotKey: "recommendations", maxRecommendations: 3 },
  { referenceSlotKey: "reference2", recommendationsSlotKey: "recommendations2", maxRecommendations: 2 },
  { referenceSlotKey: "reference3", recommendationsSlotKey: "recommendations3", maxRecommendations: 2 },
  { referenceSlotKey: "reference4", recommendationsSlotKey: "recommendations4", maxRecommendations: 2 },
  { referenceSlotKey: "reference5", recommendationsSlotKey: "recommendations5", maxRecommendations: 2 },
  { referenceSlotKey: "reference6", recommendationsSlotKey: "recommendations6", maxRecommendations: 2 },
] as const

const COVER_AND_CTA_SLIDE_COUNT = 2
const SLIDES_PER_RECOMMENDATION = 2

const PAIR_DISPLAY_SETTING_KEY = "pairDisplay"
const PAIR_DISPLAYS = ["separate-slides", "same-slide", "from-to"] as const
type PairDisplay = (typeof PAIR_DISPLAYS)[number]

const FROM_TO_WORDS = { from: "From", to: "To" } as const

function readPairDisplay(settings: Record<string, string>): PairDisplay {
  const requestedDisplay = settings[PAIR_DISPLAY_SETTING_KEY]
  return PAIR_DISPLAYS.find((pairDisplay) => pairDisplay === requestedDisplay) ?? "separate-slides"
}

function slidesPerReference(pairDisplay: PairDisplay): number {
  return pairDisplay === "separate-slides" ? 1 : 0
}

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
        description: `Até ${pair.maxRecommendations}. Cada um ganha um slide com as capas e um de conexão. O carrossel inteiro aceita até ${MAX_SLIDES_PER_POST} slides.`,
        minAlbums,
        maxAlbums: pair.maxRecommendations,
        group,
      },
    ]
  })
}

function countCarouselSlides(recommendationPairs: RecommendationPair[], pairDisplay: PairDisplay): number {
  return recommendationPairs.reduce(
    (slideCount, pair) =>
      slideCount + slidesPerReference(pairDisplay) + pair.recommendedAlbums.length * SLIDES_PER_RECOMMENDATION,
    COVER_AND_CTA_SLIDE_COUNT
  )
}

function readRecommendationPairs(albumsBySlot: Record<string, TemplateAlbum[]>, pairDisplay: PairDisplay): RecommendationPair[] {
  const recommendationPairs = RECOMMENDATION_PAIRS.flatMap((pair, pairIndex) => {
    const referenceAlbum = albumsBySlot[pair.referenceSlotKey]?.[0]
    const recommendedAlbums = albumsBySlot[pair.recommendationsSlotKey] ?? []
    if (!referenceAlbum && recommendedAlbums.length === 0) return []
    if (!referenceAlbum || recommendedAlbums.length === 0) {
      throw new Error(`O par ${pairIndex + 1} precisa de um álbum de referência e de pelo menos uma recomendação.`)
    }
    return [{ referenceAlbum, recommendedAlbums }]
  })

  const slideCount = countCarouselSlides(recommendationPairs, pairDisplay)
  if (slideCount > MAX_SLIDES_PER_POST) {
    const slideCostExplanation =
      pairDisplay !== "separate-slides"
        ? "Cada recomendação usa 2 slides (as capas juntas e a conexão)"
        : "Cada par usa 1 slide e cada recomendação usa mais 2"
    throw new Error(
      `Com essas escolhas o carrossel teria ${slideCount} slides, e o limite é ${MAX_SLIDES_PER_POST}. ${slideCostExplanation}: remova algumas recomendações.`
    )
  }
  return recommendationPairs
}

type PairSlideText = {
  referenceKicker: string
  recommendationKicker: string
  connectionKicker: string
  connectionHeadline: string
}

function buildConnectionSlide(text: PairSlideText): StudioSlide {
  return createEmptySlide("text", { kicker: text.connectionKicker, headline: text.connectionHeadline, body: "" })
}

function buildSameSlidePairSlides({ referenceAlbum, recommendedAlbums }: RecommendationPair, text: PairSlideText): StudioSlide[] {
  return recommendedAlbums.flatMap((recommendedAlbum) => [
    createEmptySlide("album-pair", {
      kicker: text.referenceKicker,
      headline: text.recommendationKicker,
      albumIds: [referenceAlbum.id, recommendedAlbum.id],
    }),
    buildConnectionSlide(text),
  ])
}

function buildFromToPairSlides({ referenceAlbum, recommendedAlbums }: RecommendationPair, text: PairSlideText): StudioSlide[] {
  return recommendedAlbums.flatMap((recommendedAlbum) => [
    createEmptySlide("album-pair", {
      kicker: FROM_TO_WORDS.from,
      headline: FROM_TO_WORDS.to,
      composition: "from-to",
      albumIds: [referenceAlbum.id, recommendedAlbum.id],
    }),
    buildConnectionSlide(text),
  ])
}

function buildPairSlides(pair: RecommendationPair, pairDisplay: PairDisplay, text: PairSlideText): StudioSlide[] {
  switch (pairDisplay) {
    case "separate-slides":
      return buildSeparatePairSlides(pair, text)
    case "same-slide":
      return buildSameSlidePairSlides(pair, text)
    case "from-to":
      return buildFromToPairSlides(pair, text)
  }
}

function buildSeparatePairSlides({ referenceAlbum, recommendedAlbums }: RecommendationPair, text: PairSlideText): StudioSlide[] {
  return [
    createEmptySlide("album", {
      kicker: text.referenceKicker,
      albumIds: [referenceAlbum.id],
      body: referenceAlbum.editorialDescription,
    }),
    ...recommendedAlbums.flatMap((recommendedAlbum) => [
      createEmptySlide("album", {
        kicker: text.recommendationKicker,
        albumIds: [recommendedAlbum.id],
        body: recommendedAlbum.editorialDescription,
      }),
      buildConnectionSlide(text),
    ]),
  ]
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
    "Para cada par: álbuns recomendados (ou os dois juntos no mesmo slide)",
    "Conexão musical entre os discos",
    "Chamada final para descoberta",
  ],
  isAvailable: true,
  defaultIdentityKey: "late-night",
  albumSlots: buildPairSlots(),
  settingFields: [
    {
      key: PAIR_DISPLAY_SETTING_KEY,
      label: "Como mostrar cada par",
      appearsIn: "Slides dos pares",
      description:
        "Juntos: as duas capas dividem o mesmo slide, em diagonal. From → To: cada capa ganha uma palavra gigante; o lado de cada uma pode ser invertido no slide.",
      kind: "select",
      defaultValue: "separate-slides",
      options: [
        { value: "separate-slides", label: "Um slide para cada álbum" },
        { value: "same-slide", label: "Referência e recomendação no mesmo slide" },
        { value: "from-to", label: "From → To, com as palavras em destaque" },
      ],
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const text = {
      coverKicker: pick(copy.coverKicker),
      singlePairCoverHeadline: pick(copy.defaultSinglePairCoverHeadline),
      multiplePairsCoverHeadline: pick(copy.defaultMultiplePairsCoverHeadline),
      coverBody: pick(copy.coverBody),
      referenceKicker: pick(copy.referenceKicker),
      recommendationKicker: pick(copy.recommendationKicker),
      connectionKicker: pick(copy.connectionKicker),
      connectionHeadline: pick(copy.connectionHeadline),
      ctaKicker: pick(copy.ctaKicker),
      ctaHeadline: pick(copy.defaultCtaHeadline),
      ctaBody: pick(copy.ctaBody),
      captionOpening: pick(copy.captionOpening),
      captionPair: pick(copy.captionPair),
      captionQuestion: pick(copy.captionQuestion),
    }
    const pairDisplay = readPairDisplay(settings)
    const recommendationPairs = readRecommendationPairs(albumsBySlot, pairDisplay)
    const firstPair = recommendationPairs[0]
    if (!firstPair) throw new Error("Escolha o álbum de referência e pelo menos uma recomendação.")

    const referenceArtists = [...new Set(recommendationPairs.map((pair) => primaryArtistName(pair.referenceAlbum)))]
    const defaultCoverHeadline =
      recommendationPairs.length === 1
        ? text.singlePairCoverHeadline(referenceArtists[0] ?? "")
        : text.multiplePairsCoverHeadline(joinWithOr(referenceArtists, copy.or))
    const coverHeadline = settings.theme?.trim() || defaultCoverHeadline

    const coverAlbumIds =
      recommendationPairs.length === 1
        ? [firstPair.referenceAlbum, ...firstPair.recommendedAlbums].slice(0, 3).map((album) => album.id)
        : recommendationPairs.map((pair) => pair.referenceAlbum.id).concat(firstPair.recommendedAlbums[0]!.id).slice(0, 4)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: text.coverKicker,
        headline: coverHeadline,
        body: text.coverBody,
        albumIds: coverAlbumIds,
      }),
      ...recommendationPairs.flatMap((pair) => buildPairSlides(pair, pairDisplay, text)),
      createEmptySlide("cta", {
        kicker: text.ctaKicker,
        headline: settings.callToAction?.trim() || text.ctaHeadline,
        body: text.ctaBody,
      }),
    ]

    const pairCaptionBlocks = recommendationPairs.map(({ referenceAlbum, recommendedAlbums }) =>
      [
        text.captionPair(referenceAlbum.title, primaryArtistName(referenceAlbum)),
        ...recommendedAlbums.map((album) => `→ ${describeAlbumLine(album)}`),
      ].join("\n")
    )
    const allAlbums = recommendationPairs.flatMap((pair) => [pair.referenceAlbum, ...pair.recommendedAlbums])

    const caption = [
      ...(recommendationPairs.length > 1 ? [text.captionOpening] : []),
      ...pairCaptionBlocks,
      editorPlaceholder(language, COPY.pt.captionConnection, COPY.en.captionConnection),
      settings.callToAction?.trim() || text.captionQuestion,
      buildHashtags(allAlbums, language),
    ].join("\n\n")

    return { title: coverHeadline, slides, caption }
  },
}
