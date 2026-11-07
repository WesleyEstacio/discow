import "server-only"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import sharp from "sharp"
import { SlideCanvas, type SlideCanvasAlbum } from "@/components/studio/slide-canvas"
import type { StudioAlbum } from "@/lib/studio/albums"
import {
  arrangeBlurredCovers,
  BLURRED_COVERS_BLEED,
  BLURRED_COVERS_BLUR_RADIUS,
  collectCarouselAlbumIds,
} from "@/lib/studio/blurred-covers"
import { arrangeCoverEcho, resolveCoverEchoAlbumId, type CoverEchoCopy } from "@/lib/studio/cover-echo"
import { buildHighlightTypography, HIGHLIGHT_FONTS, type HighlightFontKey } from "@/lib/studio/highlight-fonts"
import { resolveSlideColors, SLIDE_HEIGHT, SLIDE_WIDTH, type StudioSlide } from "@/lib/studio/slides"

const SLIDE_FONT_FAMILY = "Geist"
const COVER_FETCH_TIMEOUT_MS = 8000
const MAX_COVER_BYTES = 8 * 1024 * 1024
const FORMATS_SATORI_DECODES = new Set(["image/jpeg", "image/png"])
const BLURRED_COVERS_RENDER_SCALE = 0.25
const COVER_ECHO_RENDER_SCALE = 0.5

type SlideFont = { name: string; data: Buffer; weight: 400 | 700; style: "normal" | "italic" }

let slideFontsPromise: Promise<SlideFont[]> | null = null
const highlightFontPromises = new Map<HighlightFontKey, Promise<SlideFont>>()

function loadHighlightFont(fontKey: HighlightFontKey): Promise<SlideFont> {
  const cachedFontPromise = highlightFontPromises.get(fontKey)
  if (cachedFontPromise) return cachedFontPromise

  const font = HIGHLIGHT_FONTS[fontKey]
  const fontPromise = readFile(join(process.cwd(), "src/assets/fonts/highlight", font.fileName))
    .then((fontData): SlideFont => ({ name: font.exportFamily, data: fontData, weight: font.weight, style: font.style }))
    .catch((error: unknown) => {
      highlightFontPromises.delete(fontKey)
      throw error
    })
  highlightFontPromises.set(fontKey, fontPromise)
  return fontPromise
}

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

function decodeDataUrl(dataUrl: string | null | undefined): Buffer | null {
  const base64Payload = dataUrl?.split(";base64,")[1]
  return base64Payload ? Buffer.from(base64Payload, "base64") : null
}

// Mirrors BlurredCoversLayer's CSS (same arrangement, same blur) because
// Satori can't blur. Drawn at a quarter of the size and scaled up: the
// result is identical once blurred, and much faster.
async function renderBlurredCovers(
  slide: StudioSlide,
  carouselAlbumIds: string[],
  albumsById: Record<string, SlideCanvasAlbum>
): Promise<string | null> {
  const halfBleed = BLURRED_COVERS_BLEED / 2
  const canvasWidth = Math.round((SLIDE_WIDTH + BLURRED_COVERS_BLEED) * BLURRED_COVERS_RENDER_SCALE)
  const canvasHeight = Math.round((SLIDE_HEIGHT + BLURRED_COVERS_BLEED) * BLURRED_COVERS_RENDER_SCALE)

  const coverLayers = await Promise.all(
    arrangeBlurredCovers(carouselAlbumIds, slide.backgroundSeed).map(async (placement) => {
      const coverBytes = decodeDataUrl(albumsById[placement.albumId]?.coverImageUrl)
      if (!coverBytes) return null
      const scaledSize = Math.round(placement.size * BLURRED_COVERS_RENDER_SCALE)
      const { data, info } = await sharp(coverBytes)
        .resize(scaledSize, scaledSize, { fit: "fill" })
        .rotate(placement.rotationDegrees, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer({ resolveWithObject: true })
      const scaledCenterX = (placement.left + halfBleed + placement.size / 2) * BLURRED_COVERS_RENDER_SCALE
      const scaledCenterY = (placement.top + halfBleed + placement.size / 2) * BLURRED_COVERS_RENDER_SCALE
      return { input: data, left: Math.round(scaledCenterX - info.width / 2), top: Math.round(scaledCenterY - info.height / 2) }
    })
  )
  const visibleCoverLayers = coverLayers.filter((layer) => layer !== null)
  if (visibleCoverLayers.length === 0) return null

  // sharp always runs composite last in a pipeline, so the blur needs its own pass.
  const scatteredCovers = await sharp({
    create: { width: canvasWidth, height: canvasHeight, channels: 3, background: resolveSlideColors(slide).background },
  })
    .composite(visibleCoverLayers)
    .png()
    .toBuffer()

  const slideSizedBytes = await sharp(scatteredCovers)
    .blur(BLURRED_COVERS_BLUR_RADIUS * BLURRED_COVERS_RENDER_SCALE)
    .resize(SLIDE_WIDTH + BLURRED_COVERS_BLEED, SLIDE_HEIGHT + BLURRED_COVERS_BLEED, { fit: "fill" })
    .extract({ left: halfBleed, top: halfBleed, width: SLIDE_WIDTH, height: SLIDE_HEIGHT })
    .jpeg({ quality: 88 })
    .toBuffer()
  return `data:image/jpeg;base64,${slideSizedBytes.toString("base64")}`
}

function roundedCornersMask(size: number, cornerRadius: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/></svg>`
  )
}

async function renderCoverEchoCopy(coverBytes: Buffer, echo: CoverEchoCopy, cornerRadiusPercent: number) {
  const scaledSize = Math.max(1, Math.round(echo.size * COVER_ECHO_RENDER_SCALE))
  const scaledBlurRadius = echo.blurRadius * COVER_ECHO_RENDER_SCALE
  // CSS blur spills past the element's edges, so the copy gets transparent
  // room around it before blurring.
  const blurPadding = Math.ceil(scaledBlurRadius * 3)
  const cornerRadius = Math.round((scaledSize * cornerRadiusPercent) / 100)

  let copyPipeline = sharp(coverBytes).resize(scaledSize, scaledSize, { fit: "fill" }).ensureAlpha()
  if (cornerRadius > 0) {
    copyPipeline = copyPipeline.composite([{ input: roundedCornersMask(scaledSize, cornerRadius), blend: "dest-in" }])
  }
  const shapedCopy = await copyPipeline.png().toBuffer()

  let blurPipeline = sharp(shapedCopy)
    .extend({ top: blurPadding, bottom: blurPadding, left: blurPadding, right: blurPadding, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: echo.brightness })
  if (scaledBlurRadius >= 0.3) blurPipeline = blurPipeline.blur(scaledBlurRadius)
  return {
    image: await blurPipeline.png().toBuffer(),
    left: Math.round(echo.left * COVER_ECHO_RENDER_SCALE) - blurPadding,
    top: Math.round(echo.top * COVER_ECHO_RENDER_SCALE) - blurPadding,
    paddedSize: scaledSize + blurPadding * 2,
  }
}

// Mirrors CoverEchoLayer's CSS echoes. The front cover stays sharp, so
// Satori draws it on top; only the blurred copies are baked here.
async function renderCoverEcho(
  slide: StudioSlide,
  carouselAlbumIds: string[],
  albumsById: Record<string, SlideCanvasAlbum>
): Promise<string | null> {
  const albumId = resolveCoverEchoAlbumId(slide, carouselAlbumIds)
  const coverBytes = decodeDataUrl(albumId ? albumsById[albumId]?.coverImageUrl : null)
  if (!coverBytes) return null

  const canvasWidth = Math.round(SLIDE_WIDTH * COVER_ECHO_RENDER_SCALE)
  const canvasHeight = Math.round(SLIDE_HEIGHT * COVER_ECHO_RENDER_SCALE)
  const { echoesFromBackToFront } = arrangeCoverEcho(slide.coverEchoAnchor)

  const renderedCopies = await Promise.all(
    echoesFromBackToFront.map((echo) => renderCoverEchoCopy(coverBytes, echo, slide.albumCoverRadius))
  )
  const visibleLayers = await Promise.all(
    renderedCopies.map(async (copy) => {
      const visibleLeft = Math.max(0, copy.left)
      const visibleTop = Math.max(0, copy.top)
      const visibleWidth = Math.min(canvasWidth, copy.left + copy.paddedSize) - visibleLeft
      const visibleHeight = Math.min(canvasHeight, copy.top + copy.paddedSize) - visibleTop
      if (visibleWidth <= 0 || visibleHeight <= 0) return null
      const visiblePart = await sharp(copy.image)
        .extract({ left: visibleLeft - copy.left, top: visibleTop - copy.top, width: visibleWidth, height: visibleHeight })
        .png()
        .toBuffer()
      return { input: visiblePart, left: visibleLeft, top: visibleTop }
    })
  )

  const echoBytes = await sharp({
    create: { width: canvasWidth, height: canvasHeight, channels: 3, background: resolveSlideColors(slide).background },
  })
    .composite(visibleLayers.filter((layer) => layer !== null))
    .png()
    .toBuffer()
  const slideSizedBytes = await sharp(echoBytes).resize(SLIDE_WIDTH, SLIDE_HEIGHT, { fit: "fill" }).jpeg({ quality: 90 }).toBuffer()
  return `data:image/jpeg;base64,${slideSizedBytes.toString("base64")}`
}

const PRERENDERED_BACKGROUND_STYLES = new Set<StudioSlide["backgroundStyle"]>(["blurred-covers", "cover-echo"])

// Both blurred backgrounds ride on the same prerendered image slot.
export async function buildRenderableBlurredCovers(
  slidesToRender: StudioSlide[],
  carouselAlbumIds: string[],
  albumsById: Record<string, SlideCanvasAlbum>
): Promise<Record<string, string>> {
  const renderedBackgrounds = await Promise.all(
    slidesToRender
      .filter((slide) => PRERENDERED_BACKGROUND_STYLES.has(slide.backgroundStyle))
      .map(async (slide) => {
        try {
          const blurredCoversSrc =
            slide.backgroundStyle === "cover-echo"
              ? await renderCoverEcho(slide, carouselAlbumIds, albumsById)
              : await renderBlurredCovers(slide, carouselAlbumIds, albumsById)
          return blurredCoversSrc ? ([slide.id, blurredCoversSrc] as const) : null
        } catch (error) {
          console.warn("Could not render blurred covers background", error)
          return null
        }
      })
  )
  return Object.fromEntries(renderedBackgrounds.filter((entry) => entry !== null))
}

export type RenderableSlideAssets = {
  albumsById: Record<string, SlideCanvasAlbum>
  backgroundImagesBySlideId: Record<string, string>
  blurredCoversBySlideId: Record<string, string>
  highlightFontKey: HighlightFontKey
}

export async function renderSlideImage(
  slides: StudioSlide[],
  slideIndex: number,
  assets: RenderableSlideAssets,
  headers?: Record<string, string>
): Promise<ImageResponse> {
  const slide = slides[slideIndex]
  if (!slide) throw new Error(`Slide ${slideIndex + 1} não existe`)

  const [slideFonts, highlightFont] = await Promise.all([loadSlideFonts(), loadHighlightFont(assets.highlightFontKey)])

  return new ImageResponse(
    (
      <SlideCanvas
        slide={slide}
        albumsById={assets.albumsById}
        carouselAlbumIds={collectCarouselAlbumIds(slides)}
        slideNumber={slideIndex + 1}
        slideCount={slides.length}
        fontFamily={SLIDE_FONT_FAMILY}
        highlightTypography={buildHighlightTypography(assets.highlightFontKey, "export")}
        backgroundImageSrc={assets.backgroundImagesBySlideId[slide.id] ?? null}
        blurredCoversSrc={assets.blurredCoversBySlideId[slide.id] ?? null}
        backgroundEffectsMode="prerendered"
      />
    ),
    { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fonts: [...slideFonts, highlightFont], headers }
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
