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
  // Spotify artist id per entry in `artists` (same order/length), when
  // known - lets a display like AlbumCard link each artist name to
  // /artist/[id]. Only ever set when this came straight from a live Spotify
  // call (see mapAlbumSummary in src/lib/spotify.ts); anything rebuilt from a
  // DB row (reviews, favorite_album, discover_pick) only ever denormalized
  // artist *names* (see ROADMAP.md), so it's left undefined there and the
  // artist name just renders as plain text instead of a link.
  artistIds?: string[]
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
  // Same idea as AlbumSummary.artistIds - lets the album page's tracklist
  // link a track's (co-)artists to /artist/[id].
  artistIds?: string[]
}

export type AlbumDetail = AlbumSummary & {
  label: string | null
  genres: string[]
  tracks: Track[]
}

export type ArtistDetail = {
  id: string
  name: string
  imageUrl: string | null
  genres: string[]
  followers: number
  popularity: number
  spotifyUrl: string
}

export type ArtistTopTrack = {
  id: string
  name: string
  durationMs: number
  imageUrl: string | null
  albumId: string
  albumName: string
  spotifyUrl: string
}

// One row per artist a listener has favorited from the artist page (see
// src/lib/favorite-artists.ts). Denormalized the same way as `FavoriteAlbum`.
export type FavoriteArtist = {
  spotifyId: string
  name: string
  imageUrl: string | null
  genres: string[]
  createdAt: string
}

export type Review = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  releaseDate: string | null
  // How many tracks the reviewed release has - null for reviews saved before
  // this was tracked (see resolveReleaseKind() in src/lib/release-kind.ts,
  // which decides album vs track and treats null as an album).
  totalTracks: number | null
  rating: number
  text: string
  listenedAt: string
  updatedAt: string
  // Resolved separately, on demand, by resolveArtistIdsByAlbumId() in
  // src/lib/spotify.ts (a live Spotify lookup keyed off `spotifyId`, since
  // the review row itself only ever stored artist *names*) - undefined
  // unless the page that loaded this review specifically asked for it.
  artistIds?: string[]
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

// A hand-curated collection behind "Discows picks" on the library page
// (src/lib/picks.ts). Unlike AlbumSummary, these albums come from a static
// JSON file bundled in the repo rather than the Spotify API - `id` is still
// a real Spotify album id (so it links straight into /album/[id]), but
// there's no imageUrl/spotifyUrl round-trip since the cover ships locally.
// One row per album a listener has marked as a favorite (see
// src/lib/favorites.ts and the "Favorite albums" section in
// src/components/profile-view.tsx). Denormalized the same way as `Review`,
// so a favorite doesn't depend on that album having a review too.
export type FavoriteAlbum = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  releaseDate: string | null
  totalTracks: number | null
  createdAt: string
  // Same as Review.artistIds above - resolved on demand, not stored.
  artistIds?: string[]
}

export type PickAlbum = {
  id: string
  title: string
  artist: string
  releaseDate: string
  genres: string[]
  cover: string
  // Resolved on demand by getPicksCollections() in src/lib/picks.ts (a live
  // Spotify lookup keyed off `id`) - the curated JSON only ever names the
  // artist, never their Spotify id. Singular, unlike AlbumSummary/Track's
  // `artistIds[]`, because the curated data itself only ever credits one
  // display name per album (see src/data/picks/*.json) - this is that
  // name's primary artist on Spotify, not necessarily the only one.
  artistId?: string
}

export type PickCollection = {
  id: string
  title: string
  description: string
  createdBy: string
  cover: string | null
  albums: PickAlbum[]
}
