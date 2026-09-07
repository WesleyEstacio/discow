import "server-only"
import { and, count, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { favoriteArtists } from "@/lib/db/schema"
import type { FavoriteArtist } from "@/lib/types"

function toFavoriteArtist(row: typeof favoriteArtists.$inferSelect): FavoriteArtist {
  return {
    spotifyId: row.spotifyId,
    name: row.name,
    imageUrl: row.imageUrl,
    genres: row.genres,
    createdAt: row.createdAt.toISOString(),
  }
}

// Oldest-favorited-first, matching getFavoriteAlbums() in src/lib/favorites.ts.
export async function getFavoriteArtists(userId: string): Promise<FavoriteArtist[]> {
  const rows = await db.query.favoriteArtists.findMany({
    where: eq(favoriteArtists.userId, userId),
    orderBy: (favoriteArtist, { asc }) => asc(favoriteArtist.createdAt),
  })

  return rows.map(toFavoriteArtist)
}

// Used to enforce MAX_FAVORITE_ARTISTS before inserting a new favorite -
// cheaper than getFavoriteArtists when the favorites themselves aren't needed.
export async function getFavoriteArtistCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(favoriteArtists)
    .where(eq(favoriteArtists.userId, userId))

  return row?.value ?? 0
}

// Whether `userId` already has `spotifyId` favorited - drives the heart's
// initial state on the artist page (src/app/(dashboard)/artist/[id]/page.tsx).
export async function isFavoriteArtist(
  userId: string,
  spotifyId: string
): Promise<boolean> {
  const row = await db.query.favoriteArtists.findFirst({
    where: and(
      eq(favoriteArtists.userId, userId),
      eq(favoriteArtists.spotifyId, spotifyId)
    ),
  })

  return row !== undefined
}
