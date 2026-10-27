import { SHARE_IMAGE_TEXT_FONT_FAMILY } from "@/lib/share-image/share-image-font-families"
import {
  REVIEW_SHARE_FORMATS,
  type ReviewShareFormat,
} from "@/lib/share-image/review-share-formats"

const BRAND_COLORS = {
  text: "#f7f5fa",
  mutedText: "#c9c3d4",
  accent: "#ec4899",
  emptyStar: "#3a3045",
  coverPlaceholder: "#2a2233",
}

const MAX_ALBUM_NAME_CHARACTERS = 60
const MAX_ARTISTS_CHARACTERS = 70
const STAR_PATH =
  "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96z"

export type ReviewShareCardProps = {
  format: ReviewShareFormat
  albumName: string
  artists: string[]
  coverImageUrl: string | null
  rating: number
  reviewText: string
  username: string
}

export function truncateAtWordBoundary(text: string, maxCharacters: number): string {
  const normalizedText = text.replace(/\s+/g, " ").trim()
  if (normalizedText.length <= maxCharacters) return normalizedText

  const cutText = normalizedText.slice(0, maxCharacters)
  const lastSpaceIndex = cutText.lastIndexOf(" ")
  const textUpToLastWord =
    lastSpaceIndex > maxCharacters * 0.6 ? cutText.slice(0, lastSpaceIndex) : cutText

  return `${textUpToLastWord.replace(/[\s.,;:!?-]+$/, "")}…`
}

export function ReviewShareCard({
  format,
  albumName,
  artists,
  coverImageUrl,
  rating,
  reviewText,
  username,
}: ReviewShareCardProps) {
  const { coverSize, maxReviewCharacters } = REVIEW_SHARE_FORMATS[format]
  const isStory = format === "story"
  const shortenedReviewText = truncateAtWordBoundary(reviewText, maxReviewCharacters)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isStory ? "110px 90px 100px" : "64px 90px 60px",
        color: BRAND_COLORS.text,
        fontFamily: SHARE_IMAGE_TEXT_FONT_FAMILY,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          gap: isStory ? 44 : 28,
          width: "100%",
        }}
      >
        <AlbumCover coverImageUrl={coverImageUrl} coverSize={coverSize} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: isStory ? 60 : 50,
              fontFamily: SHARE_IMAGE_TEXT_FONT_FAMILY,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            {truncateAtWordBoundary(albumName, MAX_ALBUM_NAME_CHARACTERS)}
          </div>
          <div
            style={{
              fontSize: isStory ? 36 : 32,
              color: BRAND_COLORS.mutedText,
              textAlign: "center",
            }}
          >
            {truncateAtWordBoundary(artists.join(", "), MAX_ARTISTS_CHARACTERS)}
          </div>
        </div>

        <StarRow rating={rating} starSize={isStory ? 76 : 62} />

        {shortenedReviewText ? (
          <div
            style={{
              fontSize: isStory ? 38 : 32,
              lineHeight: 1.4,
              textAlign: "center",
              color: BRAND_COLORS.text,
              maxWidth: "100%",
            }}
          >
            {`“${shortenedReviewText}”`}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ fontSize: isStory ? 40 : 34 }}>
          {`@${username}`}
        </div>
        <div style={{ fontSize: isStory ? 28 : 24, color: BRAND_COLORS.mutedText }}>
          rated on discows.com
        </div>
      </div>
    </div>
  )
}

function AlbumCover({
  coverImageUrl,
  coverSize,
}: {
  coverImageUrl: string | null
  coverSize: number
}) {
  if (!coverImageUrl) {
    return (
      <div
        style={{
          width: coverSize,
          height: coverSize,
          borderRadius: 32,
          background: BRAND_COLORS.coverPlaceholder,
          display: "flex",
        }}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> only
    <img
      src={coverImageUrl}
      width={coverSize}
      height={coverSize}
      alt=""
      style={{
        borderRadius: 32,
        objectFit: "cover",
        boxShadow: "0 30px 80px rgba(0, 0, 0, 0.55)",
      }}
    />
  )
}

function StarRow({ rating, starSize }: { rating: number; starSize: number }) {
  const gapBetweenStars = Math.round(starSize * 0.2)
  const fullStarCount = Math.floor(rating)
  const partialStarFraction = rating - fullStarCount
  const filledWidth =
    fullStarCount * (starSize + gapBetweenStars) + partialStarFraction * starSize

  return (
    <div style={{ display: "flex", position: "relative" }}>
      <Stars color={BRAND_COLORS.emptyStar} starSize={starSize} gap={gapBetweenStars} />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: filledWidth,
          height: starSize,
          overflow: "hidden",
        }}
      >
        <Stars color={BRAND_COLORS.accent} starSize={starSize} gap={gapBetweenStars} />
      </div>
    </div>
  )
}

function Stars({ color, starSize, gap }: { color: string; starSize: number; gap: number }) {
  return (
    <div style={{ display: "flex", gap, flexShrink: 0 }}>
      {[0, 1, 2, 3, 4].map((starIndex) => (
        <svg
          key={starIndex}
          width={starSize}
          height={starSize}
          viewBox="0 0 24 24"
          style={{ flexShrink: 0 }}
        >
          <path d={STAR_PATH} fill={color} />
        </svg>
      ))}
    </div>
  )
}
