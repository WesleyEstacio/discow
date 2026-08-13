import "server-only"
import { and, asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { favoriteAlbums } from "@/lib/db/schema"
import { resolveReleaseKind, type ReleaseKind } from "@/lib/release-kind"
import type { FavoriteAlbum } from "@/lib/types"

function toFavoriteAlbum(row: typeof favoriteAlbums.$inferSelect): FavoriteAlbum {
  return {
    spotifyId: row.spotifyId,
    albumName: row.albumName,
    artists: row.artists,
    imageUrl: row.imageUrl,
    releaseDate: row.releaseDate,
    totalTracks: row.totalTracks,
    createdAt: row.createdAt.toISOString(),
  }
}

// Oldest-favorited-first, so the section shows favorites in the order they
// were picked instead of shuffling around as new ones are added.
export async function getFavoriteAlbums(userId: string): Promise<FavoriteAlbum[]> {
  const rows = await db.query.favoriteAlbums.findMany({
    where: eq(favoriteAlbums.userId, userId),
    orderBy: asc(favoriteAlbums.createdAt),
  })

  return rows.map(toFavoriteAlbum)
}

// Used to enforce MAX_FAVORITES_PER_KIND before inserting a new favorite -
// cheaper than getFavoriteAlbums when the favorites themselves aren't
// needed. The cap applies per kind (up to 5 albums *and*, separately, up to
// 5 tracks), and kind isn't its own column - same as `review` - so this
// fetches just the `totalTracks` of the user's existing favorites (at most
// 2 * MAX_FAVORITES_PER_KIND rows in practice) and classifies them in
// memory with resolveReleaseKind(), instead of adding a derived-column
// expression to the query.
export async function getFavoriteCountByKind(
  userId: string,
  kind: ReleaseKind
): Promise<number> {
  const rows = await db
    .select({ totalTracks: favoriteAlbums.totalTracks })
    .from(favoriteAlbums)
    .where(eq(favoriteAlbums.userId, userId))

  return rows.filter((row) => resolveReleaseKind(row.totalTracks) === kind).length
}

// Whether `userId` already has `spotifyId` favorited - drives the heart's
// initial state on the album page (src/app/(dashboard)/album/[id]/page.tsx).
export async function isFavoriteAlbum(
  userId: string,
  spotifyId: string
): Promise<boolean> {
  const row = await db.query.favoriteAlbums.findFirst({
    where: and(
      eq(favoriteAlbums.userId, userId),
      eq(favoriteAlbums.spotifyId, spotifyId)
    ),
  })

  return row !== undefined
}
