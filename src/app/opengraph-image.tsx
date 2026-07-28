import { ImageResponse } from "next/og"
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Default share-preview image for every route that doesn't define its own
// (e.g. album pages generate one from the album cover instead). Colors are
// the dark-theme brand palette from globals.css.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(135deg, #14121a 0%, #221830 55%, #2d1a35 100%)",
          color: "#f7f5fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "linear-gradient(135deg, #ec4899, #f472b6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 46,
              fontWeight: 700,
              color: "#1a1020",
            }}
          >
            D
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -1 }}>{SITE_NAME}</div>
        </div>
        <div style={{ fontSize: 30, color: "#c9c3d4", maxWidth: 860, textAlign: "center" }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size
  )
}
