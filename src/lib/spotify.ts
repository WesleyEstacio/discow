import type { AlbumDetail, AlbumSummary, Track } from "@/lib/types"

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
const SEARCH_LIMIT_MAX = 10

export async function searchAlbums(
  query: string,
  limit = SEARCH_LIMIT_MAX
): Promise<AlbumSummary[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const params = new URLSearchParams({
    q: trimmed,
    type: "album",
    limit: String(Math.min(Math.max(limit, 1), SEARCH_LIMIT_MAX)),
  })

  const data = await spotifyFetch<{
    albums: { items: SpotifyAlbumRaw[] }
  }>(`/search?${params.toString()}`)

  return data.albums.items.filter(Boolean).map(mapAlbumSummary)
}

export async function getAlbum(id: string): Promise<AlbumDetail> {
  const album = await spotifyFetch<SpotifyAlbumRaw>(`/albums/${id}`)

  return {
    ...mapAlbumSummary(album),
    label: album.label ?? null,
    genres: album.genres ?? [],
    tracks: mapTracks(album),
  }
}
