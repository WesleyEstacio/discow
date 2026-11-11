import { z } from "zod"
import { DEFAULT_SLIDE_FONTS, slideFontsSchema } from "@/lib/studio/studio-fonts"

export const SLIDE_WIDTH = 1080
export const SLIDE_HEIGHT = 1350
export const MAX_SLIDES_PER_POST = 20
export const MAX_ALBUMS_PER_GRID_SLIDE = 4
export const MAX_ALBUMS_PER_LIST_SLIDE = 8
export const MAX_ALBUMS_PER_COVER_SLIDE = 6

export const SLIDE_LAYOUTS = ["cover", "album", "ranked-album", "album-pair", "album-grid", "album-list", "text", "quote", "cta"] as const
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number]

export const SLIDE_LAYOUT_LABELS: Record<SlideLayout, string> = {
  cover: "Capa",
  album: "Álbum",
  "ranked-album": "Álbum numerado",
  "album-pair": "Par de álbuns",
  "album-grid": "Grade de álbuns",
  "album-list": "Lista de álbuns",
  text: "Texto",
  quote: "Citação",
  cta: "Chamada final",
}

export const MAX_ALBUMS_BY_LAYOUT: Record<SlideLayout, number> = {
  cover: MAX_ALBUMS_PER_COVER_SLIDE,
  album: 1,
  "ranked-album": 1,
  "album-pair": 2,
  "album-grid": MAX_ALBUMS_PER_GRID_SLIDE,
  "album-list": MAX_ALBUMS_PER_LIST_SLIDE,
  text: 0,
  quote: 0,
  cta: 0,
}

export const SLIDE_BACKGROUNDS = {
  ink: { label: "Tinta", background: "#120f17", text: "#f7f5fa", mutedText: "#a9a1b6", accent: "#e879c9" },
  plum: { label: "Ameixa", background: "#2a1433", text: "#fbf3fb", mutedText: "#cdb3cf", accent: "#ff8fcf" },
  midnight: { label: "Meia-noite", background: "#0e1626", text: "#f2f6fb", mutedText: "#9fb0c6", accent: "#7cc4ff" },
  forest: { label: "Floresta", background: "#10201a", text: "#f1f7f3", mutedText: "#a3bdb0", accent: "#9be3b5" },
  magenta: { label: "Magenta", background: "#c2268f", text: "#fff7fb", mutedText: "#ffd3ec", accent: "#1a0b1f" },
  ember: { label: "Brasa", background: "#d9532b", text: "#fff8f3", mutedText: "#ffd9c7", accent: "#1f0d07" },
  paper: { label: "Papel", background: "#f4efe8", text: "#17121b", mutedText: "#6e6573", accent: "#b0207e" },
  bone: { label: "Osso", background: "#e7e1f0", text: "#17121b", mutedText: "#5f566a", accent: "#7a1d6e" },
  wine: { label: "Vinho", background: "#3a0f1c", text: "#fdf2f4", mutedText: "#d9a7b4", accent: "#ff7a90" },
  cobalt: { label: "Cobalto", background: "#12236b", text: "#f2f5ff", mutedText: "#a9b6e8", accent: "#ffd23f" },
  teal: { label: "Petróleo", background: "#0b3b3c", text: "#effbfa", mutedText: "#9cc9c6", accent: "#ffb36b" },
  charcoal: { label: "Grafite", background: "#1c1c1e", text: "#f5f5f5", mutedText: "#a1a1a6", accent: "#e5e5e5" },
  cocoa: { label: "Cacau", background: "#2b1d14", text: "#fbf3ea", mutedText: "#cdb59f", accent: "#f2a65a" },
  olive: { label: "Oliva", background: "#4a5a2a", text: "#f6f7ec", mutedText: "#c6cca6", accent: "#f2c94c" },
  violet: { label: "Violeta", background: "#6d3df5", text: "#f7f3ff", mutedText: "#d3c6ff", accent: "#c8f04a" },
  terracotta: { label: "Terracota", background: "#b5532f", text: "#fff6ef", mutedText: "#f6cdb8", accent: "#2b1d14" },
  coral: { label: "Coral", background: "#ff6f59", text: "#1d0b08", mutedText: "#5e241b", accent: "#fff3e0" },
  mustard: { label: "Mostarda", background: "#e7b10a", text: "#1e1600", mutedText: "#5c4600", accent: "#8a1c1c" },
  lime: { label: "Lima", background: "#c8f04a", text: "#12170a", mutedText: "#4c5a20", accent: "#3b1d8f" },
  sky: { label: "Céu", background: "#7cc4ff", text: "#0b1a2b", mutedText: "#2f4b66", accent: "#a3156f" },
  cream: { label: "Creme", background: "#fbf1d9", text: "#2a1d0c", mutedText: "#7a6648", accent: "#c2410c" },
  sand: { label: "Areia", background: "#e9d8bf", text: "#2a1d0c", mutedText: "#6e5b44", accent: "#8a1c1c" },
  mint: { label: "Menta", background: "#d7f2e3", text: "#0f2a1e", mutedText: "#4d6e5d", accent: "#0f766e" },
  lilac: { label: "Lilás", background: "#e3d7ff", text: "#1d1238", mutedText: "#5d4f80", accent: "#6d3df5" },
  blush: { label: "Rosado", background: "#fbd9df", text: "#3a0f1c", mutedText: "#8a4b5a", accent: "#c2268f" },
} as const

export type SlideBackgroundKey = keyof typeof SLIDE_BACKGROUNDS
export const SLIDE_BACKGROUND_KEYS = Object.keys(SLIDE_BACKGROUNDS) as SlideBackgroundKey[]

export const BACKGROUND_STYLES = [
  "solid",
  "glow",
  "gradient",
  "stripes",
  "rings",
  "split",
  "soft-split",
  "two-tone",
  "frame",
  "blurred-covers",
  "blurred-covers-split",
  "cover-echo",
] as const
export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number]
export const BACKGROUND_STYLE_LABELS: Record<BackgroundStyle, string> = {
  solid: "Liso",
  glow: "Brilho",
  gradient: "Degradê",
  stripes: "Listras",
  rings: "Ondas",
  split: "Diagonal",
  "soft-split": "Diagonal desfocada",
  "two-tone": "Duas cores",
  frame: "Moldura",
  "blurred-covers": "Capas desfocadas",
  "blurred-covers-split": "Capas desfocadas na diagonal",
  "cover-echo": "Eco da capa",
}

export function usesBlurredCoversBackground(backgroundStyle: BackgroundStyle): boolean {
  return backgroundStyle === "blurred-covers" || backgroundStyle === "blurred-covers-split"
}

export const MAX_BACKGROUND_SEED = 9999

// Each layout can be arranged in a few ways. The first option is the
// original arrangement, so slides saved before compositions existed keep it.
export const SLIDE_COMPOSITIONS_BY_LAYOUT = {
  cover: ["collage", "spotlight", "mosaic", "stack", "poster", "type", "fan-deck", "cassette"],
  album: ["classic", "side", "vinyl", "poster", "taped"],
  "ranked-album": ["classic", "giant-number", "side"],
  "album-pair": ["diagonal", "mirrored", "from-to", "from-to-mirrored"],
  "album-grid": ["classic", "tight", "swatch-cards"],
  "album-list": ["classic", "cards", "j-card"],
  text: ["classic", "card", "accent-bar", "notebook"],
  quote: ["classic", "card"],
  cta: ["classic", "outline", "minimal", "subtle", "checklist", "grid"],
} as const satisfies Record<SlideLayout, readonly string[]>

export type SlideComposition = (typeof SLIDE_COMPOSITIONS_BY_LAYOUT)[SlideLayout][number]
export const SLIDE_COMPOSITIONS = [...new Set(Object.values(SLIDE_COMPOSITIONS_BY_LAYOUT).flat())] as SlideComposition[]

export const SLIDE_COMPOSITION_LABELS: Record<SlideComposition, string> = {
  collage: "Colagem",
  spotlight: "Destaque",
  mosaic: "Mosaico",
  stack: "Pilha",
  poster: "Pôster",
  type: "Tipográfica",
  "fan-deck": "Leque de amostras",
  cassette: "Fita cassete",
  taped: "Colado com fita",
  "j-card": "Encarte de fita",
  notebook: "Caderno",
  classic: "Clássico",
  side: "Lado a lado",
  vinyl: "Vinil",
  "giant-number": "Número gigante",
  tight: "Colado",
  "swatch-cards": "Amostras de tinta",
  cards: "Cartões",
  card: "Cartão",
  "accent-bar": "Barra lateral",
  outline: "Contorno",
  minimal: "Minimalista",
  subtle: "Discreta",
  checklist: "Lista para completar",
  grid: "Grade",
  diagonal: "Diagonal",
  mirrored: "Diagonal invertida",
  "from-to": "From → To",
  "from-to-mirrored": "From → To invertido",
}

// These compositions turn the kicker and headline into giant words, so the
// slide text was written for them and a visual identity must not swap them out.
const TEXT_DRIVEN_COMPOSITIONS: readonly SlideComposition[] = ["from-to", "from-to-mirrored"]

export function isTextDrivenComposition(composition: SlideComposition): boolean {
  return TEXT_DRIVEN_COMPOSITIONS.includes(composition)
}

export function resolveSlideComposition(slide: Pick<StudioSlide, "layout" | "composition">): SlideComposition {
  const availableCompositions: readonly SlideComposition[] = SLIDE_COMPOSITIONS_BY_LAYOUT[slide.layout]
  return availableCompositions.includes(slide.composition) ? slide.composition : availableCompositions[0]!
}

export const TYPE_STYLES = ["bold", "light", "caps", "wide"] as const
export type TypeStyle = (typeof TYPE_STYLES)[number]
export const TYPE_STYLE_LABELS: Record<TypeStyle, string> = {
  bold: "Forte",
  light: "Leve",
  caps: "Caixa alta",
  wide: "Espaçada",
}

export const KICKER_STYLES = ["dot", "pill", "line", "plain"] as const
export type KickerStyle = (typeof KICKER_STYLES)[number]
export const KICKER_STYLE_LABELS: Record<KickerStyle, string> = {
  dot: "Ponto",
  pill: "Etiqueta",
  line: "Linha",
  plain: "Simples",
}

export const BRAND_MARK_STYLES = ["text", "logo"] as const
export type BrandMarkStyle = (typeof BRAND_MARK_STYLES)[number]
export const BRAND_MARK_STYLE_LABELS: Record<BrandMarkStyle, string> = {
  text: "Atual (discows.)",
  logo: "Novo logo",
}

export const SLIDE_ZONES = ["top", "content", "bottom"] as const
export type SlideZone = (typeof SLIDE_ZONES)[number]
export const SLIDE_ZONE_LABELS: Record<SlideZone, string> = {
  top: "Topo",
  content: "Junto do texto",
  bottom: "Embaixo",
}

export const LOGO_POSITIONS = ["auto", ...SLIDE_ZONES] as const
export type LogoPosition = (typeof LOGO_POSITIONS)[number]
export const LOGO_POSITION_LABELS: Record<LogoPosition, string> = { auto: "Automático", ...SLIDE_ZONE_LABELS }

export const LOGO_SIZES = ["small", "medium", "large"] as const
export type LogoSize = (typeof LOGO_SIZES)[number]
export const LOGO_SIZE_LABELS: Record<LogoSize, string> = { small: "P", medium: "M", large: "G" }
export const LOGO_SIZE_SCALE: Record<LogoSize, number> = { small: 0.75, medium: 1, large: 1.35 }

export function resolveLogoZone(slide: Pick<StudioSlide, "layout" | "logoPosition">): SlideZone {
  if (slide.logoPosition !== "auto") return slide.logoPosition
  return slide.layout === "cta" ? "content" : "top"
}

export const LOGO_ALIGNMENTS = ["auto", "left", "center", "right"] as const
export type LogoAlignment = (typeof LOGO_ALIGNMENTS)[number]
export type ResolvedLogoAlignment = Exclude<LogoAlignment, "auto">
export const LOGO_ALIGNMENT_LABELS: Record<LogoAlignment, string> = {
  auto: "Automático",
  left: "Esquerda",
  center: "Centro",
  right: "Direita",
}

export function resolveLogoAlignment(
  slide: Pick<StudioSlide, "layout" | "logoPosition" | "logoAlignment" | "textAlign">
): ResolvedLogoAlignment {
  if (slide.logoAlignment !== "auto") return slide.logoAlignment
  if (resolveLogoZone(slide) === "top") return "right"
  return slide.textAlign === "center" ? "center" : "left"
}

export const LOGO_COLORS = ["auto", "black", "white"] as const
export type LogoColor = (typeof LOGO_COLORS)[number]
export const LOGO_COLOR_LABELS: Record<LogoColor, string> = {
  auto: "Automático",
  black: "Preto",
  white: "Branco",
}

// Slides saved while the logo could follow the slide colors stored "slide";
// the logo never follows the slide accent anymore, so they become "auto".
const RETIRED_LOGO_COLOR = "slide"
const logoColorSchema = z.preprocess(
  (storedValue) => (storedValue === RETIRED_LOGO_COLOR ? "auto" : storedValue),
  z.enum(LOGO_COLORS).default("auto")
)

// Always one of the official brand versions (brand/logo/final/GUIA.md) with
// the cow spots in brand pink, so slide colors never recolor the logo.
// "auto" picks black or white by the slide background.
const BRAND_LOGO_PINK = "#E0349A"
const BRAND_LOGO_INK: Record<Exclude<LogoColor, "auto">, string> = { black: "#1A1020", white: "#FFFFFF" }

export function resolveLogoColors(logoColor: LogoColor, slideBackground: string): { ink: string; accent: string } {
  const backgroundIsLight = readableTextColorFor(slideBackground) === "#17121b"
  const resolvedLogoColor = logoColor === "auto" ? (backgroundIsLight ? "black" : "white") : logoColor
  return { ink: BRAND_LOGO_INK[resolvedLogoColor], accent: BRAND_LOGO_PINK }
}

export const SLIDE_ELEMENT_TOGGLES = ["showKicker", "showProgress", "showCoverCredit", "showSwipeHint", "showBrandMark"] as const
export type SlideElementToggle = (typeof SLIDE_ELEMENT_TOGGLES)[number]
export function pickSlideElementToggles(
  slide: StudioSlide
): Pick<
  StudioSlide,
  | SlideElementToggle
  | "progressAlignment"
  | "progressSize"
  | "brandMarkStyle"
  | "kickerPosition"
  | "logoPosition"
  | "logoAlignment"
  | "logoSize"
  | "logoColor"
> {
  return {
    showKicker: slide.showKicker,
    kickerPosition: slide.kickerPosition,
    showProgress: slide.showProgress,
    showCoverCredit: slide.showCoverCredit,
    showSwipeHint: slide.showSwipeHint,
    showBrandMark: slide.showBrandMark,
    brandMarkStyle: slide.brandMarkStyle,
    logoPosition: slide.logoPosition,
    logoAlignment: slide.logoAlignment,
    logoSize: slide.logoSize,
    logoColor: slide.logoColor,
    progressAlignment: slide.progressAlignment,
    progressSize: slide.progressSize,
  }
}

export function pickSlideFonts(slide: StudioSlide): Pick<StudioSlide, "fonts"> {
  return { fonts: { ...slide.fonts } }
}

export const SLIDE_ELEMENT_TOGGLE_LABELS: Record<SlideElementToggle, string> = {
  showKicker: "Rótulo",
  showProgress: "Contador de páginas",
  showCoverCredit: "Crédito das capas (Spotify, Cover Art Archive)",
  showSwipeHint: "“Arraste →” na capa",
  showBrandMark: "Marca discows.",
}

export const HEADLINE_SIZES = ["small", "medium", "large"] as const
export type HeadlineSize = (typeof HEADLINE_SIZES)[number]
export const HEADLINE_SIZE_LABELS: Record<HeadlineSize, string> = { small: "P", medium: "M", large: "G" }
export const HEADLINE_SIZE_SCALE: Record<HeadlineSize, number> = { small: 0.82, medium: 1, large: 1.18 }

export const PROGRESS_ALIGNMENTS = ["left", "center", "right"] as const
export type ProgressAlignment = (typeof PROGRESS_ALIGNMENTS)[number]
export const PROGRESS_ALIGNMENT_LABELS: Record<ProgressAlignment, string> = {
  left: "Esquerda",
  center: "Centro",
  right: "Direita",
}

export const PROGRESS_SIZES = ["small", "medium", "large"] as const
export type ProgressSize = (typeof PROGRESS_SIZES)[number]
export const PROGRESS_SIZE_LABELS: Record<ProgressSize, string> = { small: "P", medium: "M", large: "G" }
export const PROGRESS_SIZE_SCALE: Record<ProgressSize, number> = { small: 0.8, medium: 1, large: 1.45 }

export const CONTENT_POSITIONS = ["auto", "top", "center", "bottom"] as const
export type ContentPosition = (typeof CONTENT_POSITIONS)[number]
export const CONTENT_POSITION_LABELS: Record<ContentPosition, string> = {
  auto: "Automático",
  top: "Topo",
  center: "Centro",
  bottom: "Base",
}

export const COVER_ECHO_ANCHORS = ["top", "center", "bottom"] as const
export type CoverEchoAnchor = (typeof COVER_ECHO_ANCHORS)[number]
export const COVER_ECHO_ANCHOR_LABELS: Record<CoverEchoAnchor, string> = {
  top: "Topo",
  center: "Centro",
  bottom: "Base",
}

export const COVER_GRID_TILTS = ["left", "none", "right", "split"] as const
export type CoverGridTilt = (typeof COVER_GRID_TILTS)[number]
export const COVER_GRID_TILT_LABELS: Record<CoverGridTilt, string> = {
  left: "Esquerda",
  none: "Reta",
  right: "Direita",
  split: "Para os lados",
}

export const CASSETTE_SIZES = ["small", "medium", "large"] as const
export type CassetteSize = (typeof CASSETTE_SIZES)[number]
export const CASSETTE_SIZE_LABELS: Record<CassetteSize, string> = { small: "Pequena", medium: "Média", large: "Grande" }
export const CASSETTE_SIZE_SCALE: Record<CassetteSize, number> = { small: 0.66, medium: 0.83, large: 1 }
export const CASSETTE_LABEL_TITLES = ["mixtape", "discows-mixtape"] as const
export type CassetteLabelTitle = (typeof CASSETTE_LABEL_TITLES)[number]
export const CASSETTE_LABEL_TITLE_LABELS: Record<CassetteLabelTitle, string> = { mixtape: "Mixtape", "discows-mixtape": "Discows Mixtape" }
export const CASSETTE_LABEL_TITLE_TEXT: Record<CassetteLabelTitle, string> = { mixtape: "MIXTAPE", "discows-mixtape": "DISCOWS MIXTAPE" }
export const CASSETTE_LABEL_TITLE_ALIGNMENTS = ["auto", "left", "center"] as const
export type CassetteLabelTitleAlignment = (typeof CASSETTE_LABEL_TITLE_ALIGNMENTS)[number]
export const CASSETTE_LABEL_TITLE_ALIGNMENT_LABELS: Record<CassetteLabelTitleAlignment, string> = {
  auto: "Automático",
  left: "Esquerda",
  center: "Centro",
}

export function resolveCassetteLabelTitleAlignment(
  slide: Pick<StudioSlide, "cassetteLabelTitleAlignment" | "textAlign">
): Exclude<CassetteLabelTitleAlignment, "auto"> {
  if (slide.cassetteLabelTitleAlignment !== "auto") return slide.cassetteLabelTitleAlignment
  return slide.textAlign === "center" ? "center" : "left"
}
export const DEFAULT_CASSETTE_SHELL_HEX = "#2a2521"

export const BLURRED_COVERS_SOURCES = ["slide", "carousel"] as const
export type BlurredCoversSource = (typeof BLURRED_COVERS_SOURCES)[number]
export const BLURRED_COVERS_SOURCE_LABELS: Record<BlurredCoversSource, string> = {
  slide: "Só as capas do slide",
  carousel: "Todas as capas do post",
}

export const CTA_RECAP_POSITIONS = ["above", "below"] as const
export type CtaRecapPosition = (typeof CTA_RECAP_POSITIONS)[number]
export const CTA_RECAP_POSITION_LABELS: Record<CtaRecapPosition, string> = {
  above: "Acima do título",
  below: "Abaixo do botão",
}

export const BACKGROUND_IMAGE_FILTERS = ["none", "mono", "sepia", "vivid", "faded", "dark"] as const
export type BackgroundImageFilter = (typeof BACKGROUND_IMAGE_FILTERS)[number]
export const BACKGROUND_IMAGE_FILTER_LABELS: Record<BackgroundImageFilter, string> = {
  none: "Sem filtro",
  mono: "Preto e branco",
  sepia: "Sépia",
  vivid: "Vívido",
  faded: "Desbotado",
  dark: "Escurecido",
}

// Used by the live preview. The PNG export applies the same looks with
// sharp (see background-images.ts), since Satori doesn't render CSS filters.
export const BACKGROUND_IMAGE_FILTER_CSS: Record<BackgroundImageFilter, string> = {
  none: "",
  mono: "grayscale(1)",
  sepia: "sepia(1)",
  vivid: "saturate(1.6) contrast(1.1)",
  faded: "saturate(0.55) contrast(0.85) brightness(1.08)",
  dark: "brightness(0.6)",
}

export const BACKGROUND_IMAGE_POSITIONS = ["top", "center", "bottom"] as const
export type BackgroundImagePosition = (typeof BACKGROUND_IMAGE_POSITIONS)[number]
export const BACKGROUND_IMAGE_POSITION_LABELS: Record<BackgroundImagePosition, string> = {
  top: "Topo",
  center: "Centro",
  bottom: "Base",
}

export const MAX_BACKGROUND_IMAGE_BLUR = 24
// Percent of the cover size: 0 = square corners, 50 = round like a disc.
export const MAX_ALBUM_COVER_RADIUS_PERCENT = 50

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

export const slideBackgroundImageSchema = z.object({
  imageId: z.string().min(1).max(64),
  opacity: z.number().int().min(0).max(100),
  filter: z.enum(BACKGROUND_IMAGE_FILTERS),
  blur: z.number().int().min(0).max(MAX_BACKGROUND_IMAGE_BLUR),
  position: z.enum(BACKGROUND_IMAGE_POSITIONS),
})

export type SlideBackgroundImage = z.infer<typeof slideBackgroundImageSchema>

export const DEFAULT_BACKGROUND_IMAGE_SETTINGS: Omit<SlideBackgroundImage, "imageId"> = {
  opacity: 45,
  filter: "none",
  blur: 0,
  position: "center",
}

// Fields added after the first release have defaults, so slides saved
// before them still parse (see normalizeStoredSlides).
export const studioSlideSchema = z.object({
  id: z.string().min(1).max(64),
  layout: z.enum(SLIDE_LAYOUTS),
  kicker: z.string().max(80),
  headline: z.string().max(200),
  body: z.string().max(700),
  albumIds: z.array(z.string().min(1).max(64)).max(MAX_ALBUMS_PER_LIST_SLIDE),
  backgroundKey: z.enum(SLIDE_BACKGROUND_KEYS as [SlideBackgroundKey, ...SlideBackgroundKey[]]),
  customBackgroundHex: z.string().regex(HEX_COLOR_PATTERN).nullable(),
  textAlign: z.enum(["left", "center"]),
  rankNumber: z.number().int().min(1).max(99).nullable().default(null),
  sourceNote: z.string().max(200).default(""),
  requiresSource: z.boolean().default(false),
  accentHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  headlineSize: z.enum(HEADLINE_SIZES).default("medium"),
  contentPosition: z.enum(CONTENT_POSITIONS).default("auto"),
  backgroundStyle: z.enum(BACKGROUND_STYLES).default("glow"),
  secondaryBackgroundHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  coverEchoAnchor: z.enum(COVER_ECHO_ANCHORS).default("top"),
  coverGridTilt: z.enum(COVER_GRID_TILTS).default("left"),
  cassetteSize: z.enum(CASSETTE_SIZES).default("large"),
  cassetteShellHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  cassetteStripeHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  cassetteLabelTitle: z.enum(CASSETTE_LABEL_TITLES).default("mixtape"),
  cassetteLabelTitleAlignment: z.enum(CASSETTE_LABEL_TITLE_ALIGNMENTS).default("auto"),
  ctaRecapPosition: z.enum(CTA_RECAP_POSITIONS).default("above"),
  ctaButtonHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  ctaEmptySlotHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  showCtaWebsite: z.boolean().default(true),
  backgroundImage: slideBackgroundImageSchema.nullable().default(null),
  backgroundSeed: z.number().int().min(0).max(MAX_BACKGROUND_SEED).default(0),
  blurredCoversSource: z.enum(BLURRED_COVERS_SOURCES).default("slide"),
  albumCoverRadius: z.number().int().min(0).max(MAX_ALBUM_COVER_RADIUS_PERCENT).default(0),
  composition: z.enum(SLIDE_COMPOSITIONS as [SlideComposition, ...SlideComposition[]]).default("classic"),
  typeStyle: z.enum(TYPE_STYLES).default("bold"),
  kickerStyle: z.enum(KICKER_STYLES).default("dot"),
  customTextHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  firstPairWordHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  secondPairWordHex: z.string().regex(HEX_COLOR_PATTERN).nullable().default(null),
  showPairWordShadow: z.boolean().default(true),
  showProgress: z.boolean().default(true),
  showCoverCredit: z.boolean().default(true),
  showSwipeHint: z.boolean().default(true),
  showBrandMark: z.boolean().default(true),
  brandMarkStyle: z.enum(BRAND_MARK_STYLES).default("text"),
  logoPosition: z.enum(LOGO_POSITIONS).default("auto"),
  logoAlignment: z.enum(LOGO_ALIGNMENTS).default("auto"),
  logoColor: logoColorSchema,
  logoSize: z.enum(LOGO_SIZES).default("medium"),
  showKicker: z.boolean().default(true),
  kickerPosition: z.enum(SLIDE_ZONES).default("top"),
  progressAlignment: z.enum(PROGRESS_ALIGNMENTS).default("left"),
  progressSize: z.enum(PROGRESS_SIZES).default("medium"),
  fonts: slideFontsSchema.default(DEFAULT_SLIDE_FONTS),
})

export type StudioSlide = z.infer<typeof studioSlideSchema>
export type StoredStudioSlide = z.input<typeof studioSlideSchema>

export const studioSlidesSchema = z.array(studioSlideSchema).min(1).max(MAX_SLIDES_PER_POST)

export function normalizeStoredSlides(storedSlides: unknown): StudioSlide[] {
  return studioSlidesSchema.parse(storedSlides)
}

// Everything a slide says (texts, albums) as opposed to how it looks.
// Post presets keep only the look, so a new post brings its own content.
const SLIDE_CONTENT_FIELDS = {
  id: true,
  kicker: true,
  headline: true,
  body: true,
  albumIds: true,
  rankNumber: true,
  sourceNote: true,
  requiresSource: true,
} as const

export const studioSlideStyleSchema = studioSlideSchema.omit(SLIDE_CONTENT_FIELDS)
export type StudioSlideStyle = z.infer<typeof studioSlideStyleSchema>
export type StoredStudioSlideStyle = z.input<typeof studioSlideStyleSchema>
export const studioSlideStylesSchema = z.array(studioSlideStyleSchema).min(1).max(MAX_SLIDES_PER_POST)

export function extractSlideStyles(slides: StudioSlide[]): StudioSlideStyle[] {
  return slides.map((slide) => studioSlideStyleSchema.parse(slide))
}

// Each slide takes the style of the preset slide with the same layout in the
// same order (1st album slide ← 1st album style). When the new post has more
// slides of a layout than the preset, the last style of that layout repeats;
// layouts the preset doesn't have keep their own look.
export function applySlideStyles(slides: StudioSlide[], styles: StudioSlideStyle[]): StudioSlide[] {
  const stylesByLayout = Map.groupBy(styles, (style) => style.layout)
  const appliedCountByLayout = new Map<SlideLayout, number>()

  return slides.map((slide) => {
    const layoutStyles = stylesByLayout.get(slide.layout)
    if (!layoutStyles?.length) return slide
    const appliedCount = appliedCountByLayout.get(slide.layout) ?? 0
    appliedCountByLayout.set(slide.layout, appliedCount + 1)
    const matchingStyle = layoutStyles[Math.min(appliedCount, layoutStyles.length - 1)]!
    return { ...slide, ...matchingStyle, layout: slide.layout }
  })
}

export function createSlideId(): string {
  return crypto.randomUUID().slice(0, 8)
}

export function createEmptySlide(layout: SlideLayout, overrides: Partial<StudioSlide> = {}): StudioSlide {
  return {
    id: createSlideId(),
    layout,
    kicker: "",
    headline: "",
    body: "",
    albumIds: [],
    backgroundKey: "ink",
    customBackgroundHex: null,
    textAlign: "left",
    rankNumber: null,
    sourceNote: "",
    requiresSource: false,
    accentHex: null,
    headlineSize: "medium",
    contentPosition: "auto",
    backgroundStyle: "glow",
    secondaryBackgroundHex: null,
    coverEchoAnchor: "top",
    coverGridTilt: "left",
    cassetteSize: "large",
    cassetteShellHex: null,
    cassetteStripeHex: null,
    cassetteLabelTitle: "mixtape",
    cassetteLabelTitleAlignment: "auto",
    ctaRecapPosition: "above",
    ctaButtonHex: null,
    ctaEmptySlotHex: null,
    showCtaWebsite: true,
    backgroundImage: null,
    backgroundSeed: 0,
    blurredCoversSource: "slide",
    albumCoverRadius: 0,
    composition: SLIDE_COMPOSITIONS_BY_LAYOUT[layout][0],
    typeStyle: "bold",
    kickerStyle: "dot",
    customTextHex: null,
    firstPairWordHex: null,
    secondPairWordHex: null,
    showPairWordShadow: true,
    showProgress: true,
    showCoverCredit: true,
    showSwipeHint: true,
    showBrandMark: true,
    brandMarkStyle: "text",
    logoPosition: "auto",
    logoAlignment: "auto",
    logoSize: "medium",
    logoColor: "auto",
    showKicker: true,
    kickerPosition: "top",
    progressAlignment: "left",
    progressSize: "medium",
    fonts: { ...DEFAULT_SLIDE_FONTS },
    ...overrides,
  }
}

export type SlideColors = {
  background: string
  text: string
  mutedText: string
  accent: string
}

export function readableTextColorFor(hexColor: string): "#17121b" | "#f7f5fa" {
  const red = parseInt(hexColor.slice(1, 3), 16)
  const green = parseInt(hexColor.slice(3, 5), 16)
  const blue = parseInt(hexColor.slice(5, 7), 16)
  const perceivedLuminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return perceivedLuminance > 0.6 ? "#17121b" : "#f7f5fa"
}

export function hexToRgba(hexColor: string, alpha: number): string {
  const red = parseInt(hexColor.slice(1, 3), 16)
  const green = parseInt(hexColor.slice(3, 5), 16)
  const blue = parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function mixHexColors(baseHex: string, overlayHex: string, overlayWeight: number): string {
  const mixChannel = (channelStart: number) => {
    const baseChannel = parseInt(baseHex.slice(channelStart, channelStart + 2), 16)
    const overlayChannel = parseInt(overlayHex.slice(channelStart, channelStart + 2), 16)
    const mixedChannel = Math.round(baseChannel + (overlayChannel - baseChannel) * overlayWeight)
    return mixedChannel.toString(16).padStart(2, "0")
  }
  return `#${mixChannel(1)}${mixChannel(3)}${mixChannel(5)}`
}

const DIAGONAL_ACCENT_WEIGHT = 0.24

// The stronger half of the "Diagonal" textures: the accent laid over the
// background at the same strength the plain "Diagonal" uses.
export function diagonalStrongTone(colors: SlideColors): string {
  return mixHexColors(colors.background, colors.accent, DIAGONAL_ACCENT_WEIGHT)
}

export function resolveSecondaryBackgroundColor(slide: StudioSlide, colors: SlideColors): string {
  return slide.secondaryBackgroundHex ?? diagonalStrongTone(colors)
}

export function resolveSlideColors(
  slide: Pick<StudioSlide, "backgroundKey" | "customBackgroundHex" | "accentHex" | "customTextHex">
): SlideColors {
  const baseColors: SlideColors = slide.customBackgroundHex
    ? (() => {
        const textColor = readableTextColorFor(slide.customBackgroundHex)
        return {
          background: slide.customBackgroundHex,
          text: textColor,
          mutedText: textColor === "#f7f5fa" ? "rgba(247, 245, 250, 0.72)" : "rgba(23, 18, 27, 0.66)",
          accent: textColor,
        }
      })()
    : SLIDE_BACKGROUNDS[slide.backgroundKey]
  const textColors = slide.customTextHex
    ? { text: slide.customTextHex, mutedText: hexToRgba(slide.customTextHex, 0.72) }
    : {}
  return { ...baseColors, ...textColors, ...(slide.accentHex ? { accent: slide.accentHex } : {}) }
}

export function findMissingSlideText(slide: StudioSlide): string[] {
  const missingFields: string[] = []
  const showsAlbumTitle = slide.layout === "album" || slide.layout === "ranked-album"
  const headlineIsOptional = showsAlbumTitle || slide.layout === "album-list" || slide.layout === "album-pair"
  if (!slide.headline.trim() && !headlineIsOptional) missingFields.push("título")
  if ((slide.layout === "text" || slide.layout === "quote") && !slide.body.trim()) missingFields.push("texto")
  if (MAX_ALBUMS_BY_LAYOUT[slide.layout] > 0 && slide.layout !== "cover" && slide.albumIds.length === 0) {
    missingFields.push("álbum")
  }
  if (slide.layout === "album-pair" && slide.albumIds.length === 1) missingFields.push("segundo álbum")
  if (slide.requiresSource && !slide.sourceNote.trim()) missingFields.push("fonte")
  return missingFields
}

// Recommended maximums so text fits the 1080×1350 canvas without being cut.
// The editor shows them as counters; nothing is truncated automatically.
export const SLIDE_TEXT_LIMITS: Record<SlideLayout, { kicker: number; headline: number; body: number }> = {
  cover: { kicker: 32, headline: 70, body: 140 },
  album: { kicker: 32, headline: 60, body: 220 },
  "ranked-album": { kicker: 32, headline: 60, body: 200 },
  "album-pair": { kicker: 24, headline: 24, body: 120 },
  "album-grid": { kicker: 32, headline: 40, body: 0 },
  "album-list": { kicker: 32, headline: 40, body: 0 },
  text: { kicker: 32, headline: 60, body: 420 },
  quote: { kicker: 32, headline: 220, body: 80 },
  cta: { kicker: 32, headline: 60, body: 140 },
}

export function findTextOverLimit(slide: StudioSlide): string[] {
  const limits = SLIDE_TEXT_LIMITS[slide.layout]
  const fieldsOverLimit: string[] = []
  if (slide.kicker.length > limits.kicker) fieldsOverLimit.push("rótulo")
  if (slide.headline.length > limits.headline) fieldsOverLimit.push("título")
  if (slide.body.length > limits.body) fieldsOverLimit.push("texto")
  return fieldsOverLimit
}

export function studioImageUrl(imageId: string): string {
  return `/api/studio/images/${imageId}`
}
