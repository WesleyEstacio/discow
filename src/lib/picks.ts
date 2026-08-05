import firstSteps from "@/data/picks/first-steps.json"
import hiddenGems from "@/data/picks/hidden-gems.json"
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

// Static collections curated by the Discows team, shown behind "Discows
// picks" on the library page. Unlike the rest of that page, this is fully
// static - the album data and cover images ship in the repo
// (src/data/picks + public/first-steps-covers, public/hidden-gems-covers)
// instead of coming from Spotify or the database, so there's nothing to
// fetch or cache here.
export const PICKS_COLLECTIONS: PickCollection[] = [
  toPickCollection(firstSteps),
  toPickCollection(hiddenGems),
]
