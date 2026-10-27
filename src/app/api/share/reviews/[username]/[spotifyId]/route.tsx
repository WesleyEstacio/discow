import { NextResponse } from "next/server"
import { ImageResponse } from "next/og"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"
import { getShareableReview } from "@/lib/reviews"
import { ReviewShareCard } from "@/lib/share-image/review-share-card"
import {
  REVIEW_SHARE_FORMATS,
  parseReviewShareFormat,
} from "@/lib/share-image/review-share-formats"
import { getShareImageFonts } from "@/lib/share-image/share-image-fonts"

type RouteContext = {
  params: Promise<{ username: string; spotifyId: string }>
}

const SPOTIFY_ID_PATTERN = /^[A-Za-z0-9]{22}$/
const MAX_USERNAME_LENGTH = 64
const VERSIONED_IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable"
const UNVERSIONED_IMAGE_CACHE_CONTROL = "public, max-age=300"

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit(request, { key: "share:review-image", limit: 20 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  const { username, spotifyId } = await context.params
  const decodedUsername = decodeURIComponent(username)

  if (
    !SPOTIFY_ID_PATTERN.test(spotifyId) ||
    !decodedUsername ||
    decodedUsername.length > MAX_USERNAME_LENGTH
  ) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const format = parseReviewShareFormat(searchParams.get("format"))
  const { width, height } = REVIEW_SHARE_FORMATS[format]

  const [review, fonts] = await Promise.all([
    getShareableReview(decodedUsername, spotifyId),
    getShareImageFonts(),
  ])

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 })
  }

  return new ImageResponse(
    (
      <ReviewShareCard
        format={format}
        albumName={review.albumName}
        artists={review.artists}
        coverImageUrl={review.imageUrl}
        rating={review.rating}
        reviewText={review.reviewText}
        username={review.username}
      />
    ),
    {
      width,
      height,
      fonts,
      headers: {
        "Cache-Control": searchParams.has("v")
          ? VERSIONED_IMAGE_CACHE_CONTROL
          : UNVERSIONED_IMAGE_CACHE_CONTROL,
      },
    }
  )
}
