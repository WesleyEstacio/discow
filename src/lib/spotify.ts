import { cache } from "react"
import type { AlbumDetail, AlbumSummary, ArtistSummary, Track } from "@/lib/types"

const TOKEN_URL = "https://accounts.spotify.com/api/token"
const API_BASE = "https://api.spotify.com/v1"

type TokenCache = {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

type SpotifyArtist = { name: string }

type SpotifyAlbumRaw = {
  id: string
  name: string
  artists: SpotifyArtist[]
  release_date: string
  total_tracks: number
  images: { url: string; height: number | null; width: number | null }[]
  external_urls: { spotify: string }
  label?: string
  genres?: string[]
  tracks?: {
    items: {
      id: string
      name: string
      track_number: number
      duration_ms: number
      artists: SpotifyArtist[]
    }[]
  }
}

function getCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET. Add them to .env.local."
    )
  }

  return { clientId, clientSecret }
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken
  }

  const { clientId, clientSecret } = getCredentials()
  const body = new URLSearchParams({ grant_type: "client_credentials" })

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Spotify token request failed: ${response.status} ${detail}`)
  }

  const data = (await response.json()) as {
    access_token: string
    expires_in: number
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return tokenCache.accessToken
}

async function spotifyFetch<T>(path: string): Promise<T> {
  const accessToken = await getAccessToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Spotify API error: ${response.status} ${detail}`)
  }

  return response.json() as Promise<T>
}

function pickImageUrl(
  images: { url: string; height: number | null; width: number | null }[]
): string | null {
  if (!images.length) return null
  const sorted = [...images].sort(
    (a, b) => (b.width ?? 0) - (a.width ?? 0)
  )
  return sorted[0]?.url ?? null
}

function mapAlbumSummary(album: SpotifyAlbumRaw): AlbumSummary {
  return {
    id: album.id,
    name: album.name,
    artists: album.artists.map((artist) => artist.name),
    releaseDate: album.release_date,
    totalTracks: album.total_tracks,
    imageUrl: pickImageUrl(album.images),
    spotifyUrl: album.external_urls.spotify,
  }
}

function mapTracks(album: SpotifyAlbumRaw): Track[] {
  return (album.tracks?.items ?? []).map((track) => ({
    id: track.id,
    name: track.name,
    trackNumber: track.track_number,
    durationMs: track.duration_ms,
    artists: track.artists.map((artist) => artist.name),
  }))
}

// Spotify currently rejects /search with limit > 10 (docs still say 50).
export const SEARCH_LIMIT_MAX = 10

type SpotifyArtistRaw = {
  id: string
  name: string
  genres?: string[]
  images: { url: string; height: number | null; width: number | null }[]
}

function mapArtistSummary(artist: SpotifyArtistRaw): ArtistSummary {
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: pickImageUrl(artist.images),
    genres: artist.genres ?? [],
  }
}

export async function searchAlbums(
  query: string,
  limit = SEARCH_LIMIT_MAX,
  offset = 0
): Promise<AlbumSummary[]> {
  const { albums } = await searchAlbumsPage(query, { limit, offset })
  return albums
}

// Same search as searchAlbums(), but also returns Spotify's reported total
// hit count - used by Discover (src/lib/discover-server.ts) to pick a
// genuinely random offset into the result set instead of always showing the
// same first page.
export async function searchAlbumsPage(
  query: string,
  { limit = SEARCH_LIMIT_MAX, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<{ albums: AlbumSummary[]; total: number }> {
  const trimmed = query.trim()
  if (!trimmed) return { albums: [], total: 0 }

  const params = new URLSearchParams({
    q: trimmed,
    type: "album",
    limit: String(Math.min(Math.max(limit, 1), SEARCH_LIMIT_MAX)),
    offset: String(Math.max(offset, 0)),
  })

  const data = await spotifyFetch<{
    albums: { items: SpotifyAlbumRaw[]; total: number }
  }>(`/search?${params.toString()}`)

  return {
    albums: data.albums.items.filter(Boolean).map(mapAlbumSummary),
    total: data.albums.total,
  }
}

export async function searchArtists(
  query: string,
  limit = SEARCH_LIMIT_MAX
): Promise<ArtistSummary[]> {
  const { artists } = await searchArtistsPage(query, { limit })
  return artists
}

// Same search as searchArtists(), but also returns Spotify's reported total
// hit count - used by Discover's genre-based roll (see
// src/lib/discover-server.ts) to sample a random page of artists for a
// genre instead of always the same first page. Spotify's `genre:` search
// filter only works for type=artist/track, never type=album (see the
// dedicated comment in discover-server.ts), which is why Discover finds a
// genre match through an artist first, then that artist's own albums.
export async function searchArtistsPage(
  query: string,
  { limit = SEARCH_LIMIT_MAX, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<{ artists: ArtistSummary[]; total: number }> {
  const trimmed = query.trim()
  if (!trimmed) return { artists: [], total: 0 }

  const params = new URLSearchParams({
    q: trimmed,
    type: "artist",
    limit: String(Math.min(Math.max(limit, 1), SEARCH_LIMIT_MAX)),
    offset: String(Math.max(offset, 0)),
  })

  const data = await spotifyFetch<{
    artists: { items: SpotifyArtistRaw[]; total: number }
  }>(`/search?${params.toString()}`)

  return {
    artists: data.artists.items.filter(Boolean).map(mapArtistSummary),
    total: data.artists.total,
  }
}

// Spotify's docs list 50 as the max for /artists/{id}/albums, but - like
// /search above - the API actually rejects anything past 10 with a 400
// "Invalid limit" error in practice. Kept as its own named constant rather
// than reusing SEARCH_LIMIT_MAX since they're different endpoints that
// happen to share the same real ceiling right now; discover-server.ts
// compensates for the smaller per-artist sample by checking more candidate
// artists per genre roll.
const ARTIST_ALBUMS_LIMIT_MAX = 10

export async function getArtistAlbums(
  artistId: string,
  limit = ARTIST_ALBUMS_LIMIT_MAX
): Promise<AlbumSummary[]> {
  const params = new URLSearchParams({
    include_groups: "album",
    limit: String(Math.min(Math.max(limit, 1), ARTIST_ALBUMS_LIMIT_MAX)),
  })

  const data = await spotifyFetch<{ items: SpotifyAlbumRaw[] }>(
    `/artists/${artistId}/albums?${params.toString()}`
  )

  return uniqueById(data.items.filter(Boolean).map(mapAlbumSummary))
}

function uniqueById(albums: AlbumSummary[]): AlbumSummary[] {
  const seen = new Set<string>()
  return albums.filter((album) => {
    if (seen.has(album.id)) return false
    seen.add(album.id)
    return true
  })
}

// Wrapped in React's cache() because both an album page's generateMetadata
// and the page component itself look up the same album on every request -
// this dedupes that into a single Spotify API call per render.
export const getAlbum = cache(async (id: string): Promise<AlbumDetail> => {
  const album = await spotifyFetch<SpotifyAlbumRaw>(`/albums/${id}`)

  return {
    ...mapAlbumSummary(album),
    label: album.label ?? null,
    genres: album.genres ?? [],
    tracks: mapTracks(album),
  }
})
