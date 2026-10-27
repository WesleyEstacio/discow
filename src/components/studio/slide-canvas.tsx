import type { StudioCoverSource } from "@/lib/db/schema"
import {
  resolveSlideColors,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type SlideColors,
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

type SlideCanvasProps = {
  slide: StudioSlide
  albumsById: Record<string, SlideCanvasAlbum>
  slideNumber: number
  slideCount: number
  fontFamily: string
}

const PAGE_PADDING = 88

const COVER_CREDIT_LABELS: Partial<Record<StudioCoverSource, string>> = {
  spotify: "Spotify",
  "cover-art-archive": "Cover Art Archive",
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

export function SlideCanvas({ slide, albumsById, slideNumber, slideCount, fontFamily }: SlideCanvasProps) {
  const colors = resolveSlideColors(slide)
  const slideAlbums = slide.albumIds.map((albumId) => albumsById[albumId])
  const isCentered = slide.textAlign === "center"

  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: PAGE_PADDING,
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 40 }}>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: colors.accent,
          }}
        >
          {slide.kicker}
        </div>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: colors.mutedText }}>
          discows
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          paddingTop: 48,
          paddingBottom: 48,
          justifyContent: slide.layout === "cover" ? "flex-end" : "center",
          alignItems: isCentered ? "center" : "flex-start",
          textAlign: isCentered ? "center" : "left",
        }}
      >
        <SlideBody slide={slide} slideAlbums={slideAlbums} colors={colors} isCentered={isCentered} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 32,
          fontSize: 22,
          color: colors.mutedText,
        }}
      >
        <div style={{ display: "flex", letterSpacing: 2 }}>
          {`${formatSlideNumber(slideNumber)} / ${formatSlideNumber(slideCount)}`}
        </div>
        <div style={{ display: "flex" }}>{buildCoverCredit(slideAlbums)}</div>
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

function SlideBody({ slide, slideAlbums, colors, isCentered }: SlideBodyProps) {
  switch (slide.layout) {
    case "cover":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
          <div style={{ display: "flex", width: 120, height: 10, backgroundColor: colors.accent, marginBottom: 48 }} />
          <div style={{ display: "flex", fontSize: 104, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>
            {slide.headline}
          </div>
          {slide.body ? (
            <div style={{ display: "flex", fontSize: 38, lineHeight: 1.3, marginTop: 40, color: colors.mutedText }}>
              {slide.body}
            </div>
          ) : null}
        </div>
      )
    case "album":
      return <SingleAlbumBody slide={slide} album={slideAlbums[0]} colors={colors} isCentered={isCentered} />
    case "album-grid":
      return <AlbumGridBody slide={slide} slideAlbums={slideAlbums} colors={colors} isCentered={isCentered} />
    case "text":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2 }}>
            {slide.headline}
          </div>
          {slide.body ? (
            <div style={{ display: "flex", fontSize: 40, lineHeight: 1.38, marginTop: 44, whiteSpace: "pre-wrap" }}>
              {slide.body}
            </div>
          ) : null}
        </div>
      )
    case "cta":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2.5 }}>
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
              marginTop: 64,
              padding: "18px 40px",
              borderRadius: 999,
              border: `3px solid ${colors.text}`,
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

function CoverArt({ album, size, colors }: { album: SlideCanvasAlbum | undefined; size: number; colors: SlideColors }) {
  if (!album?.coverImageUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${colors.mutedText}`,
          color: colors.mutedText,
          fontSize: Math.round(size / 14),
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
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  )
}

function SingleAlbumBody({
  slide,
  album,
  colors,
  isCentered,
}: {
  slide: StudioSlide
  album: SlideCanvasAlbum | undefined
  colors: SlideColors
  isCentered: boolean
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start" }}>
      <CoverArt album={album} size={560} colors={colors} />
      <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, marginTop: 44 }}>
        {slide.headline || album?.title || ""}
      </div>
      {album ? (
        <div style={{ display: "flex", fontSize: 34, marginTop: 12, color: colors.mutedText }}>
          {`${album.artistNames.join(", ")}${album.releaseYear ? ` · ${album.releaseYear}` : ""}`}
        </div>
      ) : null}
      {slide.body ? (
        <div style={{ display: "flex", fontSize: 32, lineHeight: 1.36, marginTop: 28 }}>{slide.body}</div>
      ) : null}
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
  const coverSize = 360
  const columnGap = 40

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isCentered ? "center" : "flex-start", width: "100%" }}>
      {slide.headline ? (
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.06, letterSpacing: -1.5, marginBottom: 40 }}>
          {slide.headline}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: coverSize * 2 + columnGap,
          columnGap,
          rowGap: 32,
          justifyContent: isCentered ? "center" : "flex-start",
        }}
      >
        {slideAlbums.map((album, index) => (
          <div key={album?.id ?? index} style={{ display: "flex", flexDirection: "column", width: coverSize }}>
            <CoverArt album={album} size={coverSize} colors={colors} />
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 700,
                marginTop: 14,
                lineHeight: 1.15,
                overflow: "hidden",
                maxHeight: 30,
              }}
            >
              {album?.title ?? ""}
            </div>
            <div style={{ display: "flex", fontSize: 22, marginTop: 4, color: colors.mutedText, overflow: "hidden", maxHeight: 28 }}>
              {album ? album.artistNames.join(", ") : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
