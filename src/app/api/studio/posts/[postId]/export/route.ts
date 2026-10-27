import { strToU8, zipSync, type Zippable } from "fflate"
import { NextResponse } from "next/server"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"
import { getStudioAdmin } from "@/lib/studio/admin"
import { getStudioAlbumsByIds } from "@/lib/studio/albums"
import { getStudioPost } from "@/lib/studio/posts"
import {
  buildExportFileBaseName,
  buildRenderableAlbums,
  buildSlideFileName,
  renderSlideImage,
} from "@/lib/studio/render-slides"

export const maxDuration = 60

type RouteContext = {
  params: Promise<{ postId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit(request, { key: "studio:carousel-zip", limit: 10 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  if (!(await getStudioAdmin())) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { postId } = await context.params
  const post = await getStudioPost(postId)
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const albumsById = await buildRenderableAlbums(await getStudioAlbumsByIds(post.albumIds))

  const slideImages = await Promise.all(
    post.slides.map(async (_slide, slideIndex) => {
      const slideImage = await renderSlideImage(post.slides, slideIndex, albumsById)
      return [buildSlideFileName(post.title, slideIndex), new Uint8Array(await slideImage.arrayBuffer())] as const
    })
  )

  // PNGs are already compressed, so they're stored as-is (level 0).
  const zipEntries: Zippable = Object.fromEntries(
    slideImages.map(([fileName, pngBytes]) => [fileName, [pngBytes, { level: 0 }]])
  )
  zipEntries["legenda.txt"] = strToU8(post.caption)

  const zipBytes = zipSync(zipEntries)

  return new Response(zipBytes, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${buildExportFileBaseName(post.title)}.zip"`,
      "Cache-Control": "private, no-store",
    },
  })
}
