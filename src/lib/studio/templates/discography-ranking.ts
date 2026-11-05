import { createEmptySlide, MAX_ALBUMS_PER_LIST_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  chunkAlbums,
  createVariantPicker,
  editorPlaceholder,
  joinCaptionParagraphs,
  primaryArtistName,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const MAX_RANKED_ALBUMS = 12

const COPY = {
  pt: {
    coverKicker: ["O ranking da discografia", "Do pior ao melhor", "Ranking sem medo"],
    defaultCoverHeadline: [
      (artistName: string) => `${artistName}: do pior ao melhor disco`,
      (artistName: string) => `Todos os discos de ${artistName}, em ordem`,
      (artistName: string) => `Rankeamos ${artistName}. Pode brigar.`,
    ],
    coverBody: [
      "Um ranking editorial. Discorde à vontade nos comentários.",
      "Uma opinião, não uma verdade. Mas é a nossa.",
      "Pegue a pipoca e prepare os comentários.",
    ],
    rankKicker: [
      (position: number) => `${position}º lugar`,
      (position: number) => `Posição ${position}`,
      (position: number) => (position === 1 ? "O topo" : `Nº ${position}`),
    ],
    rankBody: "Escreva aqui um comentário curto sobre este disco",
    verdictKicker: ["O veredito", "Fechando a conta", "O critério"],
    verdictHeadline: [
      (topTitle: string) => `${topTitle} no topo. E não foi por pouco.`,
      (topTitle: string) => `Por que ${topTitle} ficou em 1º`,
      () => "Como montamos esse ranking",
    ],
    summaryKicker: ["O ranking completo", "Tudo em ordem", "Para salvar"],
    ctaKicker: ["Sua vez", "Discorda?", "Seu ranking"],
    defaultCtaHeadline: ["Qual é o seu ranking?", "Qual disco a gente subestimou?", "Mudaria alguma posição?"],
    ctaBody: ["Mande a sua ordem nos comentários.", "Defenda seu favorito nos comentários.", "Salve e compare com o seu."],
    captionOpening: [
      (artistName: string) => `Rankeamos a discografia de ${artistName}.`,
      (artistName: string) => `${artistName}, do pior ao melhor — na nossa opinião.`,
      (artistName: string) => `Hora de colocar ${artistName} em ordem.`,
    ],
    captionWhy: "Escreva aqui o critério do ranking",
    captionQuestion: ["Qual disco você colocaria no topo?", "Onde a gente errou?", "Qual é o seu nº 1?"],
  },
  en: {
    coverKicker: ["The discography ranking", "Worst to best", "Fearless ranking"],
    defaultCoverHeadline: [
      (artistName: string) => `${artistName}, ranked worst to best`,
      (artistName: string) => `Every ${artistName} record, in order`,
      (artistName: string) => `We ranked ${artistName}. Fight us.`,
    ],
    coverBody: [
      "An editorial ranking. Feel free to disagree in the comments.",
      "An opinion, not the truth. But it's ours.",
      "Grab the popcorn and get the comments ready.",
    ],
    rankKicker: [
      (position: number) => `Number ${position}`,
      (position: number) => `Position ${position}`,
      (position: number) => (position === 1 ? "The top" : `No. ${position}`),
    ],
    rankBody: "Write a short comment about this record",
    verdictKicker: ["The verdict", "Closing the books", "The criteria"],
    verdictHeadline: [
      (topTitle: string) => `${topTitle} on top. And it wasn't close.`,
      (topTitle: string) => `Why ${topTitle} came first`,
      () => "How we built this ranking",
    ],
    summaryKicker: ["The full ranking", "All in order", "Save it"],
    ctaKicker: ["Your turn", "Disagree?", "Your ranking"],
    defaultCtaHeadline: ["What's your ranking?", "Which record did we underrate?", "Would you change any spot?"],
    ctaBody: ["Drop your order in the comments.", "Defend your favorite in the comments.", "Save it and compare with yours."],
    captionOpening: [
      (artistName: string) => `We ranked ${artistName}'s discography.`,
      (artistName: string) => `${artistName}, worst to best — in our opinion.`,
      (artistName: string) => `Time to put ${artistName} in order.`,
    ],
    captionWhy: "Write the criteria behind the ranking",
    captionQuestion: ["Which record would you put on top?", "Where did we get it wrong?", "What's your number one?"],
  },
} as const

export const discographyRankingTemplate: StudioTemplate = {
  key: "discography-ranking",
  name: "O Ranking da Discografia",
  tagline: "A discografia de um artista em ordem.",
  objective: "Organizar os álbuns de um artista em um ranking editorial, editável manualmente.",
  slideStructure: [
    "Artista e título do ranking",
    "Um álbum por slide, com número e comentário",
    "O veredito sobre o 1º lugar",
    "Ranking completo em lista",
    "Convite para opinar",
  ],
  isAvailable: true,
  defaultIdentityKey: "neon",
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
      appearsIn: "Título da capa e legenda",
      kind: "text",
      placeholder: "Vazio = artista do 1º álbum marcado",
    },
    {
      key: "revealOrder",
      label: "Ordem dos slides",
      appearsIn: "Sequência dos slides de álbum",
      kind: "select",
      defaultValue: "countdown",
      options: [
        { value: "countdown", label: "Contagem regressiva (termina no 1º lugar)" },
        { value: "top-down", label: "Do 1º lugar para o último" },
      ],
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const rankedAlbums = (albumsBySlot.albums ?? []).slice(0, MAX_RANKED_ALBUMS)
    if (rankedAlbums.length < 3) throw new Error("Escolha pelo menos três álbuns para o ranking.")

    const artistName = settings.artistName?.trim() || primaryArtistName(rankedAlbums[0]!)
    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)(artistName)
    const isCountdown = settings.revealOrder !== "top-down"
    const rankKicker = pick(copy.rankKicker)
    const summaryKicker = pick(copy.summaryKicker)

    const rankedSlides = rankedAlbums.map((album, index) =>
      createEmptySlide("ranked-album", {
        kicker: rankKicker(index + 1),
        albumIds: [album.id],
        rankNumber: index + 1,
        body: editorPlaceholder(language, COPY.pt.rankBody, COPY.en.rankBody),
      })
    )

    const verdictSlide = createEmptySlide("text", {
      kicker: pick(copy.verdictKicker),
      headline: pick(copy.verdictHeadline)(rankedAlbums[0]!.title),
      body: editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
    })

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker),
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: rankedAlbums.slice(0, 3).map((album) => album.id),
      }),
      ...(isCountdown ? [...rankedSlides.toReversed(), verdictSlide] : [rankedSlides[0]!, verdictSlide, ...rankedSlides.slice(1)]),
      ...chunkAlbums(rankedAlbums, MAX_ALBUMS_PER_LIST_SLIDE).map((albumsOnSlide, chunkIndex) =>
        createEmptySlide("album-list", {
          kicker: summaryKicker,
          headline: chunkIndex === 0 ? artistName : "",
          albumIds: albumsOnSlide.map((album) => album.id),
          rankNumber: chunkIndex * MAX_ALBUMS_PER_LIST_SLIDE + 1,
        })
      ),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening)(artistName),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      rankedAlbums
        .map((album, index) => `${index + 1}. ${album.title}${album.releaseYear ? ` (${album.releaseYear})` : ""}`)
        .join("\n"),
      pick(copy.captionQuestion),
      buildHashtags(rankedAlbums, language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
