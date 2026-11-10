"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { studioPostPresets } from "@/lib/db/schema"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { extractSlideStyles, studioSlidesSchema } from "@/lib/studio/slides"
import { findStudioTemplate } from "@/lib/studio/templates"

export type SavePostPresetResult = { success: true; presetName: string } | { success: false; error: string }

const MAX_PRESET_NAME_LENGTH = 60

const presetNameSchema = z
  .string()
  .trim()
  .min(1, "Dê um nome à pré-definição.")
  .max(MAX_PRESET_NAME_LENGTH, `Use até ${MAX_PRESET_NAME_LENGTH} caracteres.`)

function revalidatePresetPages(templateKey: string) {
  revalidatePath(`/studio/create/${templateKey}`)
  revalidatePath("/studio/posts/[postId]", "page")
}

// Saving again with a name that already exists for the template replaces
// that preset, so a look can be refined without piling up copies.
export async function savePostPresetAction(templateKey: string, name: unknown, slides: unknown): Promise<SavePostPresetResult> {
  const admin = await requireStudioAdmin()
  if (!findStudioTemplate(templateKey)) return { success: false, error: "Formato não encontrado." }

  const parsedName = presetNameSchema.safeParse(name)
  if (!parsedName.success) return { success: false, error: parsedName.error.issues[0]?.message ?? "Nome inválido." }

  const parsedSlides = studioSlidesSchema.safeParse(slides)
  if (!parsedSlides.success) return { success: false, error: "Os slides desta publicação estão inválidos." }

  const slideStyles = extractSlideStyles(parsedSlides.data)
  await db
    .insert(studioPostPresets)
    .values({ name: parsedName.data, templateKey, slideStyles, createdByUserId: admin.userId })
    .onConflictDoUpdate({
      target: [studioPostPresets.templateKey, studioPostPresets.name],
      set: { slideStyles, updatedAt: new Date() },
    })

  revalidatePresetPages(templateKey)
  return { success: true, presetName: parsedName.data }
}

export async function deletePostPresetAction(presetId: string): Promise<void> {
  await requireStudioAdmin()
  const [deletedPreset] = await db
    .delete(studioPostPresets)
    .where(eq(studioPostPresets.id, presetId))
    .returning({ templateKey: studioPostPresets.templateKey })
  if (deletedPreset) revalidatePresetPages(deletedPreset.templateKey)
}
