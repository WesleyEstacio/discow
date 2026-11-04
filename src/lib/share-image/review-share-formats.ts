export const REVIEW_SHARE_FORMATS = {
  story: {
    label: "Instagram Story",
    aspectRatioLabel: "9:16",
    width: 1080,
    height: 1920,
    coverSize: 760,
    maxReviewCharacters: 280,
  },
  feed: {
    label: "Instagram post",
    aspectRatioLabel: "4:5",
    width: 1080,
    height: 1350,
    coverSize: 520,
    maxReviewCharacters: 150,
  },
} as const

export type ReviewShareFormat = keyof typeof REVIEW_SHARE_FORMATS

export const REVIEW_SHARE_FORMAT_NAMES = Object.keys(
  REVIEW_SHARE_FORMATS
) as ReviewShareFormat[]

export function parseReviewShareFormat(value: string | null): ReviewShareFormat {
  return value === "feed" ? "feed" : "story"
}

type ReviewShareImageUrlInput = {
  username: string
  spotifyId: string
  format: ReviewShareFormat
  version: string
}

export function buildReviewShareImageUrl({
  username,
  spotifyId,
  format,
  version,
}: ReviewShareImageUrlInput): string {
  const searchParams = new URLSearchParams({ format, v: version })
  return `/api/share/reviews/${encodeURIComponent(username)}/${encodeURIComponent(spotifyId)}?${searchParams}`
}
