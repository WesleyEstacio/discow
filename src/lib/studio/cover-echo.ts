import {
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type ContentPosition,
  type CoverEchoAnchor,
  type StudioSlide,
} from "@/lib/studio/slides"

export type CoverEchoCopy = {
  left: number
  top: number
  size: number
  blurRadius: number
  brightness: number
}

export type CoverEchoArrangement = {
  frontCover: Pick<CoverEchoCopy, "left" | "top" | "size">
  echoesFromBackToFront: CoverEchoCopy[]
}

const FRONT_COVER_SIZE: Record<CoverEchoAnchor, number> = { top: 560, center: 420, bottom: 560 }
const FRONT_COVER_EDGE_DISTANCE = 168
// Where, inside the front cover, the copies grow from. Near the top edge the
// echoes spread downward, like a tunnel opening toward the text.
const GROWTH_ORIGIN_HEIGHT_RATIO: Record<CoverEchoAnchor, number> = { top: 0.15, center: 0.5, bottom: 0.85 }
const ECHO_SCALE_STEP = 1.22
const MAX_ECHO_COUNT = 12
const FIRST_ECHO_BLUR_RADIUS = 2.5
const BLUR_GROWTH_EXPONENT = 1.55
const BRIGHTNESS_LOSS_PER_ECHO = 0.045
const MIN_ECHO_BRIGHTNESS = 0.62

const TEXT_POSITION_FOR_ANCHOR: Record<CoverEchoAnchor, Exclude<ContentPosition, "auto">> = {
  top: "bottom",
  center: "bottom",
  bottom: "top",
}

function frontCoverTop(anchor: CoverEchoAnchor, size: number): number {
  switch (anchor) {
    case "top":
      return FRONT_COVER_EDGE_DISTANCE
    case "center":
      return Math.round((SLIDE_HEIGHT - size) / 2) - 110
    case "bottom":
      return SLIDE_HEIGHT - FRONT_COVER_EDGE_DISTANCE - size
  }
}

function coversWholeSlide(copy: Pick<CoverEchoCopy, "left" | "top" | "size">): boolean {
  return copy.left <= 0 && copy.top <= 0 && copy.left + copy.size >= SLIDE_WIDTH && copy.top + copy.size >= SLIDE_HEIGHT
}

// Each echo is the cover scaled up around one point of the front cover, a
// little blurrier and darker than the one before, until the slide is full.
export function arrangeCoverEcho(anchor: CoverEchoAnchor): CoverEchoArrangement {
  const frontSize = FRONT_COVER_SIZE[anchor]
  const frontCover = { left: Math.round((SLIDE_WIDTH - frontSize) / 2), top: frontCoverTop(anchor, frontSize), size: frontSize }
  const originX = frontCover.left + frontSize / 2
  const originY = frontCover.top + frontSize * GROWTH_ORIGIN_HEIGHT_RATIO[anchor]

  const echoesFromFrontToBack: CoverEchoCopy[] = []
  for (let echoNumber = 1; echoNumber <= MAX_ECHO_COUNT; echoNumber++) {
    const scale = ECHO_SCALE_STEP ** echoNumber
    const echo = {
      left: Math.round(originX - (originX - frontCover.left) * scale),
      top: Math.round(originY - (originY - frontCover.top) * scale),
      size: Math.round(frontSize * scale),
      blurRadius: Math.round(FIRST_ECHO_BLUR_RADIUS * echoNumber ** BLUR_GROWTH_EXPONENT),
      brightness: Math.max(MIN_ECHO_BRIGHTNESS, 1 - BRIGHTNESS_LOSS_PER_ECHO * echoNumber),
    }
    echoesFromFrontToBack.push(echo)
    if (coversWholeSlide(echo)) break
  }

  return { frontCover, echoesFromBackToFront: echoesFromFrontToBack.reverse() }
}

export function resolveCoverEchoAlbumId(slide: Pick<StudioSlide, "albumIds">, carouselAlbumIds: string[]): string | null {
  return slide.albumIds[0] ?? carouselAlbumIds[0] ?? null
}

// With the cover on one side, the text goes to the other unless the editor
// picked a position.
export function textPositionAroundCoverEcho(anchor: CoverEchoAnchor): Exclude<ContentPosition, "auto"> {
  return TEXT_POSITION_FOR_ANCHOR[anchor]
}
