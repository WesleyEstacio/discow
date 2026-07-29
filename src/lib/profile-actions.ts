"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { del, put } from "@vercel/blob"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

const POSTGRES_UNIQUE_VIOLATION_CODE = "23505"
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 30
const MAX_NAME_LENGTH = 80
const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export type ProfileActionResult =
  | { success: true; image?: string | null }
  | { success: false; error: string }

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === POSTGRES_UNIQUE_VIOLATION_CODE
  )
}

function revalidateProfilePaths(username: string | null) {
  revalidatePath("/profile")
  if (username) revalidatePath(`/profile/${username}`)
}

function validateImageFile(file: File, maxBytes: number, maxLabel: string): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Photo must be a JPEG, PNG, WEBP, or GIF."
  }
  if (file.size > maxBytes) {
    return `Photo must be ${maxLabel} or smaller.`
  }
  return null
}

// Deletes a previous avatar from Blob storage, if it was one of ours. Avatars
// coming from Google (or anywhere else) are just external URLs we don't own,
// so we leave those alone.
async function deletePreviousBlobImage(imageUrl: string | null) {
  if (!imageUrl || !imageUrl.includes(".public.blob.vercel-storage.com/")) return
  try {
    await del(imageUrl)
  } catch {
    // Best-effort cleanup - an orphaned blob isn't worth failing the request over.
  }
}

export type UpdateProfileInput = {
  name: string
  username: string
}

export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<ProfileActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to edit your profile." }
  }

  const name = input.name.trim()
  const username = input.username.trim().toLowerCase()

  if (!name) {
    return { success: false, error: "Name can't be empty." }
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { success: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` }
  }

  if (!username) {
    return { success: false, error: "Username can't be empty." }
  }
  if (
    username.length < MIN_USERNAME_LENGTH ||
    username.length > MAX_USERNAME_LENGTH ||
    !USERNAME_PATTERN.test(username)
  ) {
    return {
      success: false,
      error:
        "Username must be 3-30 characters, using only lowercase letters, numbers, and dashes.",
    }
  }

  try {
    await db
      .update(users)
      .set({ name, username })
      .where(eq(users.id, session.user.id))
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return { success: false, error: "That username is already taken." }
    }
    throw error
  }

  revalidateProfilePaths(session.user.username)
  revalidateProfilePaths(username)

  return { success: true }
}

export async function uploadAvatarAction(file: File): Promise<ProfileActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to edit your profile." }
  }

  const validationError = validateImageFile(file, MAX_AVATAR_BYTES, "5MB")
  if (validationError) {
    return { success: false, error: validationError }
  }

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { image: true },
  })

  const extension = file.type.split("/")[1] ?? "jpg"
  const blob = await put(`avatars/${session.user.id}-${Date.now()}.${extension}`, file, {
    access: "public",
    addRandomSuffix: false,
  })

  await db
    .update(users)
    .set({ image: blob.url })
    .where(eq(users.id, session.user.id))

  await deletePreviousBlobImage(currentUser?.image ?? null)

  revalidateProfilePaths(session.user.username)

  return { success: true, image: blob.url }
}

export async function removeAvatarAction(): Promise<ProfileActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to edit your profile." }
  }

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { image: true },
  })

  await db
    .update(users)
    .set({ image: null })
    .where(eq(users.id, session.user.id))

  await deletePreviousBlobImage(currentUser?.image ?? null)

  revalidateProfilePaths(session.user.username)

  return { success: true, image: null }
}
