import "server-only"
import { desc, eq, gte, inArray, ne, sql } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"
import { reviews as reviewsTable, users } from "@/lib/db/schema"
import { searchAlbums } from "@/lib/spotify"
import type { AlbumSummary, CommunityActivityItem, PopularAlbum } from "@/lib/types"

// Spotify's search "tag:new" filter (albums released in the last two weeks)
// only returns results when combined with another filter, so we fan out
// across a handful of broad genres and merge the results. This replaces the
// old GET /browse/new-releases endpoint, which Spotify removed in Feb 2026.
const NEW_RELEASES_SEED_GENRES = [
  "pop",
  "hip-hop",
  "rock",
  "electronic",
  "indie",
  "r&b",
] as const

function dedupeAlbumsById(albums: AlbumSummary[]): AlbumSummary[] {
  const seenAlbumIds = new Set<string>()
  return albums.filter((album) => {
    if (seenAlbumIds.has(album.id)) return false
    seenAlbumIds.add(album.id)
    return true
  })
}

export async function getNewReleases(limit = 6): Promise<AlbumSummary[]> {
  const settledSearches = await Promise.allSettled(
    NEW_RELEASES_SEED_GENRES.map((genre) => searchAlbums(`genre:"${genre}" tag:new`))
  )

  const albums = settledSearches.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  )

  return dedupeAlbumsById(albums)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    .slice(0, limit)
}

// Spotify removed the album `popularity` field in Feb 2026, so there is no
// Spotify-side signal left to build a "popular" chart from. Instead, this
// tracks popularity within our own community: the albums with the most
// reviews on Discows recently. All the fields we need are already
// denormalized onto the review row, so this needs zero Spotify API calls.
const POPULAR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

type ReviewRow = typeof reviewsTable.$inferSelect

async function queryMostReviewedAlbums(
  limit: number,
  since?: Date
): Promise<PopularAlbum[]> {
  const aggregates = await db
    .select({
      spotifyId: reviewsTable.spotifyId,
      reviewCount: sql<number>`count(*)`.mapWith(Number),
      averageRating: sql<number>`avg(${reviewsTable.rating})`.mapWith(Number),
    })
    .from(reviewsTable)
    .where(since ? gte(reviewsTable.updatedAt, since) : undefined)
    .groupBy(reviewsTable.spotifyId)
    .orderBy(desc(sql`count(*)`), desc(sql`avg(${reviewsTable.rating})`))
    .limit(limit)

  if (aggregates.length === 0) return []

  const matchingReviews = await db
    .select()
    .from(reviewsTable)
    .where(
      inArray(
        reviewsTable.spotifyId,
        aggregates.map((aggregate) => aggregate.spotifyId)
      )
    )
    .orderBy(desc(reviewsTable.updatedAt))

  const latestReviewBySpotifyId = new Map<string, ReviewRow>()
  for (const review of matchingReviews) {
    if (!latestReviewBySpotifyId.has(review.spotifyId)) {
      latestReviewBySpotifyId.set(review.spotifyId, review)
    }
  }

  return aggregates.flatMap((aggregate) => {
    const review = latestReviewBySpotifyId.get(aggregate.spotifyId)
    if (!review) return []

    const album: AlbumSummary = {
      id: review.spotifyId,
      name: review.albumName,
      artists: review.artists,
      releaseDate: review.releaseDate ?? review.updatedAt.toISOString().slice(0, 4),
      totalTracks: 0,
      imageUrl: review.imageUrl,
      spotifyUrl: `https://open.spotify.com/album/${review.spotifyId}`,
    }

    return [
      {
        album,
        averageRating: aggregate.averageRating,
        reviewCount: aggregate.reviewCount,
      },
    ]
  })
}

async function getPopularAlbumsThisWeekUncached(limit: number): Promise<PopularAlbum[]> {
  const recentAlbums = await queryMostReviewedAlbums(
    limit,
    new Date(Date.now() - POPULAR_WINDOW_MS)
  )
  if (recentAlbums.length > 0) return recentAlbums

  // Not enough activity in the last 7 days yet (e.g. a brand-new community) -
  // fall back to all-time so the section isn't empty by default.
  return queryMostReviewedAlbums(limit)
}

export const getPopularAlbumsThisWeek = unstable_cache(
  getPopularAlbumsThisWeekUncached,
  ["home-popular-albums"],
  { revalidate: 300, tags: ["community-activity"] }
)

async function getRecentCommunityActivityUncached(
  limit: number
): Promise<CommunityActivityItem[]> {
  const rows = await db
    .select({
      spotifyId: reviewsTable.spotifyId,
      albumName: reviewsTable.albumName,
      artists: reviewsTable.artists,
      imageUrl: reviewsTable.imageUrl,
      rating: reviewsTable.rating,
      reviewText: reviewsTable.reviewText,
      updatedAt: reviewsTable.updatedAt,
      reviewerName: users.name,
      reviewerImage: users.image,
      reviewerUsername: users.username,
    })
    .from(reviewsTable)
    .innerJoin(users, eq(reviewsTable.userId, users.id))
    .where(ne(reviewsTable.reviewText, ""))
    .orderBy(desc(reviewsTable.updatedAt))
    .limit(limit)

  return rows.map((row) => ({
    spotifyId: row.spotifyId,
    albumName: row.albumName,
    artists: row.artists,
    imageUrl: row.imageUrl,
    rating: row.rating,
    reviewText: row.reviewText,
    updatedAt: row.updatedAt.toISOString(),
    reviewerName: row.reviewerName ?? "A Discows listener",
    reviewerImage: row.reviewerImage,
    reviewerUsername: row.reviewerUsername,
  }))
}

export const getRecentCommunityActivity = unstable_cache(
  getRecentCommunityActivityUncached,
  ["home-community-activity"],
  { revalidate: 180, tags: ["community-activity"] }
)
