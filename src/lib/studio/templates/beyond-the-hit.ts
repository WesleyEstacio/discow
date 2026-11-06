import { createEmptySlide, MAX_ALBUMS_PER_GRID_SLIDE, type StudioSlide } from "@/lib/studio/slides"
import {
  buildHashtags,
  createVariantPicker,
  editorPlaceholder,
  joinCaptionParagraphs,
  primaryArtistName,
  splitSettingLines,
} from "@/lib/studio/templates/template-helpers"
import { COMMON_SETTING_FIELDS, type StudioTemplate } from "@/lib/studio/templates/types"

const MAX_DEEP_CUTS = 5

// "Less popular" is an editorial read, never a play-count claim, so the copy
// talks about songs that get less attention, not about numbers.
const COPY = {
  pt: {
    coverKicker: ["Beyond the Hit", "Além do hit", "Lado B"],
    defaultCoverHeadline: [
      (artistName: string) => `${artistName} é muito mais que um hit`,
      (artistName: string) => `Você conhece o hit de ${artistName}. E o resto?`,
      (artistName: string) => `As músicas de ${artistName} que ninguém pula`,
    ],
    coverBody: [
      "Faixas que merecem o mesmo play que o sucesso.",
      "Passe do refrão famoso e descubra o resto.",
      "Para quem só conhece a do rádio.",
    ],
    artistKicker: ["Artista em destaque", "Quem é", "Apresentando"],
    artistBody: "Apresente o artista em duas ou três frases e diga por que vale ir além do hit",
    hitKicker: ["O hit que todo mundo conhece", "A mais conhecida", "A do rádio"],
    hitBody: (hitTrack: string) => `“${hitTrack}” é a porta de entrada. Mas o disco guarda mais.`,
    deepCutKicker: [
      (position: number) => `Além do hit · faixa ${position}`,
      (position: number) => `Lado B nº ${position}`,
      (position: number) => `Escute também · ${position}`,
    ],
    deepCutTrackMissing: "Nome da faixa",
    deepCutBody: "Escreva o que essa faixa tem de especial",
    originKicker: ["Os álbuns de origem", "De onde vêm", "Para ouvir inteiro"],
    ctaKicker: ["Convite para explorar", "Agora é com você", "Vá além"],
    defaultCtaHeadline: [
      "Qual faixa escondida você indicaria?",
      "Qual música merecia ser o hit?",
      "Qual lado B você defende?",
    ],
    ctaBody: ["Salve e ouça os discos inteiros.", "Conta a sua nos comentários.", "Mande para quem só conhece o hit."],
    captionOpening: [
      (artistName: string, hitTrack: string) => `Todo mundo conhece “${hitTrack}”. Mas ${artistName} tem muito mais:`,
      (artistName: string, hitTrack: string) => `Para além de “${hitTrack}”: as faixas de ${artistName} que merecem atenção.`,
      (artistName: string) => `${artistName} além do hit:`,
    ],
    captionWhy: "Escreva aqui o que liga essas faixas",
    captionQuestion: ["Qual faixa você colocaria aqui?", "Já conhecia alguma?", "Qual devia ter sido o hit?"],
  },
  en: {
    coverKicker: ["Beyond the Hit", "Past the single", "B-sides"],
    defaultCoverHeadline: [
      (artistName: string) => `${artistName} is way more than one hit`,
      (artistName: string) => `You know ${artistName}'s hit. What about the rest?`,
      (artistName: string) => `The ${artistName} songs nobody skips`,
    ],
    coverBody: [
      "Tracks that deserve the same plays as the single.",
      "Get past the famous chorus and find the rest.",
      "For anyone who only knows the radio one.",
    ],
    artistKicker: ["Featured artist", "Who they are", "Introducing"],
    artistBody: "Introduce the artist in two or three sentences and say why it's worth going past the hit",
    hitKicker: ["The hit everyone knows", "The best known", "The radio one"],
    hitBody: (hitTrack: string) => `“${hitTrack}” is the way in. But the record holds more.`,
    deepCutKicker: [
      (position: number) => `Beyond the hit · track ${position}`,
      (position: number) => `B-side no. ${position}`,
      (position: number) => `Also play · ${position}`,
    ],
    deepCutTrackMissing: "Track name",
    deepCutBody: "Write what makes this track special",
    originKicker: ["Where they come from", "The source albums", "Play them in full"],
    ctaKicker: ["Keep exploring", "Your turn", "Go further"],
    defaultCtaHeadline: [
      "Which hidden track would you recommend?",
      "Which song should have been the hit?",
      "Which deep cut do you stand by?",
    ],
    ctaBody: ["Save it and play the full records.", "Tell us yours in the comments.", "Send it to someone who only knows the hit."],
    captionOpening: [
      (artistName: string, hitTrack: string) => `Everyone knows “${hitTrack}”. But ${artistName} has so much more:`,
      (artistName: string, hitTrack: string) => `Beyond “${hitTrack}”: the ${artistName} tracks that deserve attention.`,
      (artistName: string) => `${artistName}, beyond the hit:`,
    ],
    captionWhy: "Write what ties these tracks together",
    captionQuestion: ["Which track would you add?", "Did you know any of them?", "Which one should have been the hit?"],
  },
} as const

export const beyondTheHitTemplate: StudioTemplate = {
  key: "beyond-the-hit",
  name: "Beyond the Hit",
  tagline: "Músicas que merecem atenção além dos maiores sucessos de um artista.",
  objective: "Mostrar faixas menos lembradas de um artista, partindo do hit que o público já conhece.",
  slideStructure: [
    "Artista em destaque",
    "Música mais conhecida",
    "Uma faixa menos lembrada por slide, com o álbum de origem",
    "Álbuns de origem para ouvir inteiros",
    "Convite para explorar",
  ],
  isAvailable: true,
  defaultIdentityKey: "thrift-store",
  albumSlots: [
    {
      key: "hit",
      label: "Álbum do hit",
      description: "O disco de onde vem a música mais conhecida.",
      minAlbums: 1,
      maxAlbums: 1,
    },
    {
      key: "deepCuts",
      label: "Álbuns de origem das faixas",
      description: `De 1 a ${MAX_DEEP_CUTS} discos, um por faixa e na mesma ordem das faixas. O álbum do hit também pode entrar aqui.`,
      minAlbums: 1,
      maxAlbums: MAX_DEEP_CUTS,
      isOrdered: true,
    },
  ],
  settingFields: [
    {
      key: "hitTrack",
      label: "Música mais conhecida",
      appearsIn: "Slide do hit e legenda",
      kind: "text",
      placeholder: "Ex.: Wonderwall",
      required: true,
    },
    {
      key: "deepCutTracks",
      label: "Faixas menos lembradas",
      appearsIn: "Um slide por faixa",
      description: "Uma faixa por linha, na mesma ordem dos álbuns de origem marcados.",
      kind: "textarea",
      placeholder: "Faixa do 1º álbum\nFaixa do 2º álbum",
    },
    {
      key: "artistName",
      label: "Artista",
      appearsIn: "Capa, slide do artista e legenda",
      kind: "text",
      placeholder: "Vazio = artista do álbum do hit",
    },
    ...COMMON_SETTING_FIELDS,
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const hitAlbum = albumsBySlot.hit?.[0]
    const deepCutAlbums = (albumsBySlot.deepCuts ?? []).slice(0, MAX_DEEP_CUTS)
    if (!hitAlbum || deepCutAlbums.length === 0) {
      throw new Error("Escolha o álbum do hit e pelo menos um álbum de origem.")
    }

    const hitTrack = settings.hitTrack?.trim() || editorPlaceholder(language, "Nome do hit", "Hit name")
    const deepCutTracks = splitSettingLines(settings.deepCutTracks)
    const artistName = settings.artistName?.trim() || primaryArtistName(hitAlbum)
    const coverHeadline = settings.theme?.trim() || pick(copy.defaultCoverHeadline)(artistName)
    const deepCutKicker = pick(copy.deepCutKicker)
    const deepCutTrackNames = deepCutAlbums.map(
      (_album, index) => deepCutTracks[index] ?? editorPlaceholder(language, COPY.pt.deepCutTrackMissing, COPY.en.deepCutTrackMissing)
    )

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker),
        headline: coverHeadline,
        body: pick(copy.coverBody),
        albumIds: [...new Set([hitAlbum.id, ...deepCutAlbums.map((album) => album.id)])].slice(0, MAX_ALBUMS_PER_GRID_SLIDE),
      }),
      createEmptySlide("text", {
        kicker: pick(copy.artistKicker),
        headline: artistName,
        body: editorPlaceholder(language, COPY.pt.artistBody, COPY.en.artistBody),
      }),
      createEmptySlide("album", {
        kicker: pick(copy.hitKicker),
        headline: `“${hitTrack}”`,
        albumIds: [hitAlbum.id],
        body: copy.hitBody(hitTrack),
      }),
      ...deepCutAlbums.map((album, index) =>
        createEmptySlide("album", {
          kicker: deepCutKicker(index + 1),
          headline: `“${deepCutTrackNames[index]}”`,
          albumIds: [album.id],
          body: editorPlaceholder(language, COPY.pt.deepCutBody, COPY.en.deepCutBody),
        })
      ),
      createEmptySlide("album-list", {
        kicker: pick(copy.originKicker),
        headline: artistName,
        albumIds: deepCutAlbums.map((album) => album.id),
      }),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening)(artistName, hitTrack),
      deepCutAlbums.map((album, index) => `→ “${deepCutTrackNames[index]}” (${album.title})`).join("\n"),
      editorPlaceholder(language, COPY.pt.captionWhy, COPY.en.captionWhy),
      pick(copy.captionQuestion),
      buildHashtags([hitAlbum, ...deepCutAlbums], language),
    ])

    return { title: coverHeadline, slides, caption }
  },
}
