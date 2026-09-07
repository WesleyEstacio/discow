import { NextResponse } from "next/server"
import { searchArtists } from "@/lib/spotify"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, { key: "spotify:artists:search", limit: 30 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : 10

  if (!q.trim()) {
    return NextResponse.json({ artists: [] })
  }

  try {
    const artists = await searchArtists(q, Number.isFinite(limit) ? limit : 10)
    return NextResponse.json({ artists })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search artists"
    const status = message.includes("Missing SPOTIFY") ? 500 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
