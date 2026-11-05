import { createEmptySlide, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  chunkAlbums,
  createVariantPicker,
  joinCaptionParagraphs,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const MAX_DUELS = 5

const COPY = {
  pt: {
    coverKicker: ["Este ou aquele?", "Duelo de discos", "Escolha difícil"],
    defaultCoverHeadline: ["Só pode escolher um", "Um fica, o outro sai", "Você não vai gostar de escolher"],
    coverBody: [
      "Responda nos comentários: 1 ou 2 em cada duelo.",
      "Anote suas respostas e mande a sequência nos comentários.",
      "Sem empate. Sem desculpa.",
    ],
    duelKicker: [
      (duelNumber: number) => `Duelo ${duelNumber}`,
      (duelNumber: number) => `Rodada ${duelNumber}`,
      (duelNumber: number) => `Round ${duelNumber}`,
    ],
    duelHeadline: ["Qual fica?", "1 ou 2?", "Escolha um"],
    ctaKicker: ["Placar", "Resultado", "Fim de jogo"],
    defaultCtaHeadline: ["Mande suas escolhas nos comentários", "Qual foi a sua sequência?", "Conta o seu placar"],
    ctaBody: ["Ex.: 1, 2, 2, 1", "Ex.: 2, 1, 1, 2", "Marque quem sempre escolhe errado."],
    captionOpening: [
      "Este ou aquele? Só pode escolher um disco por duelo.",
      "Duelo de discos: um fica, o outro sai.",
      "Prepare-se para escolhas difíceis.",
    ],
    duelLine: (duelNumber: number, firstTitle: string, secondTitle: string) => `Duelo ${duelNumber}: ${firstTitle} ou ${secondTitle}`,
    captionQuestion: [
      "Responda nos comentários com a sua sequência.",
      "Mande seus números nos comentários.",
      "Qual duelo foi o mais difícil?",
    ],
  },
  en: {
    coverKicker: ["This or that?", "Record duel", "Tough call"],
    defaultCoverHeadline: ["You can only pick one", "One stays, one goes", "You won't like choosing"],
    coverBody: [
      "Answer in the comments: 1 or 2 for each duel.",
      "Write down your answers and drop the sequence in the comments.",
      "No ties. No excuses.",
    ],
    duelKicker: [
      (duelNumber: number) => `Duel ${duelNumber}`,
      (duelNumber: number) => `Round ${duelNumber}`,
      (duelNumber: number) => `Match ${duelNumber}`,
    ],
    duelHeadline: ["Which one stays?", "1 or 2?", "Pick one"],
    ctaKicker: ["Scoreboard", "Results", "Game over"],
    defaultCtaHeadline: ["Drop your picks in the comments", "What was your sequence?", "Share your score"],
    ctaBody: ["E.g. 1, 2, 2, 1", "E.g. 2, 1, 1, 2", "Tag the friend who always picks wrong."],
    captionOpening: [
      "This or that? You can only pick one record per duel.",
      "Record duel: one stays, one goes.",
      "Get ready for some tough calls.",
    ],
    duelLine: (duelNumber: number, firstTitle: string, secondTitle: string) => `Duel ${duelNumber}: ${firstTitle} or ${secondTitle}`,
    captionQuestion: [
      "Answer in the comments with your picks.",
      "Drop your numbers in the comments.",
      "Which duel was the hardest?",
    ],
  },
} as const

export const thisOrThatTemplate: StudioTemplate = {
  key: "this-or-that",
  name: "Este ou Aquele",
  tagline: "Duelos entre dois discos para movimentar os comentários.",
  objective: "Colocar álbuns parecidos frente a frente e pedir que o público escolha um.",
  slideStructure: ["Capa com a regra do jogo", "Um duelo por slide, lado a lado", "Chamada para responder"],
  isAvailable: true,
  defaultIdentityKey: "pop",
  albumSlots: [
    {
      key: "albums",
      label: "Álbuns em pares",
      description: "Marque em pares: o 1º contra o 2º, o 3º contra o 4º, e assim por diante (até 5 duelos).",
      minAlbums: 2,
      maxAlbums: MAX_DUELS * 2,
      isOrdered: true,
    },
  ],
  settingFields: COMMON_SETTING_FIELDS,
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const albums = albumsBySlot.albums ?? []
    if (albums.length < 2 || albums.length % 2 !== 0) {
      throw new Error("Escolha os álbuns em pares (2, 4, 6, 8 ou 10).")
    }

    const duels = chunkAlbums(albums, 2)
    const coverKicker = pick(copy.coverKicker)
    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)
    const duelKicker = pick(copy.duelKicker)
    const duelHeadline = pick(copy.duelHeadline)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: coverKicker,
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: duels[0]!.map((album) => album.id),
      }),
      ...duels.map((duelAlbums, duelIndex) =>
        createEmptySlide("album-grid", {
          kicker: duelKicker(duelIndex + 1),
          headline: duelHeadline,
          albumIds: duelAlbums.map((album) => album.id),
        })
      ),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening),
      duels
        .map(([firstAlbum, secondAlbum], duelIndex) => copy.duelLine(duelIndex + 1, firstAlbum!.title, secondAlbum!.title))
        .join("\n"),
      pick(copy.captionQuestion),
      buildHashtags(albums, language),
    ])

    return { title: `${coverKicker} ${coverHeadline}`, slides, caption }
  },
}
