"use server"

import { sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { studioTemplatePreferences } from "@/lib/db/schema"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { isTemplateTag } from "@/lib/studio/template-tags"
import { findStudioTemplate, STUDIO_TEMPLATES } from "@/lib/studio/templates"

export type TemplatePreferenceActionResult = { success: true } | { success: false; error: string }

function isCompleteTemplateOrder(orderedTemplateKeys: unknown): orderedTemplateKeys is string[] {
  if (!Array.isArray(orderedTemplateKeys) || orderedTemplateKeys.length !== STUDIO_TEMPLATES.length) return false
  const receivedKeys = new Set(orderedTemplateKeys)
  return receivedKeys.size === STUDIO_TEMPLATES.length && STUDIO_TEMPLATES.every((template) => receivedKeys.has(template.key))
}

export async function reorderTemplatesAction(orderedTemplateKeys: string[]): Promise<TemplatePreferenceActionResult> {
  await requireStudioAdmin()
  if (!isCompleteTemplateOrder(orderedTemplateKeys)) {
    return { success: false, error: "A lista de formatos mudou. Recarregue a página e tente de novo." }
  }

  const updatedAt = new Date()
  await db
    .insert(studioTemplatePreferences)
    .values(orderedTemplateKeys.map((templateKey, listPosition) => ({ templateKey, listPosition, updatedAt })))
    .onConflictDoUpdate({
      target: studioTemplatePreferences.templateKey,
      set: { listPosition: sql`excluded.list_position`, updatedAt },
    })

  revalidatePath("/studio/create")
  return { success: true }
}

export async function updateTemplateTagAction(templateKey: string, tag: string | null): Promise<TemplatePreferenceActionResult> {
  await requireStudioAdmin()
  if (!findStudioTemplate(templateKey)) return { success: false, error: "Formato não encontrado." }
  if (tag !== null && !isTemplateTag(tag)) return { success: false, error: "Tag inválida." }

  const templateIndex = STUDIO_TEMPLATES.findIndex((template) => template.key === templateKey)
  const updatedAt = new Date()
  await db
    .insert(studioTemplatePreferences)
    .values({ templateKey, tag, listPosition: STUDIO_TEMPLATES.length + templateIndex, updatedAt })
    .onConflictDoUpdate({ target: studioTemplatePreferences.templateKey, set: { tag, updatedAt } })

  revalidatePath("/studio/create")
  return { success: true }
}
