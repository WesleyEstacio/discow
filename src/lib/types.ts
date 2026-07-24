export type SpotifyImage = {
  url: string
  height: number | null
  width: number | null
}

export type AlbumSummary = {
  id: string
  name: string
  artists: string[]
  releaseDate: string
  totalTracks: number
  imageUrl: string | null
  spotifyUrl: string
}

export type ArtistSummary = {
  id: string
  name: string
  imageUrl: string | null
  genres: string[]
}

export type RecommendMode = "genre" | "artist" | "surprise"

export type RecommendRequest = {
  mode: RecommendMode
  genre?: string
  artist?: string
  yearFrom?: number
  yearTo?: number
  excludeIds?: string[]
  seedArtists?: string[]
  seedYears?: number[]
}

export type RecommendResponse = {
  albums: AlbumSummary[]
  reason: string
}

export type Track = {
  id: string
  name: string
  trackNumber: number
  durationMs: number
  artists: string[]
}

export type AlbumDetail = AlbumSummary & {
  label: string | null
  genres: string[]
  tracks: Track[]
}

export type Review = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  releaseDate: string | null
  rating: number
  text: string
  listenedAt: string
  updatedAt: string
}

