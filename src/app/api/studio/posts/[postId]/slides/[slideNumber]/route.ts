import { NextResponse } from "next/server"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"
import { getStudioAdmin } from "@/lib/studio/admin"
import { getStudioAlbumsByIds } from "@/lib/studio/albums"
import { getStudioPost } from "@/lib/studio/posts"
import { buildRenderableAlbums, buildSlideFileName, renderSlideImage } from "@/lib/studio/render-slides"

type RouteContext = {
  params: Promise<{ postId: string; slideNumber: string }>
}

const NOT_FOUND = { error: "Not found" }

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit(request, { key: "studio:slide-png", limit: 60 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  if (!(await getStudioAdmin())) return NextResponse.json(NOT_FOUND, { status: 404 })

  const { postId, slideNumber } = await context.params
  const slideIndex = Number.parseInt(slideNumber, 10) - 1
  const post = await getStudioPost(postId)
  if (!post || !Number.isInteger(slideIndex) || !post.slides[slideIndex]) {
    return NextResponse.json(NOT_FOUND, { status: 404 })
  }

  const slide = post.slides[slideIndex]!
  const albumsById = await buildRenderableAlbums(await getStudioAlbumsByIds(slide.albumIds))
  const shouldDownload = new URL(request.url).searchParams.get("download") === "1"

  return renderSlideImage(post.slides, slideIndex, albumsById, {
    "Cache-Control": "private, no-store",
    "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${buildSlideFileName(post.title, slideIndex)}"`,
  })
}
