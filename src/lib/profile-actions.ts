"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

const POSTGRES_UNIQUE_VIOLATION_CODE = "23505"
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 30
const MAX_NAME_LENGTH = 80
const MAX_BIO_LENGTH = 160

export type ProfileActionResult =
  | { success: true }
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

export type UpdateProfileInput = {
  name: string
  username: string
  // Optional - an empty string clears the bio (stored as null).
  bio?: string
  // Which earned tag to show next to the name - see resolveDisplayTag() in
  // src/lib/tags.ts. Undefined leaves the stored choice untouched, null (or
  // any key the user doesn't actually have) resets it back to the default.
  displayTagKey?: string | null
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

  const bio = input.bio?.trim() ?? ""
  if (bio.length > MAX_BIO_LENGTH) {
    return { success: false, error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer.` }
  }

  // A tag can only be selected if the user actually has it - the edit form
  // only ever offers earned tags, so a mismatch here means stale/tampered
  // input rather than a normal user action.
  const displayTagKey = input.displayTagKey
  if (displayTagKey) {
    const ownsTag = await db.query.userTags.findFirst({
      where: (userTag, { and, eq }) =>
        and(eq(userTag.userId, session.user.id), eq(userTag.key, displayTagKey)),
      columns: { key: true },
    })
    if (!ownsTag) {
      return { success: false, error: "You can only select a tag you've earned." }
    }
  }

  try {
    await db
      .update(users)
      .set({
        name,
        username,
        bio: bio || null,
        ...(input.displayTagKey !== undefined
          ? { displayTagKey: input.displayTagKey }
          : {}),
      })
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
