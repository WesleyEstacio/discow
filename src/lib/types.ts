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
  rating: number
  text: string
  listenedAt: string
  updatedAt: string
}

export type MockUser = {
  id: string
  displayName: string
  avatar: string | null
  bio: string
}
