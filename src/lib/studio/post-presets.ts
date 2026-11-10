import "server-only"
import { and, asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { studioPostPresets } from "@/lib/db/schema"
import { resolveSlideColors, studioSlideStylesSchema, type StudioSlideStyle } from "@/lib/studio/slides"

const MAX_PRESET_SWATCHES = 8

export type PostPresetSummary = {
  id: string
  name: string
  slideBackgroundColors: string[]
}

export async function listPostPresetSummaries(templateKey: string): Promise<PostPresetSummary[]> {
  const presetRows = await db
    .select({ id: studioPostPresets.id, name: studioPostPresets.name, slideStyles: studioPostPresets.slideStyles })
    .from(studioPostPresets)
    .where(eq(studioPostPresets.templateKey, templateKey))
    .orderBy(asc(studioPostPresets.name))

  return presetRows.flatMap((presetRow) => {
    const parsedStyles = studioSlideStylesSchema.safeParse(presetRow.slideStyles)
    if (!parsedStyles.success) return []
    return [
      {
        id: presetRow.id,
        name: presetRow.name,
        slideBackgroundColors: parsedStyles.data.slice(0, MAX_PRESET_SWATCHES).map((style) => resolveSlideColors(style).background),
      },
    ]
  })
}

export async function getPostPresetStyles(presetId: string, templateKey: string): Promise<StudioSlideStyle[] | null> {
  const [presetRow] = await db
    .select({ slideStyles: studioPostPresets.slideStyles })
    .from(studioPostPresets)
    .where(and(eq(studioPostPresets.id, presetId), eq(studioPostPresets.templateKey, templateKey)))
    .limit(1)
  if (!presetRow) return null

  const parsedStyles = studioSlideStylesSchema.safeParse(presetRow.slideStyles)
  return parsedStyles.success ? parsedStyles.data : null
}
