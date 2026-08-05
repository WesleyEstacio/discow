import { NextResponse } from "next/server"
import { getCommunityRatingsForAlbums } from "@/lib/discover-server"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"

// Batches the community rating lookup for every album currently in the
// listener's Discover history into a single request/query, instead of one
// round-trip per card.
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, { key: "discover:ratings", limit: 60 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  const url = new URL(request.url)
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 100)

  const ratings = await getCommunityRatingsForAlbums(ids)
  return NextResponse.json({ ratings })
}
