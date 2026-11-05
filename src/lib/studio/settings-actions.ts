"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { HIGHLIGHT_FONT_KEYS, type HighlightFontKey } from "@/lib/studio/highlight-fonts"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { saveHighlightFontKey } from "@/lib/studio/settings"

const highlightFontKeySchema = z.enum(HIGHLIGHT_FONT_KEYS)

export async function saveHighlightFontAction(fontKey: HighlightFontKey): Promise<void> {
  await requireStudioAdmin()
  await saveHighlightFontKey(highlightFontKeySchema.parse(fontKey))
  revalidatePath("/studio", "layout")
}
