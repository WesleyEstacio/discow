import { createEmptySlide, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
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
    coverKicker: "Injustamente subestimados",
    defaultCoverHeadline: "Discos que mereciam muito mais atenção",
    coverBody: "Na nossa opinião, esses passaram batido.",
    albumKicker: "Ouça com atenção",
    whyKicker: "Por que merece atenção",
    whyHeadline: (albumTitle: string) => `O que faz ${albumTitle} especial`,
    ctaKicker: "Sua vez",
    defaultCtaHeadline: "Qual disco você acha injustamente esquecido?",
    ctaBody: "Salve e dê o play hoje.",
    captionOpening: "Discos que, na nossa opinião, mereciam muito mais atenção:",
    captionWhy: "Escreva aqui o que esses discos têm em comum",
    captionQuestion: "Qual você colocaria nessa lista?",
  },
  en: {
    coverKicker: "Unfairly underrated",
    defaultCoverHeadline: "Records that deserved way more attention",
    coverBody: "In our opinion, these slipped under the radar.",
    albumKicker: "Listen closely",
    whyKicker: "Why it deserves attention",
    whyHeadline: (albumTitle: string) => `What makes ${albumTitle} special`,
    ctaKicker: "Your turn",
    defaultCtaHeadline: "Which record do you think was unfairly overlooked?",
    ctaBody: "Save it and press play today.",
    captionOpening: "Records that, in our opinion, deserved way more attention:",
    captionWhy: "Write what these records have in common",
    captionQuestion: "Which one would you add to this list?",
  },
}

export const unfairlyUnderratedTemplate: StudioTemplate = {
  key: "unfairly-underrated",
  name: "Injustamente Subestimados",
  tagline: "Discos que merecem mais atenção — como opinião editorial.",
  objective: "Destacar álbuns que merecem mais reconhecimento, sem tratar 'subestimado' como estatística.",
  slideStructure: ["Título marcante", "Capa, artista e título", "Por que merece atenção", "Convite para ouvir"],
  isAvailable: true,
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
  buildCarousel({ albumsBySlot, settings, language }) {
    const copy = COPY[language]
    const albums = (albumsBySlot.albums ?? []).slice(0, MAX_UNDERRATED_ALBUMS)
    if (albums.length === 0) throw new Error("Escolha pelo menos um álbum.")

    const coverHeadline = settings.theme?.trim() || copy.defaultCoverHeadline

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: copy.coverKicker,
        headline: coverHeadline,
        body: copy.coverBody,
        albumIds: albums.slice(0, 3).map((album) => album.id),
        backgroundKey: "ember",
        backgroundStyle: "gradient",
      }),
      ...albums.flatMap((album) => [
        createEmptySlide("album", {
          kicker: copy.albumKicker,
          albumIds: [album.id],
          body: "",
          backgroundKey: "ink",
        }),
        createEmptySlide("text", {
          kicker: copy.whyKicker,
          headline: copy.whyHeadline(album.title),
          body: album.editorialDescription,
          backgroundKey: "paper",
        }),
      ]),
      createEmptySlide("cta", {
        kicker: copy.ctaKicker,
        headline: settings.callToAction?.trim() || copy.defaultCtaHeadline,
        body: copy.ctaBody,
        backgroundKey: "ember",
        textAlign: "center",
      }),
    ]

    const caption = joinCaptionParagraphs([
      copy.captionOpening,
      albums.map((album) => `→ ${describeAlbumLine(album)}`).join("\n"),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      copy.captionQuestion,
      buildHashtags(albums, language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
