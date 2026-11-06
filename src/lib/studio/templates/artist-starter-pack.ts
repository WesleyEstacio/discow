import { createEmptySlide, MAX_ALBUMS_PER_GRID_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  createVariantPicker,
  describeAlbumLine,
  editorPlaceholder,
  joinCaptionParagraphs,
  primaryArtistName,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate, type TemplateAlbum } from "@/lib/studio/templates/types"

type StarterPackRole = "starter" | "acclaimed" | "experimental" | "deepDive"

const STARTER_PACK_ROLES: StarterPackRole[] = ["starter", "acclaimed", "experimental", "deepDive"]

const COPY = {
  pt: {
    coverKicker: ["The Artist Starter Pack", "Kit de iniciação", "Por onde começar"],
    defaultCoverHeadline: [
      (artistName: string) => `Quer conhecer ${artistName}? Comece por aqui`,
      (artistName: string) => `${artistName} para iniciantes`,
      (artistName: string) => `O kit básico para entrar em ${artistName}`,
    ],
    coverBody: [
      "Os discos certos, na ordem certa.",
      "Sem pular etapas: um caminho pela discografia.",
      "Salve e ouça um por semana.",
    ],
    artistKicker: ["Artista em destaque", "Quem é", "Apresentando"],
    artistBody: "Apresente o artista em duas ou três frases: de onde vem, que som faz e por que importa",
    roleKicker: {
      starter: ["Comece por este", "A porta de entrada", "Primeiro play"],
      acclaimed: ["O mais aclamado", "O clássico", "O que todo mundo cita"],
      experimental: ["O mais experimental", "O lado ousado", "Para quem quer arriscar"],
      deepDive: ["Para ir além", "Quando virar fã", "O próximo passo"],
    },
    roleDescription: {
      starter: "o mais fácil de gostar logo de cara",
      acclaimed: "o disco que a crítica mais celebra",
      experimental: "onde o artista mais arriscou",
      deepDive: "para quem já virou fã",
    },
    orderKicker: ["Qual ouvir primeiro?", "A ordem que a gente indica", "O caminho"],
    orderHeadline: ["Ouça nesta ordem", "O roteiro de escuta", "Do primeiro play ao mergulho"],
    summaryKicker: ["O starter pack completo", "Para salvar", "Tudo em um lugar"],
    ctaKicker: ["Sua vez", "Monte o seu", "Conta pra gente"],
    defaultCtaHeadline: [
      "Por qual disco você começaria?",
      "Qual disco faltou nesse kit?",
      "De qual artista a gente monta o próximo?",
    ],
    ctaBody: ["Salve e comece pelo primeiro.", "Mande para quem quer conhecer.", "Peça o próximo starter pack nos comentários."],
    captionOpening: [
      (artistName: string) => `Quer conhecer ${artistName} e não sabe por onde começar? A gente montou o kit:`,
      (artistName: string) => `${artistName} para iniciantes, em poucos discos:`,
      (artistName: string) => `O caminho mais curto para entender ${artistName}:`,
    ],
    captionWhy: "Escreva aqui por que essa ordem funciona",
    captionQuestion: [
      "Qual artista ganha o próximo starter pack?",
      "Você começaria por outro disco?",
      "Qual foi o seu primeiro disco desse artista?",
    ],
  },
  en: {
    coverKicker: ["The Artist Starter Pack", "Starter kit", "Where to start"],
    defaultCoverHeadline: [
      (artistName: string) => `New to ${artistName}? Start here`,
      (artistName: string) => `${artistName} for beginners`,
      (artistName: string) => `The essential kit to get into ${artistName}`,
    ],
    coverBody: [
      "The right records, in the right order.",
      "No skipping steps: a path through the discography.",
      "Save it and play one a week.",
    ],
    artistKicker: ["Featured artist", "Who they are", "Introducing"],
    artistBody: "Introduce the artist in two or three sentences: where they come from, their sound and why they matter",
    roleKicker: {
      starter: ["Start with this one", "The way in", "First play"],
      acclaimed: ["The most acclaimed", "The classic", "The one everyone quotes"],
      experimental: ["The most experimental", "The daring side", "For the adventurous"],
      deepDive: ["Go further", "Once you're a fan", "The next step"],
    },
    roleDescription: {
      starter: "the easiest to love right away",
      acclaimed: "the record critics celebrate the most",
      experimental: "where the artist took the biggest risks",
      deepDive: "for when you're already a fan",
    },
    orderKicker: ["Which one first?", "The order we recommend", "The path"],
    orderHeadline: ["Play them in this order", "The listening plan", "From first play to deep dive"],
    summaryKicker: ["The full starter pack", "Save it", "All in one place"],
    ctaKicker: ["Your turn", "Build yours", "Tell us"],
    defaultCtaHeadline: [
      "Which record would you start with?",
      "Which record is missing from this kit?",
      "Which artist should get the next one?",
    ],
    ctaBody: ["Save it and start with the first one.", "Send it to someone who wants in.", "Ask for the next starter pack below."],
    captionOpening: [
      (artistName: string) => `Want to get into ${artistName} but don't know where to start? Here's the kit:`,
      (artistName: string) => `${artistName} for beginners, in a few records:`,
      (artistName: string) => `The shortest path to understanding ${artistName}:`,
    ],
    captionWhy: "Write why this order works",
    captionQuestion: [
      "Which artist gets the next starter pack?",
      "Would you start with a different record?",
      "What was your first record by this artist?",
    ],
  },
} as const

export const artistStarterPackTemplate: StudioTemplate = {
  key: "artist-starter-pack",
  name: "The Artist Starter Pack",
  tagline: "Uma seleção de álbuns para quem quer conhecer um artista.",
  objective: "Guiar quem nunca ouviu um artista por um caminho curto e bem explicado pela discografia.",
  slideStructure: [
    "Artista em destaque",
    "Álbum ideal para começar",
    "Álbum mais aclamado",
    "Álbum mais experimental",
    "Para ir além (opcional)",
    "Qual ouvir primeiro e por quê",
    "Starter pack completo para salvar",
    "Convite para comentar",
  ],
  isAvailable: true,
  defaultIdentityKey: "pop",
  albumSlots: [
    {
      key: "starter",
      label: "Álbum ideal para começar",
      description: "O disco mais fácil de gostar logo de cara.",
      minAlbums: 1,
      maxAlbums: 1,
    },
    {
      key: "acclaimed",
      label: "Álbum mais aclamado",
      description: "O disco que a crítica e os fãs mais celebram.",
      minAlbums: 1,
      maxAlbums: 1,
    },
    {
      key: "experimental",
      label: "Álbum mais experimental",
      description: "Onde o artista mais arriscou.",
      minAlbums: 1,
      maxAlbums: 1,
    },
    {
      key: "deepDive",
      label: "Para ir além (opcional)",
      description: "Um disco para quem já virou fã.",
      minAlbums: 0,
      maxAlbums: 1,
    },
  ],
  settingFields: [
    {
      key: "artistName",
      label: "Artista",
      appearsIn: "Capa, slide do artista e legenda",
      kind: "text",
      placeholder: "Vazio = artista do álbum para começar",
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const albumsByRole = STARTER_PACK_ROLES.flatMap((role) => {
      const album = albumsBySlot[role]?.[0]
      return album ? [{ role, album }] : []
    })
    const starterAlbum = albumsBySlot.starter?.[0]
    if (!starterAlbum || albumsByRole.length < 3) {
      throw new Error("Escolha o álbum para começar, o mais aclamado e o mais experimental.")
    }

    const packAlbums: TemplateAlbum[] = albumsByRole.map(({ album }) => album)
    const artistName = settings.artistName?.trim() || primaryArtistName(starterAlbum)
    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)(artistName)
    const listeningOrder = albumsByRole
      .map(({ role, album }, index) => `${index + 1}. ${album.title} — ${copy.roleDescription[role]}`)
      .join("\n")

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker),
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: packAlbums.slice(0, MAX_ALBUMS_PER_GRID_SLIDE).map((album) => album.id),
      }),
      createEmptySlide("text", {
        kicker: pick(copy.artistKicker),
        headline: artistName,
        body: editorPlaceholder(language, COPY.pt.artistBody, COPY.en.artistBody),
      }),
      ...albumsByRole.map(({ role, album }) =>
        createEmptySlide("album", {
          kicker: pick(copy.roleKicker[role]),
          albumIds: [album.id],
          body: album.editorialDescription,
        })
      ),
      createEmptySlide("text", {
        kicker: pick(copy.orderKicker),
        headline: pick(copy.orderHeadline),
        body: listeningOrder,
      }),
      createEmptySlide("album-list", {
        kicker: pick(copy.summaryKicker),
        headline: artistName,
        albumIds: packAlbums.map((album) => album.id),
        rankNumber: 1,
      }),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening)(artistName),
      albumsByRole.map(({ album }, index) => `${index + 1}. ${describeAlbumLine(album)}`).join("\n"),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      pick(copy.captionQuestion),
      buildHashtags(packAlbums, language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
