import "server-only"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { follows, users } from "@/lib/db/schema"
import { FOLLOW_LIST_PAGE_SIZE } from "@/lib/follow-constants"
import type { UserSummary } from "@/lib/types"

export type FollowCounts = {
  followers: number
  following: number
}

// Two independent counts, run as one round trip instead of two sequential
// queries.
export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const [followerRow] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(follows)
    .where(eq(follows.followingId, userId))

  const [followingRow] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(follows)
    .where(eq(follows.followerId, userId))

  return {
    followers: followerRow?.count ?? 0,
    following: followingRow?.count ?? 0,
  }
}

// Just the "following" half, used to enforce MAX_FOLLOWING before inserting
// a new follow - cheaper than getFollowCounts when the followers count isn't
// needed.
export async function getFollowingCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(follows)
    .where(eq(follows.followerId, userId))

  return row?.count ?? 0
}

// Whether `viewerId` already follows `profileUserId` - drives the
// Follow/Unfollow toggle button on someone else's profile.
export async function isFollowing(
  viewerId: string | null | undefined,
  profileUserId: string
): Promise<boolean> {
  if (!viewerId) return false

  const row = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, viewerId),
      eq(follows.followingId, profileUserId)
    ),
  })

  return row !== undefined
}

function toUserSummary(row: {
  id: string
  name: string | null
  username: string | null
  image: string | null
}): UserSummary | null {
  if (!row.username) return null
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    image: row.image,
  }
}

export type FollowListPage = {
  limit?: number
  offset?: number
}

// Listed newest-first so a profile's "Followers"/"Following" dialog shows
// whoever just followed at the top, like most social apps. Paginated via
// limit/offset - see FOLLOW_LIST_PAGE_SIZE and the "load more" actions in
// src/lib/follow-actions.ts.
export async function getFollowers(
  userId: string,
  { limit = FOLLOW_LIST_PAGE_SIZE, offset = 0 }: FollowListPage = {}
): Promise<UserSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(sql`${follows.createdAt} desc`)
    .limit(limit)
    .offset(offset)

  return rows.flatMap((row) => toUserSummary(row) ?? [])
}

export async function getFollowing(
  userId: string,
  { limit = FOLLOW_LIST_PAGE_SIZE, offset = 0 }: FollowListPage = {}
): Promise<UserSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(sql`${follows.createdAt} desc`)
    .limit(limit)
    .offset(offset)

  return rows.flatMap((row) => toUserSummary(row) ?? [])
}
