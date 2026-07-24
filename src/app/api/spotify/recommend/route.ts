import { NextResponse } from "next/server"
import { recommendAlbums } from "@/lib/recommend"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"
import type { RecommendMode, RecommendRequest } from "@/lib/types"

const MODES: RecommendMode[] = ["genre", "artist", "surprise"]

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, { key: "spotify:recommend", limit: 20 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  let body: Partial<RecommendRequest>

  try {
    body = (await request.json()) as Partial<RecommendRequest>
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.mode || !MODES.includes(body.mode)) {
    return NextResponse.json(
      { error: "mode must be genre, artist, or surprise" },
      { status: 400 }
    )
  }

  const input: RecommendRequest = {
    mode: body.mode,
    genre: body.genre,
    artist: body.artist,
    yearFrom: body.yearFrom,
    yearTo: body.yearTo,
    excludeIds: body.excludeIds ?? [],
    seedArtists: body.seedArtists ?? [],
    seedYears: body.seedYears ?? [],
  }

  try {
    const result = await recommendAlbums(input)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to recommend albums"
    const status = message.includes("Missing SPOTIFY")
      ? 500
      : message.includes("Pick a genre") || message.includes("Enter an artist")
        ? 400
        : 502
    return NextResponse.json({ error: message }, { status })
  }
}
