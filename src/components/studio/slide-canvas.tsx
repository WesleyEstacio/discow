import type { CSSProperties, ReactNode } from "react"
import type { StudioCoverSource } from "@/lib/db/schema"
import { DiscowsWordmark } from "@/components/brand/discows-wordmark"
import { arrangeBlurredCovers, BLURRED_COVERS_BLEED, BLURRED_COVERS_BLUR_RADIUS } from "@/lib/studio/blurred-covers"
import { arrangeCoverEcho, resolveCoverEchoAlbumId, textPositionAroundCoverEcho } from "@/lib/studio/cover-echo"
import {
  resolveFontFamily,
  splitHighlightedText,
  type FontTarget,
  type SlideTextElement,
} from "@/lib/studio/studio-fonts"
import {
  BACKGROUND_IMAGE_FILTER_CSS,
  CASSETTE_SIZE_SCALE,
  HEADLINE_SIZE_SCALE,
  hexToRgba,
  LOGO_SIZE_SCALE,
  MAX_ALBUMS_PER_COVER_SLIDE,
  PROGRESS_SIZE_SCALE,
  readableTextColorFor,
  resolveLogoAlignment,
  resolveLogoColors,
  resolveLogoZone,
  resolveSecondaryBackgroundColor,
  resolveSlideColors,
  resolveSlideComposition,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type ContentPosition,
  type CoverGridTilt,
  type CtaRecapPosition,
  type SlideBackgroundImage,
  type SlideColors,
  type SlideComposition,
  type SlideLayout,
  type ResolvedLogoAlignment,
  type SlideZone,
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
  fontTarget: FontTarget
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

function resolveContentPosition(slide: StudioSlide): Exclude<ContentPosition, "auto"> {
  if (slide.contentPosition !== "auto") return slide.contentPosition
  if (slide.backgroundStyle === "cover-echo") return textPositionAroundCoverEcho(slide.coverEchoAnchor)
  return DEFAULT_CONTENT_POSITION[slide.layout]
}

const LOGO_BASE_HEIGHT_BY_ZONE: Record<SlideZone, number> = { top: 40, content: 84, bottom: 56 }
const JUSTIFY_FOR_LOGO_ALIGNMENT: Record<ResolvedLogoAlignment, CSSProperties["justifyContent"]> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
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
  fontTarget,
  backgroundImageSrc,
  blurredCoversSrc,
  backgroundEffectsMode,
}: SlideCanvasProps) {
  const typography = resolveSlideTypography(slide, fontTarget)
  const colors = resolveSlideColors(slide)
  const slideAlbums = slide.albumIds.map((albumId) => albumsById[albumId])
  const isCentered = slide.textAlign === "center"
  const contentPosition = resolveContentPosition(slide)
  const footerNote = buildFooterNote(slide, slideAlbums, slideNumber, slideCount)
  const carouselAlbums = carouselAlbumIds.flatMap((albumId) => {
    const album = albumsById[albumId]
    return album ? [album] : []
  })
  const logoZone = resolveLogoZone(slide)
  const logoColors = resolveLogoColors(slide.logoColor, colors.background)
  const showsLogo = slide.showBrandMark && slide.brandMarkStyle === "logo"
  const showsTextBrandMark = slide.showBrandMark && slide.brandMarkStyle === "text"
  const showsPositionedKicker = slide.showKicker && slide.kicker.length > 0 && slide.layout !== "album-pair"
  const logo = (
    <DiscowsWordmark
      height={Math.round(LOGO_BASE_HEIGHT_BY_ZONE[logoZone] * LOGO_SIZE_SCALE[slide.logoSize])}
      inkColor={logoColors.ink}
      accentColor={logoColors.accent}
    />
  )
  const kicker = <Kicker slide={slide} colors={colors} fontFamily={typography.kicker} />
  const logoAlignment = resolveLogoAlignment(slide)
  const showsLogoIn = (zone: SlideZone) => showsLogo && logoZone === zone
  const showsTopLogoAt = (alignment: ResolvedLogoAlignment) => showsLogoIn("top") && logoAlignment === alignment
  const showsKickerIn = (zone: SlideZone) => showsPositionedKicker && slide.kickerPosition === zone
  const alignedLogoRow = (spacingBelow: number) => (
    <div style={{ display: "flex", width: "100%", marginBottom: spacingBelow, justifyContent: JUSTIFY_FOR_LOGO_ALIGNMENT[logoAlignment] }}>
      {logo}
    </div>
  )

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
        fontFamily: typography.body,
        // Satori never fakes bold or italic, so the preview must not either.
        ...(fontTarget === "preview" ? { fontSynthesis: "none" } : {}),
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
      ) : slide.backgroundStyle === "cover-echo" ? (
        <CoverEchoLayer
          slide={slide}
          album={albumsById[resolveCoverEchoAlbumId(slide, carouselAlbumIds) ?? ""]}
          prerenderedSrc={blurredCoversSrc}
          effectsMode={backgroundEffectsMode}
          colors={colors}
          textPosition={contentPosition}
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
        {showsTopLogoAt("center") ? alignedLogoRow(showsKickerIn("top") || showsTextBrandMark ? 24 : 0) : null}
        <div
          style={{
            display: showsTopLogoAt("center") && !showsKickerIn("top") && !showsTextBrandMark ? "none" : "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: 44,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {showsTopLogoAt("left") ? <div style={{ display: "flex", marginRight: showsKickerIn("top") ? 32 : 0 }}>{logo}</div> : null}
            {showsKickerIn("top") ? kicker : null}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {showsTopLogoAt("right") ? logo : null}
            {showsTextBrandMark ? (
              <div style={{ display: "flex", alignItems: "baseline", fontSize: 30, fontWeight: 700, letterSpacing: -0.8, fontFamily: typography.brandMark }}>
                <span style={{ color: colors.text }}>discows</span>
                <span style={{ color: colors.accent }}>.</span>
              </div>
            ) : null}
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
          {showsLogoIn("content") ? alignedLogoRow(48) : null}
          {showsKickerIn("content") ? <div style={{ display: "flex", marginBottom: 32 }}>{kicker}</div> : null}
          <SlideBody
            slide={slide}
            slideAlbums={slideAlbums}
            carouselAlbums={carouselAlbums}
            colors={colors}
            isCentered={isCentered}
            typography={typography}
          />
        </div>

        {showsKickerIn("bottom") || showsLogoIn("bottom") ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", marginBottom: 32 }}>
            {showsKickerIn("bottom") ? <div style={{ display: "flex", marginBottom: showsLogoIn("bottom") ? 24 : 0 }}>{kicker}</div> : null}
            {showsLogoIn("bottom") ? alignedLogoRow(0) : null}
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", fontFamily: typography.footer }}>
          <SlideFooter slide={slide} slideNumber={slideNumber} slideCount={slideCount} colors={colors} footerNote={footerNote} />
        </div>
      </div>
    </div>
  )
}

type SlideTypography = Record<SlideTextElement, string>

function resolveSlideTypography(slide: StudioSlide, fontTarget: FontTarget): SlideTypography {
  const familyOf = (element: SlideTextElement) => resolveFontFamily(slide.fonts[element], fontTarget)
  return {
    brandMark: familyOf("brandMark"),
    kicker: familyOf("kicker"),
    headline: familyOf("headline"),
    body: familyOf("body"),
    footer: familyOf("footer"),
    highlight: familyOf("highlight"),
  }
}

function Kicker({ slide, colors, fontFamily }: { slide: StudioSlide; colors: SlideColors; fontFamily: string }) {
  if (!slide.kicker) return <div style={{ display: "flex" }} />
  return (
    <div style={{ display: "flex", fontFamily }}>
      <KickerContent slide={slide} colors={colors} />
    </div>
  )
}

function KickerContent({ slide, colors }: { slide: StudioSlide; colors: SlideColors }) {

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
    case "two-tone": {
      const secondaryColor = resolveSecondaryBackgroundColor(slide, colors)
      return (
        <div
          style={fullSlideLayer({
            backgroundImage: `linear-gradient(160deg, ${colors.background} 0%, ${colors.background} 60%, ${secondaryColor} 60%, ${secondaryColor} 100%)`,
          })}
        />
      )
    }
    case "blurred-covers":
    case "cover-echo":
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

const TEXT_SCRIM_DIRECTION: Record<Exclude<ContentPosition, "auto">, string | null> = {
  top: "180deg",
  center: null,
  bottom: "0deg",
}

function CoverEchoLayer({
  slide,
  album,
  prerenderedSrc,
  effectsMode,
  colors,
  textPosition,
}: {
  slide: StudioSlide
  album: SlideCanvasAlbum | undefined
  prerenderedSrc: string | null
  effectsMode: BackgroundEffectsMode
  colors: SlideColors
  textPosition: Exclude<ContentPosition, "auto">
}) {
  const coverImageUrl = album?.coverImageUrl
  if (!coverImageUrl) return null

  const { frontCover, echoesFromBackToFront } = arrangeCoverEcho(slide.coverEchoAnchor)
  const cornerRadius = (size: number) => Math.round((size * slide.albumCoverRadius) / 100)
  const scrimDirection = TEXT_SCRIM_DIRECTION[textPosition]

  return (
    <div style={fullSlideLayer({ overflow: "hidden" })}>
      {effectsMode === "prerendered" && prerenderedSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- Satori needs a plain <img>
        <img src={prerenderedSrc} width={SLIDE_WIDTH} height={SLIDE_HEIGHT} alt="" style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }} />
      ) : null}
      {effectsMode === "css"
        ? echoesFromBackToFront.map((echo, echoIndex) => (
            // eslint-disable-next-line @next/next/no-img-element -- the live preview mirrors the Satori markup
            <img
              key={echoIndex}
              src={coverImageUrl}
              width={echo.size}
              height={echo.size}
              alt=""
              style={{
                position: "absolute",
                left: echo.left,
                top: echo.top,
                width: echo.size,
                height: echo.size,
                borderRadius: cornerRadius(echo.size),
                filter: `blur(${echo.blurRadius}px) brightness(${echo.brightness})`,
              }}
            />
          ))
        : null}
      <div
        style={fullSlideLayer({
          backgroundImage: `linear-gradient(180deg, ${hexToRgba(colors.background, 0.75)} 0%, ${hexToRgba(colors.background, 0)} 16%, ${hexToRgba(colors.background, 0)} 88%, ${hexToRgba(colors.background, 0.7)} 100%)`,
        })}
      />
      {scrimDirection ? (
        <div
          style={fullSlideLayer({
            backgroundImage: `linear-gradient(${scrimDirection}, ${hexToRgba(colors.background, 0.92)} 0%, ${hexToRgba(colors.background, 0.55)} 30%, ${hexToRgba(colors.background, 0)} 55%)`,
          })}
        />
      ) : null}
      <CoverArt
        album={album}
        size={frontCover.size}
        colors={colors}
        cornerRadiusPercent={slide.albumCoverRadius}
        style={{ position: "absolute", left: frontCover.left, top: frontCover.top }}
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

const FOOTER_HEIGHT = 32

// The note (cover credit or "Arraste →") always sits on the side opposite
// the page counter; with a centered counter it moves above it.
function SlideFooter({
  slide,
  slideNumber,
  slideCount,
  colors,
  footerNote,
}: {
  slide: StudioSlide
  slideNumber: number
  slideCount: number
  colors: SlideColors
  footerNote: string
}) {
  const note = <div style={{ display: "flex", fontSize: 22, color: colors.mutedText, letterSpacing: 0.5 }}>{footerNote}</div>
  const emptySlot = <div style={{ display: "flex" }} />

  if (!slide.showProgress) {
    return <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", height: FOOTER_HEIGHT }}>{note}</div>
  }

  const progress = <SlideProgress slideNumber={slideNumber} slideCount={slideCount} colors={colors} scale={PROGRESS_SIZE_SCALE[slide.progressSize]} />
  const rowHeight = Math.max(FOOTER_HEIGHT, Math.round(FOOTER_HEIGHT * PROGRESS_SIZE_SCALE[slide.progressSize]))

  if (slide.progressAlignment === "center") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {footerNote ? <div style={{ display: "flex", marginBottom: 14 }}>{note}</div> : null}
        <div style={{ display: "flex", alignItems: "center", height: rowHeight }}>{progress}</div>
      </div>
    )
  }

  const progressIsOnRight = slide.progressAlignment === "right"
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: rowHeight }}>
      {progressIsOnRight ? (footerNote ? note : emptySlot) : progress}
      {progressIsOnRight ? progress : note}
    </div>
  )
}

function SlideProgress({
  slideNumber,
  slideCount,
  colors,
  scale,
}: {
  slideNumber: number
  slideCount: number
  colors: SlideColors
  scale: number
}) {
  // The bar keeps its width so a large counter still leaves room for the footer note.
  const segmentWidth = Math.max(10, Math.min(40, Math.floor(260 / slideCount)))
  const segmentHeight = Math.round(6 * scale)
  const segmentGap = 6

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", marginRight: Math.round(20 * scale) }}>
        {Array.from({ length: slideCount }, (_, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              width: segmentWidth,
              height: segmentHeight,
              borderRadius: segmentHeight / 2,
              marginRight: index === slideCount - 1 ? 0 : segmentGap,
              backgroundColor: index + 1 === slideNumber ? colors.accent : colors.mutedText,
              opacity: index + 1 === slideNumber ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", fontSize: Math.round(22 * scale), letterSpacing: 2, color: colors.mutedText }}>
        {`${formatSlideNumber(slideNumber)}/${formatSlideNumber(slideCount)}`}
      </div>
    </div>
  )
}

type SlideBodyProps = {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  carouselAlbums: SlideCanvasAlbum[]
  colors: SlideColors
  isCentered: boolean
  typography: SlideTypography
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
  typography,
  baseSize,
  lineHeight = 1.06,
  style,
  children,
}: {
  slide: StudioSlide
  typography: SlideTypography
  baseSize: number
  lineHeight?: number
  style?: CSSProperties
  children: string
}) {
  return (
    <HighlightableText
      text={children}
      typography={typography}
      alignment={slide.textAlign}
      style={{ ...headlineTypography(slide, baseSize, lineHeight), fontFamily: typography.headline, ...style }}
    />
  )
}

type TextAlignment = "left" | "center" | "right"

const JUSTIFY_FOR_TEXT_ALIGNMENT: Record<TextAlignment, CSSProperties["justifyContent"]> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
}

type HighlightedPiece = { text: string; isHighlighted: boolean }

// Splits one line into words, keeping a highlighted word glued to the
// punctuation right after it ("*Kanye*," stays one word).
function splitLineIntoWords(line: string): HighlightedPiece[][] {
  const words: HighlightedPiece[][] = []
  let currentWord: HighlightedPiece[] = []
  for (const segment of splitHighlightedText(line)) {
    for (const token of segment.text.split(/(\s+)/)) {
      if (!token) continue
      if (/^\s+$/.test(token)) {
        if (currentWord.length) words.push(currentWord)
        currentWord = []
      } else {
        currentWord.push({ text: token, isHighlighted: segment.isHighlighted })
      }
    }
  }
  if (currentWord.length) words.push(currentWord)
  return words
}

// Text where *asterisks* mark the stretches drawn with the highlight font.
// Satori can't wrap text that mixes fonts inside one line box, so with a
// highlight each word becomes its own flex item and each line wraps like text.
function HighlightableText({
  text,
  typography,
  alignment,
  style,
}: {
  text: string
  typography: SlideTypography
  alignment: TextAlignment
  style: CSSProperties
}) {
  if (!splitHighlightedText(text).some((segment) => segment.isHighlighted)) {
    return <div style={{ display: "flex", ...style }}>{text}</div>
  }

  const fontSize = typeof style.fontSize === "number" ? style.fontSize : 32
  const highlightStyle: CSSProperties = { fontFamily: typography.highlight, letterSpacing: 0 }
  const lineStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: style.justifyContent ?? JUSTIFY_FOR_TEXT_ALIGNMENT[alignment],
    columnGap: Math.round(fontSize * 0.26),
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", ...style, whiteSpace: "normal" }}>
      {text.split("\n").map((line, lineIndex) => {
        const words = splitLineIntoWords(line)
        if (!words.length) return <div key={lineIndex} style={{ display: "flex", height: Math.round(fontSize * 0.6) }} />
        return (
          <div key={lineIndex} style={lineStyle}>
            {words.map((pieces, wordIndex) =>
              pieces.length === 1 ? (
                <span key={wordIndex} style={pieces[0]!.isHighlighted ? highlightStyle : undefined}>
                  {pieces[0]!.text}
                </span>
              ) : (
                <div key={wordIndex} style={{ display: "flex", alignItems: "baseline" }}>
                  {pieces.map((piece, pieceIndex) => (
                    <span key={pieceIndex} style={piece.isHighlighted ? highlightStyle : undefined}>
                      {piece.text}
                    </span>
                  ))}
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

function BodyText({
  text,
  typography,
  alignment,
  style,
}: {
  text: string
  typography: SlideTypography
  alignment: TextAlignment
  style: CSSProperties
}) {
  if (!text) return null
  return <HighlightableText text={text} typography={typography} alignment={alignment} style={style} />
}

function SourceNote({ slide, colors }: { slide: StudioSlide; colors: SlideColors }) {
  if (!slide.sourceNote.trim()) return null
  return (
    <div style={{ display: "flex", fontSize: 24, marginTop: 32, color: colors.mutedText }}>{`Fonte: ${slide.sourceNote}`}</div>
  )
}

function SlideBody({ slide, slideAlbums, carouselAlbums, colors, isCentered, typography }: SlideBodyProps) {
  const composition = resolveSlideComposition(slide)

  switch (slide.layout) {
    case "cover":
      return (
        <CoverBody
          slide={slide}
          slideAlbums={slideAlbums}
          carouselAlbums={carouselAlbums}
          colors={colors}
          isCentered={isCentered}
          composition={composition}
          typography={typography}
        />
      )
    case "album":
      return <SingleAlbumBody slide={slide} album={slideAlbums[0]} colors={colors} isCentered={isCentered} composition={composition} typography={typography} />
    case "ranked-album":
      return <RankedAlbumBody slide={slide} album={slideAlbums[0]} colors={colors} isCentered={isCentered} composition={composition} typography={typography} />
    case "album-pair":
      return <AlbumPairBody slide={slide} slideAlbums={slideAlbums} colors={colors} composition={composition} typography={typography} />
    case "album-grid":
      return (
        <AlbumGridBody
          slide={slide}
          slideAlbums={slideAlbums}
          carouselAlbums={carouselAlbums}
          colors={colors}
          isCentered={isCentered}
          composition={composition}
          typography={typography}
        />
      )
    case "album-list":
      return <AlbumListBody slide={slide} slideAlbums={slideAlbums} colors={colors} composition={composition} typography={typography} />
    case "text":
      return (
        <TextFrame composition={composition} colors={colors} isCentered={isCentered}>
          <Headline slide={slide} typography={typography} baseSize={76}>{slide.headline}</Headline>
          <BodyText
            text={slide.body}
            typography={typography}
            alignment={slide.textAlign}
            style={{ fontSize: 40, lineHeight: 1.38, marginTop: 44, whiteSpace: "pre-wrap" }}
          />
          <SourceNote slide={slide} colors={colors} />
        </TextFrame>
      )
    case "quote":
      return (
        <TextFrame composition={composition} colors={colors} isCentered={isCentered}>
          <div style={{ display: "flex", fontSize: 240, fontWeight: 700, lineHeight: 1, height: 150, color: colors.accent }}>“</div>
          <Headline slide={slide} typography={typography} baseSize={62} lineHeight={1.18}>{slide.headline}</Headline>
          <BodyText
            text={slide.body ? `— ${slide.body}` : ""}
            typography={typography}
            alignment={slide.textAlign}
            style={{ fontSize: 34, marginTop: 40, color: colors.mutedText }}
          />
          <SourceNote slide={slide} colors={colors} />
        </TextFrame>
      )
    case "cta":
      return (
        <CtaBody
          slide={slide}
          carouselAlbums={carouselAlbums}
          colors={colors}
          isCentered={isCentered}
          composition={composition}
          typography={typography}
        />
      )
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
  if (composition === "notebook") {
    return <NotebookPage>{children}</NotebookPage>
  }
  if (composition === "accent-bar") {
    return <div style={{ ...columnStyle, borderLeft: `12px solid ${colors.accent}`, paddingLeft: 52 }}>{children}</div>
  }
  return <div style={columnStyle}>{children}</div>
}

const CTA_RECAP_MAX_ALBUMS = 3

function pickRecapAlbums(carouselAlbums: SlideCanvasAlbum[], maxAlbums: number): SlideCanvasAlbum[] {
  return carouselAlbums.filter((album) => album.coverImageUrl).slice(0, maxAlbums)
}

// The empty spot in the list the reader is invited to fill.
function CtaEmptySlot({
  size,
  symbol,
  color,
  backdropColor,
  cornerRadiusPercent,
  style,
}: {
  size: number
  symbol: "+" | "?"
  color: string
  backdropColor: string
  cornerRadiusPercent: number
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: Math.round((size * cornerRadiusPercent) / 100),
        border: `4px solid ${hexToRgba(color, 0.55)}`,
        backgroundColor: hexToRgba(backdropColor, 0.55),
        boxShadow: COVER_SHADOW,
        color,
        fontSize: Math.round(size * 0.56),
        fontWeight: 400,
        lineHeight: 1,
        ...style,
      }}
    >
      {symbol}
    </div>
  )
}

type CtaRecapProps = { albums: SlideCanvasAlbum[]; colors: SlideColors; emptySlotColor: string; cornerRadiusPercent: number }

const CTA_FAN_COVER_SIZE = 210
const CTA_FAN_COVER_OVERLAP = 70
const CTA_FAN_ROTATIONS = [-10, -3, 5]
const CTA_FAN_EMPTY_SLOT_ROTATION = 9

function CtaCoverFan({ albums, colors, emptySlotColor, cornerRadiusPercent }: CtaRecapProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", paddingLeft: CTA_FAN_COVER_OVERLAP }}>
      {albums.map((album, index) => (
        <CoverArt
          key={album.id}
          album={album}
          size={CTA_FAN_COVER_SIZE}
          colors={colors}
          cornerRadiusPercent={cornerRadiusPercent}
          style={{ marginLeft: -CTA_FAN_COVER_OVERLAP, transform: `rotate(${CTA_FAN_ROTATIONS[index] ?? 0}deg)` }}
        />
      ))}
      <CtaEmptySlot
        size={CTA_FAN_COVER_SIZE}
        symbol="+"
        color={emptySlotColor}
        backdropColor={colors.background}
        cornerRadiusPercent={cornerRadiusPercent}
        style={{ marginLeft: -CTA_FAN_COVER_OVERLAP / 2, transform: `rotate(${CTA_FAN_EMPTY_SLOT_ROTATION}deg)` }}
      />
    </div>
  )
}

const CTA_CHECKLIST_WIDTH = 720
const CTA_CHECKLIST_POSITION_WIDTH = 64
const CTA_CHECKLIST_COVER_SIZE = 88
const CTA_CHECKLIST_COVER_TO_TEXT_GAP = 28
const CTA_CHECKLIST_ROW_GAP = 18
const CTA_CHECKLIST_BLANK_LINE_WIDTH = 320

function CtaChecklistRow({ position, colors, children }: { position: number; colors: SlideColors; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: position === 1 ? 0 : CTA_CHECKLIST_ROW_GAP }}>
      <div style={{ display: "flex", width: CTA_CHECKLIST_POSITION_WIDTH, fontSize: 26, fontWeight: 700, letterSpacing: 1, color: colors.mutedText }}>
        {formatSlideNumber(position)}
      </div>
      {children}
    </div>
  )
}

function CtaAlbumChecklist({ albums, colors, emptySlotColor, cornerRadiusPercent }: CtaRecapProps) {
  const textWidth = CTA_CHECKLIST_WIDTH - CTA_CHECKLIST_POSITION_WIDTH - CTA_CHECKLIST_COVER_SIZE - CTA_CHECKLIST_COVER_TO_TEXT_GAP
  const singleLine: CSSProperties = { display: "block", width: textWidth, lineClamp: 1 }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: CTA_CHECKLIST_WIDTH, textAlign: "left" }}>
      {albums.map((album, index) => (
        <CtaChecklistRow key={album.id} position={index + 1} colors={colors}>
          <CoverArt album={album} size={CTA_CHECKLIST_COVER_SIZE} colors={colors} cornerRadiusPercent={cornerRadiusPercent} />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: CTA_CHECKLIST_COVER_TO_TEXT_GAP }}>
            <div style={{ ...singleLine, fontSize: 34, fontWeight: 700, lineHeight: 1.15 }}>{album.title}</div>
            <div style={{ ...singleLine, fontSize: 26, lineHeight: 1.3, marginTop: 4, color: colors.mutedText }}>{album.artistNames.join(", ")}</div>
          </div>
        </CtaChecklistRow>
      ))}
      <CtaChecklistRow position={albums.length + 1} colors={colors}>
        <CtaEmptySlot size={CTA_CHECKLIST_COVER_SIZE} symbol="+" color={emptySlotColor} backdropColor={colors.background} cornerRadiusPercent={cornerRadiusPercent} />
        <div
          style={{
            display: "flex",
            width: CTA_CHECKLIST_BLANK_LINE_WIDTH,
            height: 4,
            marginLeft: CTA_CHECKLIST_COVER_TO_TEXT_GAP,
            borderRadius: 2,
            backgroundColor: hexToRgba(colors.text, 0.45),
          }}
        />
      </CtaChecklistRow>
    </div>
  )
}

const CTA_GRID_MAX_TILE_SIZE = 190
const CTA_GRID_GAP = 18
const CTA_GRID_ROTATION_ROOM = 80
const CTA_GRID_WHOLE_ROTATION = 4
const CTA_GRID_SPLIT_ROTATION = 6
const CTA_GRID_SPLIT_EXTRA_GAP = 28

function gridColumnCountFor(tileCount: number): number {
  if (tileCount <= 4) return 2
  if (tileCount <= 6) return 3
  return 4
}

function wholeGridRotation(tilt: CoverGridTilt): number {
  switch (tilt) {
    case "left":
      return -CTA_GRID_WHOLE_ROTATION
    case "right":
      return CTA_GRID_WHOLE_ROTATION
    case "none":
    case "split":
      return 0
  }
}

// "split" leans the left half of the columns to the left and the right half
// to the right; with an odd count the middle column stays straight.
function splitColumnRotation(columnIndex: number, columnCount: number): number {
  const middleColumnIndex = (columnCount - 1) / 2
  if (columnIndex < middleColumnIndex) return -CTA_GRID_SPLIT_ROTATION
  if (columnIndex > middleColumnIndex) return CTA_GRID_SPLIT_ROTATION
  return 0
}

function CtaCoverGrid({ albums, colors, emptySlotColor, cornerRadiusPercent, tilt }: CtaRecapProps & { tilt: CoverGridTilt }) {
  const tileCount = albums.length + 1
  const columnCount = gridColumnCountFor(tileCount)
  const isSplit = tilt === "split"
  const totalGapWidth = CTA_GRID_GAP * (columnCount - 1) + (isSplit ? CTA_GRID_SPLIT_EXTRA_GAP : 0)
  const tileSize = Math.min(CTA_GRID_MAX_TILE_SIZE, Math.floor((CONTENT_WIDTH - CTA_GRID_ROTATION_ROOM - totalGapWidth) / columnCount))
  const firstRightColumnIndex = Math.ceil(columnCount / 2)

  const tiles = [
    ...albums.map((album) => (
      <CoverArt key={album.id} album={album} size={tileSize} colors={colors} cornerRadiusPercent={cornerRadiusPercent} />
    )),
    <CtaEmptySlot key="empty-slot" size={tileSize} symbol="?" color={emptySlotColor} backdropColor={colors.background} cornerRadiusPercent={cornerRadiusPercent} />,
  ]
  const tilesByColumn = Array.from({ length: columnCount }, (_, columnIndex) =>
    tiles.filter((_, tileIndex) => tileIndex % columnCount === columnIndex)
  )

  return (
    <div style={{ display: "flex", alignItems: "flex-start", transform: `rotate(${wholeGridRotation(tilt)}deg)` }}>
      {tilesByColumn.map((columnTiles, columnIndex) => (
        <div
          key={columnIndex}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: CTA_GRID_GAP,
            marginLeft: columnIndex === 0 ? 0 : CTA_GRID_GAP + (isSplit && columnIndex === firstRightColumnIndex ? CTA_GRID_SPLIT_EXTRA_GAP : 0),
            transform: `rotate(${isSplit ? splitColumnRotation(columnIndex, columnCount) : 0}deg)`,
          }}
        >
          {columnTiles}
        </div>
      ))}
    </div>
  )
}

const CTA_STRIP_COVER_SIZE = 96
const CTA_STRIP_COVER_OVERLAP = 22

// A small row of overlapping covers, like a stack of avatars, ending in "+".
function CtaCoverStrip({ albums, colors, emptySlotColor, cornerRadiusPercent }: CtaRecapProps) {
  const ringStyle: CSSProperties = { border: `4px solid ${colors.background}`, boxShadow: "0 10px 24px rgba(0, 0, 0, 0.3)" }
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {albums.map((album, index) => (
        <CoverArt
          key={album.id}
          album={album}
          size={CTA_STRIP_COVER_SIZE}
          colors={colors}
          cornerRadiusPercent={cornerRadiusPercent}
          style={{ ...ringStyle, marginLeft: index === 0 ? 0 : -CTA_STRIP_COVER_OVERLAP }}
        />
      ))}
      <CtaEmptySlot
        size={CTA_STRIP_COVER_SIZE}
        symbol="+"
        color={emptySlotColor}
        backdropColor={colors.background}
        cornerRadiusPercent={cornerRadiusPercent}
        style={{ ...ringStyle, marginLeft: -CTA_STRIP_COVER_OVERLAP, backgroundColor: emptySlotColor, color: readableTextColorFor(emptySlotColor) }}
      />
    </div>
  )
}

const CTA_MAX_ALBUMS_BY_COMPOSITION: Partial<Record<SlideComposition, number>> = { grid: 6, subtle: 5 }

function maxRecapAlbumsFor(composition: SlideComposition): number {
  return CTA_MAX_ALBUMS_BY_COMPOSITION[composition] ?? CTA_RECAP_MAX_ALBUMS
}

function CtaRecapArrangement({ composition, gridTilt, ...recapProps }: CtaRecapProps & { composition: SlideComposition; gridTilt: CoverGridTilt }) {
  switch (composition) {
    case "checklist":
      return <CtaAlbumChecklist {...recapProps} />
    case "grid":
      return <CtaCoverGrid {...recapProps} tilt={gridTilt} />
    case "subtle":
      return <CtaCoverStrip {...recapProps} />
    default:
      return <CtaCoverFan {...recapProps} />
  }
}

const CTA_RECAP_DEFAULT_SPACING = 72
const CTA_RECAP_SPACING_BY_COMPOSITION: Partial<Record<SlideComposition, number>> = { classic: 76, checklist: 64, subtle: 56 }

function CtaRecap({
  composition,
  position,
  ...arrangementProps
}: CtaRecapProps & { composition: SlideComposition; gridTilt: CoverGridTilt; position: CtaRecapPosition }) {
  if (composition === "minimal" || !arrangementProps.albums.length) return null
  const spacing = CTA_RECAP_SPACING_BY_COMPOSITION[composition] ?? CTA_RECAP_DEFAULT_SPACING
  return (
    <div style={{ display: "flex", ...(position === "above" ? { marginBottom: spacing } : { marginTop: spacing }) }}>
      <CtaRecapArrangement composition={composition} {...arrangementProps} />
    </div>
  )
}

const CTA_COMPACT_HEADLINE_COMPOSITIONS: readonly SlideComposition[] = ["checklist", "grid"]

function CtaBody({
  slide,
  carouselAlbums,
  colors,
  isCentered,
  composition,
  typography,
}: {
  slide: StudioSlide
  carouselAlbums: SlideCanvasAlbum[]
  colors: SlideColors
  isCentered: boolean
  composition: SlideComposition
  typography: SlideTypography
}) {
  const buttonColor = slide.ctaButtonHex ?? colors.text
  const filledButtonTextColor = slide.ctaButtonHex ? readableTextColorFor(slide.ctaButtonHex) : colors.background
  const websiteStyles: Record<"classic" | "outline" | "minimal", CSSProperties> = {
    classic: { padding: "22px 46px", borderRadius: 999, backgroundColor: buttonColor, color: filledButtonTextColor, boxShadow: COVER_SHADOW },
    outline: { padding: "20px 44px", borderRadius: 999, border: `3px solid ${buttonColor}`, color: buttonColor },
    minimal: { paddingBottom: 6, borderBottom: `4px solid ${slide.ctaButtonHex ?? colors.accent}`, color: colors.text },
  }
  const websiteStyle = composition === "outline" || composition === "minimal" ? websiteStyles[composition] : websiteStyles.classic
  const headlineBaseSize = CTA_COMPACT_HEADLINE_COMPOSITIONS.includes(composition) ? 80 : 92
  const recap = (
    <CtaRecap
      composition={composition}
      position={slide.ctaRecapPosition}
      gridTilt={slide.coverGridTilt}
      albums={pickRecapAlbums(carouselAlbums, maxRecapAlbumsFor(composition))}
      colors={colors}
      emptySlotColor={slide.ctaEmptySlotHex ?? colors.text}
      cornerRadiusPercent={slide.albumCoverRadius}
    />
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      {slide.ctaRecapPosition === "above" ? recap : null}
      <Headline slide={slide} typography={typography} baseSize={headlineBaseSize} lineHeight={1.04}>{slide.headline}</Headline>
      <BodyText
        text={slide.body}
        typography={typography}
        alignment={slide.textAlign}
        style={{ fontSize: 36, lineHeight: 1.35, marginTop: 36, color: colors.mutedText }}
      />
      {slide.showCtaWebsite ? (
        <div style={{ display: "flex", alignItems: "center", marginTop: 60, fontSize: 30, fontWeight: 700, ...websiteStyle }}>
          <span>discows.com</span>
          <span style={{ marginLeft: 14 }}>→</span>
        </div>
      ) : null}
      {slide.ctaRecapPosition === "below" ? recap : null}
    </div>
  )
}

function CoverArt({
  album,
  size,
  colors,
  cornerRadiusPercent,
  hasShadow = true,
  style,
}: {
  album: SlideCanvasAlbum | undefined
  size: number
  colors: SlideColors
  cornerRadiusPercent: number
  hasShadow?: boolean
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
  // A shadow is left out instead of set to "none": Satori paints
  // boxShadow "none" on an image as a black square at the slide origin.
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Satori and the live preview both need a plain <img>
    <img
      src={album.coverImageUrl}
      width={size}
      height={size}
      alt={`Capa de ${album.title}`}
      style={{ width: size, height: size, flexShrink: 0, objectFit: "contain", ...(hasShadow ? { boxShadow: COVER_SHADOW } : {}), borderRadius, ...style }}
    />
  )
}

const COLLAGE_ROTATIONS = [-6, 4, -3, 7, -5, 3]
const COLLAGE_MAX_COVER_SIZE = 300
const COLLAGE_OVERLAP_RATIO = 0.3
const COLLAGE_AVAILABLE_WIDTH = CONTENT_WIDTH - 24

function collageCoverSizeFor(albumCount: number) {
  if (albumCount === 1) return 440
  if (albumCount === 2) return 360
  const visibleCoverWidths = albumCount - COLLAGE_OVERLAP_RATIO * (albumCount - 1)
  return Math.min(COLLAGE_MAX_COVER_SIZE, Math.floor(COLLAGE_AVAILABLE_WIDTH / visibleCoverWidths))
}

type CoverBodyProps = SlideBodyProps & { composition: SlideComposition }

function CoverBody({ slide, slideAlbums, carouselAlbums, colors, isCentered, composition, typography }: CoverBodyProps) {
  const columnAlignment = isCentered ? "center" : "flex-start"
  const radius = slide.albumCoverRadius
  const coverText = (headlineBaseSize: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
      <Headline slide={slide} typography={typography} baseSize={headlineBaseSize} lineHeight={1.02}>{slide.headline}</Headline>
      <BodyText
        text={slide.body}
        typography={typography}
        alignment={slide.textAlign}
        style={{ fontSize: 38, lineHeight: 1.3, marginTop: 36, color: colors.mutedText }}
      />
    </div>
  )

  if (slide.backgroundStyle === "cover-echo") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
        <div style={{ display: "flex", width: 96, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginBottom: 36 }} />
        {coverText(88)}
      </div>
    )
  }

  if (slideAlbums.length === 0 || composition === "type") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
        <div style={{ display: "flex", width: 120, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginBottom: 48 }} />
        {coverText(composition === "type" ? 128 : 104)}
      </div>
    )
  }

  switch (composition) {
    case "cassette":
      return <CassetteCover slide={slide} slideAlbums={slideAlbums} carouselAlbums={carouselAlbums} colors={colors} typography={typography} />
    case "fan-deck":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: columnAlignment }}>
          <Headline slide={slide} typography={typography} baseSize={132} lineHeight={0.98}>{slide.headline}</Headline>
          {slide.customBackgroundHex ? (
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: 6, marginTop: 20, color: colors.mutedText }}>
              {slide.customBackgroundHex.toUpperCase()}
            </div>
          ) : null}
          <BodyText
            text={slide.body}
            typography={typography}
            alignment={slide.textAlign}
            style={{ fontSize: 34, lineHeight: 1.3, marginTop: 20, color: colors.mutedText }}
          />
          <PaintChipFanDeck albums={slideAlbums} swatchColor={colors.background} cornerRadiusPercent={radius} />
        </div>
      )
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
              <CoverArt key={album?.id ?? index} album={album} size={tileSize} colors={colors} cornerRadiusPercent={radius} hasShadow={false} />
            ))}
          </div>
          {coverText(100)}
        </div>
      )
    }
    case "stack": {
      const coverSize = 400
      const stepX = slideAlbums.length > 1 ? Math.min(120, Math.floor((CONTENT_WIDTH - coverSize) / (slideAlbums.length - 1))) : 0
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
      const coverSize = collageCoverSizeFor(slideAlbums.length)
      const overlap = slideAlbums.length > 2 ? Math.round(coverSize * COLLAGE_OVERLAP_RATIO) : 60
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

const PAINT_CHIP_CARD_COLORS = { background: "#ffffff", text: "#17121b", mutedText: "#6e6573" }
const PAINT_CHIP_SHADOW = "0 18px 40px rgba(0, 0, 0, 0.24)"

function formatChipNumber(position: number): string {
  return `Nº ${String(position).padStart(2, "0")}`
}

function PaintChipLabel({
  album,
  position,
  titleFontSize,
  width,
}: {
  album: SlideCanvasAlbum | undefined
  position: number
  titleFontSize: number
  width: number
}) {
  const singleLine: CSSProperties = { display: "flex", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", width }
  return (
    <div style={{ display: "flex", flexDirection: "column", width, color: PAINT_CHIP_CARD_COLORS.text, textAlign: "left" }}>
      <div style={{ ...singleLine, fontSize: titleFontSize, fontWeight: 700, lineHeight: 1.2 }}>{album?.title ?? "Álbum removido"}</div>
      <div style={{ ...singleLine, fontSize: Math.round(titleFontSize * 0.8), lineHeight: 1.3, marginTop: 4, color: PAINT_CHIP_CARD_COLORS.mutedText }}>
        {album ? album.artistNames.join(", ") : ""}
      </div>
      <div style={{ display: "flex", fontSize: Math.round(titleFontSize * 0.68), fontWeight: 700, letterSpacing: 2, marginTop: 10, color: PAINT_CHIP_CARD_COLORS.mutedText }}>
        {formatChipNumber(position)}
      </div>
    </div>
  )
}

const FAN_CHIP_PADDING = 14
const FAN_CHIP_COVER_SIZE = 240
const FAN_CHIP_WIDTH = FAN_CHIP_COVER_SIZE + FAN_CHIP_PADDING * 2
const FAN_CHIP_END_RADIUS = FAN_CHIP_WIDTH / 2
const FAN_CHIP_LABEL_HEIGHT = 96
const FAN_RIVET_DEPTH_IN_SWATCH = 44
const FAN_CHIP_HANDLE_HEIGHT = FAN_CHIP_END_RADIUS + FAN_RIVET_DEPTH_IN_SWATCH
const FAN_CHIP_HEIGHT = FAN_CHIP_PADDING + FAN_CHIP_COVER_SIZE + FAN_CHIP_LABEL_HEIGHT + FAN_CHIP_HANDLE_HEIGHT
const FAN_PIVOT_TO_CHIP_CENTER = FAN_CHIP_HEIGHT / 2 - FAN_CHIP_END_RADIUS
const FAN_PIVOT_TO_COVER_CENTER = FAN_CHIP_HEIGHT - FAN_CHIP_END_RADIUS - FAN_CHIP_PADDING - FAN_CHIP_COVER_SIZE / 2
const FAN_MAX_SPREAD_DEGREES = 108
const FAN_MAX_ANGLE_STEP_DEGREES = 27
const FAN_RIVET_SIZE = 30
const FAN_CHIP_EDGE_WIDTH = 2
const FAN_CHIP_EDGE_COLOR = "rgba(23, 18, 27, 0.16)"

function fanChipAngles(chipCount: number): number[] {
  const angleStep = chipCount > 1 ? Math.min(FAN_MAX_ANGLE_STEP_DEGREES, FAN_MAX_SPREAD_DEGREES / (chipCount - 1)) : 0
  const middleIndex = (chipCount - 1) / 2
  return Array.from({ length: chipCount }, (_, index) => (index - middleIndex) * angleStep)
}

function rotatePoint(x: number, y: number, angleRadians: number) {
  return {
    x: x * Math.cos(angleRadians) - y * Math.sin(angleRadians),
    y: x * Math.sin(angleRadians) + y * Math.cos(angleRadians),
  }
}

function highestPointOfRotatedChip(chipCenterY: number, angleRadians: number): number {
  const cornerHeights = [-1, 1].map(
    (horizontalSide) => chipCenterY + rotatePoint((horizontalSide * FAN_CHIP_WIDTH) / 2, -FAN_CHIP_HEIGHT / 2, angleRadians).y
  )
  return Math.min(...cornerHeights)
}

// Chips pivot around one rivet, like a paint fan deck. Each chip ends in a
// half circle centered on the rivet, so all their ends merge into one disc.
// Positions are computed by hand instead of transform-origin, and each cover
// gets its own rotation: Satori neither rotates an <img> inside a rotated
// parent nor draws box-shadows on rotated boxes correctly.
function PaintChipFanDeck({
  albums,
  swatchColor,
  cornerRadiusPercent,
}: {
  albums: (SlideCanvasAlbum | undefined)[]
  swatchColor: string
  cornerRadiusPercent: number
}) {
  const chipsAroundPivot = fanChipAngles(albums.length).map((angleDegrees, index) => {
    const angleRadians = (angleDegrees * Math.PI) / 180
    const chipCenter = rotatePoint(0, -FAN_PIVOT_TO_CHIP_CENTER, angleRadians)
    return {
      album: albums[index],
      position: index + 1,
      angleDegrees,
      chipCenter,
      coverCenter: rotatePoint(0, -FAN_PIVOT_TO_COVER_CENTER, angleRadians),
      highestPoint: highestPointOfRotatedChip(chipCenter.y, angleRadians),
    }
  })
  const pivotX = CONTENT_WIDTH / 2
  const pivotY = -Math.min(...chipsAroundPivot.map((chip) => chip.highestPoint))
  const fanHeight = Math.ceil(pivotY + FAN_CHIP_END_RADIUS)
  const chipsFromOutsideIn = [...chipsAroundPivot].sort((first, second) => Math.abs(second.angleDegrees) - Math.abs(first.angleDegrees))
  const frontChipPosition = chipsFromOutsideIn.at(-1)?.position
  const handleSwatchColor = readableTextColorFor(swatchColor) === "#17121b" ? mixTowardInk(swatchColor) : swatchColor
  const swatchEndRadius = FAN_CHIP_END_RADIUS - FAN_CHIP_PADDING

  return (
    <div style={{ display: "flex", position: "relative", width: CONTENT_WIDTH, height: fanHeight, marginTop: 64 }}>
      {chipsFromOutsideIn.flatMap(({ album, position, angleDegrees, chipCenter, coverCenter }) => [
        <div
          key={`chip-${position}`}
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: pivotX + chipCenter.x - FAN_CHIP_WIDTH / 2,
            top: pivotY + chipCenter.y - FAN_CHIP_HEIGHT / 2,
            width: FAN_CHIP_WIDTH,
            height: FAN_CHIP_HEIGHT,
            boxSizing: "border-box",
            padding: FAN_CHIP_PADDING - FAN_CHIP_EDGE_WIDTH,
            border: `${FAN_CHIP_EDGE_WIDTH}px solid ${FAN_CHIP_EDGE_COLOR}`,
            borderBottomLeftRadius: FAN_CHIP_END_RADIUS,
            borderBottomRightRadius: FAN_CHIP_END_RADIUS,
            backgroundColor: PAINT_CHIP_CARD_COLORS.background,
            transform: `rotate(${angleDegrees}deg)`,
          }}
        >
          <div style={{ display: "flex", width: FAN_CHIP_COVER_SIZE, height: FAN_CHIP_COVER_SIZE, flexShrink: 0 }} />
          <div style={{ display: "flex", height: FAN_CHIP_LABEL_HEIGHT, paddingTop: 14, flexShrink: 0 }}>
            {position === frontChipPosition ? (
              <PaintChipLabel album={album} position={position} titleFontSize={24} width={FAN_CHIP_COVER_SIZE} />
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              flexGrow: 1,
              width: FAN_CHIP_COVER_SIZE,
              backgroundColor: handleSwatchColor,
              borderBottomLeftRadius: swatchEndRadius,
              borderBottomRightRadius: swatchEndRadius,
            }}
          />
        </div>,
        <CoverArt
          key={`cover-${position}`}
          album={album}
          size={FAN_CHIP_COVER_SIZE}
          colors={PAINT_CHIP_CARD_COLORS_AS_SLIDE}
          cornerRadiusPercent={cornerRadiusPercent}
          hasShadow={false}
          style={{
            position: "absolute",
            left: pivotX + coverCenter.x - FAN_CHIP_COVER_SIZE / 2,
            top: pivotY + coverCenter.y - FAN_CHIP_COVER_SIZE / 2,
            transform: `rotate(${angleDegrees}deg)`,
          }}
        />,
      ])}
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: pivotX - FAN_RIVET_SIZE / 2,
          top: pivotY - FAN_RIVET_SIZE / 2,
          width: FAN_RIVET_SIZE,
          height: FAN_RIVET_SIZE,
          borderRadius: FAN_RIVET_SIZE / 2,
          backgroundColor: PAINT_CHIP_CARD_COLORS.text,
          border: `7px solid ${PAINT_CHIP_CARD_COLORS.background}`,
        }}
      />
    </div>
  )
}

const PAINT_CHIP_CARD_COLORS_AS_SLIDE: SlideColors = { ...PAINT_CHIP_CARD_COLORS, accent: PAINT_CHIP_CARD_COLORS.text }

// A light swatch on its own light slide would vanish inside the white chip,
// so the handle darkens it a little to stay visible.
function mixTowardInk(hexColor: string): string {
  const darkenChannel = (channelStart: number) =>
    Math.round(parseInt(hexColor.slice(channelStart, channelStart + 2), 16) * 0.82)
      .toString(16)
      .padStart(2, "0")
  return `#${darkenChannel(1)}${darkenChannel(3)}${darkenChannel(5)}`
}

const SWATCH_CARD_PADDING = 16

function SwatchCardGrid({
  slideAlbums,
  carouselAlbums,
  cornerRadiusPercent,
  isCentered,
}: {
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  carouselAlbums: SlideCanvasAlbum[]
  cornerRadiusPercent: number
  isCentered: boolean
}) {
  const isDuel = slideAlbums.length === 2
  const coverSize = isDuel ? 380 : 300
  const columnGap = isDuel ? 48 : 40
  const cardWidth = coverSize + SWATCH_CARD_PADDING * 2
  const positionInCarousel = (album: SlideCanvasAlbum | undefined, fallbackIndex: number) => {
    const carouselIndex = album ? carouselAlbums.findIndex((carouselAlbum) => carouselAlbum.id === album.id) : -1
    return (carouselIndex === -1 ? fallbackIndex : carouselIndex) + 1
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: cardWidth * 2 + columnGap,
        columnGap,
        rowGap: 36,
        justifyContent: isCentered ? "center" : "flex-start",
      }}
    >
      {slideAlbums.map((album, index) => (
        <div
          key={album?.id ?? index}
          style={{
            display: "flex",
            flexDirection: "column",
            width: cardWidth,
            padding: SWATCH_CARD_PADDING,
            paddingBottom: 20,
            backgroundColor: PAINT_CHIP_CARD_COLORS.background,
            boxShadow: PAINT_CHIP_SHADOW,
          }}
        >
          <CoverArt album={album} size={coverSize} colors={PAINT_CHIP_CARD_COLORS_AS_SLIDE} cornerRadiusPercent={cornerRadiusPercent} hasShadow={false} />
          <div style={{ display: "flex", marginTop: 16 }}>
            <PaintChipLabel album={album} position={positionInCarousel(album, index)} titleFontSize={isDuel ? 28 : 24} width={coverSize} />
          </div>
        </div>
      ))}
    </div>
  )
}

const MIXTAPE_PAPER_COLORS: SlideColors = { background: "#f3ead3", text: "#1f1a14", mutedText: "#6b5f4c", accent: "#d9532b" }
const MIXTAPE_PAPER_RULE = "rgba(31, 26, 20, 0.13)"
const MIXTAPE_MASKING_TAPE = "rgba(244, 232, 196, 0.86)"

const MINIMUM_STRIPE_CHANNEL_SPREAD = 40

// Cassette labels need a colorful stripe; a grey or white slide accent
// falls back to the paper's orange.
function mixtapeStripeColor(slideAccent: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(slideAccent)) return MIXTAPE_PAPER_COLORS.accent
  const channels = [1, 3, 5].map((channelStart) => parseInt(slideAccent.slice(channelStart, channelStart + 2), 16))
  const channelSpread = Math.max(...channels) - Math.min(...channels)
  return channelSpread < MINIMUM_STRIPE_CHANNEL_SPREAD ? MIXTAPE_PAPER_COLORS.accent : slideAccent
}

function MaskingTape({ width, angleDegrees, style }: { width: number; angleDegrees: number; style: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        width,
        height: Math.round(width * 0.28),
        backgroundColor: MIXTAPE_MASKING_TAPE,
        transform: `rotate(${angleDegrees}deg)`,
        ...style,
      }}
    />
  )
}

function SideLabel({ side, colors }: { side: string; colors: SlideColors }) {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: 22, fontWeight: 700, letterSpacing: 4, color: colors.mutedText }}>
      <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent, marginRight: 12 }} />
      {side}
    </div>
  )
}

// Every cassette measure below is for the large size; smaller sizes scale
// each measure by hand because Satori breaks clipping inside transform: scale.
const CASSETTE_WIDTH = CONTENT_WIDTH
const CASSETTE_HEIGHT = 560
const CASSETTE_CORNER_RADIUS = 34
const CASSETTE_SHELL_COLORS = { top: "#423b34", middle: "#2a2521", bottom: "#1d1a17", foot: "#35302a", screw: "#5a534b", slot: "#1d1a17" }
const CASSETTE_LABEL_INSET = 34
const CASSETTE_LABEL_WIDTH = CASSETTE_WIDTH - CASSETTE_LABEL_INSET * 2
const CASSETTE_LABEL_HEIGHT = 386
const CASSETTE_BAND_HEIGHT = 150
const CASSETTE_LABEL_PADDING = 32
const CASSETTE_SIDE_BADGE_SIZE = 68
const CASSETTE_CENTERED_SIDE_BADGE_SIZE = 40
const CASSETTE_LONG_HEADLINE_LENGTH = 40
const CASSETTE_WINDOW_WIDTH = 460
const CASSETTE_WINDOW_HEIGHT = 114
const CASSETTE_WINDOW_COLOR = "#15110e"
const CASSETTE_SPOOL_CENTER_OFFSET = 128
const CASSETTE_FULL_SPOOL_SIZE = 94
const CASSETTE_EMPTY_SPOOL_SIZE = 64
const CASSETTE_WOUND_TAPE = { fill: "#4a3323", ring: "#62452f" }
const CASSETTE_HUB_SIZE = 46
const CASSETTE_HUB_HOLE_SIZE = 26
const CASSETTE_HUB_COLOR = "#ece5d4"
const CASSETTE_HUB_TEETH = 6
const CASSETTE_FOOT_TOP_WIDTH = 520
const CASSETTE_FOOT_SLANT = 46
const CASSETTE_FOOT_HEIGHT = 92
const CASSETTE_FOOT_CORNER_COVER_WIDTH = 120
const CASSETTE_FOOT_CORNER_COVER_HEIGHT = 130
const CASSETTE_SCREW_SIZE = 22
const CASSETTE_SCREW_INSET = 22
const CASSETTE_COVER_PEEK = 150
const CASSETTE_COVER_SIDE_MARGIN = 40
const CASSETTE_COVER_TILT_RANGE = { first: -9, last: 10, alternatingNudge: 2 }

type ScaleMeasure = (largeSizeMeasure: number) => number

function cassettePeekingCoverSize(albumCount: number): number {
  if (albumCount >= 6) return 196
  if (albumCount === 5) return 212
  return 230
}

function cassettePeekingCoverTilt(index: number, albumCount: number): number {
  if (albumCount === 1) return -3
  const { first, last, alternatingNudge } = CASSETTE_COVER_TILT_RANGE
  const evenlySpreadTilt = first + ((last - first) * index) / (albumCount - 1)
  return evenlySpreadTilt + (index % 2 === 0 ? -alternatingNudge : alternatingNudge)
}

function CassetteScrew({ centerX, centerY, scaled }: { centerX: number; centerY: number; scaled: ScaleMeasure }) {
  const screwSize = scaled(CASSETTE_SCREW_SIZE)
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        left: centerX - screwSize / 2,
        top: centerY - screwSize / 2,
        width: screwSize,
        height: screwSize,
        borderRadius: screwSize / 2,
        backgroundColor: CASSETTE_SHELL_COLORS.screw,
      }}
    >
      <div style={{ display: "flex", width: scaled(12), height: Math.max(2, scaled(3)), backgroundColor: CASSETTE_SHELL_COLORS.slot, transform: "rotate(45deg)" }} />
    </div>
  )
}

// A wound reel of tape seen through the window. The white hub has a hole
// with teeth pointing inward, like the ones the tape deck spindle grabs.
function CassetteSpool({ centerX, centerY, woundSize, scaled }: { centerX: number; centerY: number; woundSize: number; scaled: ScaleMeasure }) {
  const hubSize = scaled(CASSETTE_HUB_SIZE)
  const holeSize = scaled(CASSETTE_HUB_HOLE_SIZE)
  const toothWidth = Math.max(3, scaled(5))
  const toothHeight = Math.max(5, scaled(8))
  const toothDistance = holeSize / 2 - scaled(3)
  const centeredCircle = (size: number, color: string): CSSProperties => ({
    display: "flex",
    position: "absolute",
    left: (woundSize - size) / 2,
    top: (woundSize - size) / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  })
  return (
    <div style={{ display: "flex", position: "absolute", left: centerX - woundSize / 2, top: centerY - woundSize / 2, width: woundSize, height: woundSize }}>
      <div
        style={{
          display: "flex",
          width: woundSize,
          height: woundSize,
          borderRadius: woundSize / 2,
          backgroundColor: CASSETTE_WOUND_TAPE.fill,
          border: `${Math.max(2, scaled(3))}px solid ${CASSETTE_WOUND_TAPE.ring}`,
        }}
      />
      <div style={centeredCircle(hubSize, CASSETTE_HUB_COLOR)} />
      <div style={centeredCircle(holeSize, CASSETTE_WINDOW_COLOR)} />
      {Array.from({ length: CASSETTE_HUB_TEETH }, (_, toothIndex) => {
        const angleDegrees = (360 / CASSETTE_HUB_TEETH) * toothIndex
        const angleRadians = (angleDegrees * Math.PI) / 180
        return (
          <div
            key={toothIndex}
            style={{
              display: "flex",
              position: "absolute",
              left: woundSize / 2 + toothDistance * Math.sin(angleRadians) - toothWidth / 2,
              top: woundSize / 2 - toothDistance * Math.cos(angleRadians) - toothHeight / 2,
              width: toothWidth,
              height: toothHeight,
              borderRadius: 1,
              backgroundColor: CASSETTE_HUB_COLOR,
              transform: `rotate(${angleDegrees}deg)`,
            }}
          />
        )
      })}
    </div>
  )
}

function CassetteWindow({ scaled }: { scaled: ScaleMeasure }) {
  const windowWidth = scaled(CASSETTE_WINDOW_WIDTH)
  const windowHeight = scaled(CASSETTE_WINDOW_HEIGHT)
  const centerY = windowHeight / 2
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: windowWidth,
        height: windowHeight,
        borderRadius: scaled(16),
        overflow: "hidden",
        backgroundColor: CASSETTE_WINDOW_COLOR,
        border: `${Math.max(2, scaled(4))}px solid rgba(0, 0, 0, 0.28)`,
      }}
    >
      <CassetteSpool centerX={windowWidth / 2 - scaled(CASSETTE_SPOOL_CENTER_OFFSET)} centerY={centerY} woundSize={scaled(CASSETTE_FULL_SPOOL_SIZE)} scaled={scaled} />
      <CassetteSpool centerX={windowWidth / 2 + scaled(CASSETTE_SPOOL_CENTER_OFFSET)} centerY={centerY} woundSize={scaled(CASSETTE_EMPTY_SPOOL_SIZE)} scaled={scaled} />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          width: windowWidth,
          height: windowHeight,
          backgroundImage:
            "linear-gradient(110deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 16%, rgba(255, 255, 255, 0.09) 16%, rgba(255, 255, 255, 0.09) 27%, rgba(255, 255, 255, 0) 27%, rgba(255, 255, 255, 0) 31%, rgba(255, 255, 255, 0.05) 31%, rgba(255, 255, 255, 0.05) 34%, rgba(255, 255, 255, 0) 34%)",
        }}
      />
    </div>
  )
}

// Satori ignores clip-path and transparent borders, so two tilted blocks in
// the shell's bottom color cut the foot's corners into a trapezoid.
function CassetteFoot({ scaled }: { scaled: ScaleMeasure }) {
  const cassetteWidth = scaled(CASSETTE_WIDTH)
  const footHeight = scaled(CASSETTE_FOOT_HEIGHT)
  const footSlant = scaled(CASSETTE_FOOT_SLANT)
  const footBottomWidth = scaled(CASSETTE_FOOT_TOP_WIDTH) + footSlant * 2
  const footTop = scaled(CASSETTE_HEIGHT) - footHeight
  const footSlantRadians = Math.atan(footSlant / footHeight)
  const cornerCoverWidth = scaled(CASSETTE_FOOT_CORNER_COVER_WIDTH)
  const cornerCoverHeight = scaled(CASSETTE_FOOT_CORNER_COVER_HEIGHT)
  const holeCenterY = footTop + footHeight * 0.55
  const holes = [
    { offsetFromCenter: -196, size: 26, isRound: true },
    { offsetFromCenter: -78, size: 18, isRound: false },
    { offsetFromCenter: 78, size: 18, isRound: false },
    { offsetFromCenter: 196, size: 26, isRound: true },
  ]
  return (
    <>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: (cassetteWidth - footBottomWidth) / 2,
          top: footTop,
          width: footBottomWidth,
          height: footHeight,
          backgroundColor: CASSETTE_SHELL_COLORS.foot,
        }}
      />
      {[-1, 1].map((side) => {
        const slantEdgeCenterX = cassetteWidth / 2 + side * (footBottomWidth / 2 - footSlant / 2)
        return (
          <div
            key={side}
            style={{
              display: "flex",
              position: "absolute",
              left: slantEdgeCenterX + side * (cornerCoverWidth / 2) * Math.cos(footSlantRadians) - cornerCoverWidth / 2,
              top: footTop + footHeight / 2 - (cornerCoverWidth / 2) * Math.sin(footSlantRadians) - cornerCoverHeight / 2,
              width: cornerCoverWidth,
              height: cornerCoverHeight,
              backgroundColor: CASSETTE_SHELL_COLORS.bottom,
              transform: `rotate(${(-side * footSlantRadians * 180) / Math.PI}deg)`,
            }}
          />
        )
      })}
      {holes.map((hole) => {
        const holeSize = scaled(hole.size)
        return (
          <div
            key={hole.offsetFromCenter}
            style={{
              display: "flex",
              position: "absolute",
              left: cassetteWidth / 2 + scaled(hole.offsetFromCenter) - holeSize / 2,
              top: holeCenterY - holeSize / 2,
              width: holeSize,
              height: holeSize,
              borderRadius: hole.isRound ? holeSize / 2 : scaled(4),
              backgroundColor: CASSETTE_WINDOW_COLOR,
            }}
          />
        )
      })}
      <CassetteScrew centerX={cassetteWidth / 2} centerY={holeCenterY} scaled={scaled} />
    </>
  )
}

function collectCassetteAlbums(
  slideAlbums: (SlideCanvasAlbum | undefined)[],
  carouselAlbums: SlideCanvasAlbum[]
): (SlideCanvasAlbum | undefined)[] {
  const coverAlbumIds = new Set(slideAlbums.map((album) => album?.id))
  const remainingCarouselAlbums = carouselAlbums.filter((album) => !coverAlbumIds.has(album.id))
  return [...slideAlbums, ...remainingCarouselAlbums].slice(0, MAX_ALBUMS_PER_COVER_SLIDE)
}

// The headline is written on the cassette label, and every album of the
// post sticks out from behind the tape like records stacked in a shoebox.
function CassetteCover({
  slide,
  slideAlbums,
  carouselAlbums,
  colors,
  typography,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  carouselAlbums: SlideCanvasAlbum[]
  colors: SlideColors
  typography: SlideTypography
}) {
  const cassetteScale = CASSETTE_SIZE_SCALE[slide.cassetteSize]
  const scaled: ScaleMeasure = (largeSizeMeasure) => Math.round(largeSizeMeasure * cassetteScale)
  const isCentered = slide.textAlign === "center"
  const cassetteWidth = scaled(CASSETTE_WIDTH)
  const cassetteHeight = scaled(CASSETTE_HEIGHT)
  const coverPeek = scaled(CASSETTE_COVER_PEEK)
  const peekingAlbums = collectCassetteAlbums(slideAlbums, carouselAlbums)
  const coverSize = scaled(cassettePeekingCoverSize(peekingAlbums.length))
  const coverSideMargin = scaled(CASSETTE_COVER_SIDE_MARGIN)
  const coverSpacing = peekingAlbums.length > 1 ? (cassetteWidth - coverSideMargin * 2 - coverSize) / (peekingAlbums.length - 1) : 0
  const firstCoverLeft = peekingAlbums.length > 1 ? coverSideMargin : (cassetteWidth - coverSize) / 2
  const labelWidth = scaled(CASSETTE_LABEL_WIDTH)
  const labelPadding = scaled(CASSETTE_LABEL_PADDING)
  const labelTextHeight = scaled(CASSETTE_LABEL_HEIGHT - CASSETTE_BAND_HEIGHT)
  const sideBadgeSize = scaled(isCentered ? CASSETTE_CENTERED_SIDE_BADGE_SIZE : CASSETTE_SIDE_BADGE_SIZE)
  const sideBadgeGap = scaled(isCentered ? 14 : 26)
  const headlineWidth = isCentered ? labelWidth - labelPadding * 2 : labelWidth - labelPadding * 2 - sideBadgeSize - sideBadgeGap
  const headlineSize = scaled(slide.headline.length > CASSETTE_LONG_HEADLINE_LENGTH ? 50 : 58)
  const screwInset = scaled(CASSETTE_SCREW_INSET)
  const stripeColor = mixtapeStripeColor(colors.accent)
  const stripeTextColor = readableTextColorFor(stripeColor) === "#17121b" ? MIXTAPE_PAPER_COLORS.text : MIXTAPE_PAPER_COLORS.background
  const bandCaption: CSSProperties = { display: "flex", width: scaled(120), fontSize: scaled(24), fontWeight: 700, letterSpacing: scaled(3), color: stripeTextColor }

  const sideBadge = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: sideBadgeSize,
        height: sideBadgeSize,
        borderRadius: sideBadgeSize / 2,
        backgroundColor: MIXTAPE_PAPER_COLORS.text,
        color: MIXTAPE_PAPER_COLORS.background,
        fontSize: Math.round(sideBadgeSize * 0.58),
        fontWeight: 700,
      }}
    >
      A
    </div>
  )
  const mixtapeCaption = (
    <div style={{ display: "flex", fontSize: scaled(21), fontWeight: 700, letterSpacing: scaled(4), color: MIXTAPE_PAPER_COLORS.mutedText }}>
      {`MIXTAPE · ${peekingAlbums.length} ${peekingAlbums.length === 1 ? "DISCO" : "DISCOS"}`}
    </div>
  )
  const labelHeadline = (
    <Headline
      slide={slide}
      typography={typography}
      baseSize={headlineSize}
      lineHeight={1.04}
      style={{ width: headlineWidth, ...(isCentered ? { justifyContent: "center" } : {}) }}
    >
      {slide.headline}
    </Headline>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      <div style={{ display: "flex", position: "relative", width: cassetteWidth, height: coverPeek + cassetteHeight }}>
        {peekingAlbums.map((album, index) => (
          <CoverArt
            key={album?.id ?? index}
            album={album}
            size={coverSize}
            colors={colors}
            cornerRadiusPercent={slide.albumCoverRadius}
            style={{
              position: "absolute",
              left: firstCoverLeft + coverSpacing * index,
              top: index % 2 === 0 ? scaled(10) : 0,
              transform: `rotate(${cassettePeekingCoverTilt(index, peekingAlbums.length)}deg)`,
            }}
          />
        ))}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            top: coverPeek,
            width: cassetteWidth,
            height: cassetteHeight,
            borderRadius: scaled(CASSETTE_CORNER_RADIUS),
            overflow: "hidden",
            backgroundColor: CASSETTE_SHELL_COLORS.middle,
            backgroundImage: `linear-gradient(180deg, ${CASSETTE_SHELL_COLORS.top} 0%, ${CASSETTE_SHELL_COLORS.middle} 40%, ${CASSETTE_SHELL_COLORS.bottom} 76%, ${CASSETTE_SHELL_COLORS.bottom} 100%)`,
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
          }}
        >
          <CassetteFoot scaled={scaled} />
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: scaled(8),
              top: scaled(8),
              width: cassetteWidth - scaled(16),
              height: cassetteHeight - scaled(16),
              borderRadius: scaled(CASSETTE_CORNER_RADIUS - 8),
              border: "2px solid rgba(255, 255, 255, 0.06)",
            }}
          />
          <CassetteScrew centerX={screwInset} centerY={screwInset} scaled={scaled} />
          <CassetteScrew centerX={cassetteWidth - screwInset} centerY={screwInset} scaled={scaled} />
          <CassetteScrew centerX={screwInset} centerY={cassetteHeight - screwInset} scaled={scaled} />
          <CassetteScrew centerX={cassetteWidth - screwInset} centerY={cassetteHeight - screwInset} scaled={scaled} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              left: scaled(CASSETTE_LABEL_INSET),
              top: scaled(CASSETTE_LABEL_INSET),
              width: labelWidth,
              height: scaled(CASSETTE_LABEL_HEIGHT),
              borderRadius: scaled(16),
              overflow: "hidden",
              backgroundColor: MIXTAPE_PAPER_COLORS.background,
              color: MIXTAPE_PAPER_COLORS.text,
            }}
          >
            {isCentered ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: labelTextHeight,
                  padding: `0 ${labelPadding}px`,
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: scaled(12) }}>
                  {sideBadge}
                  <div style={{ display: "flex", marginLeft: sideBadgeGap }}>{mixtapeCaption}</div>
                </div>
                {labelHeadline}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", height: labelTextHeight, padding: `0 ${labelPadding}px`, textAlign: "left" }}>
                <div style={{ display: "flex", marginRight: sideBadgeGap }}>{sideBadge}</div>
                <div style={{ display: "flex", flexDirection: "column", width: headlineWidth }}>
                  <div style={{ display: "flex", marginBottom: scaled(8) }}>{mixtapeCaption}</div>
                  {labelHeadline}
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", height: scaled(CASSETTE_BAND_HEIGHT), backgroundColor: stripeColor }}>
              <div style={{ display: "flex", height: scaled(8), backgroundColor: "rgba(0, 0, 0, 0.16)" }} />
              <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "space-between", padding: `0 ${scaled(30)}px` }}>
                <div style={bandCaption}>C-90</div>
                <CassetteWindow scaled={scaled} />
                <div style={{ ...bandCaption, justifyContent: "flex-end" }}>STEREO</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BodyText
        text={slide.body}
        typography={typography}
        alignment={slide.textAlign}
        style={{ fontSize: 34, lineHeight: 1.3, marginTop: 40, color: colors.mutedText }}
      />
    </div>
  )
}

function TapedAlbum({ slide, album, colors, typography }: { slide: StudioSlide; album: SlideCanvasAlbum | undefined; colors: SlideColors; typography: SlideTypography }) {
  const coverSize = slide.body.length > 140 ? 480 : 560
  const tapeWidth = Math.round(coverSize * 0.34)
  const title = slide.headline || album?.title || ""
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: CONTENT_WIDTH, textAlign: "center" }}>
      <div style={{ display: "flex", position: "relative", width: coverSize + 60, height: coverSize + 40 }}>
        <CoverArt
          album={album}
          size={coverSize}
          colors={colors}
          cornerRadiusPercent={slide.albumCoverRadius}
          style={{ position: "absolute", left: 30, top: 20, transform: "rotate(-2deg)" }}
        />
        <MaskingTape width={tapeWidth} angleDegrees={-38} style={{ left: -6, top: 30 }} />
        <MaskingTape width={tapeWidth} angleDegrees={36} style={{ left: coverSize + 66 - tapeWidth, top: 22 }} />
      </div>
      <Headline slide={slide} typography={typography} baseSize={60} lineHeight={1.08} style={{ marginTop: 44, justifyContent: "center" }}>{title}</Headline>
      <AlbumByline album={album} colors={colors} fontSize={32} />
      <BodyText text={slide.body} typography={typography} alignment="center" style={{ fontSize: 30, lineHeight: 1.36, marginTop: 24 }} />
      <SourceNote slide={slide} colors={colors} />
    </div>
  )
}

const JCARD_PADDING = 48
const JCARD_COLUMN_GAP = 40
const JCARD_ROW_COVER_SIZE = 72

function JCardTrack({ album, trackNumber, width }: { album: SlideCanvasAlbum | undefined; trackNumber: number; width: number }) {
  const singleLine: CSSProperties = { display: "flex", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }
  const textWidth = width - 52 - JCARD_ROW_COVER_SIZE - 20
  return (
    <div style={{ display: "flex", alignItems: "center", width, paddingTop: 14, paddingBottom: 14, borderBottom: `2px solid ${MIXTAPE_PAPER_RULE}` }}>
      <div style={{ display: "flex", width: 52, fontSize: 26, fontWeight: 700, color: MIXTAPE_PAPER_COLORS.mutedText }}>{String(trackNumber).padStart(2, "0")}</div>
      <CoverArt album={album} size={JCARD_ROW_COVER_SIZE} colors={MIXTAPE_PAPER_COLORS} cornerRadiusPercent={0} hasShadow={false} />
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 20, width: textWidth, textAlign: "left" }}>
        <div style={{ ...singleLine, width: textWidth, fontSize: 27, fontWeight: 700, lineHeight: 1.2 }}>{album?.title ?? "Álbum removido"}</div>
        <div style={{ ...singleLine, width: textWidth, fontSize: 22, marginTop: 4, color: MIXTAPE_PAPER_COLORS.mutedText }}>
          {album ? album.artistNames.join(", ") : ""}
        </div>
      </div>
    </div>
  )
}

// The list as a cassette insert: side A on the left, side B on the right.
function JCardTracklist({ slide, slideAlbums, colors, typography }: { slide: StudioSlide; slideAlbums: (SlideCanvasAlbum | undefined)[]; colors: SlideColors; typography: SlideTypography }) {
  const hasTwoSides = slideAlbums.length > 4
  const sideAEnd = hasTwoSides ? Math.ceil(slideAlbums.length / 2) : slideAlbums.length
  const sides = hasTwoSides
    ? [
        { label: "LADO A", albums: slideAlbums.slice(0, sideAEnd), firstTrack: 1 },
        { label: "LADO B", albums: slideAlbums.slice(sideAEnd), firstTrack: sideAEnd + 1 },
      ]
    : [{ label: "LADO A", albums: slideAlbums, firstTrack: 1 }]
  const innerWidth = CONTENT_WIDTH - JCARD_PADDING * 2
  const columnWidth = hasTwoSides ? (innerWidth - JCARD_COLUMN_GAP) / 2 : innerWidth
  const stripeColor = mixtapeStripeColor(colors.accent)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CONTENT_WIDTH,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: MIXTAPE_PAPER_COLORS.background,
        color: MIXTAPE_PAPER_COLORS.text,
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
      }}
    >
      <div style={{ display: "flex", width: CONTENT_WIDTH, height: 20, backgroundColor: stripeColor }} />
      <div style={{ display: "flex", flexDirection: "column", padding: `36px ${JCARD_PADDING}px ${JCARD_PADDING}px`, textAlign: "left" }}>
        {slide.headline ? (
          <Headline slide={{ ...slide, textAlign: "left" }} typography={typography} baseSize={58} style={{ marginBottom: 28 }}>{slide.headline}</Headline>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", width: innerWidth }}>
          {sides.map((side) => (
            <div key={side.label} style={{ display: "flex", flexDirection: "column", width: columnWidth }}>
              <div style={{ display: "flex", paddingBottom: 12, borderBottom: `3px solid ${MIXTAPE_PAPER_COLORS.text}` }}>
                <SideLabel side={side.label} colors={{ ...MIXTAPE_PAPER_COLORS, accent: stripeColor }} />
              </div>
              {side.albums.map((album, index) => (
                <JCardTrack key={album?.id ?? index} album={album} trackNumber={side.firstTrack + index} width={columnWidth} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const NOTEBOOK_LINE_SPACING = 58
const NOTEBOOK_MARGIN_LINE_LEFT = 56

// Liner notes on a page torn from a notebook. Rotating this card is safe
// because it holds only text (Satori can't rotate images inside it).
function NotebookPage({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", position: "relative", width: CONTENT_WIDTH, paddingTop: 24 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: CONTENT_WIDTH,
          padding: `76px 60px 64px ${NOTEBOOK_MARGIN_LINE_LEFT + 40}px`,
          backgroundColor: MIXTAPE_PAPER_COLORS.background,
          backgroundImage: `repeating-linear-gradient(180deg, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0) ${NOTEBOOK_LINE_SPACING - 2}px, ${MIXTAPE_PAPER_RULE} ${NOTEBOOK_LINE_SPACING - 2}px, ${MIXTAPE_PAPER_RULE} ${NOTEBOOK_LINE_SPACING}px)`,
          color: MIXTAPE_PAPER_COLORS.text,
          transform: "rotate(-1.5deg)",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: NOTEBOOK_MARGIN_LINE_LEFT,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: hexToRgba(MIXTAPE_PAPER_COLORS.accent, 0.55),
          }}
        />
        {children}
      </div>
      <MaskingTape width={220} angleDegrees={-4} style={{ left: (CONTENT_WIDTH - 220) / 2, top: 0 }} />
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

type SingleAlbumBodyProps = {
  slide: StudioSlide
  album: SlideCanvasAlbum | undefined
  colors: SlideColors
  isCentered: boolean
  composition: SlideComposition
  typography: SlideTypography
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

function SingleAlbumBody({ slide, album, colors, isCentered, composition, typography }: SingleAlbumBodyProps) {
  const radius = slide.albumCoverRadius
  const title = slide.headline || album?.title || ""
  const body = (
    <BodyText text={slide.body} typography={typography} alignment={slide.textAlign} style={{ fontSize: 32, lineHeight: 1.36, marginTop: 28 }} />
  )

  if (composition === "taped") {
    return <TapedAlbum slide={slide} album={album} colors={colors} typography={typography} />
  }

  if (composition === "side") {
    const coverSize = 420
    return (
      <div style={{ display: "flex", alignItems: "center", width: CONTENT_WIDTH }}>
        <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 52, width: CONTENT_WIDTH - coverSize - 52, textAlign: "left" }}>
          <Headline slide={slide} typography={typography} baseSize={52}>{title}</Headline>
          <AlbumByline album={album} colors={colors} fontSize={30} />
          <BodyText text={slide.body} typography={typography} alignment="left" style={{ fontSize: 28, lineHeight: 1.36, marginTop: 24 }} />
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
        <Headline slide={slide} typography={typography} baseSize={58} style={{ marginTop: 48 }}>{title}</Headline>
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
        <Headline slide={slide} typography={typography} baseSize={64} style={{ marginTop: 44, justifyContent: "center" }}>{title}</Headline>
        <AlbumByline album={album} colors={colors} fontSize={30} />
        <BodyText text={slide.body} typography={typography} alignment="center" style={{ fontSize: 28, lineHeight: 1.36, marginTop: 20 }} />
        <SourceNote slide={slide} colors={colors} />
      </div>
    )
  }

  const coverSize = slide.body.length > 140 ? 500 : 580
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      <CoverArt album={album} size={coverSize} colors={colors} cornerRadiusPercent={radius} />
      <Headline slide={slide} typography={typography} baseSize={58} lineHeight={1.08} style={{ marginTop: 48 }}>{title}</Headline>
      <AlbumByline album={album} colors={colors} fontSize={34} />
      {body}
      <SourceNote slide={slide} colors={colors} />
    </div>
  )
}

function RankedAlbumBody({ slide, album, colors, isCentered, composition, typography }: SingleAlbumBodyProps) {
  const radius = slide.albumCoverRadius
  const rankText = slide.rankNumber === null ? "" : String(slide.rankNumber)
  const title = slide.headline || album?.title || ""
  const textBlock = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      <Headline slide={slide} typography={typography} baseSize={58} lineHeight={1.08} style={{ marginTop: 48 }}>{title}</Headline>
      <AlbumByline album={album} colors={colors} fontSize={32} />
      <BodyText text={slide.body} typography={typography} alignment={slide.textAlign} style={{ fontSize: 32, lineHeight: 1.36, marginTop: 26 }} />
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
          <Headline slide={slide} typography={typography} baseSize={48} style={{ marginTop: 24 }}>{title}</Headline>
          <AlbumByline album={album} colors={colors} fontSize={28} />
          <BodyText text={slide.body} typography={typography} alignment="left" style={{ fontSize: 27, lineHeight: 1.36, marginTop: 20 }} />
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
  labelFontFamily,
}: {
  slide: StudioSlide
  album: SlideCanvasAlbum | undefined
  label: string
  colors: SlideColors
  alignment: "left" | "right"
  labelFontFamily: string
}) {
  const itemAlignment = alignment === "right" ? "flex-end" : "flex-start"
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: itemAlignment, textAlign: alignment }}>
      <Kicker slide={{ ...slide, kicker: label }} colors={colors} fontFamily={labelFontFamily} />
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
  typography,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  composition: SlideComposition
  typography: SlideTypography
}) {
  if (composition === "from-to" || composition === "from-to-mirrored") {
    return (
      <AlbumPairFromToBody
        slide={slide}
        slideAlbums={slideAlbums}
        colors={colors}
        firstCoverIsOnRight={composition === "from-to"}
        typography={typography}
      />
    )
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
          <AlbumPairCaption slide={slide} album={slideAlbums[0]} label={slide.kicker} colors={colors} alignment={referenceSide} labelFontFamily={typography.kicker} />
        </div>
        <div style={{ display: "flex", position: "absolute", bottom: 0, [referenceSide]: 0, width: captionWidth, justifyContent: referenceCoverIsOnRight ? "flex-start" : "flex-end" }}>
          <AlbumPairCaption slide={slide} album={slideAlbums[1]} label={slide.headline} colors={colors} alignment={recommendationSide} labelFontFamily={typography.headline} />
        </div>
      </div>
      {hasBody ? (
        <BodyText
          text={slide.body}
          typography={typography}
          alignment="left"
          style={{ fontSize: 30, lineHeight: 1.36, marginTop: 48, color: colors.mutedText }}
        />
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
  wordFontFamily,
  wordColor,
  colors,
  coverSize,
  coverIsOnRight,
}: {
  slide: StudioSlide
  album: SlideCanvasAlbum | undefined
  word: string
  wordFontFamily: string
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
          fontFamily: wordFontFamily,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -Math.round(wordFontSize * 0.045),
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          color: wordColor,
          ...(slide.showPairWordShadow ? { textShadow: `0 8px 40px ${hexToRgba(colors.background, 0.7)}` } : {}),
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
  typography,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  firstCoverIsOnRight: boolean
  typography: SlideTypography
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
        wordFontFamily={typography.kicker}
        wordColor={slide.firstPairWordHex ?? colors.text}
        colors={colors}
        coverSize={coverSize}
        coverIsOnRight={firstCoverIsOnRight}
      />
      <div style={{ display: "flex", height: rowGap }} />
      <AlbumPairFromToRow
        slide={slide}
        album={slideAlbums[1]}
        word={slide.headline}
        wordFontFamily={typography.headline}
        wordColor={slide.secondPairWordHex ?? colors.accent}
        colors={colors}
        coverSize={coverSize}
        coverIsOnRight={!firstCoverIsOnRight}
      />
      {hasBody ? (
        <BodyText
          text={slide.body}
          typography={typography}
          alignment="left"
          style={{ fontSize: 30, lineHeight: 1.36, marginTop: 48, color: colors.mutedText }}
        />
      ) : null}
    </div>
  )
}

function AlbumGridBody({
  slide,
  slideAlbums,
  carouselAlbums,
  colors,
  isCentered,
  composition,
  typography,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  carouselAlbums: SlideCanvasAlbum[]
  colors: SlideColors
  isCentered: boolean
  composition: SlideComposition
  typography: SlideTypography
}) {
  if (composition === "swatch-cards") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", width: "100%" }}>
        {slide.headline ? (
          <Headline slide={slide} typography={typography} baseSize={64} style={{ marginBottom: 40 }}>{slide.headline}</Headline>
        ) : null}
        <SwatchCardGrid
          slideAlbums={slideAlbums}
          carouselAlbums={carouselAlbums}
          cornerRadiusPercent={slide.albumCoverRadius}
          isCentered={isCentered}
        />
      </div>
    )
  }

  const isDuel = slideAlbums.length === 2
  const isTight = composition === "tight"
  const columnGap = isTight ? 0 : isDuel ? 64 : 40
  const coverSize = isTight ? (isDuel ? CONTENT_WIDTH / 2 : 360) : isDuel ? (CONTENT_WIDTH - columnGap) / 2 : 360

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", width: "100%" }}>
      {slide.headline ? (
        <Headline slide={slide} typography={typography} baseSize={64} style={{ marginBottom: 44 }}>{slide.headline}</Headline>
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
              hasShadow={false}
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
  typography,
}: {
  slide: StudioSlide
  slideAlbums: (SlideCanvasAlbum | undefined)[]
  colors: SlideColors
  composition: SlideComposition
  typography: SlideTypography
}) {
  if (composition === "j-card") {
    return <JCardTracklist slide={slide} slideAlbums={slideAlbums} colors={colors} typography={typography} />
  }

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
        <Headline slide={slide} typography={typography} baseSize={60} style={{ marginBottom: 40 }}>{slide.headline}</Headline>
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
            hasShadow={!isCards}
            style={isCards ? undefined : { boxShadow: "0 12px 28px rgba(0, 0, 0, 0.32)" }}
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
