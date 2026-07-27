import "server-only"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

const FALLBACK_USERNAME_BASE = "listener"
const MAX_GENERATION_ATTEMPTS = 50
const POSTGRES_UNIQUE_VIOLATION_CODE = "23505"
const NON_USERNAME_CHARACTERS_PATTERN = /[^a-z0-9]+/g
const LEADING_OR_TRAILING_DASHES_PATTERN = /^-+|-+$/g
const COMBINING_DIACRITICAL_MARKS_PATTERN = /[̀-ͯ]/g

function slugifyName(name: string | null | undefined): string {
  const slug = (name ?? "")
    .normalize("NFD")
    .replace(COMBINING_DIACRITICAL_MARKS_PATTERN, "")
    .toLowerCase()
    .replace(NON_USERNAME_CHARACTERS_PATTERN, "-")
    .replace(LEADING_OR_TRAILING_DASHES_PATTERN, "")

  return slug || FALLBACK_USERNAME_BASE
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === POSTGRES_UNIQUE_VIOLATION_CODE
  )
}

/**
 * Returns the user's username, generating and persisting one from their
 * display name if they don't have one yet (e.g. "Wesley Estacio" ->
 * "wesley-estacio"), appending "-1", "-2", ... if the base slug is taken.
 *
 * Collisions are resolved by letting the database's unique constraint reject
 * duplicates and retrying with the next suffix, rather than checking for
 * availability first - that check-then-write approach would leave a race
 * window if two accounts were created around the same time. The update is
 * additionally scoped to rows that still have no username, so this is safe
 * to call for every sign-in without ever overwriting an existing one.
 */
export async function ensureUsername(
  userId: string,
  name: string | null | undefined
): Promise<string> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { username: true },
  })

  if (existingUser?.username) return existingUser.username

  const baseUsername = slugifyName(name)

  for (let attempt = 0; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidateUsername =
      attempt === 0 ? baseUsername : `${baseUsername}-${attempt}`

    try {
      const [updatedUser] = await db
        .update(users)
        .set({ username: candidateUsername })
        .where(and(eq(users.id, userId), isNull(users.username)))
        .returning({ username: users.username })

      if (updatedUser?.username) return updatedUser.username

      // No row came back: someone else assigned this user a username
      // between our SELECT above and this UPDATE. Read whatever they set.
      const concurrentlyAssignedUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { username: true },
      })
      if (concurrentlyAssignedUser?.username) {
        return concurrentlyAssignedUser.username
      }

      throw new Error(`User ${userId} disappeared while assigning a username`)
    } catch (error) {
      if (isUniqueConstraintViolation(error) && attempt < MAX_GENERATION_ATTEMPTS) {
        continue
      }
      throw error
    }
  }

  throw new Error(`Could not generate a unique username for user ${userId}`)
}
