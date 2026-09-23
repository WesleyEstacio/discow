import "server-only"
import { desc, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { discoverPicks, reviews as reviewsTable } from "@/lib/db/schema"
import {
  buildDecadeSearchQuery,
  DISCOVER_DECADES,
  formatGenreLabel,
  MAX_DISCOVER_HISTORY_ENTRIES,
  rollDiscoverFilters,
  UNKNOWN_GENRE_LABEL,
  type CommunityRating,
  type DiscoverFilters,
  type DiscoverHistoryEntry,
  type DiscoverRoll,
  type DiscoverRollResult,
} from "@/lib/discover"
import { formatReleaseYear } from "@/lib/format"
import { getAlbum, getArtistAlbums, searchAlbumsPage, searchArtists, searchArtistsPage } from "@/lib/spotify"
import type { AlbumDetail, AlbumSummary } from "@/lib/types"

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

// A genre like "hip-hop" is stored hyphenated (it doubles as the Discovery
// Filters panel's option value and the dice modal's slug-cased fallback
// label), but Spotify's own artist `genres` tags are almost always
// space-separated ("hip hop", "east coast hip hop") - normalizing before
// comparing or querying against Spotify avoids missing real matches over a
// punctuation difference that has nothing to do with the actual genre.
function normalizeGenreForMatching(genre: string): string {
  return genre.toLowerCase().replace(/-/g, " ")
}

// Spotify search result relevance falls off a cliff well before the API's
// own offset ceiling, so random picks are capped to the first few hundred
// results - deep enough for real variety, shallow enough to stay relevant.
const RANDOM_OFFSET_CAP = 300

async function pickRandomAlbumFromQuery(
  query: string,
  excludeIds: Set<string>
): Promise<string | null> {
  const probe = await searchAlbumsPage(query, { limit: 1, offset: 0 })
  if (probe.total === 0) return null

  const maxOffset = Math.max(0, Math.min(probe.total - 1, RANDOM_OFFSET_CAP))

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offset = Math.floor(Math.random() * (maxOffset + 1))
    const { albums } = await searchAlbumsPage(query, { limit: 1, offset })
    const album = albums[0]
    if (album && !excludeIds.has(album.id)) return album.id
  }

  return null
}

type FoundAlbum = { albumId: string; genreLabel: string | null }

// Decade alone maps straight onto Spotify's `year:` search filter, which
// genuinely narrows type=album results - unlike Genre, see
// findAlbumByGenre() and findAlbumByDecadeAndGenre() below.
async function findAlbumByDecadeOrFree(
  decadeStartYear: number | null,
  excludeIds: Set<string>
): Promise<FoundAlbum | null> {
  const query = decadeStartYear ? buildDecadeSearchQuery(decadeStartYear) : "tag:new"
  const albumId = await pickRandomAlbumFromQuery(query, excludeIds)
  return albumId ? { albumId, genreLabel: null } : null
}

// How many random Decade-search candidates to check an artist genre match
// for before giving up on this attempt (see findAlbumByDecadeAndGenre
// below) - each check is a real network round trip, so this trades a bit of
// latency for a much better chance of honoring both filters at once.
const DECADE_GENRE_CANDIDATE_ATTEMPTS = 8

// Both Genre and Decade locked at once: Decade is the reliable, structural
// filter here (a real `year:` search clause with a large, genuine result
// pool), so it drives the search - Genre is then checked per candidate
// album by looking up that album's own primary artist and seeing whether
// any of their real Spotify genre tags match, instead of ever trying to
// combine both into one query (Spotify's `genre:` filter doesn't apply to
// album search at all, see findAlbumByGenre's comment below). This is what
// makes "1990s + Hip-Hop" actually able to succeed, rather than depending
// on a lucky handful of hip-hop-tagged artists happening to have an album
// in exactly that decade among the few most recent releases Spotify returns
// for them.
async function findAlbumByDecadeAndGenre(
  decadeStartYear: number,
  genre: string,
  excludeIds: Set<string>
): Promise<FoundAlbum | null> {
  const query = buildDecadeSearchQuery(decadeStartYear)
  const probe = await searchAlbumsPage(query, { limit: 1, offset: 0 })
  if (probe.total === 0) return null

  const maxOffset = Math.max(0, Math.min(probe.total - 1, RANDOM_OFFSET_CAP))
  const genreLabel = formatGenreLabel(genre)
  const normalizedGenre = normalizeGenreForMatching(genre)

  for (let attempt = 0; attempt < DECADE_GENRE_CANDIDATE_ATTEMPTS; attempt += 1) {
    const offset = Math.floor(Math.random() * (maxOffset + 1))
    const { albums } = await searchAlbumsPage(query, { limit: 1, offset })
    const album = albums[0]
    if (!album || excludeIds.has(album.id)) continue

    const primaryArtist = album.artists[0]
    if (!primaryArtist) continue

    const [artist] = await searchArtists(primaryArtist, 1)
    const matchesGenre = (artist?.genres ?? []).some((candidateGenre) =>
      candidateGenre.toLowerCase().includes(normalizedGenre)
    )
    if (matchesGenre) return { albumId: album.id, genreLabel }
  }

  return null
}

// How many artists to sample per genre search, and how many of those to
// actually check an artist's albums for. getArtistAlbums() only returns an
// artist's first ARTIST_ALBUMS_LIMIT_MAX (10) albums, so a locked Decade
// filter has a narrower window per artist to match against - checking every
// sampled artist instead of just a handful compensates for that.
const GENRE_ARTIST_SAMPLE_SIZE = 10
const GENRE_ARTIST_CANDIDATES_TO_CHECK = GENRE_ARTIST_SAMPLE_SIZE
const GENRE_ARTIST_OFFSET_CAP = 200

// Genre locked, Decade free: Spotify's search `genre:` filter is only
// honored for type=artist and type=track searches - it's silently ignored
// for type=album, so this searches artists in that genre instead, then
// looks at what those specific artists actually released. Only reached when
// Decade isn't also locked - see findAlbumByDecadeAndGenre above for the
// (more reliable) combined case, which drives the search from Decade
// instead precisely because this artist-first approach can't see past an
// artist's most recent handful of albums.
async function findAlbumByGenre(
  genre: string,
  excludeIds: Set<string>
): Promise<FoundAlbum | null> {
  const genreLabel = formatGenreLabel(genre)
  const query = `genre:"${normalizeGenreForMatching(genre)}"`

  const probe = await searchArtistsPage(query, { limit: 1, offset: 0 })
  if (probe.total === 0) return null

  const maxOffset = Math.max(0, Math.min(probe.total - 1, GENRE_ARTIST_OFFSET_CAP))
  const offset = Math.floor(Math.random() * (maxOffset + 1))
  const { artists } = await searchArtistsPage(query, {
    limit: GENRE_ARTIST_SAMPLE_SIZE,
    offset,
  })
  if (artists.length === 0) return null

  const candidateArtists = shuffle(artists).slice(0, GENRE_ARTIST_CANDIDATES_TO_CHECK)

  for (const artist of candidateArtists) {
    const albums = await getArtistAlbums(artist.id)
    const availableAlbums = albums.filter((album) => !excludeIds.has(album.id))
    if (availableAlbums.length === 0) continue

    const chosen = availableAlbums[Math.floor(Math.random() * availableAlbums.length)]!
    return { albumId: chosen.id, genreLabel }
  }

  return null
}

// Spotify's own `genres` field on /albums/{id} is effectively always empty
// these days, so when a roll wasn't already resolved through a genre match
// (see findAlbumByGenre/findAlbumByDecadeAndGenre above), the featured
// card's genre badge falls back to the primary artist's first genre tag
// instead.
async function resolveGenreLabel(detail: AlbumDetail): Promise<string | null> {
  const genreFromAlbum = detail.genres[0]
  if (genreFromAlbum) return formatGenreLabel(genreFromAlbum)

  const primaryArtist = detail.artists[0]
  if (!primaryArtist) return null

  const [artist] = await searchArtists(primaryArtist, 1)
  const genreFromArtist = artist?.genres[0]
  return genreFromArtist ? formatGenreLabel(genreFromArtist) : null
}

// Turns the album a roll actually found into the roll info shown in the
// Surprise Me modal and saved to history - always describing the real
// album, never the search intent that found it. `lockedFilters` only
// backstops the rare case where the album's own data can't fill a field
// (e.g. an unparseable release date). Falls back to UNKNOWN_GENRE_LABEL as
// a last resort so `genre` (unlike `genreLabel`) never has to be nullable -
// every display site treats that marker value as "no genre badge" instead
// of literally showing "Unknown".
function buildRollFromAlbum(
  detail: AlbumDetail,
  genreLabel: string | null,
  lockedFilters: DiscoverFilters
): DiscoverRoll {
  const releaseYear = Number(formatReleaseYear(detail.releaseDate))
  const decadeStartYear = Number.isFinite(releaseYear)
    ? Math.floor(releaseYear / 10) * 10
    : lockedFilters.decadeStartYear ?? DISCOVER_DECADES[0]

  const genre =
    genreLabel ??
    (lockedFilters.genre ? formatGenreLabel(lockedFilters.genre) : null) ??
    UNKNOWN_GENRE_LABEL

  return {
    genre,
    decadeStartYear,
    artist: detail.artists[0] ?? null,
  }
}

function toAlbumSummary(detail: AlbumDetail): AlbumSummary {
  return {
    id: detail.id,
    name: detail.name,
    artists: detail.artists,
    releaseDate: detail.releaseDate,
    totalTracks: detail.totalTracks,
    imageUrl: detail.imageUrl,
    spotifyUrl: detail.spotifyUrl,
  }
}

async function findAlbumForSearchFilters(
  searchFilters: DiscoverFilters,
  excludeIds: Set<string>
): Promise<FoundAlbum | null> {
  if (searchFilters.decadeStartYear !== null && searchFilters.genre) {
    return findAlbumByDecadeAndGenre(searchFilters.decadeStartYear, searchFilters.genre, excludeIds)
  }
  if (searchFilters.genre) {
    return findAlbumByGenre(searchFilters.genre, excludeIds)
  }
  return findAlbumByDecadeOrFree(searchFilters.decadeStartYear, excludeIds)
}

// Rolls a fresh search (respecting whatever the listener locked via the
// Discovery Filters panel - Genre and Decade can both be locked at once,
// see findAlbumByDecadeAndGenre above for how that combination is actually
// honored) and finds a genuinely random album for it, skipping anything in
// `excludeIds` - callers pass the listener's whole Discover history here,
// not just the current pick, so rolling keeps surfacing albums they haven't
// seen from Discover yet. This is what both "Surprise Me" and the very
// first visit (no history yet) call, for guests and signed-in listeners
// alike.
export async function rollDiscoverAlbum(
  filters: DiscoverFilters,
  excludeIds: string[] = []
): Promise<DiscoverRollResult> {
  const excluded = new Set(excludeIds)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const searchFilters = rollDiscoverFilters(filters)
    const found = await findAlbumForSearchFilters(searchFilters, excluded)
    if (!found) continue

    const detail = await getAlbum(found.albumId)
    const genreLabel = found.genreLabel ?? (await resolveGenreLabel(detail))
    return {
      album: toAlbumSummary(detail),
      genreLabel,
      roll: buildRollFromAlbum(detail, genreLabel, filters),
    }
  }

  throw new Error(
    "Could not find an album for these filters right now. Try clearing them or rolling again."
  )
}

// One grouped query for every album currently in the listener's Discover
// history instead of one round-trip per card.
export async function getCommunityRatingsForAlbums(
  spotifyIds: string[]
): Promise<Record<string, CommunityRating>> {
  const uniqueIds = [...new Set(spotifyIds)]
  if (uniqueIds.length === 0) return {}

  const rows = await db
    .select({
      spotifyId: reviewsTable.spotifyId,
      average: sql<number>`avg(${reviewsTable.rating})`.mapWith(Number),
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(reviewsTable)
    .where(inArray(reviewsTable.spotifyId, uniqueIds))
    .groupBy(reviewsTable.spotifyId)

  return Object.fromEntries(rows.map((row) => [row.spotifyId, { average: row.average, count: row.count }]))
}

type DiscoverPickRow = typeof discoverPicks.$inferSelect

function rowToHistoryEntry(row: DiscoverPickRow): DiscoverHistoryEntry {
  const album: AlbumSummary = {
    id: row.spotifyId,
    name: row.albumName,
    artists: row.artists,
    releaseDate: row.releaseDate ?? "",
    totalTracks: 0,
    imageUrl: row.imageUrl,
    spotifyUrl: row.spotifyUrl,
  }

  return {
    album,
    // row.genre can be UNKNOWN_GENRE_LABEL (see buildRollFromAlbum above) -
    // that's a "nothing resolved" marker, not a real label, so it's dropped
    // back to null here exactly like a live roll's genreLabel would be.
    genreLabel: row.genre === UNKNOWN_GENRE_LABEL ? null : row.genre,
    roll: { genre: row.genre, decadeStartYear: row.decadeStartYear, artist: row.artist },
  }
}

// DB-backed counterpart to the guest history in src/lib/discover.ts, for
// signed-in listeners - same entry shape and the same cap, but keyed by
// userId instead of a browser, so it follows them across devices. Oldest
// first, newest (the current featured pick) last - matches
// readDiscoverHistory()'s ordering.
export async function getAccountDiscoverHistory(userId: string): Promise<DiscoverHistoryEntry[]> {
  const rows = await db
    .select()
    .from(discoverPicks)
    .where(eq(discoverPicks.userId, userId))
    .orderBy(desc(discoverPicks.createdAt))
    .limit(MAX_DISCOVER_HISTORY_ENTRIES)

  return rows.reverse().map(rowToHistoryEntry)
}

// Saves one pick for a signed-in listener - a plain insert, unlike the
// guest history's slice(-N): older rows beyond the cap are simply left in
// place rather than deleted, since getAccountDiscoverHistory() already
// limits what it reads back out.
export async function appendAccountDiscoverHistoryEntry(
  userId: string,
  entry: DiscoverHistoryEntry
): Promise<void> {
  await db.insert(discoverPicks).values({
    userId,
    spotifyId: entry.album.id,
    albumName: entry.album.name,
    artists: entry.album.artists,
    imageUrl: entry.album.imageUrl,
    releaseDate: entry.album.releaseDate,
    spotifyUrl: entry.album.spotifyUrl,
    genre: entry.roll.genre,
    decadeStartYear: entry.roll.decadeStartYear,
    artist: entry.roll.artist,
  })
}
