import "server-only"
import sharp from "sharp"

const COVER_FETCH_TIMEOUT_MS = 5000
const MAX_COVER_BYTES = 5 * 1024 * 1024

function toHexChannel(channel: number): string {
  return Math.round(channel).toString(16).padStart(2, "0")
}

// Dominant color backs the "Color Me Discows" picker. Best effort: a cover
// that can't be fetched or decoded just has no color and can still be
// chosen by hand.
export async function findDominantCoverColor(coverImageUrl: string | null): Promise<string | null> {
  if (!coverImageUrl?.startsWith("https://")) return null

  try {
    const response = await fetch(coverImageUrl, {
      signal: AbortSignal.timeout(COVER_FETCH_TIMEOUT_MS),
    })
    if (!response.ok) return null

    const coverBytes = Buffer.from(await response.arrayBuffer())
    if (coverBytes.byteLength > MAX_COVER_BYTES) return null

    const { dominant } = await sharp(coverBytes).resize(64, 64, { fit: "inside" }).stats()
    return `#${toHexChannel(dominant.r)}${toHexChannel(dominant.g)}${toHexChannel(dominant.b)}`
  } catch (error) {
    console.warn("Could not read cover color", error)
    return null
  }
}
