import { createEmptySlide, MAX_ALBUMS_PER_GRID_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  createVariantPicker,
  describeAlbumLine,
  editorPlaceholder,
  joinCaptionParagraphs,
  primaryArtistName,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const COPY = {
  pt: {
    coverKicker: ["O artista por trás do artista", "Árvore genealógica", "De onde vem esse som"],
    defaultCoverHeadline: [
      (artistName: string) => `Quem formou o som de ${artistName}`,
      (artistName: string) => `Antes de ${artistName}, vieram eles`,
      (artistName: string) => `Os discos que ${artistName} ouviu`,
    ],
    coverBody: [
      "As influências que aparecem nos discos — com fonte.",
      "Todo som vem de algum lugar. Este vem daqui.",
      "Siga o fio de volta até a origem.",
    ],
    mainKicker: ["O artista", "Ponto de chegada", "Quem a gente conhece"],
    influenceKicker: ["A influência", "Na estante dele", "Raiz"],
    quotePlaceholder: (mainArtistName: string, influenceName: string) =>
      `Cole aqui uma frase de ${mainArtistName} sobre ${influenceName}`,
    ctaKicker: ["Continue explorando", "Volte no tempo", "Ouça na ordem"],
    defaultCtaHeadline: [
      "Que influência você ouve nesse som?",
      "Quem mais deveria estar nessa árvore?",
      "Qual raiz você vai ouvir primeiro?",
    ],
    ctaBody: ["Salve para ouvir os discos na ordem.", "Salve e faça a viagem completa.", "Conta nos comentários."],
    captionOpening: [
      (artistName: string) => `Todo artista tem seus artistas. Os de ${artistName}:`,
      (artistName: string) => `Para entender ${artistName}, comece por aqui:`,
      (artistName: string) => `A estante de discos por trás de ${artistName}:`,
    ],
    captionSources: "Liste aqui as fontes (entrevistas, livros, documentários)",
    captionQuestion: [
      "Que outra influência você colocaria aqui?",
      "Já conhecia essas raízes?",
      "Quem a gente deveria investigar na próxima?",
    ],
  },
  en: {
    coverKicker: ["The artist behind the artist", "Family tree", "Where this sound comes from"],
    defaultCoverHeadline: [
      (artistName: string) => `Who shaped ${artistName}'s sound`,
      (artistName: string) => `Before ${artistName}, there were these`,
      (artistName: string) => `The records ${artistName} listened to`,
    ],
    coverBody: [
      "The influences you can hear on the records — with sources.",
      "Every sound comes from somewhere. This one comes from here.",
      "Follow the thread back to the source.",
    ],
    mainKicker: ["The artist", "Destination", "The one you know"],
    influenceKicker: ["The influence", "On their shelf", "Roots"],
    quotePlaceholder: (mainArtistName: string, influenceName: string) =>
      `Paste a quote from ${mainArtistName} about ${influenceName}`,
    ctaKicker: ["Keep exploring", "Go back in time", "Play them in order"],
    defaultCtaHeadline: [
      "What influence do you hear in this sound?",
      "Who else belongs in this family tree?",
      "Which root will you play first?",
    ],
    ctaBody: ["Save it to play the records in order.", "Save it and take the whole trip.", "Tell us in the comments."],
    captionOpening: [
      (artistName: string) => `Every artist has their artists. ${artistName}'s:`,
      (artistName: string) => `To understand ${artistName}, start here:`,
      (artistName: string) => `The record shelf behind ${artistName}:`,
    ],
    captionSources: "List the sources here (interviews, books, documentaries)",
    captionQuestion: [
      "Which other influence would you add?",
      "Did you know these roots?",
      "Who should we dig into next?",
    ],
  },
} as const

export const artistBehindTheArtistTemplate: StudioTemplate = {
  key: "artist-behind-the-artist",
  name: "O Artista por Trás do Artista",
  tagline: "Influências e conexões entre artistas.",
  objective: "Explorar influências com fontes confiáveis; alegações sem fonte ficam sinalizadas.",
  slideStructure: [
    "Artista principal",
    "Uma influência por slide",
    "Uma citação do artista sobre ela, com fonte obrigatória",
    "Convite para explorar",
  ],
  isAvailable: true,
  defaultIdentityKey: "editorial",
  albumSlots: [
    {
      key: "main",
      label: "Álbum do artista principal",
      description: "Um disco que representa o artista.",
      minAlbums: 1,
      maxAlbums: 1,
    },
    {
      key: "influences",
      label: "Influências",
      description: "De 1 a 4 discos de artistas que o influenciaram. Cada um ganha um slide de citação com fonte.",
      minAlbums: 1,
      maxAlbums: 4,
    },
  ],
  settingFields: COMMON_SETTING_FIELDS,
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const mainAlbum = albumsBySlot.main?.[0]
    const influenceAlbums = albumsBySlot.influences ?? []
    if (!mainAlbum || influenceAlbums.length === 0) {
      throw new Error("Escolha o álbum do artista principal e pelo menos uma influência.")
    }

    const mainArtistName = primaryArtistName(mainAlbum)
    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)(mainArtistName)
    const influenceKicker = pick(copy.influenceKicker)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker),
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: [mainAlbum, ...influenceAlbums].slice(0, MAX_ALBUMS_PER_GRID_SLIDE).map((album) => album.id),
      }),
      createEmptySlide("album", {
        kicker: pick(copy.mainKicker),
        albumIds: [mainAlbum.id],
        body: mainAlbum.editorialDescription,
      }),
      ...influenceAlbums.flatMap((influenceAlbum) => [
        createEmptySlide("album", {
          kicker: influenceKicker,
          albumIds: [influenceAlbum.id],
          body: influenceAlbum.editorialDescription,
        }),
        createEmptySlide("quote", {
          headline: `[${copy.quotePlaceholder(mainArtistName, primaryArtistName(influenceAlbum))}]`,
          body: mainArtistName,
          requiresSource: true,
        }),
      ]),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening)(mainArtistName),
      influenceAlbums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      editorPlaceholder(language, COPY.pt.captionSources, COPY.en.captionSources),
      pick(copy.captionQuestion),
      buildHashtags([mainAlbum, ...influenceAlbums], language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
