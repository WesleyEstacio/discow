import { NextResponse } from "next/server"
import { getAlbum } from "@/lib/spotify"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
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
