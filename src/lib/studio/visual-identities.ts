import type {
  BackgroundStyle,
  KickerStyle,
  SlideBackgroundKey,
  SlideComposition,
  SlideLayout,
  StudioSlide,
  TypeStyle,
} from "@/lib/studio/slides"
import { isTextDrivenComposition, SLIDE_COMPOSITIONS_BY_LAYOUT } from "@/lib/studio/slides"

// A slide's role decides which colors and texture it gets from an identity,
// so the same identity looks coherent across every format.
type SlideRole = "cover" | "feature" | "support" | "collection" | "closing"

const ROLE_BY_LAYOUT: Record<SlideLayout, SlideRole> = {
  cover: "cover",
  album: "feature",
  "ranked-album": "feature",
  "album-pair": "feature",
  text: "support",
  quote: "support",
  "album-grid": "collection",
  "album-list": "collection",
  cta: "closing",
}

type CompositionChoice = { [Layout in SlideLayout]: (typeof SLIDE_COMPOSITIONS_BY_LAYOUT)[Layout][number] }

export type VisualIdentity = {
  key: string
  label: string
  description: string
  palette: Record<SlideRole, SlideBackgroundKey[]>
  backgroundStyles: Record<SlideRole, BackgroundStyle>
  compositions: CompositionChoice
  typeStyle: TypeStyle
  kickerStyle: KickerStyle
  albumCoverRadius: number
  centeredRoles: SlideRole[]
  showProgress: boolean
}

export const VISUAL_IDENTITIES = [
  {
    key: "late-night",
    label: "Madrugada",
    description: "Escuro, brilho rosa e discos de vinil saindo da capa.",
    palette: { cover: ["ink"], feature: ["plum", "ink"], support: ["midnight"], collection: ["ink"], closing: ["magenta"] },
    backgroundStyles: { cover: "blurred-covers", feature: "glow", support: "solid", collection: "glow", closing: "gradient" },
    compositions: {
      cover: "collage",
      album: "vinyl",
      "ranked-album": "classic",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "classic",
      text: "classic",
      quote: "classic",
      cta: "classic",
    },
    typeStyle: "bold",
    kickerStyle: "dot",
    albumCoverRadius: 0,
    centeredRoles: ["closing"],
    showProgress: true,
  },
  {
    key: "editorial",
    label: "Editorial",
    description: "Papel, moldura fina e títulos leves, como uma revista.",
    palette: { cover: ["paper"], feature: ["cream", "paper"], support: ["sand"], collection: ["paper"], closing: ["charcoal"] },
    backgroundStyles: { cover: "blurred-covers", feature: "solid", support: "solid", collection: "frame", closing: "solid" },
    compositions: {
      cover: "type",
      album: "side",
      "ranked-album": "side",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "classic",
      text: "accent-bar",
      quote: "classic",
      cta: "minimal",
    },
    typeStyle: "light",
    kickerStyle: "line",
    albumCoverRadius: 0,
    centeredRoles: [],
    showProgress: false,
  },
  {
    key: "pop",
    label: "Pop",
    description: "Cores fortes, listras, caixa alta e capas em mosaico.",
    palette: { cover: ["magenta"], feature: ["lime", "sky", "coral"], support: ["violet"], collection: ["mustard"], closing: ["lime"] },
    backgroundStyles: { cover: "blurred-covers", feature: "split", support: "stripes", collection: "split", closing: "stripes" },
    compositions: {
      cover: "mosaic",
      album: "poster",
      "ranked-album": "giant-number",
      "album-pair": "diagonal",
      "album-grid": "tight",
      "album-list": "cards",
      text: "card",
      quote: "card",
      cta: "outline",
    },
    typeStyle: "caps",
    kickerStyle: "pill",
    albumCoverRadius: 6,
    centeredRoles: ["feature", "closing"],
    showProgress: true,
  },
  {
    key: "thrift-store",
    label: "Sebo",
    description: "Tons quentes de sebo de discos, ondas e capas empilhadas.",
    palette: { cover: ["mustard"], feature: ["cocoa", "terracotta"], support: ["cream"], collection: ["cocoa"], closing: ["terracotta"] },
    backgroundStyles: { cover: "blurred-covers", feature: "rings", support: "solid", collection: "rings", closing: "rings" },
    compositions: {
      cover: "stack",
      album: "vinyl",
      "ranked-album": "side",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "cards",
      text: "accent-bar",
      quote: "card",
      cta: "outline",
    },
    typeStyle: "wide",
    kickerStyle: "line",
    albumCoverRadius: 3,
    centeredRoles: ["closing"],
    showProgress: true,
  },
  {
    key: "minimal",
    label: "Minimal",
    description: "Grafite e osso, uma capa por vez e muito respiro.",
    palette: { cover: ["charcoal"], feature: ["charcoal", "bone"], support: ["bone"], collection: ["charcoal"], closing: ["bone"] },
    backgroundStyles: { cover: "blurred-covers", feature: "solid", support: "solid", collection: "solid", closing: "solid" },
    compositions: {
      cover: "spotlight",
      album: "classic",
      "ranked-album": "classic",
      "album-pair": "diagonal",
      "album-grid": "tight",
      "album-list": "classic",
      text: "classic",
      quote: "classic",
      cta: "minimal",
    },
    typeStyle: "light",
    kickerStyle: "plain",
    albumCoverRadius: 0,
    centeredRoles: ["cover", "feature", "closing"],
    showProgress: false,
  },
  {
    key: "paint-chip",
    label: "Amostra de cor",
    description: "Capas como amostras de tinta, em leque e em cartões brancos.",
    palette: { cover: ["magenta"], feature: ["blush", "cream"], support: ["lilac"], collection: ["violet"], closing: ["magenta"] },
    backgroundStyles: { cover: "solid", feature: "solid", support: "solid", collection: "solid", closing: "solid" },
    compositions: {
      cover: "fan-deck",
      album: "poster",
      "ranked-album": "giant-number",
      "album-pair": "diagonal",
      "album-grid": "swatch-cards",
      "album-list": "cards",
      text: "card",
      quote: "card",
      cta: "grid",
    },
    typeStyle: "bold",
    kickerStyle: "pill",
    albumCoverRadius: 0,
    centeredRoles: ["cover", "collection", "closing"],
    showProgress: true,
  },
  {
    key: "mixtape",
    label: "Mixtape",
    description: "Fita cassete, capas presas com fita crepe e encarte de Lado A e B.",
    palette: { cover: ["olive"], feature: ["olive", "charcoal"], support: ["olive"], collection: ["charcoal"], closing: ["mustard"] },
    backgroundStyles: { cover: "glow", feature: "solid", support: "solid", collection: "solid", closing: "solid" },
    compositions: {
      cover: "cassette",
      album: "taped",
      "ranked-album": "side",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "j-card",
      text: "notebook",
      quote: "card",
      cta: "checklist",
    },
    typeStyle: "bold",
    kickerStyle: "line",
    albumCoverRadius: 0,
    centeredRoles: ["feature", "closing"],
    showProgress: true,
  },
  {
    key: "podium",
    label: "Pódio",
    description: "Cerimônia de premiação: pódio na capa, medalhas, certificado e placar.",
    palette: { cover: ["wine"], feature: ["wine", "ink"], support: ["wine"], collection: ["ink"], closing: ["wine"] },
    backgroundStyles: { cover: "glow", feature: "glow", support: "solid", collection: "solid", closing: "glow" },
    compositions: {
      cover: "podium",
      album: "poster",
      "ranked-album": "rosette",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "leaderboard",
      text: "certificate",
      quote: "card",
      cta: "grid",
    },
    typeStyle: "bold",
    kickerStyle: "pill",
    albumCoverRadius: 0,
    centeredRoles: ["cover", "feature", "support", "closing"],
    showProgress: true,
  },
  {
    key: "full-bleed",
    label: "Tela cheia",
    description: "A capa ocupa o slide, o fundo nasce das cores do disco e cada álbum vira a tela de um player.",
    palette: { cover: ["charcoal"], feature: ["charcoal"], support: ["charcoal"], collection: ["charcoal"], closing: ["charcoal"] },
    backgroundStyles: {
      cover: "full-cover",
      feature: "blurred-covers",
      support: "blurred-covers",
      collection: "blurred-covers",
      closing: "blurred-covers",
    },
    compositions: {
      cover: "type",
      album: "now-playing",
      "ranked-album": "classic",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "cover-tiles",
      text: "classic",
      quote: "classic",
      cta: "classic",
    },
    typeStyle: "bold",
    kickerStyle: "plain",
    albumCoverRadius: 2,
    centeredRoles: ["feature", "collection", "closing"],
    showProgress: false,
  },
  {
    key: "neon",
    label: "Neon",
    description: "Azul profundo, amarelo elétrico e números gigantes.",
    palette: { cover: ["cobalt"], feature: ["midnight", "cobalt"], support: ["violet"], collection: ["midnight"], closing: ["cobalt"] },
    backgroundStyles: { cover: "blurred-covers", feature: "glow", support: "gradient", collection: "glow", closing: "gradient" },
    compositions: {
      cover: "poster",
      album: "side",
      "ranked-album": "giant-number",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "cards",
      text: "card",
      quote: "card",
      cta: "outline",
    },
    typeStyle: "caps",
    kickerStyle: "pill",
    albumCoverRadius: 14,
    centeredRoles: [],
    showProgress: true,
  },
  {
    key: "tropical",
    label: "Tropical",
    description: "Verde, menta e coral, com cantos arredondados.",
    palette: { cover: ["forest"], feature: ["teal", "forest"], support: ["mint"], collection: ["teal"], closing: ["coral"] },
    backgroundStyles: { cover: "blurred-covers", feature: "glow", support: "solid", collection: "split", closing: "split" },
    compositions: {
      cover: "mosaic",
      album: "poster",
      "ranked-album": "classic",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "classic",
      text: "card",
      quote: "classic",
      cta: "classic",
    },
    typeStyle: "bold",
    kickerStyle: "pill",
    albumCoverRadius: 10,
    centeredRoles: ["feature", "closing"],
    showProgress: true,
  },
  {
    key: "ember",
    label: "Brasa",
    description: "Laranja queimado e vinho, com títulos de pôster.",
    palette: { cover: ["ember"], feature: ["wine", "ink"], support: ["sand"], collection: ["wine"], closing: ["ember"] },
    backgroundStyles: { cover: "blurred-covers", feature: "gradient", support: "solid", collection: "gradient", closing: "stripes" },
    compositions: {
      cover: "spotlight",
      album: "classic",
      "ranked-album": "giant-number",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "classic",
      text: "accent-bar",
      quote: "card",
      cta: "classic",
    },
    typeStyle: "caps",
    kickerStyle: "dot",
    albumCoverRadius: 0,
    centeredRoles: ["closing"],
    showProgress: true,
  },
  {
    key: "pastel",
    label: "Pastel",
    description: "Lilás, rosado e menta, delicado e com capas redondas.",
    palette: { cover: ["lilac"], feature: ["blush", "mint"], support: ["lilac"], collection: ["blush"], closing: ["violet"] },
    backgroundStyles: { cover: "blurred-covers", feature: "solid", support: "solid", collection: "solid", closing: "glow" },
    compositions: {
      cover: "stack",
      album: "classic",
      "ranked-album": "side",
      "album-pair": "diagonal",
      "album-grid": "classic",
      "album-list": "cards",
      text: "card",
      quote: "card",
      cta: "outline",
    },
    typeStyle: "light",
    kickerStyle: "pill",
    albumCoverRadius: 50,
    centeredRoles: ["cover", "closing"],
    showProgress: false,
  },
] as const satisfies readonly VisualIdentity[]

export type VisualIdentityKey = (typeof VISUAL_IDENTITIES)[number]["key"]

export const SURPRISE_IDENTITY_KEY = "surprise"

export function findVisualIdentity(identityKey: string): VisualIdentity | null {
  return VISUAL_IDENTITIES.find((identity) => identity.key === identityKey) ?? null
}

export function pickRandomVisualIdentity(): VisualIdentity {
  return VISUAL_IDENTITIES[Math.floor(Math.random() * VISUAL_IDENTITIES.length)]!
}

export function identitySwatchColors(identity: VisualIdentity): SlideBackgroundKey[] {
  return [...new Set([identity.palette.cover[0]!, ...identity.palette.feature, identity.palette.closing[0]!])].slice(0, 4)
}

// Restyles every slide while keeping its content (texts, albums, sources and
// background image). When a template picked a color on purpose, like the
// color of a Color Me Discows post, keepCustomBackgrounds preserves it.
export function applyVisualIdentity(
  slides: StudioSlide[],
  identity: VisualIdentity,
  { keepCustomBackgrounds }: { keepCustomBackgrounds: boolean }
): StudioSlide[] {
  const slideCountByRole: Partial<Record<SlideRole, number>> = {}

  return slides.map((slide) => {
    const role = ROLE_BY_LAYOUT[slide.layout]
    const positionInRole = slideCountByRole[role] ?? 0
    slideCountByRole[role] = positionInRole + 1
    const rolePalette = identity.palette[role]
    const composition: SlideComposition = isTextDrivenComposition(slide.composition)
      ? slide.composition
      : identity.compositions[slide.layout]

    return {
      ...slide,
      backgroundKey: rolePalette[positionInRole % rolePalette.length]!,
      customBackgroundHex: keepCustomBackgrounds ? slide.customBackgroundHex : null,
      backgroundStyle: slide.backgroundStyle === "cover-echo" ? slide.backgroundStyle : identity.backgroundStyles[role],
      composition,
      typeStyle: identity.typeStyle,
      kickerStyle: identity.kickerStyle,
      albumCoverRadius: identity.albumCoverRadius,
      textAlign: identity.centeredRoles.includes(role) ? "center" : "left",
      contentPosition: "auto",
      accentHex: null,
      customTextHex: null,
      firstPairWordHex: null,
      secondPairWordHex: null,
      showProgress: identity.showProgress,
    }
  })
}
