import "server-only"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { reviews as reviewsTable, users as usersTable } from "@/lib/db/schema"
import type { Review } from "@/lib/types"

function toReview(row: typeof reviewsTable.$inferSelect): Review {
  return {
    spotifyId: row.spotifyId,
    albumName: row.albumName,
    artists: row.artists,
    imageUrl: row.imageUrl,
    releaseDate: row.releaseDate,
    totalTracks: row.totalTracks,
    rating: row.rating,
    text: row.reviewText,
    listenedAt: row.listenedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getReviewsForUser(userId: string): Promise<Review[]> {
  const rows = await db.query.reviews.findMany({
    where: eq(reviewsTable.userId, userId),
    orderBy: desc(reviewsTable.updatedAt),
  })

  return rows.map(toReview)
}

export async function getReviewForAlbum(
  userId: string,
  spotifyId: string
): Promise<Review | null> {
  const row = await db.query.reviews.findFirst({
    where: and(
      eq(reviewsTable.userId, userId),
      eq(reviewsTable.spotifyId, spotifyId)
    ),
  })

  return row ? toReview(row) : null
}

export type ShareableReview = {
  username: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  rating: number
  reviewText: string
}

export async function getShareableReview(
  username: string,
  spotifyId: string
): Promise<ShareableReview | null> {
  const [row] = await db
    .select({
      username: usersTable.username,
      albumName: reviewsTable.albumName,
      artists: reviewsTable.artists,
      imageUrl: reviewsTable.imageUrl,
      rating: reviewsTable.rating,
      reviewText: reviewsTable.reviewText,
    })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(
      and(eq(usersTable.username, username), eq(reviewsTable.spotifyId, spotifyId))
    )
    .limit(1)

  if (!row?.username) return null

  return { ...row, username: row.username }
}
