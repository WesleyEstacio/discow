import type { StudioCoverSource } from "@/lib/db/schema"

export type ExternalAlbumSource = "spotify" | "musicbrainz"

export type MusicSearchQuery = {
  text: string
  artist: string
  year: string
  genre: string
}

export type ExternalAlbumResult = {
  source: ExternalAlbumSource
  externalId: string
  title: string
  artistNames: string[]
  releaseYear: number | null
  coverImageUrl: string | null
  coverSource: StudioCoverSource | null
  spotifyUrl: string | null
  genres: string[]
}

export type MusicProvider = {
  source: ExternalAlbumSource
  label: string
  // What the provider can't filter by, so the UI can say so instead of
  // silently ignoring a filter.
  unsupportedFilters: (keyof MusicSearchQuery)[]
  isConfigured: () => boolean
  searchAlbums: (query: MusicSearchQuery) => Promise<ExternalAlbumResult[]>
}

export function hasSearchCriteria(query: MusicSearchQuery): boolean {
  return Boolean(query.text || query.artist || query.year || query.genre)
}

export function parseReleaseYear(releaseDate: string | null | undefined): number | null {
  const year = Number.parseInt(releaseDate?.slice(0, 4) ?? "", 10)
  return Number.isFinite(year) && year > 1800 ? year : null
}
