import { NextResponse } from "next/server"
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit"
import { getStudioAdmin } from "@/lib/studio/admin"
import { MAX_UPLOAD_BYTES, storeUploadedImage } from "@/lib/studio/background-images"

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin")
  return origin !== null && origin === new URL(request.url).origin
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, { key: "studio:image-upload", limit: 20 })
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit.resetAt)

  const admin = await getStudioAdmin()
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 })

  const formData = await request.formData().catch(() => null)
  const uploadedFile = formData?.get("image")
  if (!(uploadedFile instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo de imagem." }, { status: 400 })
  }
  if (!uploadedFile.type.startsWith("image/")) {
    return NextResponse.json({ error: "O arquivo precisa ser uma imagem." }, { status: 400 })
  }
  if (uploadedFile.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "A imagem passa de 5 MB." }, { status: 413 })
  }

  try {
    const storedImage = await storeUploadedImage(Buffer.from(await uploadedFile.arrayBuffer()), admin.userId)
    return NextResponse.json(storedImage, { status: 201 })
  } catch (error) {
    console.warn("Could not store uploaded studio image", error)
    return NextResponse.json({ error: "Não foi possível ler essa imagem. Tente JPG, PNG ou WebP." }, { status: 400 })
  }
}
