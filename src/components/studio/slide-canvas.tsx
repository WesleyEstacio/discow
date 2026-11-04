import type { CSSProperties } from "react"
import type { StudioCoverSource } from "@/lib/db/schema"
import {
  BACKGROUND_IMAGE_FILTER_CSS,
  HEADLINE_SIZE_SCALE,
  hexToRgba,
  resolveSlideColors,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type ContentPosition,
  type SlideBackgroundImage,
  type SlideColors,
  type SlideLayout,
  type StudioSlide,
} from "@/lib/studio/slides"

// Rendered both in the browser (live editor preview) and by Satori on the
// server (PNG export), so it only uses what Satori supports: inline styles,
// flexbox, and a display:flex on every element with more than one child.

export type SlideCanvasAlbum = {
  id: string
  title: string
  artistNames: string[]
  releaseYear: number | null
  coverImageUrl: string | null
  coverSource: StudioCoverSource | null
}

// "css": the live preview applies filter and blur with CSS.
// "prerendered": the export already baked them in with sharp.
export type BackgroundEffectsMode = "css" | "prerendered"

type SlideCanvasProps = {
  slide: StudioSlide
  albumsById: Record<string, SlideCanvasAlbum>
  slideNumber: number
  slideCount: number
  fontFamily: string
  backgroundImageSrc: string | null
  backgroundEffectsMode: BackgroundEffectsMode
}

const PAGE_PADDING = 88
const CONTENT_WIDTH = SLIDE_WIDTH - PAGE_PADDING * 2
const COVER_SHADOW = "0 28px 64px rgba(0, 0, 0, 0.42)"

const COVER_CREDIT_LABELS: Partial<Record<StudioCoverSource, string>> = {
  spotify: "Spotify",
  "cover-art-archive": "Cover Art Archive",
}

const DEFAULT_CONTENT_POSITION: Record<SlideLayout, Exclude<ContentPosition, "auto">> = {
  cover: "bottom",
  album: "center",
  "ranked-album": "center",
  "album-grid": "center",
  "album-list": "center",
  text: "center",
  quote: "center",
  cta: "center",
}

const JUSTIFY_FOR_POSITION: Record<Exclude<ContentPosition, "auto">, CSSProperties["justifyContent"]> = {
  top: "flex-start",
  center: "center",
  bottom: "flex-end",
}

const OBJECT_POSITION_FOR_IMAGE: Record<SlideBackgroundImage["position"], string> = {
  top: "center top",
  center: "center center",
  bottom: "center bottom",
}

function formatSlideNumber(slideNumber: number): string {
  return String(slideNumber).padStart(2, "0")
}

function buildCoverCredit(albums: (SlideCanvasAlbum | undefined)[]): string {
  const creditedSources = [
    ...new Set(
      albums.flatMap((album) => {
        const label = album?.coverSource ? COVER_CREDIT_LABELS[album.coverSource] : undefined
        return label && album?.coverImageUrl ? [label] : []
      })
    ),
  ]
  return creditedSources.length ? `Capas: ${creditedSources.join(" · ")}` : ""
}

export function SlideCanvas({
  slide,
  albumsById,
  slideNumber,
  slideCount,
  fontFamily,
  backgroundImageSrc,
  backgroundEffectsMode,
}: SlideCanvasProps) {
  const colors = resolveSlideColors(slide)
  const slideAlbums = slide.albumIds.map((albumId) => albumsById[albumId])
  const isCentered = slide.textAlign === "center"
  const contentPosition = slide.contentPosition === "auto" ? DEFAULT_CONTENT_POSITION[slide.layout] : slide.contentPosition
  const footerNote = slideNumber === 1 && slideCount > 1 ? "Arraste →" : buildCoverCredit(slideAlbums)

  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        position: "relative",
        overflow: "hidden",
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily,
      }}
    >
      <BackgroundDecoration slide={slide} colors={colors} />
      {slide.backgroundImage && backgroundImageSrc ? (
        <BackgroundImageLayer
          settings={slide.backgroundImage}
          src={backgroundImageSrc}
          effectsMode={backgroundEffectsMode}
          backgroundColor={colors.background}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          display: "flex",
          flexDirection: "column",
          padding: PAGE_PADDING,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 40 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {slide.kicker ? (
              <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent, marginRight: 18 }} />
            ) : null}
            <div
              style={{
                display: "flex",
                fontSize: 25,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: colors.accent,
              }}
            >
              {slide.kicker}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 30, fontWeight: 700, letterSpacing: -0.8 }}>
            <span style={{ color: colors.text }}>discows</span>
            <span style={{ color: colors.accent }}>.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            paddingTop: 48,
            paddingBottom: 48,
            justifyContent: JUSTIFY_FOR_POSITION[contentPosition],
            alignItems: isCentered ? "center" : "flex-start",
            textAlign: isCentered ? "center" : "left",
          }}
        >
          <SlideBody slide={slide} slideAlbums={slideAlbums} colors={colors} isCentered={isCentered} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 32 }}>
          <SlideProgress slideNumber={slideNumber} slideCount={slideCount} colors={colors} />
          <div style={{ display: "flex", fontSize: 22, color: colors.mutedText, letterSpacing: 0.5 }}>{footerNote}</div>
        </div>
      </div>
    </div>
  )
}

function BackgroundDecoration({ slide, colors }: { slide: StudioSlide; colors: SlideColors }) {
  if (slide.backgroundStyle === "solid") return null

  const backgroundImage =
    slide.backgroundStyle === "glow"
      ? `radial-gradient(circle at 92% 4%, ${hexToRgba(colors.accent, 0.3)} 0%, ${hexToRgba(colors.accent, 0)} 52%)`
      : `linear-gradient(155deg, ${hexToRgba(colors.accent, 0.38)} 0%, ${hexToRgba(colors.accent, 0)} 62%)`

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        backgroundImage,
      }}
    />
  )
}

function BackgroundImageLayer({
  settings,
  src,
  effectsMode,
  backgroundColor,
}: {
  settings: SlideBackgroundImage
  src: string
  effectsMode: BackgroundEffectsMode
  backgroundColor: string
}) {
  const cssFilter =
    effectsMode === "css"
      ? [BACKGROUND_IMAGE_FILTER_CSS[settings.filter], settings.blur > 0 ? `blur(${settings.blur}px)` : ""].filter(Boolean).join(" ")
      : ""

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, display: "flex" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori and the live preview both need a plain <img> */}
      <img
        src={src}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        alt=""
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          objectFit: "cover",
          objectPosition: OBJECT_POSITION_FOR_IMAGE[settings.position],
          opacity: settings.opacity / 100,
          ...(cssFilter ? { filter: cssFilter, transform: settings.blur > 0 ? "scale(1.06)" : undefined } : {}),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          display: "flex",
          backgroundImage: `linear-gradient(0deg, ${hexToRgba(backgroundColor, 0.82)} 0%, ${hexToRgba(backgroundColor, 0)} 58%)`,
        }}
      />
    </div>
  )
}

function SlideProgress({ slideNumber, slideCount, colors }: { slideNumber: number; slideCount: number; colors: SlideColors }) {
  const segmentWidth = Math.max(10, Math.min(40, Math.floor(260 / slideCount)))

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", marginRight: 20 }}>
        {Array.from({ length: slideCount }, (_, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              width: segmentWidth,
              height: 6,
              borderRadius: 3,
              marginRight: index === slideCount - 1 ? 0 : 6,
              backgroundColor: index + 1 === slideNumber ? colors.accent : colors.mutedText,
              opacity: index + 1 === slideNumber ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", fontSize: 22, letterSpacing: 2, color: colors.mutedText }}>
        {`${formatSlideNumber(slideNumber)}/${formatSlideNumber(slideCount)}`}
      </div>
    </div>
  )
}

type SlideBodyProps = {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  isCentered: boolean
}

function scaledHeadlineSize(slide: StudioSlide, baseSize: number): number {
  return Math.round(baseSize * HEADLINE_SIZE_SCALE[slide.headlineSize])
}

function SourceNote({ slide, colors }: { slide: StudioSlide; colors: SlideColors }) {
  if (!slide.sourceNote.trim()) return null
  return (
    <div style={{ display: "flex", fontSize: 24, marginTop: 32, color: colors.mutedText }}>{`Fonte: ${slide.sourceNote}`}</div>
  )
}

function SlideBody({ slide, slideAlbums, colors, isCentered }: SlideBodyProps) {
  const columnAlignment = isCentered ? "center" : "flex-start"

  switch (slide.layout) {
    case "cover":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          {slideAlbums.length ? (
            <CoverCollage slideAlbums={slideAlbums} colors={colors} />
          ) : (
            <div style={{ display: "flex", width: 120, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginBottom: 48 }} />
          )}
          <div
            style={{
              display: "flex",
              fontSize: scaledHeadlineSize(slide, 104),
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -3,
            }}
          >
            {slide.headline}
          </div>
          {slide.body ? (
            <div style={{ display: "flex", fontSize: 38, lineHeight: 1.3, marginTop: 36, color: colors.mutedText }}>
              {slide.body}
            </div>
          ) : null}
        </div>
      )
    case "album":
      return <SingleAlbumBody slide={slide} album={slideAlbums[0]} colors={colors} isCentered={isCentered} />
    case "ranked-album":
      return <RankedAlbumBody slide={slide} album={slideAlbums[0]} colors={colors} isCentered={isCentered} />
    case "album-grid":
      return <AlbumGridBody slide={slide} slideAlbums={slideAlbums} colors={colors} isCentered={isCentered} />
    case "album-list":
      return <AlbumListBody slide={slide} slideAlbums={slideAlbums} colors={colors} />
    case "text":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          <div style={{ display: "flex", fontSize: scaledHeadlineSize(slide, 76), fontWeight: 700, lineHeight: 1.06, letterSpacing: -2 }}>
            {slide.headline}
          </div>
          {slide.body ? (
            <div style={{ display: "flex", fontSize: 40, lineHeight: 1.38, marginTop: 44, whiteSpace: "pre-wrap" }}>
              {slide.body}
            </div>
          ) : null}
          <SourceNote slide={slide} colors={colors} />
        </div>
      )
    case "quote":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          <div style={{ display: "flex", fontSize: 240, fontWeight: 700, lineHeight: 1, height: 150, color: colors.accent }}>“</div>
          <div
            style={{
              display: "flex",
              fontSize: scaledHeadlineSize(slide, 62),
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: -1.5,
            }}
          >
            {slide.headline}
          </div>
          {slide.body ? (
            <div style={{ display: "flex", fontSize: 34, marginTop: 40, color: colors.mutedText }}>{`— ${slide.body}`}</div>
          ) : null}
          <SourceNote slide={slide} colors={colors} />
        </div>
      )
    case "cta":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          <div style={{ display: "flex", fontSize: scaledHeadlineSize(slide, 92), fontWeight: 700, lineHeight: 1.04, letterSpacing: -2.5 }}>
            {slide.headline}
          </div>
          {slide.body ? (
            <div style={{ display: "flex", fontSize: 36, lineHeight: 1.35, marginTop: 40, color: colors.mutedText }}>
              {slide.body}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 64,
              padding: "20px 44px",
              borderRadius: 999,
              backgroundColor: colors.text,
              color: colors.background,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            discows.com
          </div>
        </div>
      )
  }
}

function CoverArt({
  album,
  size,
  colors,
  style,
}: {
  album: SlideCanvasAlbum | undefined
  size: number
  colors: SlideColors
  style?: CSSProperties
}) {
  if (!album?.coverImageUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${colors.mutedText}`,
          backgroundColor: colors.background,
          color: colors.mutedText,
          fontSize: Math.max(16, Math.round(size / 14)),
          ...style,
        }}
      >
        {album ? "Sem capa" : "Álbum removido"}
      </div>
    )
  }

  // Covers are shown whole and untouched: no cropping, overlays or filters.
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Satori and the live preview both need a plain <img>
    <img
      src={album.coverImageUrl}
      width={size}
      height={size}
      alt={`Capa de ${album.title}`}
      style={{ width: size, height: size, flexShrink: 0, objectFit: "contain", boxShadow: COVER_SHADOW, ...style }}
    />
  )
}

const COLLAGE_ROTATIONS = [-6, 4, -3, 7]

function CoverCollage({ slideAlbums, colors }: { slideAlbums: (SlideCanvasAlbum | undefined)[]; colors: SlideColors }) {
  const coverSize = slideAlbums.length === 1 ? 440 : slideAlbums.length === 2 ? 360 : 300
  const overlap = slideAlbums.length > 2 ? 90 : 60

  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 72, paddingLeft: 12 }}>
      {slideAlbums.map((album, index) => (
        <CoverArt
          key={album?.id ?? index}
          album={album}
          size={coverSize}
          colors={colors}
          style={{
            marginLeft: index === 0 ? 0 : -overlap,
            transform: slideAlbums.length > 1 ? `rotate(${COLLAGE_ROTATIONS[index] ?? 0}deg)` : undefined,
          }}
        />
      ))}
    </div>
  )
}

function AlbumByline({ album, colors, fontSize }: { album: SlideCanvasAlbum | undefined; colors: SlideColors; fontSize: number }) {
  if (!album) return null
  return (
    <div style={{ display: "flex", fontSize, marginTop: 12, color: colors.mutedText }}>
      {`${album.artistNames.join(", ")}${album.releaseYear ? ` · ${album.releaseYear}` : ""}`}
    </div>
  )
}

function SingleAlbumBody({ slide, album, colors, isCentered }: { slide: StudioSlide; album: SlideCanvasAlbum | undefined; colors: SlideColors; isCentered: boolean }) {
  const coverSize = slide.body.length > 140 ? 500 : 580

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      <CoverArt album={album} size={coverSize} colors={colors} />
      <div
        style={{
          display: "flex",
          fontSize: scaledHeadlineSize(slide, 58),
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: -1.5,
          marginTop: 48,
        }}
      >
        {slide.headline || album?.title || ""}
      </div>
      <AlbumByline album={album} colors={colors} fontSize={34} />
      {slide.body ? <div style={{ display: "flex", fontSize: 32, lineHeight: 1.36, marginTop: 28 }}>{slide.body}</div> : null}
      <SourceNote slide={slide} colors={colors} />
    </div>
  )
}

function RankedAlbumBody({ slide, album, colors, isCentered }: { slide: StudioSlide; album: SlideCanvasAlbum | undefined; colors: SlideColors; isCentered: boolean }) {
  const coverSize = slide.body.length > 120 ? 480 : 540

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", width: CONTENT_WIDTH }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: isCentered ? "center" : "flex-start", width: CONTENT_WIDTH }}>
        <div
          style={{
            display: "flex",
            fontSize: 300,
            fontWeight: 700,
            lineHeight: 0.78,
            letterSpacing: -16,
            color: colors.accent,
            marginRight: 36,
          }}
        >
          {slide.rankNumber === null ? "" : String(slide.rankNumber)}
        </div>
        <CoverArt album={album} size={coverSize} colors={colors} />
      </div>
      <div
        style={{
          display: "flex",
          fontSize: scaledHeadlineSize(slide, 58),
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: -1.5,
          marginTop: 48,
        }}
      >
        {slide.headline || album?.title || ""}
      </div>
      <AlbumByline album={album} colors={colors} fontSize={32} />
      {slide.body ? <div style={{ display: "flex", fontSize: 32, lineHeight: 1.36, marginTop: 26 }}>{slide.body}</div> : null}
      <SourceNote slide={slide} colors={colors} />
    </div>
  )
}

function AlbumGridBody({
  slide,
  slideAlbums,
  colors,
  isCentered,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  isCentered: boolean
}) {
  const isDuel = slideAlbums.length === 2
  const columnGap = isDuel ? 64 : 40
  const coverSize = isDuel ? (CONTENT_WIDTH - columnGap) / 2 : 360

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", width: "100%" }}>
      {slide.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: scaledHeadlineSize(slide, 64),
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: -1.5,
            marginBottom: 44,
          }}
        >
          {slide.headline}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: coverSize * 2 + columnGap,
          columnGap,
          rowGap: 36,
          justifyContent: isCentered ? "center" : "flex-start",
        }}
      >
        {slideAlbums.map((album, index) => (
          <div key={album?.id ?? index} style={{ display: "flex", flexDirection: "column", width: coverSize }}>
            <CoverArt album={album} size={coverSize} colors={colors} />
            <div
              style={{
                display: "flex",
                fontSize: isDuel ? 32 : 26,
                fontWeight: 700,
                marginTop: 18,
                lineHeight: 1.15,
                overflow: "hidden",
                maxHeight: isDuel ? 74 : 30,
              }}
            >
              {album?.title ?? ""}
            </div>
            <div style={{ display: "flex", fontSize: isDuel ? 26 : 22, marginTop: 6, color: colors.mutedText, overflow: "hidden", maxHeight: 32 }}>
              {album ? album.artistNames.join(", ") : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlbumListBody({ slide, slideAlbums, colors }: { slide: StudioSlide; slideAlbums: (SlideCanvasAlbum | undefined)[]; colors: SlideColors }) {
  const coverSize = slideAlbums.length > 6 ? 88 : slideAlbums.length > 4 ? 112 : 140
  const rowGap = slideAlbums.length > 6 ? 18 : 26
  const showsNumbers = slide.rankNumber !== null

  return (
    <div style={{ display: "flex", flexDirection: "column", width: CONTENT_WIDTH }}>
      {slide.headline ? (
        <div
          style={{
            display: "flex",
            fontSize: scaledHeadlineSize(slide, 60),
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: -1.5,
            marginBottom: 40,
          }}
        >
          {slide.headline}
        </div>
      ) : null}
      {slideAlbums.map((album, index) => (
        <div key={album?.id ?? index} style={{ display: "flex", alignItems: "center", marginTop: index === 0 ? 0 : rowGap }}>
          {showsNumbers ? (
            <div
              style={{
                display: "flex",
                width: 96,
                flexShrink: 0,
                fontSize: Math.round(coverSize * 0.5),
                fontWeight: 700,
                letterSpacing: -2,
                color: colors.accent,
              }}
            >
              {String((slide.rankNumber ?? 1) + index)}
            </div>
          ) : null}
          <CoverArt album={album} size={coverSize} colors={colors} style={{ boxShadow: "0 12px 28px rgba(0, 0, 0, 0.32)" }} />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 32, width: CONTENT_WIDTH - coverSize - (showsNumbers ? 96 : 0) - 32 }}>
            <div
              style={{
                display: "flex",
                fontSize: coverSize > 100 ? 36 : 30,
                fontWeight: 700,
                lineHeight: 1.12,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {album?.title ?? "Álbum removido"}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: coverSize > 100 ? 28 : 24,
                marginTop: 6,
                color: colors.mutedText,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {album ? `${album.artistNames.join(", ")}${album.releaseYear ? ` · ${album.releaseYear}` : ""}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
