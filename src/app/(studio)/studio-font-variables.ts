import { Chewy } from "next/font/google"

// Live-preview copy of Chewy (src/lib/studio/studio-fonts.ts). Not preloaded:
// the browser only downloads it once a slide actually uses it.
const chewy = Chewy({ weight: "400", subsets: ["latin"], variable: "--font-studio-chewy", preload: false })

export const studioFontVariableClassNames = chewy.variable
