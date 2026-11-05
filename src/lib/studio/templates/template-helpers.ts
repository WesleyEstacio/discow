import type { PostLanguage } from "@/lib/studio/post-status"
import type { TemplateAlbum } from "@/lib/studio/templates/types"

export const DISCOWS_WEBSITE = "discows.com"

export function primaryArtistName(album: TemplateAlbum): string {
  return album.artistNames[0] ?? ""
}

export function describeAlbumLine(album: TemplateAlbum): string {
  const artist = album.artistNames.join(", ")
  return `${album.title} — ${artist}${album.releaseYear ? ` (${album.releaseYear})` : ""}`
}

function toHashtag(text: string): string {
  return `#${text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")}`
}

// Only built from the brand and the albums' real genres - never from
// trending or invented topics.
export function buildHashtags(albums: TemplateAlbum[], language: PostLanguage): string {
  const brandHashtags = language === "pt" ? ["#discows", "#descobertamusical"] : ["#discows", "#musicdiscovery"]
  const genreHashtags = [...new Set(albums.flatMap((album) => album.genres).map(toHashtag))]
    .filter((hashtag) => hashtag.length > 2)
    .slice(0, 4)
  return [...brandHashtags, ...genreHashtags].join(" ")
}

// Bracketed text marks the parts the admin still has to write, so a
// generated caption is never mistaken for finished copy.
export function editorPlaceholder(language: PostLanguage, portugueseText: string, englishText: string): string {
  return `[${language === "pt" ? portugueseText : englishText}]`
}

export function joinCaptionParagraphs(paragraphs: (string | null | undefined | false)[]): string {
  return paragraphs.filter((paragraph): paragraph is string => Boolean(paragraph && paragraph.trim())).join("\n\n")
}

export function chunkAlbums<Item>(items: Item[], chunkSize: number): Item[][] {
  const chunks: Item[][] = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

function seededRandom(seed: number): number {
  const sineValue = Math.sin(seed) * 10000
  return sineValue - Math.floor(sineValue)
}

// Each call returns the next pick for the same post, so a post keeps the
// same texts if it is rebuilt with the same seed.
export function createVariantPicker(variantSeed: number) {
  let pickCount = 0
  return function pickVariant<Variant>(variants: readonly [Variant, ...Variant[]]): Variant {
    pickCount += 1
    const variantIndex = Math.floor(seededRandom(variantSeed * 31 + pickCount) * variants.length)
    return variants[variantIndex] ?? variants[0]
  }
}

export function createVariantSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}
