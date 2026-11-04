import "server-only"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { SHARE_IMAGE_TEXT_FONT_FAMILY } from "@/lib/share-image/share-image-font-families"

type ShareImageFont = {
  name: string
  data: Buffer
  weight: 400 | 700
  style: "normal"
}

async function loadShareImageFonts(): Promise<ShareImageFont[]> {
  const [regularFontData, boldFontData] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Geist-Bold.ttf")),
  ])

  return [
    { name: SHARE_IMAGE_TEXT_FONT_FAMILY, data: regularFontData, weight: 400, style: "normal" },
    { name: SHARE_IMAGE_TEXT_FONT_FAMILY, data: boldFontData, weight: 700, style: "normal" },
  ]
}

let shareImageFontsPromise: Promise<ShareImageFont[]> | null = null

export function getShareImageFonts(): Promise<ShareImageFont[]> {
  shareImageFontsPromise ??= loadShareImageFonts().catch((error: unknown) => {
    shareImageFontsPromise = null
    throw error
  })
  return shareImageFontsPromise
}
