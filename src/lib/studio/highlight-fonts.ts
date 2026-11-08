export const HIGHLIGHT_FONT_KEYS = ["playfair", "caveat", "marker", "bebas", "space-mono", "pacifico", "chewy"] as const
export type HighlightFontKey = (typeof HIGHLIGHT_FONT_KEYS)[number]

export const DEFAULT_HIGHLIGHT_FONT_KEY: HighlightFontKey = "playfair"

export type HighlightFont = {
  label: string
  description: string
  exportFamily: string
  fileName: string
  weight: 400 | 700
  style: "normal" | "italic"
  cssVariable: string
}

// cssVariable comes from next/font in the Studio layout (live preview);
// fileName is the bundled .woff in src/assets/fonts/highlight (PNG export).
export const HIGHLIGHT_FONTS: Record<HighlightFontKey, HighlightFont> = {
  playfair: {
    label: "Playfair Display",
    description: "Serifada itálica",
    exportFamily: "Highlight Playfair",
    fileName: "playfair-display-latin-700-italic.woff",
    weight: 700,
    style: "italic",
    cssVariable: "--font-highlight-playfair",
  },
  caveat: {
    label: "Caveat",
    description: "Manuscrita",
    exportFamily: "Highlight Caveat",
    fileName: "caveat-latin-700-normal.woff",
    weight: 700,
    style: "normal",
    cssVariable: "--font-highlight-caveat",
  },
  marker: {
    label: "Permanent Marker",
    description: "Marcador",
    exportFamily: "Highlight Marker",
    fileName: "permanent-marker-latin-400-normal.woff",
    weight: 400,
    style: "normal",
    cssVariable: "--font-highlight-marker",
  },
  bebas: {
    label: "Bebas Neue",
    description: "Condensada",
    exportFamily: "Highlight Bebas",
    fileName: "bebas-neue-latin-400-normal.woff",
    weight: 400,
    style: "normal",
    cssVariable: "--font-highlight-bebas",
  },
  "space-mono": {
    label: "Space Mono",
    description: "Monoespaçada itálica",
    exportFamily: "Highlight Space Mono",
    fileName: "space-mono-latin-700-italic.woff",
    weight: 700,
    style: "italic",
    cssVariable: "--font-highlight-space-mono",
  },
  pacifico: {
    label: "Pacifico",
    description: "Cursiva",
    exportFamily: "Highlight Pacifico",
    fileName: "pacifico-latin-400-normal.woff",
    weight: 400,
    style: "normal",
    cssVariable: "--font-highlight-pacifico",
  },
  chewy: {
    label: "Chewy",
    description: "Arredondada divertida",
    exportFamily: "Highlight Chewy",
    fileName: "chewy-latin-400-normal.woff",
    weight: 400,
    style: "normal",
    cssVariable: "--font-highlight-chewy",
  },
}

export function isHighlightFontKey(value: string): value is HighlightFontKey {
  return (HIGHLIGHT_FONT_KEYS as readonly string[]).includes(value)
}

// The slide's main text font: the Studio default (Geist) or any highlight font.
export const DEFAULT_TEXT_FONT_KEY = "default"
export const TEXT_FONT_KEYS = [DEFAULT_TEXT_FONT_KEY, ...HIGHLIGHT_FONT_KEYS] as const
export type TextFontKey = (typeof TEXT_FONT_KEYS)[number]

export function textFontLabel(textFontKey: TextFontKey): string {
  return textFontKey === DEFAULT_TEXT_FONT_KEY ? "Padrão (Geist)" : HIGHLIGHT_FONTS[textFontKey].label
}

export type FontTarget = "preview" | "export"

export type HighlightTypography = {
  fontFamily: string
  fontWeight: HighlightFont["weight"]
  fontStyle: HighlightFont["style"]
}

export function buildHighlightTypography(fontKey: HighlightFontKey, target: FontTarget): HighlightTypography {
  const font = HIGHLIGHT_FONTS[fontKey]
  return {
    fontFamily: target === "preview" ? `var(${font.cssVariable}), serif` : font.exportFamily,
    fontWeight: font.weight,
    fontStyle: font.style,
  }
}

export const DEFAULT_TEXT_FONT_FAMILY: Record<FontTarget, string> = {
  preview: "var(--font-sans), sans-serif",
  export: "Geist",
}

export function resolveTextFontFamily(textFontKey: TextFontKey, target: FontTarget): string {
  return textFontKey === DEFAULT_TEXT_FONT_KEY
    ? DEFAULT_TEXT_FONT_FAMILY[target]
    : buildHighlightTypography(textFontKey, target).fontFamily
}

export type HighlightedTextSegment = { text: string; isHighlighted: boolean }

// "The worst song on every *Kanye* album" → the words between asterisks are
// drawn with the highlight font. An unmatched asterisk stays as plain text.
export function splitHighlightedText(text: string): HighlightedTextSegment[] {
  return text
    .split(/(\*[^*\n]+\*)/)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.length > 2 && part.startsWith("*") && part.endsWith("*")
        ? { text: part.slice(1, -1), isHighlighted: true }
        : { text: part, isHighlighted: false }
    )
}
