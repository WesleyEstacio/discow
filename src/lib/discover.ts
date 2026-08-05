// Pure constants, types, and browser-safe helpers for the Discover page.
// Deliberately free of "server-only" imports (unlike src/lib/discover-server.ts) -
// the Discovery Filters panel needs DISCOVER_GENRES/DISCOVER_DECADES to render
// its pickers, and the Surprise Me dice modal needs formatDecadeLabel/
// formatGenreLabel to display whatever roll the API hands back, all from
// Client Components. This module also owns the *guest* Discover history,
// which lives entirely in the browser (localStorage) - signed-in listeners
// get the same history from the database instead (discover_pick table, see
// src/lib/discover-server.ts), so it follows their account across devices.

import type { AlbumSummary } from "@/lib/types"

export type DiscoverFilters = {
  genre: string | null
  decadeStartYear: number | null
}

export type DiscoverRoll = {
  genre: string
  decadeStartYear: number
  // Always the primary artist of the album a roll actually found - purely
  // informational (shown in the Surprise Me modal and album grid), not a
  // filter the listener can lock.
  artist: string | null
}

export type DiscoverRollResult = {
  album: AlbumSummary
  genreLabel: string | null
  roll: DiscoverRoll
}

export type DiscoverHistoryEntry = {
  album: AlbumSummary
  genreLabel: string | null
  roll: DiscoverRoll
}

export type CommunityRating = { average: number; count: number }

export const DISCOVER_GENRES = [
  "rock",
  "pop",
  "hip-hop",
  "jazz",
  "electronic",
  "indie",
  "r&b",
  "metal",
  "folk",
  "classical",
  "soul",
  "punk",
] as const

// Start-of-decade years - 2020 means the 2020s (2020-2029).
export const DISCOVER_DECADES = [2020, 2010, 2000, 1990, 1980, 1970, 1960] as const

// buildRollFromAlbum() in discover-server.ts falls back to this when a roll
// can't resolve any real genre for the album it found - it's a marker
// value, never a genre a listener actually asked for, so every place that
// displays a roll's genre (the featured card badge, the Surprise Me dice
// modal) checks against it and simply shows no genre badge at all rather
// than a literal "Unknown" tag.
export const UNKNOWN_GENRE_LABEL = "Unknown"

export function formatDecadeLabel(decadeStartYear: number): string {
  return `${decadeStartYear}s`
}

// "hip-hop" -> "Hip-Hop", "r&b" -> "R&B" (the one irregular case - title
// casing alone would give "R&b").
export function formatGenreLabel(genre: string): string {
  if (genre.toLowerCase() === "r&b") return "R&B"
  return genre
    .split("-")
    .map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join("-")
}

function pickRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

// Spotify's search `genre:` filter only works for type=artist/track, never
// type=album - so unlike Decade, Genre is never turned into an album search
// clause directly (see discover-server.ts, which searches by Decade first
// when both are locked, or by artist when only Genre is). This only ever
// builds the Decade clause.
export function buildDecadeSearchQuery(decadeStartYear: number): string {
  return `year:${decadeStartYear}-${decadeStartYear + 9}`
}

// Fills in exactly one unset filter axis (Genre or Decade) with a random
// value, leaving anything the listener already locked in the Discovery
// Filters panel untouched. Randomizing only one axis at a time - rather than
// both - keeps a locked filter from ever being paired with an incompatible
// random value on the very first attempt; see rollDiscoverAlbum() in
// discover-server.ts for what happens if that combination still turns up
// nothing.
export function rollDiscoverFilters(filters: DiscoverFilters): DiscoverFilters {
  const unsetAxes: (keyof DiscoverFilters)[] = []
  if (!filters.genre) unsetAxes.push("genre")
  if (!filters.decadeStartYear) unsetAxes.push("decadeStartYear")

  if (unsetAxes.length === 0) return filters

  const axis = pickRandomItem(unsetAxes)
  return {
    genre: axis === "genre" ? pickRandomItem(DISCOVER_GENRES) : filters.genre,
    decadeStartYear:
      axis === "decadeStartYear" ? pickRandomItem(DISCOVER_DECADES) : filters.decadeStartYear,
  }
}

const HISTORY_STORAGE_KEY = "discows:discover-history"

// Each guest browser keeps its own history, so it's capped on purpose - deep
// enough to feel like a real "discovered so far" shelf, small enough to
// stay cheap to store and re-render. Signed-in history (discover_pick table)
// is capped to the same size for the same reason, even though a DB row has
// no size pressure of its own - see getAccountDiscoverHistory() in
// discover-server.ts.
export const MAX_DISCOVER_HISTORY_ENTRIES = 24

function isValidHistoryEntry(value: unknown): value is DiscoverHistoryEntry {
  const candidate = value as Partial<DiscoverHistoryEntry> | null
  const album = candidate?.album as Partial<AlbumSummary> | undefined
  const roll = candidate?.roll

  return Boolean(
    album &&
      typeof album.id === "string" &&
      typeof album.name === "string" &&
      Array.isArray(album.artists) &&
      roll &&
      typeof roll.genre === "string" &&
      typeof roll.decadeStartYear === "number" &&
      (roll.artist === null || typeof roll.artist === "string")
  )
}

// Oldest first, newest (the current featured pick) last. Guest path only -
// see getAccountDiscoverHistory() in discover-server.ts for the signed-in
// equivalent.
export function readDiscoverHistory(): DiscoverHistoryEntry[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidHistoryEntry).slice(-MAX_DISCOVER_HISTORY_ENTRIES)
  } catch {
    return []
  }
}

export function writeDiscoverHistory(entries: DiscoverHistoryEntry[]): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(entries.slice(-MAX_DISCOVER_HISTORY_ENTRIES))
    )
  } catch {
    // Storage full or unavailable (private browsing, quota, etc.) - history
    // just won't persist across reloads, which degrades gracefully.
  }
}
