import { z } from "zod"

export const SLIDE_WIDTH = 1080
export const SLIDE_HEIGHT = 1350
export const MAX_SLIDES_PER_POST = 20
export const MAX_ALBUMS_PER_GRID_SLIDE = 4

export const SLIDE_LAYOUTS = ["cover", "album", "text", "album-grid", "cta"] as const
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number]

export const SLIDE_LAYOUT_LABELS: Record<SlideLayout, string> = {
  cover: "Capa",
  album: "Álbum",
  text: "Texto",
  "album-grid": "Grade de álbuns",
  cta: "Chamada final",
}

export const SLIDE_BACKGROUNDS = {
  ink: { label: "Tinta", background: "#120f17", text: "#f7f5fa", mutedText: "#a9a1b6", accent: "#e879c9" },
  plum: { label: "Ameixa", background: "#2a1433", text: "#fbf3fb", mutedText: "#cdb3cf", accent: "#ff8fcf" },
  magenta: { label: "Magenta", background: "#c2268f", text: "#fff7fb", mutedText: "#ffd3ec", accent: "#1a0b1f" },
  paper: { label: "Papel", background: "#f4efe8", text: "#17121b", mutedText: "#6e6573", accent: "#b0207e" },
  bone: { label: "Osso", background: "#e7e1f0", text: "#17121b", mutedText: "#5f566a", accent: "#7a1d6e" },
} as const

export type SlideBackgroundKey = keyof typeof SLIDE_BACKGROUNDS
export const SLIDE_BACKGROUND_KEYS = Object.keys(SLIDE_BACKGROUNDS) as SlideBackgroundKey[]

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

export const studioSlideSchema = z.object({
  id: z.string().min(1).max(64),
  layout: z.enum(SLIDE_LAYOUTS),
  kicker: z.string().max(80),
  headline: z.string().max(200),
  body: z.string().max(700),
  albumIds: z.array(z.string().min(1).max(64)).max(MAX_ALBUMS_PER_GRID_SLIDE),
  backgroundKey: z.enum(SLIDE_BACKGROUND_KEYS as [SlideBackgroundKey, ...SlideBackgroundKey[]]),
  customBackgroundHex: z.string().regex(HEX_COLOR_PATTERN).nullable(),
  textAlign: z.enum(["left", "center"]),
})

export type StudioSlide = z.infer<typeof studioSlideSchema>

export const studioSlidesSchema = z.array(studioSlideSchema).min(1).max(MAX_SLIDES_PER_POST)

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

export function resolveSlideColors(slide: Pick<StudioSlide, "backgroundKey" | "customBackgroundHex">): SlideColors {
  if (slide.customBackgroundHex) {
    const textColor = readableTextColorFor(slide.customBackgroundHex)
    return {
      background: slide.customBackgroundHex,
      text: textColor,
      mutedText: textColor === "#f7f5fa" ? "rgba(247, 245, 250, 0.72)" : "rgba(23, 18, 27, 0.66)",
      accent: textColor,
    }
  }
  return SLIDE_BACKGROUNDS[slide.backgroundKey]
}

export function findMissingSlideText(slide: StudioSlide): string[] {
  const missingFields: string[] = []
  if (!slide.headline.trim() && slide.layout !== "album") missingFields.push("título")
  if (slide.layout === "text" && !slide.body.trim()) missingFields.push("texto")
  if ((slide.layout === "album" || slide.layout === "album-grid") && slide.albumIds.length === 0) {
    missingFields.push("álbum")
  }
  return missingFields
}

// Recommended maximums so text fits the 1080×1350 canvas without being cut.
// The editor shows them as counters; nothing is truncated automatically.
export const SLIDE_TEXT_LIMITS: Record<SlideLayout, { kicker: number; headline: number; body: number }> = {
  cover: { kicker: 32, headline: 70, body: 140 },
  album: { kicker: 32, headline: 60, body: 220 },
  text: { kicker: 32, headline: 60, body: 420 },
  "album-grid": { kicker: 32, headline: 40, body: 0 },
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
