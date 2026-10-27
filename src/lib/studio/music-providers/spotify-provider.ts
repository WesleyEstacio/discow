import "server-only"
import { searchAlbums } from "@/lib/spotify"
import {
  parseReleaseYear,
  type ExternalAlbumResult,
  type MusicProvider,
  type MusicSearchQuery,
} from "@/lib/studio/music-providers/types"

function quoteForSpotify(value: string): string {
  return `"${value.replaceAll('"', "")}"`
}

function buildSpotifyQuery({ text, artist, year }: MusicSearchQuery): string {
  return [
    text,
    artist ? `artist:${quoteForSpotify(artist)}` : "",
    /^\d{4}(-\d{4})?$/.test(year) ? `year:${year}` : "",
  ]
    .filter(Boolean)
    .join(" ")
}

export const spotifyMusicProvider: MusicProvider = {
  source: "spotify",
  label: "Spotify",
  // Spotify's album search has no genre filter (genre: only works for
  // artists and tracks).
  unsupportedFilters: ["genre"],
  isConfigured: () =>
    Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
  async searchAlbums(query) {
    const spotifyQuery = buildSpotifyQuery(query)
    if (!spotifyQuery) return []

    const albums = await searchAlbums(spotifyQuery)
    return albums.map(
      (album): ExternalAlbumResult => ({
        source: "spotify",
        externalId: album.id,
        title: album.name,
        artistNames: album.artists,
        releaseYear: parseReleaseYear(album.releaseDate),
        coverImageUrl: album.imageUrl,
        coverSource: album.imageUrl ? "spotify" : null,
        spotifyUrl: album.spotifyUrl,
        genres: [],
      })
    )
  },
}
