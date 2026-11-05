import { z } from "zod"

export const SLIDE_WIDTH = 1080
export const SLIDE_HEIGHT = 1350
export const MAX_SLIDES_PER_POST = 20
export const MAX_ALBUMS_PER_GRID_SLIDE = 4
export const MAX_ALBUMS_PER_LIST_SLIDE = 8

export const SLIDE_LAYOUTS = ["cover", "album", "ranked-album", "album-grid", "album-list", "text", "quote", "cta"] as const
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number]

export const SLIDE_LAYOUT_LABELS: Record<SlideLayout, string> = {
  cover: "Capa",
  album: "Álbum",
  "ranked-album": "Álbum numerado",
  "album-grid": "Grade de álbuns",
  "album-list": "Lista de álbuns",
  text: "Texto",
  quote: "Citação",
  cta: "Chamada final",
}

export const MAX_ALBUMS_BY_LAYOUT: Record<SlideLayout, number> = {
  cover: MAX_ALBUMS_PER_GRID_SLIDE,
  album: 1,
  "ranked-album": 1,
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
} as const

export type SlideBackgroundKey = keyof typeof SLIDE_BACKGROUNDS
export const SLIDE_BACKGROUND_KEYS = Object.keys(SLIDE_BACKGROUNDS) as SlideBackgroundKey[]

export const BACKGROUND_STYLES = ["solid", "glow", "gradient"] as const
export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number]
export const BACKGROUND_STYLE_LABELS: Record<BackgroundStyle, string> = {
  solid: "Liso",
  glow: "Brilho",
  gradient: "Degradê",
}

export const HEADLINE_SIZES = ["small", "medium", "large"] as const
export type HeadlineSize = (typeof HEADLINE_SIZES)[number]
export const HEADLINE_SIZE_LABELS: Record<HeadlineSize, string> = { small: "P", medium: "M", large: "G" }
export const HEADLINE_SIZE_SCALE: Record<HeadlineSize, number> = { small: 0.82, medium: 1, large: 1.18 }

export const CONTENT_POSITIONS = ["auto", "top", "center", "bottom"] as const
export type ContentPosition = (typeof CONTENT_POSITIONS)[number]
export const CONTENT_POSITION_LABELS: Record<ContentPosition, string> = {
  auto: "Automático",
  top: "Topo",
  center: "Centro",
  bottom: "Base",
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
  backgroundImage: slideBackgroundImageSchema.nullable().default(null),
  albumCoverRadius: z.number().int().min(0).max(MAX_ALBUM_COVER_RADIUS_PERCENT).default(0),
})

export type StudioSlide = z.infer<typeof studioSlideSchema>
export type StoredStudioSlide = z.input<typeof studioSlideSchema>

export const studioSlidesSchema = z.array(studioSlideSchema).min(1).max(MAX_SLIDES_PER_POST)

export function normalizeStoredSlides(storedSlides: unknown): StudioSlide[] {
  return studioSlidesSchema.parse(storedSlides)
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
    backgroundImage: null,
    albumCoverRadius: 0,
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

export function resolveSlideColors(
  slide: Pick<StudioSlide, "backgroundKey" | "customBackgroundHex" | "accentHex">
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
  return slide.accentHex ? { ...baseColors, accent: slide.accentHex } : baseColors
}

export function findMissingSlideText(slide: StudioSlide): string[] {
  const missingFields: string[] = []
  const showsAlbumTitle = slide.layout === "album" || slide.layout === "ranked-album"
  if (!slide.headline.trim() && !showsAlbumTitle && slide.layout !== "album-list") missingFields.push("título")
  if ((slide.layout === "text" || slide.layout === "quote") && !slide.body.trim()) missingFields.push("texto")
  if (MAX_ALBUMS_BY_LAYOUT[slide.layout] > 0 && slide.layout !== "cover" && slide.albumIds.length === 0) {
    missingFields.push("álbum")
  }
  if (slide.requiresSource && !slide.sourceNote.trim()) missingFields.push("fonte")
  return missingFields
}

// Recommended maximums so text fits the 1080×1350 canvas without being cut.
// The editor shows them as counters; nothing is truncated automatically.
export const SLIDE_TEXT_LIMITS: Record<SlideLayout, { kicker: number; headline: number; body: number }> = {
  cover: { kicker: 32, headline: 70, body: 140 },
  album: { kicker: 32, headline: 60, body: 220 },
  "ranked-album": { kicker: 32, headline: 60, body: 200 },
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
