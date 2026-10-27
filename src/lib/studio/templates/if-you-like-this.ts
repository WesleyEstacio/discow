import { createEmptySlide, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  describeAlbumLine,
  editorPlaceholder,
  primaryArtistName,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const COPY = {
  pt: {
    coverKicker: "Se você gosta disto",
    defaultCoverHeadline: (referenceArtist: string) => `Se você gosta de ${referenceArtist}, experimente estes discos`,
    coverBody: "Uma ponte entre o que você já ouve e o que você ainda vai amar.",
    referenceKicker: "Se você gosta de",
    recommendationKicker: "Experimente",
    connectionKicker: "A conexão",
    connectionHeadline: "Por que combinam",
    ctaKicker: "Sua vez",
    defaultCtaHeadline: "Qual disco você colocaria nessa lista?",
    ctaBody: "Salve para ouvir depois.",
    captionOpening: (referenceTitle: string, referenceArtist: string, count: number) =>
      `Se ${referenceTitle}, de ${referenceArtist}, vive no seu repeat, ${count === 1 ? "este disco merece" : "estes discos merecem"} um lugar na sua próxima audição:`,
    captionConnection: "Escreva aqui o que liga esses discos",
    captionQuestion: "Qual você ouviria primeiro?",
  },
  en: {
    coverKicker: "If you like this",
    defaultCoverHeadline: (referenceArtist: string) => `If you like ${referenceArtist}, try these records`,
    coverBody: "A bridge between what you already play and what you're about to love.",
    referenceKicker: "If you like",
    recommendationKicker: "Try",
    connectionKicker: "The connection",
    connectionHeadline: "Why they fit",
    ctaKicker: "Your turn",
    defaultCtaHeadline: "Which record would you add to this list?",
    ctaBody: "Save it for later.",
    captionOpening: (referenceTitle: string, referenceArtist: string, count: number) =>
      `If ${referenceTitle} by ${referenceArtist} lives on repeat for you, ${count === 1 ? "this record deserves" : "these records deserve"} a spot in your next listen:`,
    captionConnection: "Write what connects these records",
    captionQuestion: "Which one would you play first?",
  },
}

export const ifYouLikeThisTemplate: StudioTemplate = {
  key: "if-you-like-this",
  name: "Se Você Gosta Disto, Experimente Aquilo",
  tagline: "Recomendações a partir de um gosto que o ouvinte já tem.",
  objective: "Recomendar álbuns com base no gosto musical atual do ouvinte.",
  slideStructure: [
    "Capa com título marcante",
    "Álbum de referência",
    "Álbum recomendado",
    "Conexão musical entre os dois",
    "Recomendações adicionais (opcional)",
    "Chamada final para descoberta",
  ],
  isAvailable: true,
  albumSlots: [
    {
      key: "reference",
      label: "Álbum de referência",
      description: "O disco que o ouvinte já conhece e gosta.",
      minAlbums: 1,
      maxAlbums: 1,
    },
    {
      key: "recommendations",
      label: "Recomendações",
      description: "De 1 a 4 álbuns para experimentar. Cada um ganha um slide de conexão.",
      minAlbums: 1,
      maxAlbums: 4,
    },
  ],
  settingFields: COMMON_SETTING_FIELDS,
  buildCarousel({ albumsBySlot, settings, language }) {
    const copy = COPY[language]
    const referenceAlbum = albumsBySlot.reference?.[0]
    const recommendedAlbums = albumsBySlot.recommendations ?? []
    if (!referenceAlbum || recommendedAlbums.length === 0) {
      throw new Error("Escolha o álbum de referência e pelo menos uma recomendação.")
    }

    const referenceArtist = primaryArtistName(referenceAlbum)
    const coverHeadline = settings.theme?.trim() || copy.defaultCoverHeadline(referenceArtist)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: coverHeadline,
        body: copy.coverBody,
        backgroundKey: "ink",
      }),
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
      createEmptySlide("cta", {
        kicker: copy.ctaKicker,
        headline: settings.callToAction?.trim() || copy.defaultCtaHeadline,
        body: copy.ctaBody,
        backgroundKey: "magenta",
        textAlign: "center",
      }),
    ]

    const caption = [
      copy.captionOpening(referenceAlbum.title, referenceArtist, recommendedAlbums.length),
      recommendedAlbums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      editorPlaceholder(language, COPY.pt.captionConnection, COPY.en.captionConnection),
      settings.callToAction?.trim() || copy.captionQuestion,
      buildHashtags([referenceAlbum, ...recommendedAlbums], language),
    ].join("\n\n")

    return { title: coverHeadline, slides, caption }
  },
}
