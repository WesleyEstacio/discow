import { createEmptySlide, MAX_ALBUMS_PER_GRID_SLIDE, MAX_ALBUMS_PER_LIST_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  describeAlbumLine,
  editorPlaceholder,
  joinCaptionParagraphs,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const COPY = {
  pt: {
    coverKicker: "Álbuns para cada sentimento",
    defaultCoverHeadline: (feeling: string) => `Discos para ${feeling}`,
    coverBody: "Uma trilha sonora para o que você está sentindo agora.",
    albumKicker: (feeling: string) => `Para ${feeling}`,
    summaryKicker: "A trilha completa",
    summaryHeadline: "Salve a lista",
    ctaKicker: "Sua vez",
    defaultCtaHeadline: (feeling: string) => `Que disco você ouve para ${feeling}?`,
    ctaBody: "Conte nos comentários e salve para depois.",
    captionOpening: (feeling: string) => `Discos para ${feeling}.`,
    captionWhy: "Escreva aqui por que esses discos combinam com esse momento",
    captionQuestion: "Qual entraria na sua lista?",
  },
  en: {
    coverKicker: "Albums for every feeling",
    defaultCoverHeadline: (feeling: string) => `Records for ${feeling}`,
    coverBody: "A soundtrack for whatever you're feeling right now.",
    albumKicker: (feeling: string) => `For ${feeling}`,
    summaryKicker: "The full soundtrack",
    summaryHeadline: "Save the list",
    ctaKicker: "Your turn",
    defaultCtaHeadline: (feeling: string) => `What do you play for ${feeling}?`,
    ctaBody: "Tell us in the comments and save it for later.",
    captionOpening: (feeling: string) => `Records for ${feeling}.`,
    captionWhy: "Write why these records fit this moment",
    captionQuestion: "Which one would make your list?",
  },
}

export const albumsForEveryFeelingTemplate: StudioTemplate = {
  key: "albums-for-every-feeling",
  name: "Álbuns para Cada Sentimento",
  tagline: "Discos para um momento ou situação.",
  objective: "Recomendar álbuns com base em um sentimento, momento ou situação.",
  slideStructure: [
    "Título com apelo emocional",
    "Um álbum por slide, com descrição curta",
    "Lista completa para salvar",
    "Chamada final",
  ],
  isAvailable: true,
  albumSlots: [
    {
      key: "albums",
      label: "Álbuns",
      description: "De 3 a 8 discos que combinam com o sentimento.",
      minAlbums: 3,
      maxAlbums: MAX_ALBUMS_PER_LIST_SLIDE,
    },
  ],
  settingFields: [
    {
      key: "feeling",
      label: "Sentimento ou momento",
      kind: "text",
      required: true,
      placeholder: "Ex.: um domingo de chuva",
      description: "Completa a frase “Discos para…”.",
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language }) {
    const copy = COPY[language]
    const albums = albumsBySlot.albums ?? []
    const feeling = settings.feeling?.trim() ?? ""
    if (albums.length < 3) throw new Error("Escolha pelo menos três álbuns.")
    if (!feeling) throw new Error("Preencha o sentimento ou momento.")

    const coverHeadline = settings.theme?.trim() || copy.defaultCoverHeadline(feeling)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: coverHeadline,
        body: copy.coverBody,
        albumIds: albums.slice(0, MAX_ALBUMS_PER_GRID_SLIDE).map((album) => album.id),
        backgroundKey: "midnight",
      }),
      ...albums.map((album, index) =>
        createEmptySlide("album", {
          kicker: copy.albumKicker(feeling),
          albumIds: [album.id],
          body: album.editorialDescription,
          backgroundKey: index % 2 === 0 ? "ink" : "midnight",
        })
      ),
      createEmptySlide("album-list", {
        kicker: copy.summaryKicker,
        headline: copy.summaryHeadline,
        albumIds: albums.map((album) => album.id),
        backgroundKey: "midnight",
      }),
      createEmptySlide("cta", {
        kicker: copy.ctaKicker,
        headline: settings.callToAction?.trim() || copy.defaultCtaHeadline(feeling),
        body: copy.ctaBody,
        backgroundKey: "magenta",
        textAlign: "center",
      }),
    ]

    const caption = joinCaptionParagraphs([
      copy.captionOpening(feeling),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      albums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      copy.captionQuestion,
      buildHashtags(albums, language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
