import { NextResponse } from "next/server"
import { getAlbum } from "@/lib/spotify"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit(request, { key: "spotify:album", limit: 60 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "Album id is required" }, { status: 400 })
  }

  try {
    const album = await getAlbum(id)
    return NextResponse.json({ album })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load album"
    const status = message.includes("Missing SPOTIFY")
      ? 500
      : message.includes("404")
        ? 404
        : 502
    return NextResponse.json({ error: message }, { status })
  }
}
