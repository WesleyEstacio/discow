"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { favoriteArtists } from "@/lib/db/schema"
import { MAX_FAVORITE_ARTISTS } from "@/lib/favorite-artist-constants"
import { getFavoriteArtistCount } from "@/lib/favorite-artists"

export type AddFavoriteArtistInput = {
  spotifyId: string
  name: string
  imageUrl: string | null
  genres: string[]
}

export type FavoriteArtistActionResult =
  | { success: true }
  | { success: false; error: string }

export async function addFavoriteArtistAction(
  input: AddFavoriteArtistInput
): Promise<FavoriteArtistActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to favorite an artist." }
  }

  const userId = session.user.id

  // Soft cap, checked-then-inserted rather than enforced by a DB constraint -
  // same tradeoff as MAX_FAVORITES_PER_KIND in favorite-actions.ts.
  const favoriteCount = await getFavoriteArtistCount(userId)
  if (favoriteCount >= MAX_FAVORITE_ARTISTS) {
    return {
      success: false,
      error: `You can only favorite up to ${MAX_FAVORITE_ARTISTS} artists right now.`,
    }
  }

  await db
    .insert(favoriteArtists)
    .values({
      userId,
      spotifyId: input.spotifyId,
      name: input.name,
      imageUrl: input.imageUrl,
      genres: input.genres,
    })
    .onConflictDoNothing({
      target: [favoriteArtists.userId, favoriteArtists.spotifyId],
    })

  revalidatePath(`/artist/${input.spotifyId}`)

  return { success: true }
}

export async function removeFavoriteArtistAction(
  spotifyId: string
): Promise<FavoriteArtistActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to manage your favorite artists." }
  }

  await db
    .delete(favoriteArtists)
    .where(
      and(
        eq(favoriteArtists.userId, session.user.id),
        eq(favoriteArtists.spotifyId, spotifyId)
      )
    )

  revalidatePath(`/artist/${spotifyId}`)

  return { success: true }
}
