import { createEmptySlide, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  createVariantPicker,
  describeAlbumLine,
  editorPlaceholder,
  joinCaptionParagraphs,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const MAX_UNDERRATED_ALBUMS = 5

// "Underrated" is presented as an editorial opinion, never as a statistic,
// so the copy talks about what we think, not about play counts.
const COPY = {
  pt: {
    coverKicker: ["Injustamente subestimados", "Merecia mais", "Passou batido"],
    defaultCoverHeadline: [
      "Discos que mereciam muito mais atenção",
      "Ninguém fala desses discos. A gente fala.",
      "Tesouros que ficaram no fundo da estante",
    ],
    coverBody: [
      "Na nossa opinião, esses passaram batido.",
      "Opinião nossa: estes discos merecem uma segunda chance.",
      "Tire a poeira e dê o play.",
    ],
    albumKicker: ["Ouça com atenção", "Defendemos este", "Tire da estante"],
    whyKicker: ["Por que merece atenção", "Nosso argumento", "O caso a favor"],
    whyHeadline: [
      (albumTitle: string) => `O que faz ${albumTitle} especial`,
      (albumTitle: string) => `Por que ${albumTitle} merecia mais`,
      (albumTitle: string) => `Escute ${albumTitle} prestando atenção nisto`,
    ],
    ctaKicker: ["Sua vez", "Faça justiça", "Indique um"],
    defaultCtaHeadline: [
      "Qual disco você acha injustamente esquecido?",
      "Que disco merecia estar aqui?",
      "Qual tesouro escondido você defende?",
    ],
    ctaBody: ["Salve e dê o play hoje.", "Defenda o seu nos comentários.", "Mande para quem precisa conhecer."],
    captionOpening: [
      "Discos que, na nossa opinião, mereciam muito mais atenção:",
      "Alguns discos passaram batido. Estes não deveriam:",
      "Hora de fazer justiça com estes discos:",
    ],
    captionWhy: "Escreva aqui o que esses discos têm em comum",
    captionQuestion: ["Qual você colocaria nessa lista?", "Já conhecia algum?", "Qual disco você sente que ninguém ouviu?"],
  },
  en: {
    coverKicker: ["Unfairly underrated", "Deserved more", "Slipped under the radar"],
    defaultCoverHeadline: [
      "Records that deserved way more attention",
      "Nobody talks about these records. We do.",
      "Treasures left at the back of the shelf",
    ],
    coverBody: [
      "In our opinion, these slipped under the radar.",
      "Our take: these records deserve a second chance.",
      "Dust them off and press play.",
    ],
    albumKicker: ["Listen closely", "We stand by this one", "Pull it off the shelf"],
    whyKicker: ["Why it deserves attention", "Our case", "The argument"],
    whyHeadline: [
      (albumTitle: string) => `What makes ${albumTitle} special`,
      (albumTitle: string) => `Why ${albumTitle} deserved more`,
      (albumTitle: string) => `Listen to ${albumTitle} for this`,
    ],
    ctaKicker: ["Your turn", "Do it justice", "Recommend one"],
    defaultCtaHeadline: [
      "Which record do you think was unfairly overlooked?",
      "Which record belongs here?",
      "Which hidden gem do you stand by?",
    ],
    ctaBody: ["Save it and press play today.", "Defend yours in the comments.", "Send it to someone who should know it."],
    captionOpening: [
      "Records that, in our opinion, deserved way more attention:",
      "Some records slipped by. These shouldn't have:",
      "Time to do these records justice:",
    ],
    captionWhy: "Write what these records have in common",
    captionQuestion: ["Which one would you add to this list?", "Did you know any of them?", "Which record do you feel nobody heard?"],
  },
} as const

export const unfairlyUnderratedTemplate: StudioTemplate = {
  key: "unfairly-underrated",
  name: "Injustamente Subestimados",
  tagline: "Discos que merecem mais atenção — como opinião editorial.",
  objective: "Destacar álbuns que merecem mais reconhecimento, sem tratar 'subestimado' como estatística.",
  slideStructure: ["Título marcante", "Capa, artista e título", "Por que merece atenção", "Convite para ouvir"],
  isAvailable: true,
  defaultIdentityKey: "ember",
  albumSlots: [
    {
      key: "albums",
      label: "Álbuns",
      description: `De 1 a ${MAX_UNDERRATED_ALBUMS} discos. Cada um ganha um slide de capa e um de argumento.`,
      minAlbums: 1,
      maxAlbums: MAX_UNDERRATED_ALBUMS,
    },
  ],
  settingFields: COMMON_SETTING_FIELDS,
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const albums = (albumsBySlot.albums ?? []).slice(0, MAX_UNDERRATED_ALBUMS)
    if (albums.length === 0) throw new Error("Escolha pelo menos um álbum.")

    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)
    const albumKicker = pick(copy.albumKicker)
    const whyKicker = pick(copy.whyKicker)
    const whyHeadline = pick(copy.whyHeadline)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker),
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: albums.slice(0, 3).map((album) => album.id),
      }),
      ...albums.flatMap((album) => [
        createEmptySlide("album", {
          kicker: albumKicker,
          albumIds: [album.id],
          body: "",
        }),
        createEmptySlide("text", {
          kicker: whyKicker,
          headline: whyHeadline(album.title),
          body: album.editorialDescription,
        }),
      ]),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening),
      albums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      pick(copy.captionQuestion),
      buildHashtags(albums, language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
