import { createEmptySlide, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  createVariantPicker,
  describeAlbumLine,
  editorPlaceholder,
  joinCaptionParagraphs,
  primaryArtistName,
  splitSettingLines,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const COPY = {
  pt: {
    coverKicker: ["A Closer Listen", "Ouvindo de perto", "Com fone e atenção"],
    defaultCoverHeadline: [
      (albumTitle: string) => `${albumTitle}, ouvido de perto`,
      (albumTitle: string) => `O que você não percebeu em ${albumTitle}`,
      (albumTitle: string) => `Os detalhes escondidos de ${albumTitle}`,
    ],
    coverBody: [
      "Uma leitura atenta, faixa a faixa, detalhe a detalhe.",
      "Coloque o fone. Vamos ouvir de novo.",
      "Tudo o que passa batido na primeira audição.",
    ],
    artworkKicker: ["Capa e título", "Antes do play", "O que a capa diz"],
    artworkBody: "Descreva a capa e o que o título sugere sobre o disco",
    contextKicker: ["Contexto do álbum", "Onde ele nasceu", "O momento"],
    contextHeadline: [
      (artistName: string, releaseYear: number | null) => (releaseYear ? `${artistName} em ${releaseYear}` : `${artistName} naquele momento`),
      () => "Onde esse disco aparece",
      () => "Antes de dar o play",
    ],
    contextBody: "Conte o momento da carreira, da cena ou do mundo em que o disco saiu",
    soundKicker: ["Sonoridade e produção", "Como ele soa", "Por dentro do som"],
    soundHeadline: ["O que está por trás do som", "Preste atenção na produção", "A textura do disco"],
    soundBody: "Descreva timbres, instrumentos, produção e mixagem que fazem esse som",
    tracksKicker: ["Faixas que merecem atenção", "Não pule estas", "Para ouvir com calma"],
    tracksHeadline: ["Volte nestas faixas", "Onde estão os detalhes", "As faixas-chave"],
    tracksBody: "Liste as faixas e o detalhe de cada uma",
    whyKicker: ["Por que ouvir?", "O argumento final", "Vale o play"],
    whyHeadline: [
      "Por que você deveria ouvir esse disco",
      "O que fica depois da última faixa",
      "Por que ele merece a sua atenção",
    ],
    whyBody: "Feche com o motivo principal para alguém dar o play hoje",
    ctaKicker: ["Sua vez", "Ouça de novo", "Conta pra gente"],
    defaultCtaHeadline: [
      "Qual detalhe você percebeu nesse disco?",
      "Qual faixa você ouviria primeiro?",
      "Que disco a gente deveria ouvir de perto?",
    ],
    ctaBody: ["Salve e ouça com fone.", "Conta nos comentários.", "Mande para quem precisa ouvir."],
    captionOpening: [
      (albumLine: string) => `Ouvimos de perto: ${albumLine}.`,
      (albumLine: string) => `Os detalhes que passam batido em ${albumLine}.`,
      (albumLine: string) => `Uma leitura atenta de ${albumLine}.`,
    ],
    captionWhy: "Escreva aqui um resumo da análise em duas frases",
    captionQuestion: ["Qual detalhe você notou?", "Já ouviu esse disco inteiro?", "Qual disco merece a próxima análise?"],
  },
  en: {
    coverKicker: ["A Closer Listen", "Listening closely", "Headphones on"],
    defaultCoverHeadline: [
      (albumTitle: string) => `${albumTitle}, up close`,
      (albumTitle: string) => `What you missed on ${albumTitle}`,
      (albumTitle: string) => `The hidden details of ${albumTitle}`,
    ],
    coverBody: [
      "A careful listen, track by track, detail by detail.",
      "Put your headphones on. Let's listen again.",
      "Everything that slips by on the first listen.",
    ],
    artworkKicker: ["Cover and title", "Before you press play", "What the cover says"],
    artworkBody: "Describe the artwork and what the title suggests about the record",
    contextKicker: ["The context", "Where it came from", "The moment"],
    contextHeadline: [
      (artistName: string, releaseYear: number | null) => (releaseYear ? `${artistName} in ${releaseYear}` : `${artistName} at the time`),
      () => "Where this record fits",
      () => "Before you press play",
    ],
    contextBody: "Describe the moment in the career, the scene or the world when the record came out",
    soundKicker: ["Sound and production", "How it sounds", "Inside the sound"],
    soundHeadline: ["What's behind the sound", "Listen to the production", "The texture of the record"],
    soundBody: "Describe the tones, instruments, production and mix that make this sound",
    tracksKicker: ["Tracks worth your attention", "Don't skip these", "Play these slowly"],
    tracksHeadline: ["Go back to these tracks", "Where the details are", "The key tracks"],
    tracksBody: "List the tracks and the detail in each one",
    whyKicker: ["Why listen?", "The final argument", "Worth the play"],
    whyHeadline: ["Why you should listen to this record", "What stays after the last track", "Why it deserves your attention"],
    whyBody: "Close with the main reason someone should press play today",
    ctaKicker: ["Your turn", "Play it again", "Tell us"],
    defaultCtaHeadline: [
      "Which detail did you notice on this record?",
      "Which track would you play first?",
      "Which record should we listen to next?",
    ],
    ctaBody: ["Save it and listen with headphones.", "Tell us in the comments.", "Send it to someone who needs it."],
    captionOpening: [
      (albumLine: string) => `A closer listen: ${albumLine}.`,
      (albumLine: string) => `The details that slip by on ${albumLine}.`,
      (albumLine: string) => `A careful read of ${albumLine}.`,
    ],
    captionWhy: "Write a two-sentence summary of the analysis",
    captionQuestion: ["Which detail did you notice?", "Have you heard the whole record?", "Which record deserves the next closer listen?"],
  },
} as const

export const aCloserListenTemplate: StudioTemplate = {
  key: "a-closer-listen",
  name: "A Closer Listen",
  tagline: "Uma análise editorial de um álbum, explorando detalhes que talvez passem despercebidos.",
  objective: "Ler um disco com atenção, do visual ao som, e dar ao público motivos concretos para ouvi-lo.",
  slideStructure: [
    "Capa e título",
    "Contexto do álbum",
    "Sonoridade e produção",
    "Faixas que merecem atenção",
    "Citação com fonte (opcional)",
    "Por que você deveria ouvir?",
    "Convite para comentar",
  ],
  isAvailable: true,
  defaultIdentityKey: "editorial",
  albumSlots: [
    {
      key: "album",
      label: "Álbum analisado",
      description: "O disco que o post inteiro vai analisar.",
      minAlbums: 1,
      maxAlbums: 1,
    },
  ],
  settingFields: [
    {
      key: "highlightTracks",
      label: "Faixas que merecem atenção",
      appearsIn: "Slide de faixas e legenda",
      description: "Uma por linha. Vazio = o slide fica para você completar no editor.",
      kind: "textarea",
      placeholder: "Faixa 3 — a virada de bateria no fim\nFaixa 7 — o coro escondido na mixagem",
    },
    {
      key: "quote",
      label: "Citação sobre o disco (opcional)",
      appearsIn: "Slide de citação (só aparece se preenchida)",
      description: "De um integrante, produtor ou crítico. A fonte é obrigatória no editor.",
      kind: "textarea",
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const album = albumsBySlot.album?.[0]
    if (!album) throw new Error("Escolha o álbum que será analisado.")

    const artistName = primaryArtistName(album)
    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)(album.title)
    const highlightTracks = splitSettingLines(settings.highlightTracks)
    const quote = settings.quote?.trim()

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker),
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: [album.id],
        backgroundStyle: "cover-echo",
        coverEchoAnchor: "top",
      }),
      createEmptySlide("album", {
        kicker: pick(copy.artworkKicker),
        albumIds: [album.id],
        body: editorPlaceholder(language, COPY.pt.artworkBody, COPY.en.artworkBody),
      }),
      createEmptySlide("text", {
        kicker: pick(copy.contextKicker),
        headline: pick(copy.contextHeadline)(artistName, album.releaseYear),
        body: editorPlaceholder(language, COPY.pt.contextBody, COPY.en.contextBody),
      }),
      createEmptySlide("text", {
        kicker: pick(copy.soundKicker),
        headline: pick(copy.soundHeadline),
        body: album.editorialDescription || editorPlaceholder(language, COPY.pt.soundBody, COPY.en.soundBody),
      }),
      createEmptySlide("text", {
        kicker: pick(copy.tracksKicker),
        headline: pick(copy.tracksHeadline),
        body: highlightTracks.length
          ? highlightTracks.map((track) => `→ ${track}`).join("\n")
          : editorPlaceholder(language, COPY.pt.tracksBody, COPY.en.tracksBody),
      }),
      ...(quote
        ? [
            createEmptySlide("quote", {
              headline: quote,
              body: editorPlaceholder(language, "Quem disse", "Who said it"),
              requiresSource: true,
            }),
          ]
        : []),
      createEmptySlide("text", {
        kicker: pick(copy.whyKicker),
        headline: pick(copy.whyHeadline),
        body: editorPlaceholder(language, COPY.pt.whyBody, COPY.en.whyBody),
      }),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening)(describeAlbumLine(album)),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      highlightTracks.length ? highlightTracks.map((track) => `→ ${track}`).join("\n") : null,
      pick(copy.captionQuestion),
      buildHashtags([album], language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
