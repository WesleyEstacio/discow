import "server-only"
import { SITE_URL } from "@/lib/seo"
import {
  parseReleaseYear,
  type ExternalAlbumResult,
  type MusicProvider,
  type MusicSearchQuery,
} from "@/lib/studio/music-providers/types"

const MUSICBRAINZ_SEARCH_URL = "https://musicbrainz.org/ws/2/release-group/"
const COVER_ART_ARCHIVE_URL = "https://coverartarchive.org/release-group"
const SEARCH_RESULT_LIMIT = 10
const COVER_LOOKUP_TIMEOUT_MS = 4000

// MusicBrainz asks every client to identify itself with a meaningful
// User-Agent (https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting).
const MUSICBRAINZ_USER_AGENT = `DiscowsStudio/0.1 ( ${SITE_URL} )`

type MusicBrainzReleaseGroup = {
  id: string
  title: string
  "first-release-date"?: string
  "primary-type"?: string
  "artist-credit"?: { name: string }[]
  tags?: { name: string; count: number }[]
}

const RATE_LIMIT_RETRY_DELAY_MS = 1100

// MusicBrainz answers 503 when its ~1 request/second limit is hit; one
// retry after a pause covers the common case of two searches in a row.
async function fetchMusicBrainzWithOneRetry(url: string): Promise<Response> {
  const requestOptions = {
    headers: { "User-Agent": MUSICBRAINZ_USER_AGENT, Accept: "application/json" },
    next: { revalidate: 3600 },
  }
  const firstResponse = await fetch(url, requestOptions)
  if (firstResponse.status !== 503) return firstResponse

  await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY_MS))
  return fetch(url, requestOptions)
}

function escapeLuceneValue(value: string): string {
  return value.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1")
}

function buildMusicBrainzQuery({ text, artist, year, genre }: MusicSearchQuery): string {
  const clauses = [
    text ? `releasegroup:"${escapeLuceneValue(text)}"` : "",
    artist ? `artist:"${escapeLuceneValue(artist)}"` : "",
    /^\d{4}$/.test(year) ? `firstreleasedate:${year}*` : "",
    genre ? `tag:"${escapeLuceneValue(genre.toLowerCase())}"` : "",
  ].filter(Boolean)

  return clauses.length ? [...clauses, "primarytype:album"].join(" AND ") : ""
}

async function findCoverArtArchiveUrl(releaseGroupId: string): Promise<string | null> {
  const coverUrl = `${COVER_ART_ARCHIVE_URL}/${releaseGroupId}/front-500`
  try {
    const response = await fetch(coverUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(COVER_LOOKUP_TIMEOUT_MS),
    })
    return response.ok ? coverUrl : null
  } catch {
    return null
  }
}

function pickTopGenres(tags: MusicBrainzReleaseGroup["tags"]): string[] {
  return [...(tags ?? [])]
    .sort((firstTag, secondTag) => secondTag.count - firstTag.count)
    .slice(0, 4)
    .map((tag) => tag.name)
}

export const musicBrainzMusicProvider: MusicProvider = {
  source: "musicbrainz",
  label: "MusicBrainz + Cover Art Archive",
  unsupportedFilters: [],
  isConfigured: () => true,
  async searchAlbums(query) {
    const musicBrainzQuery = buildMusicBrainzQuery(query)
    if (!musicBrainzQuery) return []

    const searchParams = new URLSearchParams({
      query: musicBrainzQuery,
      fmt: "json",
      limit: String(SEARCH_RESULT_LIMIT),
    })
    const response = await fetchMusicBrainzWithOneRetry(`${MUSICBRAINZ_SEARCH_URL}?${searchParams}`)

    if (!response.ok) {
      throw new Error(`MusicBrainz respondeu ${response.status}`)
    }

    const data = (await response.json()) as { "release-groups"?: MusicBrainzReleaseGroup[] }
    const releaseGroups = data["release-groups"] ?? []
    const coverUrls = await Promise.all(
      releaseGroups.map((releaseGroup) => findCoverArtArchiveUrl(releaseGroup.id))
    )

    return releaseGroups.map(
      (releaseGroup, index): ExternalAlbumResult => ({
        source: "musicbrainz",
        externalId: releaseGroup.id,
        title: releaseGroup.title,
        artistNames: (releaseGroup["artist-credit"] ?? []).map((credit) => credit.name),
        releaseYear: parseReleaseYear(releaseGroup["first-release-date"]),
        coverImageUrl: coverUrls[index] ?? null,
        coverSource: coverUrls[index] ? "cover-art-archive" : null,
        spotifyUrl: null,
        genres: pickTopGenres(releaseGroup.tags),
      })
    )
  },
}
