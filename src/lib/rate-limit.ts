import { NextResponse } from "next/server"

type RateLimitBucket = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  key: string
  limit: number
  windowMs?: number
}

type RateLimitResult = {
  success: boolean
  remaining: number
  resetAt: number
}

const DEFAULT_WINDOW_MS = 60_000
const MAX_TRACKED_BUCKETS = 5_000

const buckets = new Map<string, RateLimitBucket>()

function pruneExpiredBuckets(now: number) {
  if (buckets.size < MAX_TRACKED_BUCKETS) return

  for (const [bucketKey, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(bucketKey)
  }
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

/**
 * In-memory rate limiter, keyed by route + client IP.
 * Good enough for local development and single-instance deployments.
 * For multi-instance production, swap this for a shared store like Upstash Redis.
 */
export function checkRateLimit(
  request: Request,
  { key, limit, windowMs = DEFAULT_WINDOW_MS }: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  pruneExpiredBuckets(now)

  const bucketKey = `${key}:${getClientIp(request)}`
  const bucket = buckets.get(bucketKey)

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs
    buckets.set(bucketKey, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return {
    success: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  }
}

export function rateLimitExceededResponse(resetAt: number) {
  const retryAfterSeconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))

  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": retryAfterSeconds.toString() },
    }
  )
}
