import { unstable_cache } from "next/cache"
import firstSteps from "@/data/picks/first-steps.json"
import hiddenGems from "@/data/picks/hidden-gems.json"
import { resolveArtistIdsByAlbumId } from "@/lib/spotify"
import type { PickCollection } from "@/lib/types"

type RawPickAlbum = (typeof firstSteps.albums)[number]

type RawPickCollection = {
  id: string
  title: string
  description: string
  createdBy: string
  cover: string | null
  albums: RawPickAlbum[]
}

// Cover paths in the JSON are relative to /public (e.g.
// "first-steps-covers/xxx.jpg") so the source data can be generated without
// knowing anything about how the app serves static assets - this is the one
// place that turns them into paths next/image can actually load.
function toPublicPath(relativePath: string) {
  return `/${relativePath}`
}

function toPickCollection(raw: RawPickCollection): PickCollection {
  const albums = raw.albums.map((album) => ({
    id: album.id,
    title: album.title,
    artist: album.artist,
    releaseDate: album.releaseDate,
    genres: album.genres,
    cover: toPublicPath(album.cover),
  }))

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    createdBy: raw.createdBy,
    cover: raw.cover ? toPublicPath(raw.cover) : (albums[0]?.cover ?? null),
    albums,
  }
}

// The collections themselves are fully static - the album data and cover
// images ship in the repo (src/data/picks + public/first-steps-covers,
// public/hidden-gems-covers) instead of coming from Spotify or the database.
const STATIC_PICKS_COLLECTIONS: PickCollection[] = [
  toPickCollection(firstSteps),
  toPickCollection(hiddenGems),
]

// Each album's `artist` field is only ever a display name (see the JSON
// files above), so this resolves every album's real Spotify artist id (one
// live lookup per unique album, see resolveArtistIdsByAlbumId in
// src/lib/spotify.ts) purely so the picks dialog can link the artist credit
// to /artist/[id]. There are ~80 albums across both collections today, so
// doing this on every request would mean ~80 outbound Spotify calls per
// visitor - wrapped in unstable_cache with a long revalidate window instead,
// since the curated list itself barely ever changes and a given album's
// artist id never does, so there's nothing to gain from re-resolving it
// often.
const PICKS_ARTIST_IDS_REVALIDATE_SECONDS = 60 * 60 * 24 * 7

async function getPicksCollectionsUncached(): Promise<PickCollection[]> {
  const allAlbumIds = STATIC_PICKS_COLLECTIONS.flatMap((collection) =>
    collection.albums.map((album) => album.id)
  )
  const artistIdsByAlbumId = await resolveArtistIdsByAlbumId(allAlbumIds)

  return STATIC_PICKS_COLLECTIONS.map((collection) => ({
    ...collection,
    albums: collection.albums.map((album) => ({
      ...album,
      artistId: artistIdsByAlbumId[album.id]?.[0],
    })),
  }))
}

// Curated collections behind "Discows picks" on the library page.
export const getPicksCollections = unstable_cache(
  getPicksCollectionsUncached,
  ["picks-collections"],
  { revalidate: PICKS_ARTIST_IDS_REVALIDATE_SECONDS, tags: ["picks-collections"] }
)
