import "server-only"
import { eq } from "drizzle-orm"
import { cache } from "react"
import { db } from "@/lib/db"
import { studioSettings } from "@/lib/db/schema"
import { DEFAULT_HIGHLIGHT_FONT_KEY, isHighlightFontKey, type HighlightFontKey } from "@/lib/studio/highlight-fonts"

const HIGHLIGHT_FONT_SETTING_KEY = "highlightFontKey"

export const getHighlightFontKey = cache(async (): Promise<HighlightFontKey> => {
  const [storedSetting] = await db
    .select({ value: studioSettings.value })
    .from(studioSettings)
    .where(eq(studioSettings.key, HIGHLIGHT_FONT_SETTING_KEY))
    .limit(1)
  return storedSetting && isHighlightFontKey(storedSetting.value) ? storedSetting.value : DEFAULT_HIGHLIGHT_FONT_KEY
})

export async function saveHighlightFontKey(fontKey: HighlightFontKey): Promise<void> {
  await db
    .insert(studioSettings)
    .values({ key: HIGHLIGHT_FONT_SETTING_KEY, value: fontKey })
    .onConflictDoUpdate({ target: studioSettings.key, set: { value: fontKey, updatedAt: new Date() } })
}
