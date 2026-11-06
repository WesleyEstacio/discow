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

const MAX_COMMUNITY_PICKS = 8

const COPY = {
  pt: {
    coverKicker: [
      (edition: string) => (edition ? `Community Picks · ${edition}` : "Discow Community Picks"),
      (edition: string) => (edition ? `Vocês indicaram · ${edition}` : "Vocês indicaram"),
      (edition: string) => (edition ? `Da comunidade · ${edition}` : "Da comunidade"),
    ],
    coverBody: [
      "A gente perguntou. Vocês responderam.",
      "As indicações de quem acompanha a Discows.",
      "Curadoria feita por vocês.",
    ],
    overviewKicker: ["As respostas", "O que vocês mandaram", "A seleção"],
    overviewHeadline: ["Vocês responderam", "A seleção da comunidade", "Separamos estas"],
    pickKicker: [
      (recommender: string | null) => (recommender ? `Indicado por ${recommender}` : "Indicação da comunidade"),
      (recommender: string | null) => (recommender ? `Escolha de ${recommender}` : "Escolha da comunidade"),
      (recommender: string | null) => (recommender ? `Via ${recommender}` : "Via comunidade"),
    ],
    pickBody: "Escreva por que esse disco responde à pergunta (ou cite a resposta de quem indicou)",
    ctaKicker: ["Próxima edição", "Participe", "Sua indicação aqui"],
    defaultCtaHeadline: [
      "Quer aparecer na próxima edição?",
      "Sua indicação pode ser a próxima",
      "Responda e entre na próxima seleção",
    ],
    ctaBody: [
      "Fique de olho nos stories para a próxima pergunta.",
      "Comente aqui o disco que você indicaria.",
      "Siga a Discows e responda na próxima rodada.",
    ],
    captionOpening: [
      (question: string) => `Perguntamos: “${question}” E vocês responderam:`,
      (question: string) => `“${question}” — as respostas da comunidade:`,
      (question: string) => `A pergunta da vez foi “${question}” Olha o que vocês mandaram:`,
    ],
    captionThanks: "Agradeça aqui a quem participou",
    captionQuestion: [
      "Qual seria a sua resposta?",
      "Que pergunta a gente faz na próxima edição?",
      "Concorda com as escolhas?",
    ],
  },
  en: {
    coverKicker: [
      (edition: string) => (edition ? `Community Picks · ${edition}` : "Discow Community Picks"),
      (edition: string) => (edition ? `You picked · ${edition}` : "You picked"),
      (edition: string) => (edition ? `From the community · ${edition}` : "From the community"),
    ],
    coverBody: ["We asked. You answered.", "Picks from the people who follow Discows.", "Curated by you."],
    overviewKicker: ["The answers", "What you sent", "The selection"],
    overviewHeadline: ["You answered", "The community's selection", "We picked these"],
    pickKicker: [
      (recommender: string | null) => (recommender ? `Picked by ${recommender}` : "Community pick"),
      (recommender: string | null) => (recommender ? `${recommender}'s choice` : "Community choice"),
      (recommender: string | null) => (recommender ? `Via ${recommender}` : "Via the community"),
    ],
    pickBody: "Write why this record answers the question (or quote the person who picked it)",
    ctaKicker: ["Next edition", "Join in", "Your pick here"],
    defaultCtaHeadline: ["Want to be in the next edition?", "Your pick could be next", "Answer and join the next selection"],
    ctaBody: [
      "Watch our stories for the next question.",
      "Comment the record you'd pick.",
      "Follow Discows and answer next round.",
    ],
    captionOpening: [
      (question: string) => `We asked: “${question}” And you answered:`,
      (question: string) => `“${question}” — the community's answers:`,
      (question: string) => `This round's question was “${question}” Here's what you sent:`,
    ],
    captionThanks: "Thank everyone who took part",
    captionQuestion: ["What would your answer be?", "What should we ask next edition?", "Do you agree with the picks?"],
  },
} as const

export const communityPicksTemplate: StudioTemplate = {
  key: "community-picks",
  name: "Discow Community Picks",
  tagline: "Recomendações musicais feitas pela própria comunidade.",
  objective: "Transformar as respostas do público em um carrossel que dá crédito a quem indicou e chama para a próxima edição.",
  slideStructure: [
    "Pergunta para a comunidade",
    "Seleção de respostas",
    "Uma capa por recomendação, com quem recomendou (opcional)",
    "Convite para participar da próxima edição",
  ],
  isAvailable: true,
  defaultIdentityKey: "tropical",
  albumSlots: [
    {
      key: "picks",
      label: "Discos indicados",
      description: `De 2 a ${MAX_COMMUNITY_PICKS} discos indicados pela comunidade. Cada um ganha um slide de capa.`,
      minAlbums: 2,
      maxAlbums: MAX_COMMUNITY_PICKS,
      isOrdered: true,
    },
  ],
  settingFields: [
    {
      key: "question",
      label: "Pergunta feita à comunidade",
      appearsIn: "Título da capa e legenda",
      kind: "text",
      placeholder: "Ex.: Qual disco você ouviria numa viagem de carro?",
      required: true,
    },
    {
      key: "recommenders",
      label: "Quem recomendou (opcional)",
      appearsIn: "Rótulo de cada slide de disco e legenda",
      description: "Um @ por linha, na mesma ordem dos discos marcados. Só use com a autorização de quem indicou.",
      kind: "textarea",
      placeholder: "@fulano\n@ciclana",
    },
    {
      key: "edition",
      label: "Edição (opcional)",
      appearsIn: "Rótulo da capa",
      kind: "text",
      placeholder: "Ex.: #3",
    },
    ...COMMON_SETTING_FIELDS.filter((field) => field.key === "callToAction"),
  ],
  buildCarousel({ albumsBySlot, settings, language, variantSeed }) {
    const copy = COPY[language]
    const pick = createVariantPicker(variantSeed)
    const picks = (albumsBySlot.picks ?? []).slice(0, MAX_COMMUNITY_PICKS)
    if (picks.length < 2) throw new Error("Escolha pelo menos dois discos indicados.")

    const question = settings.question?.trim() || editorPlaceholder(language, "Pergunta para a comunidade", "Question for the community")
    const recommenders = splitSettingLines(settings.recommenders)
    const edition = settings.edition?.trim() ?? ""
    const pickKicker = pick(copy.pickKicker)
    const overviewKicker = pick(copy.overviewKicker)
    const overviewHeadline = pick(copy.overviewHeadline)

    const slides: StudioSlide[] = [
      createEmptySlide("cover", {
        kicker: pick(copy.coverKicker)(edition),
        headline: question,
        body: pick(copy.coverBody),
        albumIds: picks.slice(0, MAX_ALBUMS_PER_GRID_SLIDE).map((album) => album.id),
      }),
      ...chunkAlbums(picks, MAX_ALBUMS_PER_GRID_SLIDE).map((albumsOnSlide) =>
        createEmptySlide("album-grid", {
          kicker: overviewKicker,
          headline: overviewHeadline,
          albumIds: albumsOnSlide.map((album) => album.id),
        })
      ),
      ...picks.map((album, index) =>
        createEmptySlide("album", {
          kicker: pickKicker(recommenders[index] ?? null),
          albumIds: [album.id],
          body: editorPlaceholder(language, COPY.pt.pickBody, COPY.en.pickBody),
        })
      ),
      createEmptySlide("cta", {
        kicker: pick(copy.ctaKicker),
        headline: settings.callToAction?.trim() || pick(copy.defaultCtaHeadline),
        body: pick(copy.ctaBody),
      }),
    ]

    const caption = joinCaptionParagraphs([
      pick(copy.captionOpening)(question),
      picks
        .map((album, index) => `→ ${describeAlbumLine(album)}${recommenders[index] ? ` · ${recommenders[index]}` : ""}`)
        .join("\n"),
      editorPlaceholder(language, COPY.pt.captionThanks, COPY.en.captionThanks),
      pick(copy.captionQuestion),
      buildHashtags(picks, language),
    ])

    return { title: question, slides, caption }
  },
}
