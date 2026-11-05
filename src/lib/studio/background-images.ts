import "server-only"
import { and, desc, eq, inArray } from "drizzle-orm"
import sharp, { type Sharp } from "sharp"
import { db } from "@/lib/db"
import { studioImages } from "@/lib/db/schema"
import {
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type BackgroundImageFilter,
  type BackgroundImagePosition,
  type SlideBackgroundImage,
} from "@/lib/studio/slides"

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const STORED_MAX_WIDTH = 1620
const STORED_MAX_HEIGHT = 2025

export type StudioImageSummary = {
  id: string
  width: number
  height: number
  isDefaultBackground: boolean
}

const STUDIO_IMAGE_SUMMARY_COLUMNS = {
  id: studioImages.id,
  width: studioImages.width,
  height: studioImages.height,
  isDefaultBackground: studioImages.isDefaultBackground,
}

// Re-encoding drops EXIF (location, camera) and proves the file is really
// an image before it is stored.
export async function storeUploadedImage(uploadedBytes: Buffer, uploadedByUserId: string): Promise<StudioImageSummary> {
  const { data: jpegBytes, info } = await sharp(uploadedBytes, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: STORED_MAX_WIDTH, height: STORED_MAX_HEIGHT, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer({ resolveWithObject: true })

  const [storedImage] = await db
    .insert(studioImages)
    .values({
      contentType: "image/jpeg",
      bytes: jpegBytes,
      width: info.width,
      height: info.height,
      byteSize: jpegBytes.byteLength,
      createdByUserId: uploadedByUserId,
    })
    .returning(STUDIO_IMAGE_SUMMARY_COLUMNS)

  return storedImage!
}

export async function getStudioImageBytes(imageId: string): Promise<{ contentType: string; bytes: Buffer } | null> {
  const [image] = await db
    .select({ contentType: studioImages.contentType, bytes: studioImages.bytes })
    .from(studioImages)
    .where(eq(studioImages.id, imageId))
    .limit(1)
  return image ?? null
}

// Default backgrounds come first, so the brand set is always in the list.
export async function listRecentStudioImages(limit = 36): Promise<StudioImageSummary[]> {
  return db
    .select(STUDIO_IMAGE_SUMMARY_COLUMNS)
    .from(studioImages)
    .orderBy(desc(studioImages.isDefaultBackground), desc(studioImages.createdAt))
    .limit(limit)
}

export async function listDefaultBackgroundImages(): Promise<StudioImageSummary[]> {
  return db
    .select(STUDIO_IMAGE_SUMMARY_COLUMNS)
    .from(studioImages)
    .where(eq(studioImages.isDefaultBackground, true))
    .orderBy(desc(studioImages.createdAt))
}

export async function isDefaultBackgroundImage(imageId: string): Promise<boolean> {
  const [image] = await db
    .select({ id: studioImages.id })
    .from(studioImages)
    .where(and(eq(studioImages.id, imageId), eq(studioImages.isDefaultBackground, true)))
    .limit(1)
  return Boolean(image)
}

export async function setDefaultBackgroundImage(imageId: string, isDefaultBackground: boolean): Promise<void> {
  await db.update(studioImages).set({ isDefaultBackground }).where(eq(studioImages.id, imageId))
}

const SEPIA_MATRIX: [[number, number, number], [number, number, number], [number, number, number]] = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131],
]

function applyContrast(image: Sharp, contrast: number): Sharp {
  return image.linear(contrast, 128 * (1 - contrast))
}

// Mirrors BACKGROUND_IMAGE_FILTER_CSS in slides.ts as closely as sharp allows.
function applyFilter(image: Sharp, filter: BackgroundImageFilter): Sharp {
  switch (filter) {
    case "none":
      return image
    case "mono":
      return image.grayscale()
    case "sepia":
      return image.recomb(SEPIA_MATRIX)
    case "vivid":
      return applyContrast(image.modulate({ saturation: 1.6 }), 1.1)
    case "faded":
      return applyContrast(image.modulate({ saturation: 0.55, brightness: 1.08 }), 0.85)
    case "dark":
      return image.linear(0.6, 0)
  }
}

const SHARP_POSITIONS: Record<BackgroundImagePosition, string> = {
  top: "top",
  center: "centre",
  bottom: "bottom",
}

async function renderBackgroundImage(sourceBytes: Buffer, settings: SlideBackgroundImage): Promise<string> {
  let image = sharp(sourceBytes).resize({
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    fit: "cover",
    position: SHARP_POSITIONS[settings.position],
  })
  image = applyFilter(image, settings.filter)
  if (settings.blur > 0) image = image.blur(Math.max(0.3, settings.blur))

  const renderedBytes = await image.jpeg({ quality: 88 }).toBuffer()
  return `data:image/jpeg;base64,${renderedBytes.toString("base64")}`
}

// Returns, per slide id, the background ready for Satori: cropped to the
// canvas with filter and blur already applied (opacity stays a CSS style).
export async function buildRenderableBackgrounds(
  slides: { id: string; backgroundImage: SlideBackgroundImage | null }[]
): Promise<Record<string, string>> {
  const slidesWithImage = slides.flatMap((slide) => (slide.backgroundImage ? [{ slideId: slide.id, settings: slide.backgroundImage }] : []))
  if (slidesWithImage.length === 0) return {}

  const imageIds = [...new Set(slidesWithImage.map((slide) => slide.settings.imageId))]
  const storedImages = await db
    .select({ id: studioImages.id, bytes: studioImages.bytes })
    .from(studioImages)
    .where(inArray(studioImages.id, imageIds))
  const bytesByImageId = new Map(storedImages.map((storedImage) => [storedImage.id, storedImage.bytes]))

  const renderedBackgrounds = await Promise.all(
    slidesWithImage.map(async ({ slideId, settings }) => {
      const sourceBytes = bytesByImageId.get(settings.imageId)
      if (!sourceBytes) return null
      try {
        return [slideId, await renderBackgroundImage(sourceBytes, settings)] as const
      } catch (error) {
        console.warn("Could not render slide background", error)
        return null
      }
    })
  )
  return Object.fromEntries(renderedBackgrounds.filter((entry) => entry !== null))
}
