"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { reviews as reviewsTable } from "@/lib/db/schema"

export type SaveReviewInput = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  releaseDate: string | null
  rating: number
  text: string
}

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string }

function revalidateReviewPaths(spotifyId: string) {
  revalidatePath(`/album/${spotifyId}`)
  revalidatePath("/profile")
  revalidatePath("/")
}

export async function saveReview(
  input: SaveReviewInput
): Promise<ReviewActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to save a review." }
  }

  if (input.rating <= 0 || input.rating > 5) {
    return { success: false, error: "Pick a rating between 0.5 and 5 stars." }
  }

  const userId = session.user.id

  await db
    .insert(reviewsTable)
    .values({
      userId,
      spotifyId: input.spotifyId,
      albumName: input.albumName,
      artists: input.artists,
      imageUrl: input.imageUrl,
      releaseDate: input.releaseDate,
      rating: input.rating,
      reviewText: input.text.trim(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [reviewsTable.userId, reviewsTable.spotifyId],
      set: {
        albumName: input.albumName,
        artists: input.artists,
        imageUrl: input.imageUrl,
        releaseDate: input.releaseDate,
        rating: input.rating,
        reviewText: input.text.trim(),
        updatedAt: new Date(),
      },
    })

  revalidateReviewPaths(input.spotifyId)

  return { success: true }
}

export async function deleteReviewAction(
  spotifyId: string
): Promise<ReviewActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to remove a review." }
  }

  await db
    .delete(reviewsTable)
    .where(
      and(
        eq(reviewsTable.userId, session.user.id),
        eq(reviewsTable.spotifyId, spotifyId)
      )
    )

  revalidateReviewPaths(spotifyId)

  return { success: true }
}
