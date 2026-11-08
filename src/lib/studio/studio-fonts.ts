import { z } from "zod"

export const STUDIO_FONT_KEYS = ["geist", "chewy"] as const
export type StudioFontKey = (typeof STUDIO_FONT_KEYS)[number]

export type FontTarget = "preview" | "export"

type StudioFont = {
  label: string
  familyByTarget: Record<FontTarget, string>
}

// Preview families come from next/font in the Studio layout; export families
// are the bundled files registered with Satori in render-slides.tsx.
export const STUDIO_FONTS: Record<StudioFontKey, StudioFont> = {
  geist: {
    label: "Geist",
    familyByTarget: { preview: "var(--font-sans), sans-serif", export: "Geist" },
  },
  chewy: {
    label: "Chewy",
    familyByTarget: { preview: "var(--font-studio-chewy), cursive", export: "Chewy" },
  },
}

export function resolveFontFamily(fontKey: StudioFontKey, target: FontTarget): string {
  return STUDIO_FONTS[fontKey].familyByTarget[target]
}

export const SLIDE_TEXT_ELEMENTS = ["brandMark", "kicker", "headline", "body", "footer", "highlight"] as const
export type SlideTextElement = (typeof SLIDE_TEXT_ELEMENTS)[number]

export const SLIDE_TEXT_ELEMENT_LABELS: Record<SlideTextElement, string> = {
  brandMark: "Marca discows.",
  kicker: "Rótulo",
  headline: "Título",
  body: "Texto e nomes dos álbuns",
  footer: "Contador e rodapé",
  highlight: "Trechos entre *asteriscos*",
}

export type SlideFonts = Record<SlideTextElement, StudioFontKey>

export const DEFAULT_SLIDE_FONTS: SlideFonts = {
  brandMark: "geist",
  kicker: "geist",
  headline: "geist",
  body: "geist",
  footer: "geist",
  highlight: "chewy",
}

// A font that is no longer offered falls back to the default instead of
// breaking slides saved before it was removed.
const studioFontKeySchema = (fallbackFontKey: StudioFontKey) => z.enum(STUDIO_FONT_KEYS).catch(fallbackFontKey)

export const slideFontsSchema = z.object({
  brandMark: studioFontKeySchema(DEFAULT_SLIDE_FONTS.brandMark),
  kicker: studioFontKeySchema(DEFAULT_SLIDE_FONTS.kicker),
  headline: studioFontKeySchema(DEFAULT_SLIDE_FONTS.headline),
  body: studioFontKeySchema(DEFAULT_SLIDE_FONTS.body),
  footer: studioFontKeySchema(DEFAULT_SLIDE_FONTS.footer),
  highlight: studioFontKeySchema(DEFAULT_SLIDE_FONTS.highlight),
})

type TextWithSelection = { text: string; selectionStart: number; selectionEnd: number }

const WORD_CHARACTER_PATTERN = /[\p{L}\p{N}'’-]/u

// Wraps the selected stretch in *asterisks*, or unwraps it when it already
// is. With nothing selected, the word under the cursor is used.
export function toggleHighlightAroundSelection({ text, selectionStart, selectionEnd }: TextWithSelection): TextWithSelection {
  let start = selectionStart
  let end = selectionEnd
  if (start === end) {
    while (start > 0 && WORD_CHARACTER_PATTERN.test(text[start - 1]!)) start -= 1
    while (end < text.length && WORD_CHARACTER_PATTERN.test(text[end]!)) end += 1
  }
  while (start < end && /\s/.test(text[start]!)) start += 1
  while (end > start && /\s/.test(text[end - 1]!)) end -= 1
  if (start === end) return { text, selectionStart, selectionEnd }

  const isAlreadyHighlighted = text[start - 1] === "*" && text[end] === "*"
  if (isAlreadyHighlighted) {
    return {
      text: `${text.slice(0, start - 1)}${text.slice(start, end)}${text.slice(end + 1)}`,
      selectionStart: start - 1,
      selectionEnd: end - 1,
    }
  }
  const selectedText = text.slice(start, end).replaceAll("*", "")
  return {
    text: `${text.slice(0, start)}*${selectedText}*${text.slice(end)}`,
    selectionStart: start + 1,
    selectionEnd: start + 1 + selectedText.length,
  }
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
