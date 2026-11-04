import { createEmptySlide, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  chunkAlbums,
  joinCaptionParagraphs,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const MAX_DUELS = 5

const COPY = {
  pt: {
    coverKicker: "Este ou aquele?",
    defaultCoverHeadline: "Só pode escolher um",
    coverBody: "Responda nos comentários: 1 ou 2 em cada duelo.",
    duelKicker: (duelNumber: number) => `Duelo ${duelNumber}`,
    duelHeadline: "Qual fica?",
    ctaKicker: "Placar",
    defaultCtaHeadline: "Mande suas escolhas nos comentários",
    ctaBody: "Ex.: 1, 2, 2, 1",
    captionOpening: "Este ou aquele? Só pode escolher um disco por duelo.",
    duelLine: (duelNumber: number, firstTitle: string, secondTitle: string) => `Duelo ${duelNumber}: ${firstTitle} ou ${secondTitle}`,
    captionQuestion: "Responda nos comentários com a sua sequência.",
  },
  en: {
    coverKicker: "This or that?",
    defaultCoverHeadline: "You can only pick one",
    coverBody: "Answer in the comments: 1 or 2 for each duel.",
    duelKicker: (duelNumber: number) => `Duel ${duelNumber}`,
    duelHeadline: "Which one stays?",
    ctaKicker: "Scoreboard",
    defaultCtaHeadline: "Drop your picks in the comments",
    ctaBody: "E.g. 1, 2, 2, 1",
    captionOpening: "This or that? You can only pick one record per duel.",
    duelLine: (duelNumber: number, firstTitle: string, secondTitle: string) => `Duel ${duelNumber}: ${firstTitle} or ${secondTitle}`,
    captionQuestion: "Answer in the comments with your picks.",
  },
}

export const thisOrThatTemplate: StudioTemplate = {
  key: "this-or-that",
  name: "Este ou Aquele",
  tagline: "Duelos entre dois discos para movimentar os comentários.",
  objective: "Colocar álbuns parecidos frente a frente e pedir que o público escolha um.",
  slideStructure: ["Capa com a regra do jogo", "Um duelo por slide, lado a lado", "Chamada para responder"],
  isAvailable: true,
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
  buildCarousel({ albumsBySlot, settings, language }) {
    const copy = COPY[language]
    const albums = albumsBySlot.albums ?? []
    if (albums.length < 2 || albums.length % 2 !== 0) {
      throw new Error("Escolha os álbuns em pares (2, 4, 6, 8 ou 10).")
    }

    const duels = chunkAlbums(albums, 2)
    const coverHeadline = settings.theme?.trim() || copy.defaultCoverHeadline

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: coverHeadline,
        body: copy.coverBody,
        albumIds: duels[0]!.map((album) => album.id),
        backgroundKey: "magenta",
      }),
      ...duels.map((duelAlbums, duelIndex) =>
        createEmptySlide("album-grid", {
          kicker: copy.duelKicker(duelIndex + 1),
          headline: copy.duelHeadline,
          albumIds: duelAlbums.map((album) => album.id),
          backgroundKey: duelIndex % 2 === 0 ? "ink" : "plum",
          textAlign: "center",
        })
      ),
      createEmptySlide("cta", {
        kicker: copy.ctaKicker,
        headline: settings.callToAction?.trim() || copy.defaultCtaHeadline,
        body: copy.ctaBody,
        backgroundKey: "magenta",
        textAlign: "center",
      }),
    ]

    const caption = joinCaptionParagraphs([
      copy.captionOpening,
      duels
        .map(([firstAlbum, secondAlbum], duelIndex) => copy.duelLine(duelIndex + 1, firstAlbum!.title, secondAlbum!.title))
        .join("\n"),
      copy.captionQuestion,
      buildHashtags(albums, language),
    ])

    return { title: `${copy.coverKicker} ${coverHeadline}`, slides, caption }
  },
}
