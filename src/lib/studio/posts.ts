import "server-only"
import { and, asc, desc, eq, gte, inArray, isNotNull, lt, sql, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { studioAlbums, studioPosts } from "@/lib/db/schema"
import type { PostLanguage, PostStatus } from "@/lib/studio/post-status"

export type StudioPost = typeof studioPosts.$inferSelect

export type StudioPostSummary = Pick<
  StudioPost,
  "id" | "title" | "templateKey" | "status" | "language" | "scheduledFor" | "updatedAt" | "createdAt"
> & { slideCount: number }

export type StudioPostFilters = {
  status?: PostStatus
  templateKey?: string
  language?: PostLanguage
  scheduledFrom?: Date
  scheduledUntil?: Date
}

const postSummaryColumns = {
  id: studioPosts.id,
  title: studioPosts.title,
  templateKey: studioPosts.templateKey,
  status: studioPosts.status,
  language: studioPosts.language,
  scheduledFor: studioPosts.scheduledFor,
  updatedAt: studioPosts.updatedAt,
  createdAt: studioPosts.createdAt,
  slideCount: sql<number>`jsonb_array_length(${studioPosts.slides})::int`,
}

export async function listStudioPosts(filters: StudioPostFilters = {}): Promise<StudioPostSummary[]> {
  const conditions: SQL[] = []
  if (filters.status) conditions.push(eq(studioPosts.status, filters.status))
  if (filters.templateKey) conditions.push(eq(studioPosts.templateKey, filters.templateKey))
  if (filters.language) conditions.push(eq(studioPosts.language, filters.language))
  if (filters.scheduledFrom) conditions.push(gte(studioPosts.scheduledFor, filters.scheduledFrom))
  if (filters.scheduledUntil) conditions.push(lt(studioPosts.scheduledFor, filters.scheduledUntil))

  return db
    .select(postSummaryColumns)
    .from(studioPosts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(studioPosts.updatedAt))
    .limit(200)
}

export async function getStudioPost(postId: string): Promise<StudioPost | null> {
  const [post] = await db.select().from(studioPosts).where(eq(studioPosts.id, postId)).limit(1)
  return post ?? null
}

export async function countStudioPostsByStatus(): Promise<Record<PostStatus, number>> {
  const rows = await db
    .select({ status: studioPosts.status, count: sql<number>`count(*)::int` })
    .from(studioPosts)
    .groupBy(studioPosts.status)

  const counts: Record<PostStatus, number> = {
    idea: 0,
    draft: 0,
    in_review: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
  }
  for (const row of rows) counts[row.status] = row.count
  return counts
}

export async function listUpcomingScheduledPosts(limit = 5): Promise<StudioPostSummary[]> {
  return db
    .select(postSummaryColumns)
    .from(studioPosts)
    .where(and(isNotNull(studioPosts.scheduledFor), gte(studioPosts.scheduledFor, startOfToday()), sql`${studioPosts.status} <> 'published'`))
    .orderBy(asc(studioPosts.scheduledFor))
    .limit(limit)
}

export async function listRecentStudioPosts(limit = 6): Promise<StudioPostSummary[]> {
  return db.select(postSummaryColumns).from(studioPosts).orderBy(desc(studioPosts.updatedAt)).limit(limit)
}

export async function listRecentlyUsedAlbums(limit = 8) {
  const recentPosts = await db
    .select({ albumIds: studioPosts.albumIds })
    .from(studioPosts)
    .orderBy(desc(studioPosts.updatedAt))
    .limit(20)

  const recentAlbumIds = [...new Set(recentPosts.flatMap((post) => post.albumIds))].slice(0, limit)
  if (recentAlbumIds.length === 0) return []

  const albums = await db
    .select({ id: studioAlbums.id, title: studioAlbums.title, artistNames: studioAlbums.artistNames, coverImageUrl: studioAlbums.coverImageUrl })
    .from(studioAlbums)
    .where(inArray(studioAlbums.id, recentAlbumIds))

  const albumsById = new Map(albums.map((album) => [album.id, album]))
  return recentAlbumIds.flatMap((albumId) => {
    const album = albumsById.get(albumId)
    return album ? [album] : []
  })
}

export async function listRecentlyAddedAlbums(limit = 5) {
  return db
    .select({ id: studioAlbums.id, title: studioAlbums.title, artistNames: studioAlbums.artistNames, createdAt: studioAlbums.createdAt })
    .from(studioAlbums)
    .orderBy(desc(studioAlbums.createdAt))
    .limit(limit)
}

export function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}
