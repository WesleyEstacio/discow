"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { studioPosts } from "@/lib/db/schema"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { getStudioAlbumsByIds } from "@/lib/studio/albums"
import { isDefaultBackgroundImage } from "@/lib/studio/background-images"
import { scheduledDateToTimestamp, studioPostDraftSchema } from "@/lib/studio/post-input"
import { isPostLanguage, isPostStatus, type PostStatus } from "@/lib/studio/post-status"
import { getPostPresetStyles } from "@/lib/studio/post-presets"
import { applySlideStyles, DEFAULT_BACKGROUND_IMAGE_SETTINGS, type StudioSlide, type StudioSlideStyle } from "@/lib/studio/slides"
import { findStudioTemplate } from "@/lib/studio/templates"
import { createVariantSeed } from "@/lib/studio/templates/template-helpers"
import type { StudioTemplate, TemplateAlbum } from "@/lib/studio/templates/types"
import {
  applyVisualIdentity,
  findVisualIdentity,
  pickRandomVisualIdentity,
  SURPRISE_IDENTITY_KEY,
  type VisualIdentity,
} from "@/lib/studio/visual-identities"

export type CreatePostFormState = { message: string | null }

export type SavePostResult =
  | { success: true; savedAt: string }
  | { success: false; error: string }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

async function applyChosenDefaultBackground(slides: StudioSlide[], formValue: FormDataEntryValue | null): Promise<StudioSlide[]> {
  const imageId = typeof formValue === "string" ? formValue : ""
  if (!UUID_PATTERN.test(imageId) || !(await isDefaultBackgroundImage(imageId))) return slides
  return slides.map((slide) => ({ ...slide, backgroundImage: { ...DEFAULT_BACKGROUND_IMAGE_SETTINGS, imageId } }))
}

function resolveChosenIdentity(template: StudioTemplate, formValue: FormDataEntryValue | null): VisualIdentity {
  const chosenKey = typeof formValue === "string" ? formValue : ""
  if (chosenKey === SURPRISE_IDENTITY_KEY) return pickRandomVisualIdentity()
  return findVisualIdentity(chosenKey) ?? findVisualIdentity(template.defaultIdentityKey) ?? pickRandomVisualIdentity()
}

async function findChosenPresetStyles(template: StudioTemplate, formValue: FormDataEntryValue | null): Promise<StudioSlideStyle[] | null> {
  const presetId = typeof formValue === "string" ? formValue : ""
  if (!UUID_PATTERN.test(presetId)) return null
  return getPostPresetStyles(presetId, template.key)
}

function revalidateStudioPosts(postId?: string) {
  revalidatePath("/studio")
  revalidatePath("/studio/posts")
  if (postId) revalidatePath(`/studio/posts/${postId}`)
}

export async function createPostFromTemplateAction(
  templateKey: string,
  _previousState: CreatePostFormState,
  formData: FormData
): Promise<CreatePostFormState> {
  const admin = await requireStudioAdmin()
  const template = findStudioTemplate(templateKey)
  if (!template) return { message: "Modelo não encontrado." }

  const languageValue = String(formData.get("language") ?? "pt")
  const language = isPostLanguage(languageValue) ? languageValue : "pt"

  const selectedAlbumIdsBySlot = Object.fromEntries(
    template.albumSlots.map((slot) => [
      slot.key,
      [...new Set(formData.getAll(`slot:${slot.key}`).map(String))].slice(0, slot.maxAlbums),
    ])
  )
  for (const slot of template.albumSlots) {
    if ((selectedAlbumIdsBySlot[slot.key]?.length ?? 0) < slot.minAlbums) {
      const slotName = slot.group ? `${slot.group.label} · ${slot.label}` : slot.label
      return { message: `Escolha pelo menos ${slot.minAlbums} em "${slotName}".` }
    }
  }

  const settings = Object.fromEntries(
    template.settingFields.map((field) => [field.key, String(formData.get(`setting:${field.key}`) ?? "").trim().slice(0, 300)])
  )
  const missingRequiredField = template.settingFields.find((field) => field.required && !settings[field.key])
  if (missingRequiredField) return { message: `Preencha "${missingRequiredField.label}".` }

  const allSelectedAlbumIds = Object.values(selectedAlbumIdsBySlot).flat()
  const albums = await getStudioAlbumsByIds(allSelectedAlbumIds)
  const albumsById = new Map(albums.map((album) => [album.id, album]))
  const albumsBySlot: Record<string, TemplateAlbum[]> = Object.fromEntries(
    Object.entries(selectedAlbumIdsBySlot).map(([slotKey, albumIds]) => [
      slotKey,
      albumIds.flatMap((albumId) => {
        const album = albumsById.get(albumId)
        return album ? [album] : []
      }),
    ])
  )

  let carousel
  try {
    carousel = template.buildCarousel({ albumsBySlot, settings, language, variantSeed: createVariantSeed() })
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Não foi possível montar o carrossel." }
  }
  const presetStyles = await findChosenPresetStyles(template, formData.get("presetId"))
  const identity = resolveChosenIdentity(template, formData.get("visualIdentity"))
  const slides = presetStyles
    ? applySlideStyles(carousel.slides, presetStyles)
    : await applyChosenDefaultBackground(
        applyVisualIdentity(carousel.slides, identity, { keepCustomBackgrounds: true }),
        formData.get("backgroundImageId")
      )
  const lookSetting: Record<string, string> = presetStyles
    ? { presetId: String(formData.get("presetId")) }
    : { visualIdentity: identity.key }

  const [createdPost] = await db
    .insert(studioPosts)
    .values({
      title: carousel.title,
      templateKey: template.key,
      status: "draft",
      language,
      settings: { ...settings, ...lookSetting },
      slides,
      albumIds: [...new Set(slides.flatMap((slide) => slide.albumIds))],
      caption: carousel.caption,
      createdByUserId: admin.userId,
    })
    .returning({ id: studioPosts.id })

  revalidateStudioPosts()
  redirect(`/studio/posts/${createdPost!.id}`)
}

function publishedAtForStatus(status: PostStatus, currentPublishedAt: Date | null): Date | null {
  if (status !== "published") return null
  return currentPublishedAt ?? new Date()
}

export async function savePostAction(postId: string, draft: unknown): Promise<SavePostResult> {
  await requireStudioAdmin()

  const parsedDraft = studioPostDraftSchema.safeParse(draft)
  if (!parsedDraft.success) {
    return { success: false, error: parsedDraft.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const [currentPost] = await db
    .select({ publishedAt: studioPosts.publishedAt })
    .from(studioPosts)
    .where(eq(studioPosts.id, postId))
    .limit(1)
  if (!currentPost) return { success: false, error: "Esta publicação não existe mais." }

  const values = parsedDraft.data
  const savedAt = new Date()

  await db
    .update(studioPosts)
    .set({
      title: values.title,
      status: values.status,
      language: values.language,
      slides: values.slides,
      albumIds: [...new Set(values.slides.flatMap((slide) => slide.albumIds))],
      caption: values.caption,
      notes: values.notes,
      scheduledFor: scheduledDateToTimestamp(values.scheduledFor),
      publishedAt: publishedAtForStatus(values.status, currentPost.publishedAt),
      updatedAt: savedAt,
    })
    .where(eq(studioPosts.id, postId))

  revalidateStudioPosts(postId)
  return { success: true, savedAt: savedAt.toISOString() }
}

export async function updatePostStatusAction(postId: string, status: string): Promise<void> {
  await requireStudioAdmin()
  if (!isPostStatus(status)) throw new Error("Status inválido")

  const [currentPost] = await db
    .select({ publishedAt: studioPosts.publishedAt, scheduledFor: studioPosts.scheduledFor })
    .from(studioPosts)
    .where(eq(studioPosts.id, postId))
    .limit(1)
  if (!currentPost) return
  if (status === "scheduled" && !currentPost.scheduledFor) {
    throw new Error("Defina a data de publicação no editor antes de marcar como agendada.")
  }

  await db
    .update(studioPosts)
    .set({ status, publishedAt: publishedAtForStatus(status, currentPost.publishedAt), updatedAt: new Date() })
    .where(eq(studioPosts.id, postId))

  revalidateStudioPosts(postId)
}

export async function deletePostAction(postId: string): Promise<void> {
  await requireStudioAdmin()
  await db.delete(studioPosts).where(eq(studioPosts.id, postId))
  revalidateStudioPosts()
  redirect("/studio/posts")
}

export async function duplicatePostAction(postId: string): Promise<void> {
  const admin = await requireStudioAdmin()
  const [originalPost] = await db.select().from(studioPosts).where(eq(studioPosts.id, postId)).limit(1)
  if (!originalPost) return

  const [copiedPost] = await db
    .insert(studioPosts)
    .values({
      title: `${originalPost.title} (cópia)`,
      templateKey: originalPost.templateKey,
      status: "draft",
      language: originalPost.language,
      settings: originalPost.settings,
      slides: originalPost.slides,
      albumIds: originalPost.albumIds,
      caption: originalPost.caption,
      notes: originalPost.notes,
      createdByUserId: admin.userId,
    })
    .returning({ id: studioPosts.id })

  revalidateStudioPosts()
  redirect(`/studio/posts/${copiedPost!.id}`)
}
