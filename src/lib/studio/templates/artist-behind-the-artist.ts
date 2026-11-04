import { createEmptySlide, MAX_ALBUMS_PER_GRID_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  describeAlbumLine,
  editorPlaceholder,
  joinCaptionParagraphs,
  primaryArtistName,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const COPY = {
  pt: {
    coverKicker: "O artista por trás do artista",
    defaultCoverHeadline: (artistName: string) => `Quem formou o som de ${artistName}`,
    coverBody: "As influências que aparecem nos discos — com fonte.",
    mainKicker: "O artista",
    influenceKicker: "A influência",
    connectionKicker: "A conexão",
    connectionHeadline: (influenceName: string) => `O que veio de ${influenceName}`,
    ctaKicker: "Continue explorando",
    defaultCtaHeadline: "Que influência você ouve nesse som?",
    ctaBody: "Salve para ouvir os discos na ordem.",
    captionOpening: (artistName: string) => `Todo artista tem seus artistas. Os de ${artistName}:`,
    captionSources: "Liste aqui as fontes (entrevistas, livros, documentários)",
    captionQuestion: "Que outra influência você colocaria aqui?",
  },
  en: {
    coverKicker: "The artist behind the artist",
    defaultCoverHeadline: (artistName: string) => `Who shaped ${artistName}'s sound`,
    coverBody: "The influences you can hear on the records — with sources.",
    mainKicker: "The artist",
    influenceKicker: "The influence",
    connectionKicker: "The connection",
    connectionHeadline: (influenceName: string) => `What came from ${influenceName}`,
    ctaKicker: "Keep exploring",
    defaultCtaHeadline: "What influence do you hear in this sound?",
    ctaBody: "Save it to play the records in order.",
    captionOpening: (artistName: string) => `Every artist has their artists. ${artistName}'s:`,
    captionSources: "List the sources here (interviews, books, documentaries)",
    captionQuestion: "Which other influence would you add?",
  },
}

export const artistBehindTheArtistTemplate: StudioTemplate = {
  key: "artist-behind-the-artist",
  name: "O Artista por Trás do Artista",
  tagline: "Influências e conexões entre artistas.",
  objective: "Explorar influências com fontes confiáveis; alegações sem fonte ficam sinalizadas.",
  slideStructure: [
    "Artista principal",
    "Uma influência por slide",
    "A conexão, com fonte obrigatória",
    "Convite para explorar",
  ],
  isAvailable: true,
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
      description: "De 1 a 4 discos de artistas que o influenciaram. Cada um ganha um slide de conexão com fonte.",
      minAlbums: 1,
      maxAlbums: 4,
    },
  ],
  settingFields: COMMON_SETTING_FIELDS,
  buildCarousel({ albumsBySlot, settings, language }) {
    const copy = COPY[language]
    const mainAlbum = albumsBySlot.main?.[0]
    const influenceAlbums = albumsBySlot.influences ?? []
    if (!mainAlbum || influenceAlbums.length === 0) {
      throw new Error("Escolha o álbum do artista principal e pelo menos uma influência.")
    }

    const mainArtistName = primaryArtistName(mainAlbum)
    const coverHeadline = settings.theme?.trim() || copy.defaultCoverHeadline(mainArtistName)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: coverHeadline,
        body: copy.coverBody,
        albumIds: [mainAlbum, ...influenceAlbums].slice(0, MAX_ALBUMS_PER_GRID_SLIDE).map((album) => album.id),
        backgroundKey: "forest",
      }),
      createEmptySlide("album", {
        kicker: copy.mainKicker,
        albumIds: [mainAlbum.id],
        body: mainAlbum.editorialDescription,
        backgroundKey: "ink",
      }),
      ...influenceAlbums.flatMap((influenceAlbum) => [
        createEmptySlide("album", {
          kicker: copy.influenceKicker,
          albumIds: [influenceAlbum.id],
          body: influenceAlbum.editorialDescription,
          backgroundKey: "forest",
        }),
        createEmptySlide("text", {
          kicker: copy.connectionKicker,
          headline: copy.connectionHeadline(primaryArtistName(influenceAlbum)),
          body: "",
          requiresSource: true,
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

    const caption = joinCaptionParagraphs([
      copy.captionOpening(mainArtistName),
      influenceAlbums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      editorPlaceholder(language, COPY.pt.captionSources, COPY.en.captionSources),
      copy.captionQuestion,
      buildHashtags([mainAlbum, ...influenceAlbums], language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
