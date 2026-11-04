import { NextResponse } from "next/server"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"
import { getStudioAdmin } from "@/lib/studio/admin"
import { getStudioImageBytes } from "@/lib/studio/background-images"

type RouteContext = {
  params: Promise<{ imageId: string }>
}

const IMAGE_ID_PATTERN = /^[0-9a-f-]{36}$/

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit(request, { key: "studio:image", limit: 300 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  if (!(await getStudioAdmin())) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { imageId } = await context.params
  if (!IMAGE_ID_PATTERN.test(imageId)) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const image = await getStudioImageBytes(imageId)
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Stored images never change, so the browser can keep them for good.
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
