import { SLIDE_HEIGHT, SLIDE_WIDTH, type StudioSlide } from "@/lib/studio/slides"

export const BLURRED_COVERS_BLUR_RADIUS = 170
// Covers spill past the canvas edges so the blur never fades into the
// background color at the borders.
export const BLURRED_COVERS_BLEED = 400

const GRID_COLUMNS = 3
const GRID_ROWS = 4
const MIN_COVER_SIZE = 460
const MAX_COVER_SIZE = 680
const MAX_ROTATION_DEGREES = 18

export type BlurredCoverPlacement = {
  albumId: string
  left: number
  top: number
  size: number
  rotationDegrees: number
}

function createSeededRandom(seedText: string): () => number {
  let state = 2166136261
  for (const character of seedText) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619)
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<Item>(items: Item[], random: () => number): Item[] {
  const shuffledItems = [...items]
  for (let index = shuffledItems.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex]!, shuffledItems[index]!]
  }
  return shuffledItems
}

// Same inputs always give the same arrangement, so the live preview and the
// exported PNG match. A jittered grid keeps the canvas covered while the
// order, offsets, sizes and angles look random.
export function arrangeBlurredCovers(albumIds: string[], seed: number): BlurredCoverPlacement[] {
  if (albumIds.length === 0) return []

  const random = createSeededRandom(`${seed}:${albumIds.join(",")}`)
  const cellWidth = (SLIDE_WIDTH + BLURRED_COVERS_BLEED) / GRID_COLUMNS
  const cellHeight = (SLIDE_HEIGHT + BLURRED_COVERS_BLEED) / GRID_ROWS
  const cells = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, cellIndex) => ({
    column: cellIndex % GRID_COLUMNS,
    row: Math.floor(cellIndex / GRID_COLUMNS),
  }))
  const albumOrder = shuffle(albumIds, random)

  const shuffledCells = shuffle(cells, random)
  const placementCount = Math.max(shuffledCells.length, albumOrder.length)

  return Array.from({ length: placementCount }, (_, placementIndex) => {
    const cell = shuffledCells[placementIndex % shuffledCells.length]!
    const size = Math.round(MIN_COVER_SIZE + random() * (MAX_COVER_SIZE - MIN_COVER_SIZE))
    const centerX = (cell.column + 0.2 + random() * 0.6) * cellWidth - BLURRED_COVERS_BLEED / 2
    const centerY = (cell.row + 0.2 + random() * 0.6) * cellHeight - BLURRED_COVERS_BLEED / 2
    return {
      albumId: albumOrder[placementIndex % albumOrder.length]!,
      left: Math.round(centerX - size / 2),
      top: Math.round(centerY - size / 2),
      size,
      rotationDegrees: Math.round((random() * 2 - 1) * MAX_ROTATION_DEGREES),
    }
  })
}

export function collectCarouselAlbumIds(slides: Pick<StudioSlide, "albumIds">[]): string[] {
  return [...new Set(slides.flatMap((slide) => slide.albumIds))]
}

// A slide with no albums of its own still gets a background from the rest of the carousel.
export function resolveBlurredCoverAlbumIds(
  slide: Pick<StudioSlide, "albumIds" | "blurredCoversSource">,
  carouselAlbumIds: string[]
): string[] {
  const usesOnlySlideCovers = slide.blurredCoversSource === "slide" && slide.albumIds.length > 0
  return usesOnlySlideCovers ? slide.albumIds : carouselAlbumIds
}
