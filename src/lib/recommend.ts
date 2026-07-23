import type {
  AlbumSummary,
  RecommendMode,
  RecommendRequest,
} from "@/lib/types"
import {
  getArtistAlbums,
  searchAlbums,
  searchArtists,
} from "@/lib/spotify"

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

const FALLBACK_ARTISTS = [
  "Radiohead",
  "Nina Simone",
  "Kendrick Lamar",
  "Bjork",
  "Miles Davis",
  "Arctic Monkeys",
  "Frank Ocean",
  "The Beatles",
]

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function uniqueAlbums(albums: AlbumSummary[]): AlbumSummary[] {
  const seen = new Set<string>()
  return albums.filter((album) => {
    if (seen.has(album.id)) return false
    seen.add(album.id)
    return true
  })
}

function yearClause(yearFrom?: number, yearTo?: number) {
  if (yearFrom && yearTo) {
    if (yearFrom === yearTo) return ` year:${yearFrom}`
    return ` year:${Math.min(yearFrom, yearTo)}-${Math.max(yearFrom, yearTo)}`
  }
  if (yearFrom) return ` year:${yearFrom}-${yearFrom + 9}`
  if (yearTo) return ` year:${Math.max(yearTo - 9, 1950)}-${yearTo}`
  return ""
}

function filterExcluded(
  albums: AlbumSummary[],
  excludeIds: Set<string>
): AlbumSummary[] {
  return albums.filter((album) => !excludeIds.has(album.id))
}

async function albumsForArtistName(artistName: string): Promise<AlbumSummary[]> {
  const artists = await searchArtists(artistName, 1)
  const artist = artists[0]
  if (!artist) {
    return searchAlbums(`artist:"${artistName}"`)
  }
  return getArtistAlbums(artist.id)
}

async function recommendByGenre(
  genre: string,
  yearFrom?: number,
  yearTo?: number
): Promise<{ albums: AlbumSummary[]; reason: string }> {
  const query = `genre:"${genre}"${yearClause(yearFrom, yearTo)}`
  const albums = await searchAlbums(query)
  return {
    albums,
    reason: `Albums tagged around ${genre}${yearFrom || yearTo ? " in the selected years" : ""}.`,
  }
}

async function recommendByArtist(
  artist: string
): Promise<{ albums: AlbumSummary[]; reason: string }> {
  const albums = await albumsForArtistName(artist)
  return {
    albums,
    reason: `More albums related to ${artist}.`,
  }
}

async function recommendSurprise(
  seedArtists: string[],
  seedYears: number[],
  yearFrom?: number,
  yearTo?: number
): Promise<{ albums: AlbumSummary[]; reason: string }> {
  const artists = shuffle(
    seedArtists.length > 0 ? seedArtists : FALLBACK_ARTISTS
  ).slice(0, 3)

  const genre = shuffle([...DISCOVER_GENRES])[0]
  const decadeSeed =
    seedYears.length > 0
      ? shuffle(seedYears)[0]
      : shuffle([1971, 1985, 1997, 2008, 2018])[0]
  const decadeStart = Math.floor(decadeSeed / 10) * 10

  const queries: Promise<AlbumSummary[]>[] = [
    ...artists.map((artist) => albumsForArtistName(artist)),
    searchAlbums(`genre:"${genre}"${yearClause(yearFrom, yearTo)}`),
  ]

  if (yearFrom || yearTo) {
    queries.push(searchAlbums(yearClause(yearFrom, yearTo).trim()))
  } else {
    queries.push(searchAlbums(`year:${decadeStart}-${decadeStart + 9}`))
  }

  const batches = await Promise.allSettled(queries)
  const albums = batches.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  )

  const reason =
    seedArtists.length > 0
      ? `Picked from artists you rated highly (${artists.slice(0, 2).join(", ")}${artists.length > 2 ? "…" : ""}) plus a ${genre} wild card.`
      : `Surprise mix from popular artists and ${genre}. Rate albums to personalize this.`

  return { albums: uniqueAlbums(albums), reason }
}

export async function recommendAlbums(
  input: RecommendRequest
): Promise<{ albums: AlbumSummary[]; reason: string; mode: RecommendMode }> {
  const excludeIds = new Set(input.excludeIds ?? [])
  const mode = input.mode

  let result: { albums: AlbumSummary[]; reason: string }

  if (mode === "genre") {
    if (!input.genre?.trim()) {
      throw new Error("Pick a genre to get recommendations.")
    }
    result = await recommendByGenre(
      input.genre.trim(),
      input.yearFrom,
      input.yearTo
    )
  } else if (mode === "artist") {
    if (!input.artist?.trim()) {
      throw new Error("Enter an artist to get recommendations.")
    }
    result = await recommendByArtist(input.artist.trim())
  } else {
    result = await recommendSurprise(
      input.seedArtists ?? [],
      input.seedYears ?? [],
      input.yearFrom,
      input.yearTo
    )
  }

  const albums = shuffle(
    filterExcluded(uniqueAlbums(result.albums), excludeIds)
  ).slice(0, 10)

  return {
    albums,
    reason: result.reason,
    mode,
  }
}
