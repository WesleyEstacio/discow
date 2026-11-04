import { createEmptySlide, MAX_ALBUMS_PER_LIST_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  chunkAlbums,
  editorPlaceholder,
  joinCaptionParagraphs,
  primaryArtistName,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const MAX_RANKED_ALBUMS = 12

const COPY = {
  pt: {
    coverKicker: "O ranking da discografia",
    defaultCoverHeadline: (artistName: string) => `${artistName}: do pior ao melhor disco`,
    coverBody: "Um ranking editorial. Discorde à vontade nos comentários.",
    rankKicker: (position: number) => `${position}º lugar`,
    rankBody: "Escreva aqui um comentário curto sobre este disco",
    summaryKicker: "O ranking completo",
    ctaKicker: "Sua vez",
    defaultCtaHeadline: "Qual é o seu ranking?",
    ctaBody: "Mande a sua ordem nos comentários.",
    captionOpening: (artistName: string) => `Rankeamos a discografia de ${artistName}.`,
    captionWhy: "Escreva aqui o critério do ranking",
    captionQuestion: "Qual disco você colocaria no topo?",
  },
  en: {
    coverKicker: "The discography ranking",
    defaultCoverHeadline: (artistName: string) => `${artistName}, ranked worst to best`,
    coverBody: "An editorial ranking. Feel free to disagree in the comments.",
    rankKicker: (position: number) => `Number ${position}`,
    rankBody: "Write a short comment about this record",
    summaryKicker: "The full ranking",
    ctaKicker: "Your turn",
    defaultCtaHeadline: "What's your ranking?",
    ctaBody: "Drop your order in the comments.",
    captionOpening: (artistName: string) => `We ranked ${artistName}'s discography.`,
    captionWhy: "Write the criteria behind the ranking",
    captionQuestion: "Which record would you put on top?",
  },
}

export const discographyRankingTemplate: StudioTemplate = {
  key: "discography-ranking",
  name: "O Ranking da Discografia",
  tagline: "A discografia de um artista em ordem.",
  objective: "Organizar os álbuns de um artista em um ranking editorial, editável manualmente.",
  slideStructure: [
    "Artista e título do ranking",
    "Um álbum por slide, com número e comentário",
    "Ranking completo em lista",
    "Convite para opinar",
  ],
  isAvailable: true,
  albumSlots: [
    {
      key: "albums",
      label: "Álbuns em ordem",
      description: "Marque na ordem do ranking: o primeiro marcado é o 1º lugar. A ordem pode ser ajustada no editor.",
      minAlbums: 3,
      maxAlbums: MAX_RANKED_ALBUMS,
      isOrdered: true,
    },
  ],
  settingFields: [
    {
      key: "artistName",
      label: "Artista",
      kind: "text",
      placeholder: "Vazio = artista do 1º álbum marcado",
    },
    {
      key: "revealOrder",
      label: "Ordem dos slides",
      kind: "select",
      defaultValue: "countdown",
      options: [
        { value: "countdown", label: "Contagem regressiva (termina no 1º lugar)" },
        { value: "top-down", label: "Do 1º lugar para o último" },
      ],
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language }) {
    const copy = COPY[language]
    const rankedAlbums = (albumsBySlot.albums ?? []).slice(0, MAX_RANKED_ALBUMS)
    if (rankedAlbums.length < 3) throw new Error("Escolha pelo menos três álbuns para o ranking.")

    const artistName = settings.artistName?.trim() || primaryArtistName(rankedAlbums[0]!)
    const coverHeadline = settings.theme?.trim() || copy.defaultCoverHeadline(artistName)
    const isCountdown = settings.revealOrder !== "top-down"

    const rankedSlides = rankedAlbums.map((album, index) =>
      createEmptySlide("ranked-album", {
        kicker: copy.rankKicker(index + 1),
        albumIds: [album.id],
        rankNumber: index + 1,
        body: editorPlaceholder(language, COPY.pt.rankBody, COPY.en.rankBody),
        backgroundKey: index === 0 ? "plum" : "ink",
      })
    )

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: coverHeadline,
        body: copy.coverBody,
        albumIds: rankedAlbums.slice(-3).map((album) => album.id),
        backgroundKey: "plum",
      }),
      ...(isCountdown ? rankedSlides.toReversed() : rankedSlides),
      ...chunkAlbums(rankedAlbums, MAX_ALBUMS_PER_LIST_SLIDE).map((albumsOnSlide, chunkIndex) =>
        createEmptySlide("album-list", {
          kicker: copy.summaryKicker,
          headline: chunkIndex === 0 ? artistName : "",
          albumIds: albumsOnSlide.map((album) => album.id),
          rankNumber: chunkIndex * MAX_ALBUMS_PER_LIST_SLIDE + 1,
          backgroundKey: "ink",
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
      copy.captionOpening(artistName),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      rankedAlbums
        .map((album, index) => `${index + 1}. ${album.title}${album.releaseYear ? ` (${album.releaseYear})` : ""}`)
        .join("\n"),
      copy.captionQuestion,
      buildHashtags(rankedAlbums, language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
