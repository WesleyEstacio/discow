import "server-only"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { userTags, users } from "@/lib/db/schema"

export type ProfileTag = {
  id: string
  label: string
}

// Reads whatever tags are stored for this user - nothing is computed here.
// See ensureJoinedTag() below for the one tag that's assigned automatically;
// everything else (like "first-users") is added by hand to the `user_tag`
// table.
export async function getProfileTags(userId: string): Promise<ProfileTag[]> {
  const rows = await db
    .select({ key: userTags.key, label: userTags.label })
    .from(userTags)
    .where(eq(userTags.userId, userId))
    .orderBy(asc(userTags.createdAt))

  return rows.map((row) => ({ id: row.key, label: row.label }))
}

// Assigns the "Joined in <year>" tag once. Called from auth.ts on
// createUser (brand-new accounts) and signIn (backfills accounts that
// existed before this feature shipped) - the (userId, key) primary key makes
// re-running this a no-op, so it's safe to call on every sign-in.
export async function ensureJoinedTag(userId: string): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { createdAt: true },
  })
  if (!user) return

  // Based on the user's actual createdAt, not "now" - otherwise a backfilled
  // tag for an account that signed up in 2026 but doesn't return until 2027
  // would say "Joined in 2027".
  const year = user.createdAt.getFullYear()

  await db
    .insert(userTags)
    .values({ userId, key: `joined-${year}`, label: `Joined in ${year}` })
    .onConflictDoNothing({ target: [userTags.userId, userTags.key] })
}
