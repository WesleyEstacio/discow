import "server-only"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import sharp from "sharp"
import { SlideCanvas, type SlideCanvasAlbum } from "@/components/studio/slide-canvas"
import type { StudioAlbum } from "@/lib/studio/albums"
import { SLIDE_HEIGHT, SLIDE_WIDTH, type StudioSlide } from "@/lib/studio/slides"

const SLIDE_FONT_FAMILY = "Geist"
const COVER_FETCH_TIMEOUT_MS = 8000
const MAX_COVER_BYTES = 8 * 1024 * 1024
const FORMATS_SATORI_DECODES = new Set(["image/jpeg", "image/png"])

type SlideFont = { name: string; data: Buffer; weight: 400 | 700; style: "normal" }

let slideFontsPromise: Promise<SlideFont[]> | null = null

function loadSlideFonts(): Promise<SlideFont[]> {
  slideFontsPromise ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Geist-Bold.ttf")),
  ])
    .then(([regularFontData, boldFontData]): SlideFont[] => [
      { name: SLIDE_FONT_FAMILY, data: regularFontData, weight: 400, style: "normal" },
      { name: SLIDE_FONT_FAMILY, data: boldFontData, weight: 700, style: "normal" },
    ])
    .catch((error: unknown) => {
      slideFontsPromise = null
      throw error
    })
  return slideFontsPromise
}

// Covers are downloaded up front and inlined, so a slow or missing image
// shows the "Sem capa" placeholder instead of failing the whole export.
// Only formats Satori can't decode are converted (to PNG, same pixels).
async function loadCoverAsDataUrl(coverImageUrl: string | null): Promise<string | null> {
  if (!coverImageUrl?.startsWith("https://")) return null

  try {
    const response = await fetch(coverImageUrl, { signal: AbortSignal.timeout(COVER_FETCH_TIMEOUT_MS) })
    if (!response.ok) return null

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? ""
    if (!contentType.startsWith("image/")) return null

    const coverBytes = Buffer.from(await response.arrayBuffer())
    if (coverBytes.byteLength > MAX_COVER_BYTES) return null

    if (FORMATS_SATORI_DECODES.has(contentType)) {
      return `data:${contentType};base64,${coverBytes.toString("base64")}`
    }
    const pngBytes = await sharp(coverBytes).png().toBuffer()
    return `data:image/png;base64,${pngBytes.toString("base64")}`
  } catch (error) {
    console.warn("Could not load cover for slide export", error)
    return null
  }
}

export async function buildRenderableAlbums(albums: StudioAlbum[]): Promise<Record<string, SlideCanvasAlbum>> {
  const coverDataUrls = await Promise.all(albums.map((album) => loadCoverAsDataUrl(album.coverImageUrl)))
  return Object.fromEntries(
    albums.map((album, index) => [
      album.id,
      {
        id: album.id,
        title: album.title,
        artistNames: album.artistNames,
        releaseYear: album.releaseYear,
        coverImageUrl: coverDataUrls[index] ?? null,
        coverSource: album.coverSource,
      },
    ])
  )
}

export async function renderSlideImage(
  slides: StudioSlide[],
  slideIndex: number,
  albumsById: Record<string, SlideCanvasAlbum>,
  headers?: Record<string, string>
): Promise<ImageResponse> {
  const slide = slides[slideIndex]
  if (!slide) throw new Error(`Slide ${slideIndex + 1} não existe`)

  return new ImageResponse(
    (
      <SlideCanvas
        slide={slide}
        albumsById={albumsById}
        slideNumber={slideIndex + 1}
        slideCount={slides.length}
        fontFamily={SLIDE_FONT_FAMILY}
      />
    ),
    { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fonts: await loadSlideFonts(), headers }
  )
}

export function buildExportFileBaseName(postTitle: string): string {
  const slug = postTitle
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return `discows-${slug || "carrossel"}`
}

export function buildSlideFileName(postTitle: string, slideIndex: number): string {
  return `${buildExportFileBaseName(postTitle)}-${String(slideIndex + 1).padStart(2, "0")}.png`
}
