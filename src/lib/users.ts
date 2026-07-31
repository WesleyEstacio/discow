import "server-only"
import { eq } from "drizzle-orm"
import { cache } from "react"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { normalizeForMatching } from "@/lib/text"
import type { UserSummary } from "@/lib/types"

export type PublicUser = {
  id: string
  name: string | null
  username: string
  image: string | null
  createdAt: Date
}

// Wrapped in React's cache() because both generateMetadata and the page
// component look up the same username on every request - this dedupes that
// into a single DB round trip per render instead of two.
export const getUserByUsername = cache(
  async (username: string): Promise<PublicUser | null> => {
    const row = await db.query.users.findFirst({
      where: eq(users.username, username),
    })

    if (!row?.username) return null

    return {
      id: row.id,
      name: row.name,
      username: row.username,
      image: row.image,
      createdAt: row.createdAt,
    }
  }
)

// Ranks over-fetched matches so an exact/prefix hit on username - the more
// deliberate signal when someone types "@handle" - always beats a looser
// match on display name, before the caller slices down to `limit`.
function rankByRelevance<Row extends { username: string; name: string | null }>(
  query: string,
  rows: Row[]
): Row[] {
  const normalizedQuery = normalizeForMatching(query)

  function rankOf(row: Row) {
    const username = normalizeForMatching(row.username)
    const name = row.name ? normalizeForMatching(row.name) : ""
    if (username === normalizedQuery) return 0
    if (username.startsWith(normalizedQuery)) return 1
    if (name.startsWith(normalizedQuery)) return 2
    return 3
  }

  return [...rows].sort((a, b) => rankOf(a) - rankOf(b))
}

/**
 * Fuzzy user search for the combined album+user search bar. Matches a
 * leading "@" (typing "@wes" searches for username "wes") against either
 * username or display name, over-fetching so `rankByRelevance` can surface
 * exact/prefix username matches before the caller's `limit` cuts the list.
 */
export async function searchUsers(query: string, limit = 6): Promise<UserSummary[]> {
  const trimmed = query.trim().replace(/^@+/, "")
  if (!trimmed) return []

  const pattern = `%${trimmed}%`

  const rows = await db.query.users.findMany({
    where: (user, { and, or, ilike, isNotNull }) =>
      and(
        isNotNull(user.username),
        or(ilike(user.username, pattern), ilike(user.name, pattern))
      ),
    orderBy: (user, { asc }) => [asc(user.username)],
    limit: limit * 3,
  })

  const withUsername = rows.filter(
    (row): row is typeof row & { username: string } => row.username !== null
  )

  return rankByRelevance(trimmed, withUsername)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      image: row.image,
    }))
}
