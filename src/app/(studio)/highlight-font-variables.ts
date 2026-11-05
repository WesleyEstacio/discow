import { Bebas_Neue, Caveat, Pacifico, Permanent_Marker, Playfair_Display, Space_Mono } from "next/font/google"

// Live-preview copies of the highlight fonts (src/lib/studio/highlight-fonts.ts).
// Not preloaded: the browser only downloads the one a slide actually uses.
const playfairDisplay = Playfair_Display({ weight: "700", style: "italic", subsets: ["latin"], variable: "--font-highlight-playfair", preload: false })
const caveat = Caveat({ weight: "700", subsets: ["latin"], variable: "--font-highlight-caveat", preload: false })
const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-highlight-marker", preload: false })
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-highlight-bebas", preload: false })
const spaceMono = Space_Mono({ weight: "700", style: "italic", subsets: ["latin"], variable: "--font-highlight-space-mono", preload: false })
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-highlight-pacifico", preload: false })

export const highlightFontVariableClassNames = [playfairDisplay, caveat, permanentMarker, bebasNeue, spaceMono, pacifico]
  .map((font) => font.variable)
  .join(" ")
