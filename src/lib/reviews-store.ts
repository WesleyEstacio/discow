import type { Review } from "@/lib/types"

const STORAGE_KEY = "discow:reviews"

let cachedReviews: Review[] = []
let cacheInitialized = false

function canUseStorage() {
  return typeof window !== "undefined"
}

function readAll(): Review[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Review[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function sortReviews(reviews: Review[]) {
  return [...reviews].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

function writeAll(reviews: Review[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
  cachedReviews = sortReviews(reviews)
  cacheInitialized = true
}

function ensureCache() {
  if (!cacheInitialized) {
    cachedReviews = sortReviews(readAll())
    cacheInitialized = true
  }
  return cachedReviews
}

export function refreshReviewsCache() {
  cachedReviews = sortReviews(readAll())
  cacheInitialized = true
  return cachedReviews
}

export function getReviews(): Review[] {
  return ensureCache()
}

export function getReviewForAlbum(spotifyId: string): Review | null {
  return ensureCache().find((review) => review.spotifyId === spotifyId) ?? null
}

export type UpsertReviewInput = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  rating: number
  text: string
  listenedAt?: string
}

export function upsertReview(input: UpsertReviewInput): Review {
  const now = new Date().toISOString()
  const existing = getReviewForAlbum(input.spotifyId)
  const next: Review = {
    spotifyId: input.spotifyId,
    albumName: input.albumName,
    artists: input.artists,
    imageUrl: input.imageUrl,
    rating: input.rating,
    text: input.text.trim(),
    listenedAt: input.listenedAt ?? existing?.listenedAt ?? now,
    updatedAt: now,
  }

  const others = readAll().filter((review) => review.spotifyId !== input.spotifyId)
  writeAll([next, ...others])
  return next
}

export function deleteReview(spotifyId: string) {
  writeAll(readAll().filter((review) => review.spotifyId !== spotifyId))
}
