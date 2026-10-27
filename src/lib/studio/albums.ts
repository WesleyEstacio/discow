import "server-only"
import { and, arrayContains, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { studioAlbums, studioPosts } from "@/lib/db/schema"
import type { ExternalAlbumSource } from "@/lib/studio/music-providers/types"

export type StudioAlbum = typeof studioAlbums.$inferSelect

export type StudioAlbumFilters = {
  text?: string
  genre?: string
  tag?: string
  year?: string
}

export async function listStudioAlbums(filters: StudioAlbumFilters = {}, limit = 120): Promise<StudioAlbum[]> {
  const conditions = []

  if (filters.text) {
    const pattern = `%${filters.text}%`
    conditions.push(
      or(
        ilike(studioAlbums.title, pattern),
        sql`array_to_string(${studioAlbums.artistNames}, ' ') ilike ${pattern}`
      )
    )
  }
  if (filters.genre) {
    conditions.push(sql`exists (select 1 from unnest(${studioAlbums.genres}) as genre where genre ilike ${`%${filters.genre}%`})`)
  }
  if (filters.tag) {
    conditions.push(arrayContains(studioAlbums.tags, [filters.tag]))
  }
  if (filters.year && /^\d{4}$/.test(filters.year)) {
    conditions.push(eq(studioAlbums.releaseYear, Number.parseInt(filters.year, 10)))
  }

  return db
    .select()
    .from(studioAlbums)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(studioAlbums.createdAt))
    .limit(limit)
}

export async function getStudioAlbum(albumId: string): Promise<StudioAlbum | null> {
  const [album] = await db.select().from(studioAlbums).where(eq(studioAlbums.id, albumId)).limit(1)
  return album ?? null
}

export async function getStudioAlbumsByIds(albumIds: string[]): Promise<StudioAlbum[]> {
  if (albumIds.length === 0) return []
  return db.select().from(studioAlbums).where(inArray(studioAlbums.id, albumIds))
}

export async function findSavedAlbumIdsByExternalId(
  source: ExternalAlbumSource,
  externalIds: string[]
): Promise<Map<string, string>> {
  if (externalIds.length === 0) return new Map()

  const rows = await db
    .select({ id: studioAlbums.id, externalId: studioAlbums.externalId })
    .from(studioAlbums)
    .where(and(eq(studioAlbums.externalSource, source), inArray(studioAlbums.externalId, externalIds)))

  return new Map(
    rows.flatMap((row) => (row.externalId ? [[row.externalId, row.id] as const] : []))
  )
}

export async function countPostsUsingAlbum(albumId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studioPosts)
    .where(arrayContains(studioPosts.albumIds, [albumId]))
  return row?.count ?? 0
}

export async function listAllAlbumTags(): Promise<string[]> {
  const rows = await db.execute<{ tag: string }>(
    sql`select distinct unnest(${studioAlbums.tags}) as tag from ${studioAlbums} order by tag`
  )
  return rows.rows.map((row) => row.tag)
}
