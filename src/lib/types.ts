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

export type UserSummary = {
  id: string
  name: string | null
  username: string
  image: string | null
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

export type PopularAlbum = {
  album: AlbumSummary
  averageRating: number
  reviewCount: number
}

export type CommunityActivityItem = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  rating: number
  reviewText: string
  updatedAt: string
  reviewerName: string
  reviewerImage: string | null
  reviewerUsername: string | null
}

