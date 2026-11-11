import { createEmptySlide, MAX_ALBUMS_PER_COVER_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  createVariantPicker,
  describeAlbumLine,
  editorPlaceholder,
  joinCaptionParagraphs,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const COPY = {
  pt: {
    coverKicker: ["Álbuns para cada sentimento", "Trilha sonora", "Para o momento certo"],
    defaultCoverHeadline: [
      (feeling: string) => `Discos para ${feeling}`,
      (feeling: string) => `A trilha sonora de ${feeling}`,
      (feeling: string) => `O que ouvir em ${feeling}`,
    ],
    coverBody: [
      "Uma trilha sonora para o que você está sentindo agora.",
      "Alguns momentos pedem o disco certo.",
      "Dê o play e deixe o clima tomar conta.",
    ],
    moodKicker: ["O clima", "Antes do play", "Feche os olhos"],
    moodHeadline: [
      (feeling: string) => `Tem disco que foi feito para ${feeling}.`,
      (feeling: string) => `${feeling[0]?.toUpperCase() ?? ""}${feeling.slice(1)} tem trilha sonora. A gente montou.`,
      (feeling: string) => `Aumente o volume: é ${feeling}.`,
    ],
    albumKicker: [
      (feeling: string) => `Para ${feeling}`,
      (_feeling: string, position: number) => `Nº ${position}`,
      (_feeling: string, position: number) => `Disco ${position}`,
    ],
    summaryKicker: ["A trilha completa", "Salve a lista", "Para voltar depois"],
    summaryHeadline: ["Salve a lista", "A playlist inteira", "Tudo num lugar só"],
    ctaKicker: ["Sua vez", "Seu disco", "Conta pra gente"],
    defaultCtaHeadline: [
      (feeling: string) => `Que disco você ouve para ${feeling}?`,
      (feeling: string) => `Qual seria o seu disco para ${feeling}?`,
      () => "Que disco faltou nessa trilha?",
    ],
    ctaBody: ["Conte nos comentários e salve para depois.", "Salve para quando o momento chegar.", "Mande para quem está nesse clima."],
    captionOpening: [
      (feeling: string) => `Discos para ${feeling}.`,
      (feeling: string) => `Montamos a trilha sonora de ${feeling}.`,
      (feeling: string) => `Para ${feeling}, esses discos resolvem.`,
    ],
    captionWhy: "Escreva aqui por que esses discos combinam com esse momento",
    captionQuestion: ["Qual entraria na sua lista?", "Qual você daria o play primeiro?", "Que disco você acrescentaria?"],
  },
  en: {
    coverKicker: ["Albums for every feeling", "Soundtrack", "For the right moment"],
    defaultCoverHeadline: [
      (feeling: string) => `Records for ${feeling}`,
      (feeling: string) => `The soundtrack for ${feeling}`,
      (feeling: string) => `What to play for ${feeling}`,
    ],
    coverBody: [
      "A soundtrack for whatever you're feeling right now.",
      "Some moments need the right record.",
      "Press play and let the mood take over.",
    ],
    moodKicker: ["The mood", "Before you press play", "Close your eyes"],
    moodHeadline: [
      (feeling: string) => `Some records were made for ${feeling}.`,
      (feeling: string) => `${feeling[0]?.toUpperCase() ?? ""}${feeling.slice(1)} has a soundtrack. We made it.`,
      (feeling: string) => `Turn it up: it's ${feeling}.`,
    ],
    albumKicker: [
      (feeling: string) => `For ${feeling}`,
      (_feeling: string, position: number) => `No. ${position}`,
      (_feeling: string, position: number) => `Record ${position}`,
    ],
    summaryKicker: ["The full soundtrack", "Save the list", "For later"],
    summaryHeadline: ["Save the list", "The whole playlist", "All in one place"],
    ctaKicker: ["Your turn", "Your record", "Tell us"],
    defaultCtaHeadline: [
      (feeling: string) => `What do you play for ${feeling}?`,
      (feeling: string) => `What would be your record for ${feeling}?`,
      () => "Which record is missing from this soundtrack?",
    ],
    ctaBody: ["Tell us in the comments and save it for later.", "Save it for when the moment comes.", "Send it to someone in this mood."],
    captionOpening: [
      (feeling: string) => `Records for ${feeling}.`,
      (feeling: string) => `We built the soundtrack for ${feeling}.`,
      (feeling: string) => `For ${feeling}, these records do the job.`,
    ],
    captionWhy: "Write why these records fit this moment",
    captionQuestion: ["Which one would make your list?", "Which one would you play first?", "Which record would you add?"],
  },
} as const

export const albumsForEveryFeelingTemplate: StudioTemplate = {
  key: "albums-for-every-feeling",
  name: "Álbuns para Cada Sentimento",
  tagline: "Discos para um momento ou situação.",
  objective: "Recomendar álbuns com base em um sentimento, momento ou situação.",
  slideStructure: [
    "Título com apelo emocional",
    "Um slide para criar o clima",
    "Um álbum por slide, com descrição curta",
    "Lista completa para salvar",
    "Chamada final",
  ],
  isAvailable: true,
  defaultIdentityKey: "mixtape",
  albumSlots: [
    {
      key: "albums",
      label: "Álbuns",
      description: `De 3 a ${MAX_ALBUMS_PER_COVER_SLIDE} discos que combinam com o sentimento. Todas as capas aparecem na capa do post.`,
      minAlbums: 3,
      maxAlbums: MAX_ALBUMS_PER_COVER_SLIDE,
    },
  ],
  settingFields: [
    {
      key: "feeling",
      label: "Sentimento ou momento",
      appearsIn: "Título da capa, slide de clima e rótulo dos álbuns",
      kind: "text",
      required: true,
      placeholder: "Ex.: um domingo de chuva",
      description: "Completa a frase “Discos para…”.",
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const albums = albumsBySlot.albums ?? []
    const feeling = settings.feeling?.trim() ?? ""
    if (albums.length < 3) throw new Error("Escolha pelo menos três álbuns.")
    if (!feeling) throw new Error("Preencha o sentimento ou momento.")

    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)(feeling)
    const albumKicker = pick(copy.albumKicker)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker),
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: albums.map((album) => album.id),
      }),
      createEmptySlide("text", {
        kicker: pick(copy.moodKicker),
        headline: pick(copy.moodHeadline)(feeling),
        body: editorPlaceholder(language, "Descreva o clima em uma ou duas frases", "Describe the mood in a sentence or two"),
      }),
      ...albums.map((album, index) =>
        createEmptySlide("album", {
          kicker: albumKicker(feeling, index + 1),
          albumIds: [album.id],
          body: album.editorialDescription,
        })
      ),
      createEmptySlide("album-list", {
        kicker: pick(copy.summaryKicker),
        headline: pick(copy.summaryHeadline),
        albumIds: albums.map((album) => album.id),
      }),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline)(feeling),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening)(feeling),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      albums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      pick(copy.captionQuestion),
      buildHashtags(albums, language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
