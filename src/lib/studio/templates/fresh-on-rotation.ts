import { createEmptySlide, MAX_ALBUMS_PER_GRID_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  chunkAlbums,
  createVariantPicker,
  describeAlbumLine,
  editorPlaceholder,
  joinCaptionParagraphs,
  splitSettingLines,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const MAX_FRESH_RELEASES = 8

const COPY = {
  pt: {
    coverKicker: ["Fresh on Rotation", "Acabou de sair", "Lançamentos"],
    defaultCoverHeadline: [
      (period: string) => (period ? `Os lançamentos de ${period} que merecem seu play` : "Lançamentos que merecem entrar na sua biblioteca"),
      (period: string) => (period ? `O que tocou aqui em ${period}` : "O que está tocando por aqui agora"),
      (period: string) => (period ? `${period}: discos novos para salvar` : "Discos novos para salvar hoje"),
    ],
    coverBody: [
      "Uma capa por slide. Arraste e escolha o seu.",
      "Saiu agora e já está na rotação.",
      "Novidades fresquinhas, sem enrolação.",
    ],
    releaseKicker: [
      (releaseDate: string | null) => (releaseDate ? `Saiu em ${releaseDate}` : "Lançamento recente"),
      (releaseDate: string | null) => (releaseDate ? `Lançado em ${releaseDate}` : "Novo na rotação"),
      (releaseDate: string | null) => (releaseDate ? `Fresquinho · ${releaseDate}` : "Fresquinho"),
    ],
    releaseBody: "Descreva este lançamento em uma ou duas frases",
    pickKicker: ["Qual você vai ouvir primeiro?", "Escolha o seu", "Hora de escolher"],
    pickHeadline: ["Qual entra primeiro na sua playlist?", "Qual dá o play primeiro?", "Um só. Qual?"],
    ctaKicker: ["Sua vez", "Faltou algum?", "Conta pra gente"],
    defaultCtaHeadline: [
      "Qual lançamento você vai ouvir primeiro?",
      "Que disco novo faltou nessa lista?",
      "Qual desses já está na sua rotação?",
    ],
    ctaBody: ["Salve para ouvir no fim de semana.", "Responda nos comentários.", "Mande para quem vive atrás de novidade."],
    captionOpening: [
      (period: string) => (period ? `Os lançamentos de ${period} que entraram na nossa rotação:` : "Os lançamentos que entraram na nossa rotação:"),
      () => "Discos novos que merecem um lugar na sua biblioteca:",
      () => "Saiu agora e já está tocando por aqui:",
    ],
    captionWhy: "Escreva aqui o que esses lançamentos têm em comum",
    captionQuestion: ["Qual você vai ouvir primeiro?", "Já ouviu algum?", "Que lançamento faltou aqui?"],
  },
  en: {
    coverKicker: ["Fresh on Rotation", "Just out", "New releases"],
    defaultCoverHeadline: [
      (period: string) => (period ? `${period} releases worth your play` : "New releases worth a spot in your library"),
      (period: string) => (period ? `What we played in ${period}` : "What's on rotation right now"),
      (period: string) => (period ? `${period}: new records to save` : "New records to save today"),
    ],
    coverBody: [
      "One cover per slide. Swipe and pick yours.",
      "Just out and already on rotation.",
      "Fresh releases, no filler.",
    ],
    releaseKicker: [
      (releaseDate: string | null) => (releaseDate ? `Out ${releaseDate}` : "Recent release"),
      (releaseDate: string | null) => (releaseDate ? `Released ${releaseDate}` : "New on rotation"),
      (releaseDate: string | null) => (releaseDate ? `Fresh · ${releaseDate}` : "Fresh"),
    ],
    releaseBody: "Describe this release in one or two sentences",
    pickKicker: ["Which one first?", "Pick yours", "Time to choose"],
    pickHeadline: ["Which one hits your playlist first?", "Which one gets the first play?", "Just one. Which?"],
    ctaKicker: ["Your turn", "Missing one?", "Tell us"],
    defaultCtaHeadline: [
      "Which release will you play first?",
      "Which new record is missing here?",
      "Which of these is already on your rotation?",
    ],
    ctaBody: ["Save it for the weekend.", "Answer in the comments.", "Send it to someone always hunting new music."],
    captionOpening: [
      (period: string) => (period ? `The ${period} releases that made our rotation:` : "The releases that made our rotation:"),
      () => "New records that deserve a spot in your library:",
      () => "Just out and already playing here:",
    ],
    captionWhy: "Write what these releases have in common",
    captionQuestion: ["Which one will you play first?", "Heard any of them yet?", "Which release is missing here?"],
  },
} as const

export const freshOnRotationTemplate: StudioTemplate = {
  key: "fresh-on-rotation",
  name: "Fresh on Rotation",
  tagline: "Novos lançamentos que merecem entrar na sua biblioteca musical.",
  objective: "Apresentar lançamentos recentes, um por slide, e fazer o público escolher qual ouvir primeiro.",
  slideStructure: [
    "Seleção de lançamentos recentes",
    "Uma capa por slide, com artista e data de lançamento",
    "Breve descrição de cada álbum",
    "Todas as capas juntas: qual você vai ouvir primeiro?",
    "Convite para comentar",
  ],
  isAvailable: true,
  defaultIdentityKey: "neon",
  albumSlots: [
    {
      key: "releases",
      label: "Lançamentos",
      description: `De 2 a ${MAX_FRESH_RELEASES} discos recentes. Cada um ganha um slide de capa.`,
      minAlbums: 2,
      maxAlbums: MAX_FRESH_RELEASES,
      isOrdered: true,
    },
  ],
  settingFields: [
    {
      key: "period",
      label: "Período (opcional)",
      appearsIn: "Título da capa e legenda",
      kind: "text",
      placeholder: "Ex.: setembro",
    },
    {
      key: "releaseDates",
      label: "Datas de lançamento (opcional)",
      appearsIn: "Rótulo de cada slide de álbum",
      description: "Uma data por linha, na mesma ordem dos discos marcados. Vazio = mostra só o ano.",
      kind: "textarea",
      placeholder: "12/09\n19/09",
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const releases = (albumsBySlot.releases ?? []).slice(0, MAX_FRESH_RELEASES)
    if (releases.length < 2) throw new Error("Escolha pelo menos dois lançamentos.")

    const period = settings.period?.trim() ?? ""
    const releaseDates = splitSettingLines(settings.releaseDates)
    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)(period)
    const releaseKicker = pick(copy.releaseKicker)
    const pickKicker = pick(copy.pickKicker)
    const pickHeadline = pick(copy.pickHeadline)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker),
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: releases.slice(0, MAX_ALBUMS_PER_GRID_SLIDE).map((album) => album.id),
      }),
      ...releases.map((album, index) =>
        createEmptySlide("album", {
          kicker: releaseKicker(releaseDates[index] ?? (album.releaseYear ? String(album.releaseYear) : null)),
          albumIds: [album.id],
          body: album.editorialDescription || editorPlaceholder(language, COPY.pt.releaseBody, COPY.en.releaseBody),
        })
      ),
      ...chunkAlbums(releases, MAX_ALBUMS_PER_GRID_SLIDE).map((albumsOnSlide) =>
        createEmptySlide("album-grid", {
          kicker: pickKicker,
          headline: pickHeadline,
          albumIds: albumsOnSlide.map((album) => album.id),
        })
      ),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening)(period),
      releases
        .map((album, index) => `→ ${describeAlbumLine(album)}${releaseDates[index] ? ` · ${releaseDates[index]}` : ""}`)
        .join("\n"),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      pick(copy.captionQuestion),
      buildHashtags(releases, language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
