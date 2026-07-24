import "server-only"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { reviews as reviewsTable } from "@/lib/db/schema"
import type { Review } from "@/lib/types"

function toReview(row: typeof reviewsTable.$inferSelect): Review {
  return {
    spotifyId: row.spotifyId,
    albumName: row.albumName,
    artists: row.artists,
    imageUrl: row.imageUrl,
    releaseDate: row.releaseDate,
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
