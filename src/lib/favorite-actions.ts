"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { favoriteAlbums } from "@/lib/db/schema"
import { MAX_FAVORITES_PER_KIND } from "@/lib/favorite-constants"
import { getFavoriteCountByKind } from "@/lib/favorites"
import { resolveReleaseKind } from "@/lib/release-kind"

export type AddFavoriteAlbumInput = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  releaseDate: string | null
  totalTracks: number | null
}

export type FavoriteActionResult =
  | { success: true }
  | { success: false; error: string }

// Both add and remove revalidate the album page (the heart lives there) and
// the profile page (the favorites section lives there).
function revalidateFavoritePaths(spotifyId: string, username: string | null) {
  revalidatePath(`/album/${spotifyId}`)
  if (username) revalidatePath(`/profile/${username}`)
}

export async function addFavoriteAlbumAction(
  input: AddFavoriteAlbumInput
): Promise<FavoriteActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to favorite an album." }
  }

  const userId = session.user.id
  const kind = resolveReleaseKind(input.totalTracks)

  // Soft cap, checked-then-inserted rather than enforced by a DB constraint -
  // same tradeoff as MAX_FOLLOWING in follow-actions.ts. Applies per kind, so
  // an account can have up to MAX_FAVORITES_PER_KIND albums *and*, separately,
  // up to MAX_FAVORITES_PER_KIND tracks.
  const favoriteCount = await getFavoriteCountByKind(userId, kind)
  if (favoriteCount >= MAX_FAVORITES_PER_KIND) {
    const kindLabel = kind === "album" ? "albums" : "tracks"
    return {
      success: false,
      error: `You can only favorite up to ${MAX_FAVORITES_PER_KIND} ${kindLabel} right now.`,
    }
  }

  await db
    .insert(favoriteAlbums)
    .values({
      userId,
      spotifyId: input.spotifyId,
      albumName: input.albumName,
      artists: input.artists,
      imageUrl: input.imageUrl,
      releaseDate: input.releaseDate,
      totalTracks: input.totalTracks,
    })
    .onConflictDoNothing({
      target: [favoriteAlbums.userId, favoriteAlbums.spotifyId],
    })

  revalidateFavoritePaths(input.spotifyId, session.user.username)

  return { success: true }
}

export async function removeFavoriteAlbumAction(
  spotifyId: string
): Promise<FavoriteActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to manage your favorite albums." }
  }

  await db
    .delete(favoriteAlbums)
    .where(
      and(
        eq(favoriteAlbums.userId, session.user.id),
        eq(favoriteAlbums.spotifyId, spotifyId)
      )
    )

  revalidateFavoritePaths(spotifyId, session.user.username)

  return { success: true }
}
