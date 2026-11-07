import type { CSSProperties, ReactNode } from "react"
import type { StudioCoverSource } from "@/lib/db/schema"
import { arrangeBlurredCovers, BLURRED_COVERS_BLEED, BLURRED_COVERS_BLUR_RADIUS } from "@/lib/studio/blurred-covers"
import { splitHighlightedHeadline, type HighlightTypography } from "@/lib/studio/highlight-fonts"
import {
  BACKGROUND_IMAGE_FILTER_CSS,
  HEADLINE_SIZE_SCALE,
  hexToRgba,
  resolveSlideColors,
  resolveSlideComposition,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type ContentPosition,
  type SlideBackgroundImage,
  type SlideColors,
  type SlideComposition,
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
  carouselAlbumIds: string[]
  slideNumber: number
  slideCount: number
  fontFamily: string
  highlightTypography: HighlightTypography
  backgroundImageSrc: string | null
  blurredCoversSrc: string | null
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
  "album-pair": "center",
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

function buildFooterNote(slide: StudioSlide, slideAlbums: (SlideCanvasAlbum | undefined)[], slideNumber: number, slideCount: number): string {
  if (slideNumber === 1 && slideCount > 1 && slide.showSwipeHint) return "Arraste →"
  return slide.showCoverCredit ? buildCoverCredit(slideAlbums) : ""
}

export function SlideCanvas({
  slide,
  albumsById,
  carouselAlbumIds,
  slideNumber,
  slideCount,
  fontFamily,
  highlightTypography,
  backgroundImageSrc,
  blurredCoversSrc,
  backgroundEffectsMode,
}: SlideCanvasProps) {
  const colors = resolveSlideColors(slide)
  const slideAlbums = slide.albumIds.map((albumId) => albumsById[albumId])
  const isCentered = slide.textAlign === "center"
  const contentPosition = slide.contentPosition === "auto" ? DEFAULT_CONTENT_POSITION[slide.layout] : slide.contentPosition
  const footerNote = buildFooterNote(slide, slideAlbums, slideNumber, slideCount)

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
      {slide.backgroundStyle === "blurred-covers" ? (
        <BlurredCoversLayer
          slide={slide}
          albumsById={albumsById}
          carouselAlbumIds={carouselAlbumIds}
          prerenderedSrc={blurredCoversSrc}
          effectsMode={backgroundEffectsMode}
          backgroundColor={colors.background}
        />
      ) : (
        <BackgroundDecoration slide={slide} colors={colors} />
      )}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 44 }}>
          {slide.layout === "album-pair" ? <div style={{ display: "flex" }} /> : <Kicker slide={slide} colors={colors} />}
          {slide.showBrandMark ? (
            <div style={{ display: "flex", alignItems: "baseline", fontSize: 30, fontWeight: 700, letterSpacing: -0.8 }}>
              <span style={{ color: colors.text }}>discows</span>
              <span style={{ color: colors.accent }}>.</span>
            </div>
          ) : null}
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
          <SlideBody slide={slide} slideAlbums={slideAlbums} colors={colors} isCentered={isCentered} highlightTypography={highlightTypography} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 32 }}>
          {slide.showProgress ? <SlideProgress slideNumber={slideNumber} slideCount={slideCount} colors={colors} /> : <div style={{ display: "flex" }} />}
          <div style={{ display: "flex", fontSize: 22, color: colors.mutedText, letterSpacing: 0.5 }}>{footerNote}</div>
        </div>
      </div>
    </div>
  )
}

function Kicker({ slide, colors }: { slide: StudioSlide; colors: SlideColors }) {
  if (!slide.kicker) return <div style={{ display: "flex" }} />

  const kickerText = (
    <div style={{ display: "flex", fontSize: 25, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: colors.accent }}>
      {slide.kicker}
    </div>
  )

  switch (slide.kickerStyle) {
    case "pill":
      return (
        <div
          style={{
            display: "flex",
            padding: "8px 22px",
            borderRadius: 999,
            backgroundColor: colors.accent,
            color: colors.background,
            fontSize: 23,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {slide.kicker}
        </div>
      )
    case "line":
      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 56, height: 4, backgroundColor: colors.accent, marginRight: 20 }} />
          {kickerText}
        </div>
      )
    case "plain":
      return kickerText
    case "dot":
      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent, marginRight: 18 }} />
          {kickerText}
        </div>
      )
  }
}

function fullSlideLayer(style: CSSProperties): CSSProperties {
  return { position: "absolute", top: 0, left: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, display: "flex", ...style }
}

function BackgroundDecoration({ slide, colors }: { slide: StudioSlide; colors: SlideColors }) {
  switch (slide.backgroundStyle) {
    case "solid":
      return null
    case "glow":
      return (
        <div
          style={fullSlideLayer({
            backgroundImage: `radial-gradient(circle at 92% 4%, ${hexToRgba(colors.accent, 0.3)} 0%, ${hexToRgba(colors.accent, 0)} 52%)`,
          })}
        />
      )
    case "gradient":
      return (
        <div
          style={fullSlideLayer({
            backgroundImage: `linear-gradient(155deg, ${hexToRgba(colors.accent, 0.38)} 0%, ${hexToRgba(colors.accent, 0)} 62%)`,
          })}
        />
      )
    case "stripes":
      return (
        <div
          style={fullSlideLayer({
            backgroundImage: `repeating-linear-gradient(135deg, ${hexToRgba(colors.accent, 0.1)} 0px, ${hexToRgba(colors.accent, 0.1)} 14px, ${hexToRgba(colors.accent, 0)} 14px, ${hexToRgba(colors.accent, 0)} 46px)`,
          })}
        />
      )
    case "rings":
      return (
        <div
          style={fullSlideLayer({
            backgroundImage: `repeating-radial-gradient(circle at 100% 0%, ${hexToRgba(colors.accent, 0.16)} 0px, ${hexToRgba(colors.accent, 0.16)} 3px, ${hexToRgba(colors.accent, 0)} 3px, ${hexToRgba(colors.accent, 0)} 38px)`,
          })}
        />
      )
    case "split":
      return (
        <div
          style={fullSlideLayer({
            backgroundImage: `linear-gradient(160deg, ${hexToRgba(colors.accent, 0)} 0%, ${hexToRgba(colors.accent, 0)} 60%, ${hexToRgba(colors.accent, 0.24)} 60%, ${hexToRgba(colors.accent, 0.24)} 100%)`,
          })}
        />
      )
    case "blurred-covers":
      return null
    case "frame":
      return (
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            width: SLIDE_WIDTH - 72,
            height: SLIDE_HEIGHT - 72,
            display: "flex",
            border: `3px solid ${hexToRgba(colors.accent, 0.7)}`,
          }}
        />
      )
  }
}

function BlurredCoversLayer({
  slide,
  albumsById,
  carouselAlbumIds,
  prerenderedSrc,
  effectsMode,
  backgroundColor,
}: {
  slide: StudioSlide
  albumsById: Record<string, SlideCanvasAlbum>
  carouselAlbumIds: string[]
  prerenderedSrc: string | null
  effectsMode: BackgroundEffectsMode
  backgroundColor: string
}) {
  const halfBleed = BLURRED_COVERS_BLEED / 2
  const placements = effectsMode === "css" ? arrangeBlurredCovers(carouselAlbumIds, slide.backgroundSeed) : []

  return (
    <div style={fullSlideLayer({ overflow: "hidden" })}>
      {effectsMode === "prerendered" && prerenderedSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- Satori needs a plain <img>
        <img src={prerenderedSrc} width={SLIDE_WIDTH} height={SLIDE_HEIGHT} alt="" style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }} />
      ) : null}
      {placements.length > 0 ? (
        <div
          style={{
            position: "absolute",
            top: -halfBleed,
            left: -halfBleed,
            width: SLIDE_WIDTH + BLURRED_COVERS_BLEED,
            height: SLIDE_HEIGHT + BLURRED_COVERS_BLEED,
            display: "flex",
            filter: `blur(${BLURRED_COVERS_BLUR_RADIUS}px)`,
          }}
        >
          {placements.map((placement, placementIndex) => {
            const coverImageUrl = albumsById[placement.albumId]?.coverImageUrl
            if (!coverImageUrl) return null
            return (
              // eslint-disable-next-line @next/next/no-img-element -- the live preview mirrors the Satori markup
              <img
                key={placementIndex}
                src={coverImageUrl}
                width={placement.size}
                height={placement.size}
                alt=""
                style={{
                  position: "absolute",
                  left: placement.left + halfBleed,
                  top: placement.top + halfBleed,
                  width: placement.size,
                  height: placement.size,
                  transform: `rotate(${placement.rotationDegrees}deg)`,
                }}
              />
            )
          })}
        </div>
      ) : null}
      <div
        style={fullSlideLayer({
          backgroundImage: `linear-gradient(0deg, ${hexToRgba(backgroundColor, 0.88)} 0%, ${hexToRgba(backgroundColor, 0.35)} 45%, ${hexToRgba(backgroundColor, 0.3)} 100%)`,
        })}
      />
    </div>
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
    <div style={fullSlideLayer({})}>
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
        style={fullSlideLayer({
          backgroundImage: `linear-gradient(0deg, ${hexToRgba(backgroundColor, 0.82)} 0%, ${hexToRgba(backgroundColor, 0)} 58%)`,
        })}
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
  highlightTypography: HighlightTypography
}

function headlineTypography(slide: StudioSlide, baseSize: number, lineHeight: number): CSSProperties {
  const fontSize = Math.round(baseSize * HEADLINE_SIZE_SCALE[slide.headlineSize])
  switch (slide.typeStyle) {
    case "bold":
      return { fontSize, fontWeight: 700, lineHeight, letterSpacing: -Math.round(fontSize * 0.028) }
    case "light":
      return { fontSize, fontWeight: 400, lineHeight, letterSpacing: -Math.round(fontSize * 0.02) }
    case "caps":
      return { fontSize: Math.round(fontSize * 0.86), fontWeight: 700, lineHeight: 1.02, letterSpacing: Math.round(fontSize * 0.005), textTransform: "uppercase" }
    case "wide":
      return { fontSize: Math.round(fontSize * 0.7), fontWeight: 400, lineHeight: 1.12, letterSpacing: Math.round(fontSize * 0.07), textTransform: "uppercase" }
  }
}

function Headline({
  slide,
  highlightTypography,
  baseSize,
  lineHeight = 1.06,
  style,
  children,
}: {
  slide: StudioSlide
  highlightTypography: HighlightTypography
  baseSize: number
  lineHeight?: number
  style?: CSSProperties
  children: string
}) {
  const typography = headlineTypography(slide, baseSize, lineHeight)
  const segments = splitHighlightedHeadline(children)
  if (!segments.some((segment) => segment.isHighlighted)) {
    return <div style={{ display: "flex", ...typography, ...style }}>{children}</div>
  }

  // Satori can't wrap text that mixes fonts inside one line box, so each
  // word becomes its own flex item and the container wraps like text.
  const fontSize = typeof typography.fontSize === "number" ? typography.fontSize : baseSize
  const words = segments.flatMap((segment) =>
    segment.text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, isHighlighted: segment.isHighlighted }))
  )

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        justifyContent: slide.textAlign === "center" ? "center" : "flex-start",
        columnGap: Math.round(fontSize * 0.26),
        ...typography,
        ...style,
      }}
    >
      {words.map(({ word, isHighlighted }, wordIndex) => (
        <span key={wordIndex} style={isHighlighted ? { ...highlightTypography, letterSpacing: 0 } : undefined}>
          {word}
        </span>
      ))}
    </div>
  )
}

function SourceNote({ slide, colors }: { slide: StudioSlide; colors: SlideColors }) {
  if (!slide.sourceNote.trim()) return null
  return (
    <div style={{ display: "flex", fontSize: 24, marginTop: 32, color: colors.mutedText }}>{`Fonte: ${slide.sourceNote}`}</div>
  )
}

function SlideBody({ slide, slideAlbums, colors, isCentered, highlightTypography }: SlideBodyProps) {
  const composition = resolveSlideComposition(slide)

  switch (slide.layout) {
    case "cover":
      return <CoverBody slide={slide} slideAlbums={slideAlbums} colors={colors} isCentered={isCentered} composition={composition} highlightTypography={highlightTypography} />
    case "album":
      return <SingleAlbumBody slide={slide} album={slideAlbums[0]} colors={colors} isCentered={isCentered} composition={composition} highlightTypography={highlightTypography} />
    case "ranked-album":
      return <RankedAlbumBody slide={slide} album={slideAlbums[0]} colors={colors} isCentered={isCentered} composition={composition} highlightTypography={highlightTypography} />
    case "album-pair":
      return <AlbumPairBody slide={slide} slideAlbums={slideAlbums} colors={colors} composition={composition} />
    case "album-grid":
      return <AlbumGridBody slide={slide} slideAlbums={slideAlbums} colors={colors} isCentered={isCentered} composition={composition} highlightTypography={highlightTypography} />
    case "album-list":
      return <AlbumListBody slide={slide} slideAlbums={slideAlbums} colors={colors} composition={composition} highlightTypography={highlightTypography} />
    case "text":
      return (
        <TextFrame composition={composition} colors={colors} isCentered={isCentered}>
          <Headline slide={slide} highlightTypography={highlightTypography} baseSize={76}>{slide.headline}</Headline>
          {slide.body ? (
            <div style={{ display: "flex", fontSize: 40, lineHeight: 1.38, marginTop: 44, whiteSpace: "pre-wrap" }}>{slide.body}</div>
          ) : null}
          <SourceNote slide={slide} colors={colors} />
        </TextFrame>
      )
    case "quote":
      return (
        <TextFrame composition={composition} colors={colors} isCentered={isCentered}>
          <div style={{ display: "flex", fontSize: 240, fontWeight: 700, lineHeight: 1, height: 150, color: colors.accent }}>“</div>
          <Headline slide={slide} highlightTypography={highlightTypography} baseSize={62} lineHeight={1.18}>{slide.headline}</Headline>
          {slide.body ? (
            <div style={{ display: "flex", fontSize: 34, marginTop: 40, color: colors.mutedText }}>{`— ${slide.body}`}</div>
          ) : null}
          <SourceNote slide={slide} colors={colors} />
        </TextFrame>
      )
    case "cta":
      return <CtaBody slide={slide} colors={colors} isCentered={isCentered} composition={composition} highlightTypography={highlightTypography} />
  }
}

function TextFrame({
  composition,
  colors,
  isCentered,
  children,
}: {
  composition: SlideComposition
  colors: SlideColors
  isCentered: boolean
  children: ReactNode
}) {
  const columnStyle: CSSProperties = { display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }

  if (composition === "card") {
    return (
      <div
        style={{
          ...columnStyle,
          width: CONTENT_WIDTH,
          padding: 64,
          borderRadius: 36,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          border: `2px solid ${hexToRgba(colors.accent, 0.35)}`,
        }}
      >
        {children}
      </div>
    )
  }
  if (composition === "accent-bar") {
    return <div style={{ ...columnStyle, borderLeft: `12px solid ${colors.accent}`, paddingLeft: 52 }}>{children}</div>
  }
  return <div style={columnStyle}>{children}</div>
}

function CtaBody({
  slide,
  colors,
  isCentered,
  composition,
  highlightTypography,
}: {
  slide: StudioSlide
  colors: SlideColors
  isCentered: boolean
  composition: SlideComposition
  highlightTypography: HighlightTypography
}) {
  const websiteStyles: Record<"classic" | "outline" | "minimal", CSSProperties> = {
    classic: { padding: "20px 44px", borderRadius: 999, backgroundColor: colors.text, color: colors.background },
    outline: { padding: "18px 42px", borderRadius: 999, border: `3px solid ${colors.text}`, color: colors.text },
    minimal: { paddingBottom: 6, borderBottom: `4px solid ${colors.accent}`, color: colors.text },
  }
  const websiteStyle = composition === "outline" || composition === "minimal" ? websiteStyles[composition] : websiteStyles.classic

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      <Headline slide={slide} highlightTypography={highlightTypography} baseSize={92} lineHeight={1.04}>{slide.headline}</Headline>
      {slide.body ? (
        <div style={{ display: "flex", fontSize: 36, lineHeight: 1.35, marginTop: 40, color: colors.mutedText }}>{slide.body}</div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", marginTop: 64, fontSize: 30, fontWeight: 700, ...websiteStyle }}>discows.com</div>
    </div>
  )
}

function CoverArt({
  album,
  size,
  colors,
  cornerRadiusPercent,
  style,
}: {
  album: SlideCanvasAlbum | undefined
  size: number
  colors: SlideColors
  cornerRadiusPercent: number
  style?: CSSProperties
}) {
  const borderRadius = Math.round((size * cornerRadiusPercent) / 100)
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
          borderRadius,
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
      style={{ width: size, height: size, flexShrink: 0, objectFit: "contain", boxShadow: COVER_SHADOW, borderRadius, ...style }}
    />
  )
}

const COLLAGE_ROTATIONS = [-6, 4, -3, 7]

type CoverBodyProps = SlideBodyProps & { composition: SlideComposition }

function CoverBody({ slide, slideAlbums, colors, isCentered, composition, highlightTypography }: CoverBodyProps) {
  const columnAlignment = isCentered ? "center" : "flex-start"
  const radius = slide.albumCoverRadius
  const coverText = (headlineBaseSize: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
      <Headline slide={slide} highlightTypography={highlightTypography} baseSize={headlineBaseSize} lineHeight={1.02}>{slide.headline}</Headline>
      {slide.body ? (
        <div style={{ display: "flex", fontSize: 38, lineHeight: 1.3, marginTop: 36, color: colors.mutedText }}>{slide.body}</div>
      ) : null}
    </div>
  )

  if (slideAlbums.length === 0 || composition === "type") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
        <div style={{ display: "flex", width: 120, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginBottom: 48 }} />
        {coverText(composition === "type" ? 128 : 104)}
      </div>
    )
  }

  switch (composition) {
    case "spotlight":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          <CoverArt album={slideAlbums[0]} size={560} colors={colors} cornerRadiusPercent={radius} style={{ marginBottom: 64 }} />
          {coverText(92)}
        </div>
      )
    case "mosaic": {
      const tileSize = Math.floor(CONTENT_WIDTH / Math.max(2, slideAlbums.length))
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          <div style={{ display: "flex", marginBottom: 64 }}>
            {slideAlbums.map((album, index) => (
              <CoverArt key={album?.id ?? index} album={album} size={tileSize} colors={colors} cornerRadiusPercent={radius} style={{ boxShadow: "none" }} />
            ))}
          </div>
          {coverText(100)}
        </div>
      )
    }
    case "stack": {
      const coverSize = 400
      const stepX = 120
      const stepY = 44
      const stackWidth = coverSize + stepX * (slideAlbums.length - 1)
      const stackHeight = coverSize + stepY * (slideAlbums.length - 1)
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          <div style={{ display: "flex", position: "relative", width: stackWidth, height: stackHeight, marginBottom: 64 }}>
            {slideAlbums.map((album, index) => (
              <CoverArt
                key={album?.id ?? index}
                album={album}
                size={coverSize}
                colors={colors}
                cornerRadiusPercent={radius}
                style={{ position: "absolute", left: index * stepX, top: (slideAlbums.length - 1 - index) * stepY }}
              />
            ))}
          </div>
          {coverText(96)}
        </div>
      )
    }
    case "poster": {
      const coverSize = Math.min(200, Math.floor((CONTENT_WIDTH - 24 * (slideAlbums.length - 1)) / slideAlbums.length))
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          {coverText(124)}
          <div style={{ display: "flex", marginTop: 72 }}>
            {slideAlbums.map((album, index) => (
              <CoverArt
                key={album?.id ?? index}
                album={album}
                size={coverSize}
                colors={colors}
                cornerRadiusPercent={radius}
                style={{ marginLeft: index === 0 ? 0 : 24 }}
              />
            ))}
          </div>
        </div>
      )
    }
    default: {
      const coverSize = slideAlbums.length === 1 ? 440 : slideAlbums.length === 2 ? 360 : 300
      const overlap = slideAlbums.length > 2 ? 90 : 60
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 72, paddingLeft: 12 }}>
            {slideAlbums.map((album, index) => (
              <CoverArt
                key={album?.id ?? index}
                album={album}
                size={coverSize}
                colors={colors}
                cornerRadiusPercent={radius}
                style={{
                  marginLeft: index === 0 ? 0 : -overlap,
                  transform: slideAlbums.length > 1 ? `rotate(${COLLAGE_ROTATIONS[index] ?? 0}deg)` : undefined,
                }}
              />
            ))}
          </div>
          {coverText(104)}
        </div>
      )
    }
  }
}

function AlbumByline({ album, colors, fontSize }: { album: SlideCanvasAlbum | undefined; colors: SlideColors; fontSize: number }) {
  if (!album) return null
  return (
    <div style={{ display: "flex", fontSize, marginTop: 12, color: colors.mutedText }}>
      {`${album.artistNames.join(", ")}${album.releaseYear ? ` · ${album.releaseYear}` : ""}`}
    </div>
  )
}

type SingleAlbumBodyProps = {
  slide: StudioSlide
  album: SlideCanvasAlbum | undefined
  colors: SlideColors
  isCentered: boolean
  composition: SlideComposition
  highlightTypography: HighlightTypography
}

function VinylDisc({ size, colors }: { size: number; colors: SlideColors }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#0b0b0d",
        backgroundImage: "repeating-radial-gradient(circle at 50% 50%, #18181b 0px, #18181b 3px, #0b0b0d 3px, #0b0b0d 7px)",
        boxShadow: COVER_SHADOW,
      }}
    >
      <div style={{ display: "flex", width: size * 0.34, height: size * 0.34, borderRadius: size * 0.17, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", width: 18, height: 18, borderRadius: 9, backgroundColor: "#0b0b0d" }} />
      </div>
    </div>
  )
}

function SingleAlbumBody({ slide, album, colors, isCentered, composition, highlightTypography }: SingleAlbumBodyProps) {
  const radius = slide.albumCoverRadius
  const title = slide.headline || album?.title || ""
  const body = slide.body ? <div style={{ display: "flex", fontSize: 32, lineHeight: 1.36, marginTop: 28 }}>{slide.body}</div> : null

  if (composition === "side") {
    const coverSize = 420
    return (
      <div style={{ display: "flex", alignItems: "center", width: CONTENT_WIDTH }}>
        <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 52, width: CONTENT_WIDTH - coverSize - 52, textAlign: "left" }}>
          <Headline slide={slide} highlightTypography={highlightTypography} baseSize={52}>{title}</Headline>
          <AlbumByline album={album} colors={colors} fontSize={30} />
          {slide.body ? <div style={{ display: "flex", fontSize: 28, lineHeight: 1.36, marginTop: 24 }}>{slide.body}</div> : null}
          <SourceNote slide={slide} colors={colors} />
        </div>
      </div>
    )
  }

  if (composition === "vinyl") {
    const coverSize = slide.body.length > 140 ? 460 : 520
    const discSize = Math.round(coverSize * 0.94)
    const discOffset = Math.round(coverSize * 0.42)
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
        <div style={{ display: "flex", position: "relative", width: coverSize + discOffset, height: coverSize }}>
          <div style={{ display: "flex", position: "absolute", left: discOffset, top: (coverSize - discSize) / 2 }}>
            <VinylDisc size={discSize} colors={colors} />
          </div>
          <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} style={{ position: "absolute", left: 0, top: 0 }} />
        </div>
        <Headline slide={slide} highlightTypography={highlightTypography} baseSize={58} style={{ marginTop: 48 }}>{title}</Headline>
        <AlbumByline album={album} colors={colors} fontSize={34} />
        {body}
        <SourceNote slide={slide} colors={colors} />
      </div>
    )
  }

  if (composition === "poster") {
    const coverSize = slide.body.length > 100 ? 600 : 680
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: CONTENT_WIDTH, textAlign: "center" }}>
        <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} />
        <Headline slide={slide} highlightTypography={highlightTypography} baseSize={64} style={{ marginTop: 44, justifyContent: "center" }}>{title}</Headline>
        <AlbumByline album={album} colors={colors} fontSize={30} />
        {slide.body ? <div style={{ display: "flex", fontSize: 28, lineHeight: 1.36, marginTop: 20 }}>{slide.body}</div> : null}
        <SourceNote slide={slide} colors={colors} />
      </div>
    )
  }

  const coverSize = slide.body.length > 140 ? 500 : 580
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} />
      <Headline slide={slide} highlightTypography={highlightTypography} baseSize={58} lineHeight={1.08} style={{ marginTop: 48 }}>{title}</Headline>
      <AlbumByline album={album} colors={colors} fontSize={34} />
      {body}
      <SourceNote slide={slide} colors={colors} />
    </div>
  )
}

function RankedAlbumBody({ slide, album, colors, isCentered, composition, highlightTypography }: SingleAlbumBodyProps) {
  const radius = slide.albumCoverRadius
  const rankText = slide.rankNumber === null ? "" : String(slide.rankNumber)
  const title = slide.headline || album?.title || ""
  const textBlock = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      <Headline slide={slide} highlightTypography={highlightTypography} baseSize={58} lineHeight={1.08} style={{ marginTop: 48 }}>{title}</Headline>
      <AlbumByline album={album} colors={colors} fontSize={32} />
      {slide.body ? <div style={{ display: "flex", fontSize: 32, lineHeight: 1.36, marginTop: 26 }}>{slide.body}</div> : null}
      <SourceNote slide={slide} colors={colors} />
    </div>
  )

  if (composition === "giant-number") {
    const coverSize = slide.body.length > 120 ? 500 : 560
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", width: CONTENT_WIDTH }}>
        <div style={{ display: "flex", position: "relative", width: CONTENT_WIDTH, height: coverSize, justifyContent: "flex-end" }}>
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: -24,
              top: -110,
              fontSize: 620,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -40,
              color: hexToRgba(colors.accent, 0.32),
            }}
          >
            {rankText}
          </div>
          <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} />
        </div>
        {textBlock}
      </div>
    )
  }

  if (composition === "side") {
    const coverSize = 400
    return (
      <div style={{ display: "flex", alignItems: "center", width: CONTENT_WIDTH }}>
        <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 52, width: CONTENT_WIDTH - coverSize - 52, textAlign: "left" }}>
          <div style={{ display: "flex", fontSize: 220, fontWeight: 700, lineHeight: 0.84, letterSpacing: -12, color: colors.accent }}>{rankText}</div>
          <Headline slide={slide} highlightTypography={highlightTypography} baseSize={48} style={{ marginTop: 24 }}>{title}</Headline>
          <AlbumByline album={album} colors={colors} fontSize={28} />
          {slide.body ? <div style={{ display: "flex", fontSize: 27, lineHeight: 1.36, marginTop: 20 }}>{slide.body}</div> : null}
          <SourceNote slide={slide} colors={colors} />
        </div>
      </div>
    )
  }

  const coverSize = slide.body.length > 120 ? 480 : 540
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", width: CONTENT_WIDTH }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: isCentered ? "center" : "flex-start", width: CONTENT_WIDTH }}>
        <div style={{ display: "flex", fontSize: 300, fontWeight: 700, lineHeight: 0.78, letterSpacing: -16, color: colors.accent, marginRight: 36 }}>
          {rankText}
        </div>
        <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} />
      </div>
      {textBlock}
    </div>
  )
}

function AlbumPairCaption({
  slide,
  album,
  label,
  colors,
  alignment,
}: {
  slide: StudioSlide
  album: SlideCanvasAlbum | undefined
  label: string
  colors: SlideColors
  alignment: "left" | "right"
}) {
  const itemAlignment = alignment === "right" ? "flex-end" : "flex-start"
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: itemAlignment, textAlign: alignment }}>
      <Kicker slide={{ ...slide, kicker: label }} colors={colors} />
      <div style={{ display: "flex", marginTop: 24, overflow: "hidden", maxHeight: 156, ...headlineTypography(slide, 48, 1.06) }}>
        {album?.title ?? "Álbum removido"}
      </div>
      <AlbumByline album={album} colors={colors} fontSize={28} />
    </div>
  )
}

// The two covers overlap at one corner, so the pair reads as a single
// object; each caption sits in the free corner next to its own cover.
function AlbumPairBody({
  slide,
  slideAlbums,
  colors,
  composition,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  composition: SlideComposition
}) {
  if (composition === "from-to" || composition === "from-to-mirrored") {
    return <AlbumPairFromToBody slide={slide} slideAlbums={slideAlbums} colors={colors} firstCoverIsOnRight={composition === "from-to"} />
  }

  const hasBody = slide.body.trim().length > 0
  const coverSize = hasBody ? 440 : 500
  const verticalOverlap = 40
  const captionGap = 40
  const pairHeight = coverSize * 2 - verticalOverlap
  const captionWidth = CONTENT_WIDTH - coverSize - captionGap
  const referenceCoverIsOnRight = composition !== "mirrored"
  const referenceSide = referenceCoverIsOnRight ? "right" : "left"
  const recommendationSide = referenceCoverIsOnRight ? "left" : "right"
  const coverArt = (album: SlideCanvasAlbum | undefined, style: CSSProperties) => (
    <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={slide.albumCoverRadius} style={{ position: "absolute", ...style }} />
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", width: CONTENT_WIDTH }}>
      <div style={{ display: "flex", position: "relative", width: CONTENT_WIDTH, height: pairHeight }}>
        {coverArt(slideAlbums[0], { top: 0, [referenceSide]: 0 })}
        {coverArt(slideAlbums[1], { bottom: 0, [recommendationSide]: 0 })}
        <div style={{ display: "flex", position: "absolute", top: 0, [recommendationSide]: 0, width: captionWidth, justifyContent: referenceCoverIsOnRight ? "flex-end" : "flex-start" }}>
          <AlbumPairCaption slide={slide} album={slideAlbums[0]} label={slide.kicker} colors={colors} alignment={referenceSide} />
        </div>
        <div style={{ display: "flex", position: "absolute", bottom: 0, [referenceSide]: 0, width: captionWidth, justifyContent: referenceCoverIsOnRight ? "flex-start" : "flex-end" }}>
          <AlbumPairCaption slide={slide} album={slideAlbums[1]} label={slide.headline} colors={colors} alignment={recommendationSide} />
        </div>
      </div>
      {hasBody ? (
        <div style={{ display: "flex", fontSize: 30, lineHeight: 1.36, marginTop: 48, color: colors.mutedText }}>{slide.body}</div>
      ) : null}
    </div>
  )
}

const GIANT_WORD_MAX_FONT_SIZE = 230
const GIANT_WORD_GLYPH_WIDTH_RATIO = 0.72

function fitGiantWordFontSize(word: string, availableWidth: number): number {
  const characterCount = Math.max(word.length, 1)
  return Math.min(GIANT_WORD_MAX_FONT_SIZE, Math.floor(availableWidth / (characterCount * GIANT_WORD_GLYPH_WIDTH_RATIO)))
}

// Each album gets its own row: the cover on one side and, on the other, a
// giant word (FROM / TO) that bleeds over the cover edge, with the album
// title resting at the bottom. The rows alternate sides, so the eye zigzags
// from the first album to the second.
function AlbumPairFromToRow({
  slide,
  album,
  word,
  wordColor,
  colors,
  coverSize,
  coverIsOnRight,
}: {
  slide: StudioSlide
  album: SlideCanvasAlbum | undefined
  word: string
  wordColor: string
  colors: SlideColors
  coverSize: number
  coverIsOnRight: boolean
}) {
  const wordBleedOverCover = 84
  const textColumnGap = 40
  const coverSide = coverIsOnRight ? "right" : "left"
  const textSide = coverIsOnRight ? "left" : "right"
  const alignTowardCover = coverIsOnRight ? "flex-end" : "flex-start"
  const textAlign = coverIsOnRight ? "right" : "left"
  const wordAreaWidth = CONTENT_WIDTH - coverSize + wordBleedOverCover
  const wordFontSize = fitGiantWordFontSize(word, wordAreaWidth)

  return (
    <div style={{ display: "flex", position: "relative", width: CONTENT_WIDTH, height: coverSize }}>
      <CoverArt
        album={album}
        size={coverSize}
        colors={colors}
        cornerRadiusPercent={slide.albumCoverRadius}
        style={{ position: "absolute", top: 0, [coverSide]: 0 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: alignTowardCover,
          textAlign,
          position: "absolute",
          bottom: 0,
          [textSide]: 0,
          width: CONTENT_WIDTH - coverSize - textColumnGap,
        }}
      >
        <div style={{ display: "flex", overflow: "hidden", maxHeight: 156, ...headlineTypography(slide, 46, 1.06) }}>
          {album?.title ?? "Álbum removido"}
        </div>
        <AlbumByline album={album} colors={colors} fontSize={27} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: alignTowardCover,
          position: "absolute",
          top: -Math.round(wordFontSize * 0.1),
          [textSide]: 0,
          width: wordAreaWidth,
          fontSize: wordFontSize,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -Math.round(wordFontSize * 0.045),
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          color: wordColor,
          textShadow: `0 8px 40px ${hexToRgba(colors.background, 0.7)}`,
        }}
      >
        {word}
      </div>
    </div>
  )
}

function AlbumPairFromToBody({
  slide,
  slideAlbums,
  colors,
  firstCoverIsOnRight,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  firstCoverIsOnRight: boolean
}) {
  const hasBody = slide.body.trim().length > 0
  const coverSize = hasBody ? 400 : 460
  const rowGap = hasBody ? 48 : 56

  return (
    <div style={{ display: "flex", flexDirection: "column", width: CONTENT_WIDTH }}>
      <AlbumPairFromToRow
        slide={slide}
        album={slideAlbums[0]}
        word={slide.kicker}
        wordColor={colors.text}
        colors={colors}
        coverSize={coverSize}
        coverIsOnRight={firstCoverIsOnRight}
      />
      <div style={{ display: "flex", height: rowGap }} />
      <AlbumPairFromToRow
        slide={slide}
        album={slideAlbums[1]}
        word={slide.headline}
        wordColor={colors.accent}
        colors={colors}
        coverSize={coverSize}
        coverIsOnRight={!firstCoverIsOnRight}
      />
      {hasBody ? (
        <div style={{ display: "flex", fontSize: 30, lineHeight: 1.36, marginTop: 48, color: colors.mutedText }}>{slide.body}</div>
      ) : null}
    </div>
  )
}

function AlbumGridBody({
  slide,
  slideAlbums,
  colors,
  isCentered,
  composition,
  highlightTypography,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  isCentered: boolean
  composition: SlideComposition
  highlightTypography: HighlightTypography
}) {
  const isDuel = slideAlbums.length === 2
  const isTight = composition === "tight"
  const columnGap = isTight ? 0 : isDuel ? 64 : 40
  const coverSize = isTight ? (isDuel ? CONTENT_WIDTH / 2 : 360) : isDuel ? (CONTENT_WIDTH - columnGap) / 2 : 360

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", width: "100%" }}>
      {slide.headline ? (
        <Headline slide={slide} highlightTypography={highlightTypography} baseSize={64} style={{ marginBottom: 44 }}>{slide.headline}</Headline>
      ) : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: coverSize * 2 + columnGap,
          columnGap,
          rowGap: isTight ? 0 : 36,
          justifyContent: isCentered ? "center" : "flex-start",
        }}
      >
        {slideAlbums.map((album, index) =>
          isTight ? (
            <CoverArt
              key={album?.id ?? index}
              album={album}
              size={coverSize}
              colors={colors}
              cornerRadiusPercent={slide.albumCoverRadius}
              style={{ boxShadow: "none" }}
            />
          ) : (
            <div key={album?.id ?? index} style={{ display: "flex", flexDirection: "column", width: coverSize }}>
              <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={slide.albumCoverRadius} />
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
          )
        )}
      </div>
      {isTight ? (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          {slideAlbums.map((album, index) => (
            <div key={album?.id ?? index} style={{ display: "flex", fontSize: 24, lineHeight: 1.4, color: colors.mutedText }}>
              {`${index + 1}. ${album ? `${album.title} — ${album.artistNames.join(", ")}` : "Álbum removido"}`}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function AlbumListBody({
  slide,
  slideAlbums,
  colors,
  composition,
  highlightTypography,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  composition: SlideComposition
  highlightTypography: HighlightTypography
}) {
  const isCards = composition === "cards"
  const cardPadding = isCards ? 14 : 0
  const baseCoverSize = slideAlbums.length > 6 ? 88 : slideAlbums.length > 4 ? 112 : 140
  const coverSize = isCards ? baseCoverSize - 16 : baseCoverSize
  const rowGap = isCards ? 12 : slideAlbums.length > 6 ? 18 : 26
  const showsNumbers = slide.rankNumber !== null
  const rowWidth = CONTENT_WIDTH - cardPadding * 2

  return (
    <div style={{ display: "flex", flexDirection: "column", width: CONTENT_WIDTH }}>
      {slide.headline ? (
        <Headline slide={slide} highlightTypography={highlightTypography} baseSize={60} style={{ marginBottom: 40 }}>{slide.headline}</Headline>
      ) : null}
      {slideAlbums.map((album, index) => (
        <div
          key={album?.id ?? index}
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: index === 0 ? 0 : rowGap,
            ...(isCards ? { padding: cardPadding, borderRadius: 20, backgroundColor: hexToRgba(colors.accent, 0.12) } : {}),
          }}
        >
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
          <CoverArt
            album={album}
            size={coverSize}
            colors={colors}
            cornerRadiusPercent={slide.albumCoverRadius}
            style={{ boxShadow: isCards ? "none" : "0 12px 28px rgba(0, 0, 0, 0.32)" }}
          />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 32, width: rowWidth - coverSize - (showsNumbers ? 96 : 0) - 32 }}>
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
