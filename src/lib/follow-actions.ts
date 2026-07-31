"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { follows, users } from "@/lib/db/schema"
import { MAX_FOLLOWING } from "@/lib/follow-constants"
import { getFollowers, getFollowing, getFollowingCount } from "@/lib/follows"
import type { UserSummary } from "@/lib/types"

export type FollowActionResult =
  | { success: true; following: boolean }
  | { success: false; error: string }

// Both follow and unfollow revalidate the same two profiles: the viewer's
// (their "Following" count changed) and the target's (their "Followers"
// count changed).
function revalidateFollowPaths(usernames: Array<string | null | undefined>) {
  for (const username of usernames) {
    if (username) revalidatePath(`/profile/${username}`)
  }
}

export async function followUserAction(targetUserId: string): Promise<FollowActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to follow people." }
  }
  if (session.user.id === targetUserId) {
    return { success: false, error: "You can't follow yourself." }
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
    columns: { username: true },
  })
  if (!targetUser) {
    return { success: false, error: "That user doesn't exist." }
  }

  // Soft cap, checked-then-inserted rather than enforced by a DB constraint -
  // a race between two concurrent follows could in theory sneak one past the
  // limit, but that's an acceptable tradeoff for how small MAX_FOLLOWING is.
  const followingCount = await getFollowingCount(session.user.id)
  if (followingCount >= MAX_FOLLOWING) {
    return {
      success: false,
      error: `You can only follow up to ${MAX_FOLLOWING} people right now.`,
    }
  }

  await db
    .insert(follows)
    .values({ followerId: session.user.id, followingId: targetUserId })
    .onConflictDoNothing({ target: [follows.followerId, follows.followingId] })

  revalidateFollowPaths([session.user.username, targetUser.username])

  return { success: true, following: true }
}

export async function unfollowUserAction(targetUserId: string): Promise<FollowActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to manage who you follow." }
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
    columns: { username: true },
  })

  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, session.user.id),
        eq(follows.followingId, targetUserId)
      )
    )

  revalidateFollowPaths([session.user.username, targetUser?.username])

  return { success: true, following: false }
}

// "Load more" for the Followers/Following dialog (src/components/follow-
// list-dialog.tsx) - the first page is fetched server-side with the rest of
// the profile, these actions fetch every page after that.
export async function getMoreFollowersAction(
  userId: string,
  offset: number
): Promise<UserSummary[]> {
  return getFollowers(userId, { offset })
}

export async function getMoreFollowingAction(
  userId: string,
  offset: number
): Promise<UserSummary[]> {
  return getFollowing(userId, { offset })
}
