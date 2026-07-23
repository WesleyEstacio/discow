import { NextResponse } from "next/server"
import { searchAlbums } from "@/lib/spotify"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : 10

  if (!q.trim()) {
    return NextResponse.json({ albums: [] })
  }

  try {
    const albums = await searchAlbums(q, Number.isFinite(limit) ? limit : 10)
    return NextResponse.json({ albums })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search albums"
    const status = message.includes("Missing SPOTIFY") ? 500 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
